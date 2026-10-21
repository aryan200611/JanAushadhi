"""
JanAushadhi Satya - FastAPI Clinical & Price Transparency API
Zero-LLM deterministic backend serving:
- GET  /api/search?q={query}&strength={optional_strength}
- POST /api/prescription-cart
- GET  /api/nearest-kendra?lat={lat}&lon={lon}
- GET  /api/health
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure backend root is in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from engine.search_engine import DeterministicDrugSearchEngine
from engine.locator import KendraLocator
from engine.ocr_pipeline import process_strip_image_to_query


# Initialize FastAPI app
app = FastAPI(
    title="JanAushadhi Satya API",
    description="Deterministic zero-hallucination medicine search and clinical equivalence auditor",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory singletons for sub-5ms performance
search_engine = DeterministicDrugSearchEngine()
locator = KendraLocator()


# Pydantic Request Models
class CartItem(BaseModel):
    drug_id: str = Field(..., description="Unique drug ID (e.g. DRUG-001)")
    monthly_units: int = Field(default=30, gt=0, description="Monthly consumption in dosage units")


class PrescriptionCartRequest(BaseModel):
    items: List[CartItem] = Field(..., min_length=1, description="List of prescribed medicines in cart")


class ScanStripRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded medicine blister pack image or data URL")


@app.post("/api/scan-strip")
def scan_medicine_strip(req: ScanStripRequest):
    """
    Glare-Resistant Medicine Strip Scanner:
    Applies adaptive anti-glare contrast binarization, filters pharma stop-words,
    and directly feeds candidate tokens into the deterministic search engine.
    """
    result = process_strip_image_to_query(
        image_base64=req.image_base64,
        search_engine_instance=search_engine
    )
    return result


@app.get("/api/health")
def health_check():
    """System health check and index stats."""
    return {
        "status": "HEALTHY",
        "service": "JanAushadhi Satya Engine",
        "zero_llm_guaranteed": True,
        "indexed_drugs_count": len(search_engine.drugs),
        "indexed_kendras_count": len(locator.kendras)
    }


@app.get("/api/search")
def search_drugs(
    q: str = Query(..., min_length=1, description="Brand name, generic salt, or voice transcript"),
    strength: Optional[str] = Query(None, description="Optional explicit strength (e.g. '40mg', '20mg')")
):
    """
    Stage 1-4 Deterministic Drug Search:
    - Normalizes voice transcripts
    - Indian Phonetic + Rapidfuzz scoring (0.60 * Fuzzy + 0.40 * Phonetic)
    - Ambiguity Guardrail (e.g., 'Telma' -> 20mg, 40mg, 80mg)
    - Release-type lock (SR != IR)
    - Hard fallback if confidence < 65.0
    """
    result = search_engine.search(query=q, strength=strength)
    return result


@app.post("/api/prescription-cart")
def calculate_prescription_cart(cart: PrescriptionCartRequest):
    """
    Calculates total monthly and 1-year chronic disease household savings across multiple prescribed drugs.
    """
    total_monthly_branded = 0.0
    total_monthly_generic = 0.0
    itemized = []
    has_nti = False

    for item in cart.items:
        drug = search_engine.drugs_by_id.get(item.drug_id)
        if not drug:
            continue

        if drug.get("is_narrow_therapeutic_index", False):
            has_nti = True

        units = item.monthly_units
        b_cost = round(drug["branded_unit_price"] * units, 2)
        g_cost = round(drug["generic_unit_price"] * units, 2)
        savings = round(b_cost - g_cost, 2)

        total_monthly_branded += b_cost
        total_monthly_generic += g_cost

        itemized.append({
            "drug_id": drug["id"],
            "brand_name": drug["brand_name"],
            "generic_name": drug["generic_name"],
            "pmbjp_drug_code": drug["pmbjp_drug_code"],
            "release_type": drug["release_type"],
            "generic_release_type": drug["generic_release_type"],
            "is_narrow_therapeutic_index": drug.get("is_narrow_therapeutic_index", False),
            "monthly_units": units,
            "branded_unit_price": drug["branded_unit_price"],
            "generic_unit_price": drug["generic_unit_price"],
            "branded_monthly_cost": b_cost,
            "generic_monthly_cost": g_cost,
            "monthly_savings": savings,
            "annual_savings": round(savings * 12, 2),
            "savings_percentage": drug["savings_percentage"]
        })

    net_monthly_savings = round(total_monthly_branded - total_monthly_generic, 2)
    one_year_chronic_savings = round(net_monthly_savings * 12, 2)
    overall_savings_pct = (
        round((net_monthly_savings / total_monthly_branded) * 100, 1) if total_monthly_branded > 0 else 0.0
    )

    return {
        "status": "SUCCESS",
        "items_count": len(itemized),
        "total_monthly_branded_cost": round(total_monthly_branded, 2),
        "total_monthly_generic_cost": round(total_monthly_generic, 2),
        "net_monthly_savings": net_monthly_savings,
        "one_year_chronic_savings": one_year_chronic_savings,
        "overall_savings_percentage": overall_savings_pct,
        "has_narrow_therapeutic_index_drug": has_nti,
        "items": itemized
    }


@app.get("/api/nearest-kendra")
def get_nearest_kendras(
    lat: float = Query(..., ge=-90.0, le=90.0, description="User Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="User Longitude")
):
    """
    Offline Haversine Store Locator:
    Returns the 3 nearest Jan Aushadhi Kendras with distance in km,
    address, pincode, and Google Maps directions URL.
    """
    nearest = locator.find_nearest_kendras(user_lat=lat, user_lon=lon, limit=3)
    return {
        "status": "SUCCESS",
        "user_coordinates": {"lat": lat, "lon": lon},
        "count": len(nearest),
        "nearest_kendras": nearest
    }


# Backwards-compatible programmatic interface
class JanAushadhiSatyaAPI:
    def __init__(self):
        self.engine = search_engine
        self.locator = locator
        self.drugs = search_engine.drugs
        self.kendras = locator.kendras

    def search_drugs(self, query: str) -> Dict[str, Any]:
        res = self.engine.search(query)
        if res.get("status") == "AMBIGUOUS_STRENGTH":
            return {
                "query": query,
                "total_results": len(res.get("candidates", [])),
                "is_ambiguous": True,
                "ambiguity_candidates": res.get("candidates", []),
                "results": [c for c in self.drugs if query.lower() in c["brand_name"].lower()]
            }
        elif res.get("status") == "SUCCESS":
            return {
                "query": query,
                "total_results": 1,
                "is_ambiguous": False,
                "ambiguity_candidates": [],
                "results": [res["drug"]]
            }
        else:
            return {
                "query": query,
                "total_results": 0,
                "is_ambiguous": False,
                "ambiguity_candidates": [],
                "results": []
            }

    def audit_drug(self, drug_id: str) -> Optional[Dict[str, Any]]:
        target = self.engine.drugs_by_id.get(drug_id)
        if not target:
            return None
        return {
            "drug": target,
            "clinical_audit": {
                "is_clinically_safe": target["release_match_status"] == "EXACT_MATCH" and not target.get("is_narrow_therapeutic_index", False),
                "release_match": target["release_match_status"] == "EXACT_MATCH",
                "savings_percentage": target["savings_percentage"],
                "warnings": ["NARROW THERAPEUTIC INDEX"] if target.get("is_narrow_therapeutic_index") else []
            }
        }

    def find_nearest_kendras(self, lat: float, lon: float, limit: int = 5) -> List[Dict[str, Any]]:
        return self.locator.find_nearest_kendras(lat, lon, limit=limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
