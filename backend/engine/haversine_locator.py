"""
JanAushadhi Satya - Offline Haversine Geo-Locator
Calculates geodesic distances and finds nearest PMBJP Kendras without external network calls.
"""

import math
from typing import List, Dict, Any, Tuple


class KendraLocator:
    """Zero-dependency Haversine formula calculation for offline resilience."""

    EARTH_RADIUS_KM = 6371.0

    @classmethod
    def haversine_distance_km(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates great-circle distance between two coordinates in kilometers.
        Formula:
          a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
          c = 2 * atan2(√a, √(1−a))
          d = R * c
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

    @classmethod
    def find_nearest_kendras(
        cls,
        user_lat: float,
        user_lon: float,
        kendras: List[Dict[str, Any]],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Computes distance from user to each Kendra and returns sorted results.
        Includes estimated travel times.
        """
        results = []
        for k in kendras:
            dist = cls.haversine_distance_km(user_lat, user_lon, k["latitude"], k["longitude"])
            # Approximate travel times: 4 km/h walking, 25 km/h urban driving
            walk_min = int(round((dist / 4.0) * 60))
            drive_min = int(round((dist / 25.0) * 60))

            kendra_entry = dict(k)
            kendra_entry["distance_km"] = dist
            kendra_entry["approx_walk_minutes"] = max(1, walk_min)
            kendra_entry["approx_drive_minutes"] = max(1, drive_min)
            results.append(kendra_entry)

        results.sort(key=lambda x: x["distance_km"])
        return results[:limit]
