"""
JanAushadhi Satya - Offline Haversine Store Locator
Pure Python great-circle distance calculation for PMBJP Kendras.
Zero external network calls, zero map API keys, 100% offline resilient.
"""

import math
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional


class KendraLocator:
    """Offline Haversine Store Locator indexing Jan Aushadhi Kendras in-memory."""

    EARTH_RADIUS_KM = 6371.0

    def __init__(self, kendras_path: Optional[str] = None):
        if not kendras_path:
            base_dir = Path(__file__).resolve().parent.parent / "data_pipeline" / "output"
            kendras_path = str(base_dir / "jan_aushadhi_kendras.json")

        with open(kendras_path, "r", encoding="utf-8") as f:
            self.kendras: List[Dict[str, Any]] = json.load(f)

    @classmethod
    def haversine_distance_km(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates great-circle distance between two GPS coordinates in kilometers.
        d = 2 * R * asin(sqrt(sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)))
        """
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(cls.EARTH_RADIUS_KM * c, 2)

    def find_nearest_kendras(
        self,
        user_lat: float,
        user_lon: float,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Returns the closest Jan Aushadhi Kendras sorted by distance.
        Includes full address, pin code, and Google Maps directions URL.
        """
        results = []
        for k in self.kendras:
            dist = self.haversine_distance_km(user_lat, user_lon, k["latitude"], k["longitude"])
            # Directions URL format
            directions_url = f"https://www.google.com/maps/dir/?api=1&destination={k['latitude']},{k['longitude']}"
            
            entry = {
                "kendra_id": k["kendra_id"],
                "name": k["name"],
                "address": k["address"],
                "city": k["city"],
                "state": k["state"],
                "pincode": k["pincode"],
                "latitude": k["latitude"],
                "longitude": k["longitude"],
                "contact_phone": k["contact_phone"],
                "operating_hours": k.get("operating_hours", "09:00 AM - 09:00 PM"),
                "is_open_sunday": k.get("is_open_sunday", True),
                "distance_km": dist,
                "approx_walk_minutes": max(1, int(round((dist / 4.0) * 60))),
                "approx_drive_minutes": max(1, int(round((dist / 25.0) * 60))),
                "directions_url": directions_url
            }
            results.append(entry)

        results.sort(key=lambda x: x["distance_km"])
        return results[:limit]
