"""
JanAushadhi Satya - Stage 1-4 Complete Deterministic Search Engine
Orchestrates:
- Stage 1: Tokenizer (Voice transcript normalization, dosages, release modifiers)
- Stage 2: Indian Phonetic + Rapidfuzz Scorer (0.60 * Fuzzy + 0.40 * Phonetic)
- Stage 3: Clinical Safety Guardrails (Ambiguity Disambiguation & Release Lock)
- Stage 4: Hard Safe Fallback (< 65.0 Confidence -> NOT_FOUND)

Zero-LLM guarantee: In-memory vectorized index executing in < 5ms per query.
"""

import time
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from .tokenizer import tokenize_prescription, normalize_spoken_numbers, ParsedPrescriptionQuery
from .matcher import score_candidate, indian_phonetic_hash
from .safety_guardrails import (
    check_strength_ambiguity,
    verify_release_type_lock,
    build_safe_fallback,
    create_match_explanation,
    CONFIDENCE_THRESHOLD,
)


class DeterministicDrugSearchEngine:
    """In-memory zero-hallucination search and equivalence audit engine."""

    def __init__(self, data_path: Optional[str] = None):
        if not data_path:
            base_dir = Path(__file__).resolve().parent.parent / "data_pipeline" / "output"
            data_path = str(base_dir / "golden_drugs.json")

        with open(data_path, "r", encoding="utf-8") as f:
            self.drugs: List[Dict[str, Any]] = json.load(f)

        self._build_in_memory_index()

    def _build_in_memory_index(self):
        """Constructs fast inverted indexes for sub-millisecond retrieval."""
        self.drugs_by_id: Dict[str, Dict[str, Any]] = {}
        self.brand_root_map: Dict[str, List[Dict[str, Any]]] = {}

        for drug in self.drugs:
            did = drug["id"]
            self.drugs_by_id[did] = drug

            # Index brand root (first word, lowercased without hyphens)
            bname = drug["brand_name"].lower()
            root = bname.split()[0].replace("-", "")
            if root not in self.brand_root_map:
                self.brand_root_map[root] = []
            self.brand_root_map[root].append(drug)

            # Pre-compute phonetic tokens & targets for speed
            drug["_brand_phonetic"] = indian_phonetic_hash(drug["brand_name"])
            drug["_generic_phonetic"] = indian_phonetic_hash(drug["generic_name"])
            drug["_targets"] = [drug["brand_name"], drug["composition_display"]] + drug.get("search_synonyms", [])
            drug["_strength_nums"] = [
                str(int(c["strength_val"]) if c["strength_val"] == int(c["strength_val"]) else c["strength_val"])
                for c in drug.get("composition", [])
            ]

        # Warm up C-extensions and CPU caches
        try:
            score_candidate("warmup", "Warmup 500", "Warmup Salt", [])
        except Exception:
            pass

    def search(
        self,
        query: str,
        strength: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the 4-Stage Search Pipeline in < 5ms.
        """
        t0 = time.perf_counter()

        if not query or not query.strip():
            return {
                "status": "EMPTY_QUERY",
                "message": "Please enter a drug brand or generic active molecule name.",
                "execution_time_ms": round((time.perf_counter() - t0) * 1000, 2),
                "results": []
            }

        # -------------------------------------------------------------
        # STAGE 1: Regex & Voice Transcript Tokenizer
        # -------------------------------------------------------------
        parsed = tokenize_prescription(query)
        effective_strength = strength or parsed.explicit_strength
        if effective_strength:
            num_only = re.sub(r"[^\d.]", "", effective_strength)
            if num_only and num_only not in parsed.dosage_numbers:
                parsed.dosage_numbers.append(num_only)

        search_query_stem = parsed.core_name or parsed.normalized_query

        # Check for brand root match (e.g. 'telma', 'dolo', 'atorva', 'glycomet')
        clean_root = search_query_stem.lower().replace("-", "").split()[0] if search_query_stem else ""
        root_matches = self.brand_root_map.get(clean_root, [])

        # -------------------------------------------------------------
        # STAGE 3A: Ambiguity Guardrail Check
        # If user searches 'telma' without strength, and multiple strengths exist
        # -------------------------------------------------------------
        if root_matches and len(root_matches) > 1 and not effective_strength:
            ambiguity_alert = check_strength_ambiguity(
                query_stem=query,
                query_strength=effective_strength,
                candidates=root_matches
            )
            if ambiguity_alert:
                ambiguity_alert["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 2)
                return ambiguity_alert

        # -------------------------------------------------------------
        # STAGE 2: Indian Phonetic + Rapidfuzz Scorer
        # -------------------------------------------------------------
        scored_candidates = []
        req_num = re.sub(r"[^\d.]", "", effective_strength) if effective_strength else None

        for drug in self.drugs:
            composite, fuzzy, phonetic, matched_text = score_candidate(
                query_str=parsed.normalized_query,
                target_brand=drug["brand_name"],
                target_salt=drug["composition_display"],
                synonyms=drug.get("search_synonyms", [])
            )

            # Bonus / penalty based on explicit strength parameter
            if req_num:
                bname_lower = drug["brand_name"].lower()
                if req_num in bname_lower or req_num in drug["_strength_nums"]:
                    composite += 20.0
                elif root_matches and drug in root_matches:
                    composite = max(0.0, composite - 35.0)

            # Bonus for matching dosage numbers in query
            if parsed.dosage_numbers:
                bname_lower = drug["brand_name"].lower()
                for dnum in parsed.dosage_numbers:
                    if dnum in bname_lower or dnum in drug["_strength_nums"]:
                        composite += 10.0
                        break

            # Bonus for matching release modifier (e.g. 'xr', 'sr', 'duo')
            if parsed.release_modifiers:
                for mod in parsed.release_modifiers:
                    if mod.upper() == drug["release_type"] or mod in drug["brand_name"].lower():
                        composite += 8.0
                        break

            scored_candidates.append({
                "drug": drug,
                "composite_score": composite,
                "fuzzy_score": fuzzy,
                "phonetic_score": phonetic,
                "matched_text": matched_text
            })

        # Sort by composite score descending
        scored_candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        best = scored_candidates[0] if scored_candidates else None

        # -------------------------------------------------------------
        # STAGE 4: Hard Safe Fallback (Score < 65.0)
        # -------------------------------------------------------------
        if not best or best["composite_score"] < CONFIDENCE_THRESHOLD:
            fallback = build_safe_fallback(
                query=query,
                best_score=best["composite_score"] if best else 0.0,
                candidate_brand=best["drug"]["brand_name"] if best else None
            )
            fallback["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 2)
            return fallback

        # Top matched drug
        matched_drug = best["drug"]

        # -------------------------------------------------------------
        # STAGE 3B: Release-Type Lock & Ambiguity Validation
        # -------------------------------------------------------------
        # If user searched a generic term without strength and the best match has peers
        top_root = matched_drug["brand_name"].lower().replace("-", "").split()[0]
        peers = self.brand_root_map.get(top_root, [])
        if len(peers) > 1 and not effective_strength and not parsed.dosage_numbers:
            # Also trigger ambiguity guardrail if composite match was on generic root
            ambiguity_alert = check_strength_ambiguity(
                query_stem=query,
                query_strength=None,
                candidates=peers
            )
            if ambiguity_alert:
                ambiguity_alert["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 2)
                return ambiguity_alert

        # Release Lock
        is_safe_release, release_warning = verify_release_type_lock(
            matched_drug["release_type"],
            matched_drug["generic_release_type"]
        )

        # Build Match Explanation
        matched_via = "Phonetic + Fuzzy"
        if best["phonetic_score"] >= 95.0:
            matched_via = "Indian Phonetic Normalizer"
        elif best["fuzzy_score"] >= 95.0:
            matched_via = "Exact / Fuzzy Lexical"

        match_explanation = create_match_explanation(
            input_token=query,
            matched_brand=matched_drug["brand_name"],
            confidence=min(100.0, best["composite_score"]),
            fuzzy_score=best["fuzzy_score"],
            phonetic_score=best["phonetic_score"],
            matched_via=matched_via
        )

        exec_time = round((time.perf_counter() - t0) * 1000, 2)

        return {
            "status": "SUCCESS",
            "execution_time_ms": exec_time,
            "query": query,
            "parsed_query": {
                "normalized": parsed.normalized_query,
                "dosage_numbers": parsed.dosage_numbers,
                "release_modifiers": parsed.release_modifiers,
                "explicit_strength": effective_strength
            },
            "match_explanation": match_explanation,
            "drug": matched_drug,
            "pack_size_normalization": {
                "branded_pack_size": matched_drug["branded_pack_size"],
                "branded_mrp": matched_drug["branded_mrp"],
                "branded_unit_price": matched_drug["branded_unit_price"],
                "normalized_10_unit_branded_price": matched_drug["normalized_10_unit_branded_price"],
                "generic_pack_size": matched_drug["generic_pack_size"],
                "generic_mrp": matched_drug["generic_mrp"],
                "generic_unit_price": matched_drug["generic_unit_price"],
                "normalized_10_unit_generic_price": matched_drug["normalized_10_unit_generic_price"],
                "savings_percentage": matched_drug["savings_percentage"],
                "savings_per_10_units": matched_drug["savings_per_10_units"],
                "formula_note": "Branded Unit = MRP / PackSize; Generic Unit = MRP / PackSize; 10-Unit = Unit * 10"
            },
            "clinical_safety": {
                "is_release_match": is_safe_release,
                "release_lock_warning": release_warning,
                "brand_release": matched_drug["release_type"],
                "generic_release": matched_drug["generic_release_type"],
                "is_narrow_therapeutic_index": matched_drug.get("is_narrow_therapeutic_index", False),
                "clinical_notes": matched_drug["clinical_notes"]
            }
        }
