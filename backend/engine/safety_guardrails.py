"""
JanAushadhi Satya - Stage 3 & 4: Clinical Safety Guardrails & Hard Safe Fallback
Enforces:
1. Multi-Strength Ambiguity Guardrail (e.g., 'Telma' -> 20mg, 40mg, 80mg)
2. Release-Type Lock (SR != IR)
3. Hard Safe Fallback (Score < 65.0 -> NOT_FOUND)
4. Match Explanation generator for UI transparency
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass


CONFIDENCE_THRESHOLD = 65.0


@dataclass
class MatchExplanation:
    matched_via: str
    confidence: float
    input_token: str
    matched_brand: str
    fuzzy_score: float
    phonetic_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "matched_via": self.matched_via,
            "confidence": self.confidence,
            "input_token": self.input_token,
            "matched_brand": self.matched_brand,
            "fuzzy_score": self.fuzzy_score,
            "phonetic_score": self.phonetic_score
        }


def check_strength_ambiguity(
    query_stem: str,
    query_strength: Optional[str],
    candidates: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Stage 3: Ambiguity Guardrail.
    If query matches multiple strengths of the same brand root (e.g. 'Telma 20', 'Telma 40', 'Telma 80')
    and user has NOT specified a strength, returns AMBIGUOUS_STRENGTH response.
    """
    if not candidates or len(candidates) < 2:
        return None

    # If user provided a specific strength or dosage number, do not block
    if query_strength and any(c.isdigit() for c in query_strength):
        return None

    # Check if candidates share the same brand prefix (e.g. 'Telma', 'Glycomet-GP', 'Atorva')
    first_root = candidates[0]["brand_name"].split()[0].lower().replace("-", "")
    all_same_root = all(
        c["brand_name"].split()[0].lower().replace("-", "").startswith(first_root[:4])
        for c in candidates
    )

    if all_same_root:
        strengths = []
        matching_brand_ids = []
        detailed_candidates = []

        for c in candidates:
            # Extract strength label from composition_display
            s_label = c.get("composition_display", "")
            # Short strength label (e.g. '20mg', '40mg', '80mg')
            first_comp = c.get("composition", [{}])[0]
            val = first_comp.get("strength_val", "")
            unit = first_comp.get("strength_unit", "mg")
            val_str = f"{int(val) if val == int(val) else val}{unit}"
            if val_str not in strengths:
                strengths.append(val_str)
            matching_brand_ids.append(c["id"])
            detailed_candidates.append({
                "brand_id": c["id"],
                "brand_name": c["brand_name"],
                "strength": val_str,
                "composition_display": c["composition_display"],
                "dosage_form": c["dosage_form"],
                "generic_name": c["generic_name"],
                "pmbjp_drug_code": c["pmbjp_drug_code"]
            })

        if len(strengths) >= 2:
            return {
                "status": "AMBIGUOUS_STRENGTH",
                "message": (
                    f"Clinical Guardrail Alert: Multiple distinct dosage strengths found for '{query_stem}'. "
                    "For patient safety, generic substitution without explicit dosage strength is locked to avoid under/overdose."
                ),
                "query": query_stem,
                "available_strengths": strengths,
                "matching_brand_ids": matching_brand_ids,
                "candidates": detailed_candidates
            }

    return None


def verify_release_type_lock(brand_release: str, generic_release: str) -> Tuple[bool, Optional[str]]:
    """
    Clinical Release-Type Lock:
    Ensures an SR (Sustained Release) or XR (Extended Release) brand
    is NEVER matched to an IR (Immediate Release) generic.
    """
    b_rel = brand_release.upper()
    g_rel = generic_release.upper()

    if b_rel in ["SR", "XR", "CR", "ER"] and g_rel == "IR":
        return (
            False,
            f"CLINICAL SAFETY LOCK: Mismatch between {b_rel} (Extended/Sustained Release) and "
            f"{g_rel} (Immediate Release). Substituting causes acute pharmacokinetic dose-dumping."
        )

    if b_rel != g_rel:
        return (
            False,
            f"Release formulation differs: {b_rel} vs {g_rel}. Clinical caution required."
        )

    return (True, None)


def build_safe_fallback(query: str, best_score: float, candidate_brand: Optional[str] = None) -> Dict[str, Any]:
    """
    Stage 4: Hard Safe Fallback when score < 65.0.
    Zero-LLM guarantee: Never guesses, generates, or fabricates drug data.
    """
    return {
        "status": "NOT_FOUND",
        "message": (
            "Not found in verified database. For patient safety, we never guess or generate drug data. "
            "Please confirm with your doctor or pharmacist."
        ),
        "query": query,
        "match_explanation": {
            "matched_via": "None (Below Confidence Threshold)",
            "confidence": round(best_score, 2),
            "input_token": query,
            "matched_brand": candidate_brand or "None",
            "threshold_required": CONFIDENCE_THRESHOLD
        }
    }


def create_match_explanation(
    input_token: str,
    matched_brand: str,
    confidence: float,
    fuzzy_score: float,
    phonetic_score: float,
    matched_via: str = "Phonetic + Fuzzy"
) -> Dict[str, Any]:
    """Generates transparency debug payload for the UI badge."""
    return MatchExplanation(
        matched_via=matched_via,
        confidence=confidence,
        input_token=input_token,
        matched_brand=matched_brand,
        fuzzy_score=fuzzy_score,
        phonetic_score=phonetic_score
    ).to_dict()
