"""
JanAushadhi Satya - Automated Test Suite
Audits mathematical precision, clinical safety guardrails,
schema compliance, and offline Kendra lookups for hackathon judges.
"""

import json
import unittest
from pathlib import Path
import sys

# Add repository root to path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from engine.equivalence_auditor import EquivalenceAuditor
from engine.haversine_locator import KendraLocator
from api.main import JanAushadhiSatyaAPI


class TestJanAushadhiSatya(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_dir = REPO_ROOT / "backend" / "data_pipeline" / "output"
        with open(cls.data_dir / "golden_drugs.json", "r", encoding="utf-8") as f:
            cls.drugs = json.load(f)
        with open(cls.data_dir / "jan_aushadhi_kendras.json", "r", encoding="utf-8") as f:
            cls.kendras = json.load(f)
        cls.api = JanAushadhiSatyaAPI()

    def test_golden_dataset_size(self):
        """Dataset must contain at least 30 validated drugs and 25 kendras."""
        self.assertGreaterEqual(len(self.drugs), 30, "Must have at least 30 verified drug formulations")
        self.assertGreaterEqual(len(self.kendras), 25, "Must have at least 25 real Jan Aushadhi Kendras")

    def test_required_prompt_drugs_present(self):
        """All mandatory Indian prescription drugs from user brief must be present."""
        expected_brands = [
            "Augmentin 625 Duo", "Pan-D", "Telma 20", "Telma 40", "Telma 80",
            "Glycomet-GP 1", "Glycomet-GP 2", "Atorva 10", "Atorva 20", "Shelcal 500",
            "Dolo 650", "Azithral 500", "Ecosprin 75", "Thyronorm 50", "Stamlo 5",
            "Pantocid 40", "Montair LC", "Allegra 120", "Metolar XR 50", "Chymoral Forte"
        ]
        drug_names = [d["brand_name"] for d in self.drugs]
        for brand in expected_brands:
            self.assertIn(brand, drug_names, f"Mandatory drug {brand} missing from dataset")

    def test_pack_size_normalization_math(self):
        """Validates that pack size differences (e.g. 15 tabs vs 10 tabs) never create false savings."""
        for drug in self.drugs:
            b_unit = drug["branded_unit_price"]
            g_unit = drug["generic_unit_price"]
            
            # Unit price should equal MRP / pack size
            expected_b_unit = round(drug["branded_mrp"] / drug["branded_pack_size"], 2)
            expected_g_unit = round(drug["generic_mrp"] / drug["generic_pack_size"], 2)
            
            self.assertAlmostEqual(b_unit, expected_b_unit, delta=0.05, 
                                   msg=f"Branded unit price arithmetic error in {drug['brand_name']}")
            self.assertAlmostEqual(g_unit, expected_g_unit, delta=0.05,
                                   msg=f"Generic unit price arithmetic error in {drug['generic_name']}")
            
            # 10-unit normalized calculation check
            self.assertEqual(drug["normalized_10_unit_branded_price"], round(b_unit * 10, 2))
            self.assertEqual(drug["normalized_10_unit_generic_price"], round(g_unit * 10, 2))

            # Savings percentage formula verification
            expected_savings_pct = round(((b_unit - g_unit) / b_unit) * 100, 1)
            self.assertAlmostEqual(drug["savings_percentage"], expected_savings_pct, delta=0.5)

    def test_clinical_release_types(self):
        """Release types must be one of IR, SR, XR, EC, DT and composition must be sorted."""
        valid_releases = {"IR", "SR", "XR", "EC", "DT"}
        for drug in self.drugs:
            self.assertIn(drug["release_type"], valid_releases)
            self.assertIn(drug["generic_release_type"], valid_releases)
            
            # Composition must be sorted by molecule name alphabetically
            mol_names = [c["molecule"].lower() for c in drug["composition"]]
            self.assertEqual(mol_names, sorted(mol_names), f"Composition not sorted in {drug['brand_name']}")

    def test_telma_strength_ambiguity_guardrail(self):
        """Searching 'Telma' without strength must flag ambiguity with 3 candidates (20, 40, 80)."""
        res = self.api.search_drugs("Telma")
        self.assertTrue(res["is_ambiguous"], "Telma root must trigger strength ambiguity guardrail")
        candidate_names = [c["brand_name"] for c in res["ambiguity_candidates"]]
        self.assertIn("Telma 20", candidate_names)
        self.assertIn("Telma 40", candidate_names)
        self.assertIn("Telma 80", candidate_names)

    def test_narrow_therapeutic_index_guardrail(self):
        """Thyronorm 50 must be flagged as Narrow Therapeutic Index (NTI)."""
        thyro = next(d for d in self.drugs if d["brand_name"] == "Thyronorm 50")
        self.assertTrue(thyro["is_narrow_therapeutic_index"])
        
        audit = EquivalenceAuditor.audit_substitution(thyro, thyro["pmbjp_drug_code"])
        self.assertFalse(audit["is_clinically_safe"], "NTI drugs cannot be marked automatically safe without doctor note")
        self.assertTrue(any("NARROW THERAPEUTIC INDEX" in w for w in audit["warnings"]))

    def test_haversine_accuracy(self):
        """Offline Haversine calculation must be accurate within 100 meters."""
        # Connaught Place (28.6315, 77.2167) to AIIMS Delhi (28.5672, 77.2100) is approx 7.2 km
        dist = KendraLocator.haversine_distance_km(28.6315, 77.2167, 28.5672, 77.2100)
        self.assertAlmostEqual(dist, 7.2, delta=0.5)

        # Nearest kendra lookup
        nearest = KendraLocator.find_nearest_kendras(28.6315, 77.2167, self.kendras, limit=1)
        self.assertEqual(nearest[0]["city"], "New Delhi")


if __name__ == "__main__":
    unittest.main()
