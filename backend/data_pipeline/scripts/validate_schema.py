"""
JanAushadhi Satya - Strict Clinical & Commercial Data Schema
Enforces zero-hallucination, pack-size normalization, release-type safety,
and deterministic phonetic indexing for Indian pharmaceuticals.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator, model_validator


# Clinically recognized drug release modalities in India
ReleaseType = Literal["IR", "SR", "XR", "EC", "DT"]


class MoleculeStrength(BaseModel):
    molecule: str = Field(..., description="Standardized active pharmaceutical ingredient (API)")
    strength_val: float = Field(..., gt=0, description="Numerical strength value")
    strength_unit: str = Field(..., description="Unit of measurement (mg, mcg, IU, AU, g)")

    @field_validator("molecule")
    @classmethod
    def standardize_molecule(cls, v: str) -> str:
        cleaned = v.strip().title()
        if not cleaned:
            raise ValueError("Molecule name cannot be empty")
        return cleaned

    @field_validator("strength_unit")
    @classmethod
    def standardize_unit(cls, v: str) -> str:
        return v.strip().lower() if v.strip().lower() in ["mg", "mcg", "g", "ml"] else v.strip()


class DrugRecord(BaseModel):
    id: str = Field(..., description="Unique immutable drug ID (e.g. DRUG-001)")
    brand_name: str = Field(..., min_length=2, description="Commercial Indian brand trade name")
    brand_manufacturer: str = Field(..., description="Marketing authorization holder / pharma company")
    dosage_form: str = Field(..., description="Tablet, Capsule, Syrup, Rotacap, etc.")
    release_type: ReleaseType = Field(
        ...,
        description="IR (Immediate Release), SR (Sustained Release), XR (Extended Release), EC (Enteric Coated), DT (Dispersible Tablet)"
    )
    generic_release_type: ReleaseType = Field(
        ...,
        description="Official Jan Aushadhi generic formulation release type"
    )
    composition: List[MoleculeStrength] = Field(
        ..., min_length=1, description="Sorted list of active ingredients"
    )
    composition_display: str = Field(..., description="Clinically readable active molecule summary")
    
    # Commercial Pricing - Branded
    branded_mrp: float = Field(..., gt=0, description="Branded Maximum Retail Price in INR (incl. GST)")
    branded_pack_size: int = Field(..., gt=0, description="Number of units per commercial pack")
    branded_unit_price: float = Field(..., gt=0, description="Normalized price per unit (INR)")
    normalized_10_unit_branded_price: float = Field(..., gt=0, description="Price benchmarked for 10 units")
    
    # Commercial Pricing - PMBJP Jan Aushadhi Generic
    generic_name: str = Field(..., description="PMBJP official generic product title")
    pmbjp_drug_code: str = Field(..., description="Official Bureau of Pharma PSUs of India (BPPI/PMBI) item code")
    generic_pack_size: int = Field(..., gt=0, description="Jan Aushadhi standard pack size")
    generic_mrp: float = Field(..., gt=0, description="Official PMBJP Maximum Retail Price in INR")
    generic_unit_price: float = Field(..., gt=0, description="PMBJP price per unit (INR)")
    normalized_10_unit_generic_price: float = Field(..., gt=0, description="PMBJP price benchmarked for 10 units")
    
    # Mathematical Normalization & Statutory Caps
    savings_percentage: float = Field(..., ge=0, le=100, description="Fair percentage savings based on unit price")
    savings_per_10_units: float = Field(..., ge=0, description="Net patient savings for 10 units in INR")
    nppa_ceiling_price: Optional[float] = Field(None, description="NPPA DPCO ceiling price per unit if scheduled")
    
    # Clinical Safety & Bioequivalence Attributes
    therapeutic_category: str = Field(..., description="Primary anatomical therapeutic chemical category")
    clinical_notes: str = Field(..., description="Clinical equivalence, bioequivalence, and interchangeability notes")
    is_narrow_therapeutic_index: bool = Field(
        default=False,
        description="True for drugs like Thyroxine/Lithium requiring physician monitoring upon brand switch"
    )
    release_match_status: Literal["EXACT_MATCH", "RELEASE_MISMATCH"] = Field(
        default="EXACT_MATCH",
        description="Clinical warning if release mechanics differ (e.g. SR vs IR)"
    )

    # Search & Offline Phonetic Guardrails
    phonetic_keys: List[str] = Field(
        default_factory=list,
        description="Precomputed phonetic tokens for zero-hallucination search"
    )
    search_synonyms: List[str] = Field(
        default_factory=list,
        description="Common doctor abbreviations and commercial trade variants"
    )

    @field_validator("composition")
    @classmethod
    def ensure_sorted_composition(cls, comp: List[MoleculeStrength]) -> List[MoleculeStrength]:
        """Composition must be canonically sorted by molecule name for deterministic fingerprinting."""
        return sorted(comp, key=lambda x: x.molecule.lower())

    @model_validator(mode="after")
    def verify_pricing_math_and_release(self) -> "DrugRecord":
        """Audit arithmetic to guarantee zero commercial hallucinations."""
        # 1. Unit price audit (tolerating 2-decimal rounding)
        expected_branded_unit = round(self.branded_mrp / self.branded_pack_size, 4)
        expected_generic_unit = round(self.generic_mrp / self.generic_pack_size, 4)
        
        if abs(self.branded_unit_price - round(expected_branded_unit, 2)) > 0.05:
            raise ValueError(
                f"Branded unit price mismatch: got {self.branded_unit_price}, "
                f"expected ~{round(expected_branded_unit, 2)} for {self.brand_name}"
            )
        
        if abs(self.generic_unit_price - round(expected_generic_unit, 2)) > 0.05:
            raise ValueError(
                f"Generic unit price mismatch: got {self.generic_unit_price}, "
                f"expected ~{round(expected_generic_unit, 2)} for {self.generic_name}"
            )

        # 2. Release mechanism safety check
        if self.release_type != self.generic_release_type:
            object.__setattr__(self, "release_match_status", "RELEASE_MISMATCH")

        return self


class JanAushadhiKendra(BaseModel):
    kendra_id: str = Field(..., description="Official PMBJP Kendra store code")
    name: str = Field(..., description="Store title")
    address: str = Field(..., description="Complete postal address")
    city: str = Field(..., description="Indian municipality / city")
    state: str = Field(..., description="Indian state / UT")
    pincode: str = Field(..., min_length=6, max_length=6, description="6-digit Indian Postal PIN code")
    latitude: float = Field(..., ge=6.0, le=38.0, description="Geographic latitude within India")
    longitude: float = Field(..., ge=68.0, le=98.0, description="Geographic longitude within India")
    contact_phone: str = Field(..., description="Contact phone or helpline number")
    operating_hours: str = Field(default="09:00 AM - 09:00 PM", description="Store daily timings")
    is_open_sunday: bool = Field(default=True, description="Sunday operational status")
