"""
JanAushadhi Satya - Adversarial Pytest Suite
Rigorous testing of:
1. Heavy Indian misspellings ('augmntn 625', 'shelkal', 'ajithral 500')
2. Missing strength ambiguity guardrail ('telma' -> AMBIGUOUS_STRENGTH)
3. Fake / unverified drug rejection ('xyzrandompill' -> NOT_FOUND)
4. Explicit strength disambiguation ('telma' + strength='40mg' -> Telma 40)
5. Generic salt search ('amoxycillin clavulanate' -> Augmentin 625 Duo)
6. Voice transcript spoken words ('glycomet gp two' -> Glycomet-GP 2)
7. Sub-5ms execution time latency constraint
8. Offline Haversine store locator with directions URL
9. Multi-drug prescription cart 1-year chronic savings calculation
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from api.main import app, search_engine, locator

client = TestClient(app)


# -----------------------------------------------------------------------------
# Test 1: Heavy Misspellings & Regional Phonetic Variants
# -----------------------------------------------------------------------------
def test_heavy_misspelling_augmentin():
    """Query 'augmntn 625' must deterministically match 'Augmentin 625 Duo'."""
    res = client.get("/api/search?q=augmntn 625")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Augmentin 625 Duo"
    assert data["match_explanation"]["confidence"] >= 80.0
    assert "Amoxycillin" in data["drug"]["composition_display"]


def test_heavy_misspelling_shelcal():
    """Query 'shelkal' ('c' -> 'k' Indian phonetic substitution) must match 'Shelcal 500'."""
    res = client.get("/api/search?q=shelkal")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Shelcal 500"
    assert data["match_explanation"]["confidence"] >= 80.0


def test_heavy_misspelling_azithral():
    """Query 'ajithral 500' ('z' -> 'j' Indian phonetic habit) must match 'Azithral 500'."""
    res = client.get("/api/search?q=ajithral 500")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Azithral 500"
    assert data["match_explanation"]["confidence"] >= 80.0


# -----------------------------------------------------------------------------
# Test 2: Missing Strength Ambiguity Guardrail
# -----------------------------------------------------------------------------
def test_missing_strength_ambiguity_telma():
    """
    Query 'telma' without strength MUST trigger AMBIGUOUS_STRENGTH status
    with available_strengths containing 20mg, 40mg, 80mg.
    """
    res = client.get("/api/search?q=telma")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "AMBIGUOUS_STRENGTH"
    assert "available_strengths" in data
    assert "20mg" in data["available_strengths"]
    assert "40mg" in data["available_strengths"]
    assert "80mg" in data["available_strengths"]
    assert len(data["candidates"]) >= 3
    assert "Clinical Guardrail Alert" in data["message"]


def test_disambiguation_with_strength_param():
    """Providing 'telma' with strength='40mg' must bypass ambiguity and return Telma 40."""
    res = client.get("/api/search?q=telma&strength=40mg")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Telma 40"
    assert data["drug"]["composition_display"] == "Telmisartan 40mg"


def test_disambiguation_in_query_telma_20():
    """Query 'telma 20' must resolve to Telma 20."""
    res = client.get("/api/search?q=telma 20")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Telma 20"


def test_disambiguation_in_query_telma_80():
    """Query 'telma 80' must resolve to Telma 80."""
    res = client.get("/api/search?q=telma 80")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Telma 80"


# -----------------------------------------------------------------------------
# Test 3: Fake / Unverified Drug Hard Safe Fallback
# -----------------------------------------------------------------------------
def test_fake_drug_hard_fallback():
    """Fake drug query 'xyzrandompill' must trigger NOT_FOUND with clinical safeguard."""
    res = client.get("/api/search?q=xyzrandompill")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "NOT_FOUND"
    assert "Not found in verified database" in data["message"]
    assert "For patient safety, we never guess or generate drug data" in data["message"]
    assert data["match_explanation"]["confidence"] < 65.0


# -----------------------------------------------------------------------------
# Test 4: Generic Salt Name Search
# -----------------------------------------------------------------------------
def test_generic_salt_search_amoxycillin():
    """Searching active generic salt 'amoxycillin clavulanate' must find Augmentin 625 Duo."""
    res = client.get("/api/search?q=amoxycillin clavulanate")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "Amoxycillin" in data["drug"]["composition_display"]


def test_generic_salt_search_pantoprazole():
    """Searching 'pantoprazole domperidone' must match Pan-D."""
    res = client.get("/api/search?q=pantoprazole domperidone")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Pan-D"


# -----------------------------------------------------------------------------
# Test 5: Voice Transcript Spoken Number Words
# -----------------------------------------------------------------------------
def test_spoken_number_transcript():
    """Spoken voice transcript 'glycomet gp two' must normalize to Glycomet-GP 2."""
    res = client.get("/api/search?q=glycomet gp two")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["drug"]["brand_name"] == "Glycomet-GP 2"
    assert "2mg" in data["drug"]["composition_display"]


# -----------------------------------------------------------------------------
# Test 6: Performance Latency (< 5ms per query)
# -----------------------------------------------------------------------------
def test_search_execution_latency():
    """Search latency must be strictly under 5 milliseconds."""
    # Warmup query
    client.get("/api/search?q=warmup 500")

    test_queries = [
        "augmntn 625",
        "shelkal",
        "pan d",
        "dolo 650",
        "metolar xr 50",
        "allegra 120",
        "ecosprin 75",
        "thyronorm 50"
    ]
    for q in test_queries:
        res = client.get(f"/api/search?q={q}")
        assert res.status_code == 200
        data = res.json()
        assert data["execution_time_ms"] < 5.0, f"Query '{q}' took {data['execution_time_ms']}ms (limit: 5.0ms)"


# -----------------------------------------------------------------------------
# Test 7: Offline Haversine Nearest Kendra Locator
# -----------------------------------------------------------------------------
def test_nearest_kendra_locator():
    """Returns 3 nearest Kendras with distance_km and Google Maps directions URL."""
    # Delhi Connaught Place coordinates
    res = client.get("/api/nearest-kendra?lat=28.6315&lon=77.2167")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["count"] == 3
    assert len(data["nearest_kendras"]) == 3

    top = data["nearest_kendras"][0]
    assert "distance_km" in top
    assert top["distance_km"] < 1.0  # Connaught Place kendra is right there
    assert "directions_url" in top
    assert "https://www.google.com/maps/dir/?api=1&destination=" in top["directions_url"]
    assert "address" in top
    assert "pincode" in top


# -----------------------------------------------------------------------------
# Test 8: Prescription Cart Multi-Drug Chronic Savings
# -----------------------------------------------------------------------------
def test_prescription_cart_calculation():
    """Calculates monthly bill and 1-year chronic disease household savings."""
    cart_payload = {
        "items": [
            {"drug_id": "DRUG-001", "monthly_units": 10},  # Augmentin 625 Duo
            {"drug_id": "DRUG-002", "monthly_units": 30},  # Pan-D
            {"drug_id": "DRUG-004", "monthly_units": 30},  # Telma 40
            {"drug_id": "DRUG-007", "monthly_units": 30}   # Glycomet-GP 2
        ]
    }
    res = client.post("/api/prescription-cart", json=cart_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["items_count"] == 4
    assert data["total_monthly_branded_cost"] > data["total_monthly_generic_cost"]
    assert data["net_monthly_savings"] > 500.0
    assert data["one_year_chronic_savings"] == round(data["net_monthly_savings"] * 12, 2)
    assert data["overall_savings_percentage"] >= 70.0


# -----------------------------------------------------------------------------
# Test 9: Glare-Resistant Strip Scanner OCR Endpoint
# -----------------------------------------------------------------------------
def test_scan_strip_endpoint():
    """Tests /api/scan-strip with synthetic image and stop-word filtering."""
    import io
    import base64
    from PIL import Image, ImageDraw

    # Create dummy strip image
    img = Image.new("RGB", (300, 80), color=(240, 240, 240))
    d = ImageDraw.Draw(img)
    d.text((10, 20), "PAN-D Pantoprazole 40mg Strip", fill=(10, 10, 10))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_data = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    res = client.post("/api/scan-strip", json={"image_base64": b64_data})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "extracted_query" in data
    # Stop-word "strip" must be filtered out
    assert "strip" not in [t.lower() for t in data["cleaned_tokens"]]
