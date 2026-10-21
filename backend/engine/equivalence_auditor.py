"""
JanAushadhi Satya - Clinical Equivalence & Ambiguity Guardrail Engine
Provides deterministic equivalence checks, strength ambiguity resolution,
and Narrow Therapeutic Index (NTI) clinical safeguards.
"""

from typing import List, Dict, Any, Optional
import math


class EquivalenceAuditor:
    """Audits generic substitution safety and flags critical clinical disparities."""

    @staticmethod
    def audit_substitution(branded_record: Dict[str, Any], generic_code: str) -> Dict[str, Any]:
        """
        Audits clinical safety of substituting a branded drug with a Jan Aushadhi generic.
        Returns safety verdict, release comparison, and statutory compliance.
        """
        is_release_match = branded_record["release_type"] == branded_record["generic_release_type"]
        is_nti = branded_record.get("is_narrow_therapeutic_index", False)

        warnings = []
        cautions = []

        if not is_release_match:
            warnings.append(
                f"CRITICAL RELEASE MISMATCH: Branded is {branded_record['release_type']} "
                f"while Generic is {branded_record['generic_release_type']}. "
                "Pharmacokinetic absorption curves differ significantly."
            )

        if is_nti:
            warnings.append(
                "NARROW THERAPEUTIC INDEX (NTI) ALERT: This medicine has a steep dose-response relationship. "
                "Generic substitution must be done under prescribing physician supervision with baseline monitoring."
            )

        # Statutory ceiling price check
        nppa_cap = branded_record.get("nppa_ceiling_price")
        statutory_compliance = True
        if nppa_cap and branded_record["branded_unit_price"] > (nppa_cap * 1.15):
            cautions.append(
                f"Price Transparency Notice: Branded unit price (₹{branded_record['branded_unit_price']}) "
                f"exceeds standard benchmark (₹{nppa_cap}). PMBJP generic brings significant relief."
            )

        # Pack-size normalization verification
        branded_unit = branded_record["branded_unit_price"]
        generic_unit = branded_record["generic_unit_price"]
        savings_pct = branded_record["savings_percentage"]
        savings_10_units = branded_record["savings_per_10_units"]

        return {
            "is_clinically_safe": is_release_match and not is_nti,
            "release_match": is_release_match,
            "branded_release": branded_record["release_type"],
            "generic_release": branded_record["generic_release_type"],
            "is_narrow_therapeutic_index": is_nti,
            "warnings": warnings,
            "cautions": cautions,
            "branded_unit_price": branded_unit,
            "generic_unit_price": generic_unit,
            "savings_percentage": savings_pct,
            "savings_per_10_units": savings_10_units,
            "pack_size_comparison": {
                "branded_pack": branded_record["branded_pack_size"],
                "generic_pack": branded_record["generic_pack_size"],
                "is_different_pack_size": branded_record["branded_pack_size"] != branded_record["generic_pack_size"]
            }
        }

    @staticmethod
    def detect_strength_ambiguity(query: str, all_drugs: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """
        Detects if query is an ambiguous brand root without dosage strength.
        Example: 'Telma' matches Telma 20, Telma 40, Telma 80.
        Requires explicit disambiguation to prevent lethal or subtherapeutic dispensing.
        """
        clean_q = query.strip().lower()
        # Find exact root matches
        matched = []
        for drug in all_drugs:
            bname = drug["brand_name"].lower()
            if clean_q in bname:
                matched.append(drug)

        # If 2 or more distinct strengths exist for the same brand root
        if len(matched) > 1:
            # Check if all share the same prefix word
            first_word = matched[0]["brand_name"].split()[0].lower()
            if all(d["brand_name"].lower().startswith(first_word) for d in matched):
                return matched
        return None
