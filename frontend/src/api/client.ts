import {
  executeOfflineSearch,
  calculateOfflineNearestKendras,
  updateEngineStatus,
} from '../utils/offlineFallback';
import { DrugRecord, JanAushadhiKendra } from '../../../src/types/drug';

const API_BASE = 'http://localhost:8000';

export interface SearchResponse {
  status: 'SUCCESS' | 'AMBIGUOUS_STRENGTH' | 'NOT_FOUND' | 'EMPTY_QUERY';
  message?: string;
  execution_time_ms?: number;
  query?: string;
  parsed_query?: {
    normalized: string;
    dosage_numbers: string[];
    release_modifiers: string[];
    explicit_strength: string | null;
  };
  match_explanation?: {
    matched_via: string;
    confidence: number;
    input_token: string;
    matched_brand: string;
    fuzzy_score?: number;
    phonetic_score?: number;
    threshold_required?: number;
  };
  drug?: DrugRecord;
  available_strengths?: string[];
  candidates?: Array<{
    brand_id: string;
    brand_name: string;
    strength: string;
    composition_display: string;
    dosage_form: string;
    generic_name: string;
    pmbjp_drug_code: string;
  }>;
  pack_size_normalization?: {
    branded_pack_size: number;
    branded_mrp: number;
    branded_unit_price: number;
    normalized_10_unit_branded_price: number;
    generic_pack_size: number;
    generic_mrp: number;
    generic_unit_price: number;
    normalized_10_unit_generic_price: number;
    savings_percentage: number;
    savings_per_10_units: number;
    formula_note: string;
  };
  clinical_safety?: {
    is_release_match: boolean;
    release_lock_warning?: string | null;
    brand_release: string;
    generic_release: string;
    is_narrow_therapeutic_index: boolean;
    clinical_notes: string;
  };
}

export async function fetchDrugSearch(query: string, strength?: string): Promise<SearchResponse> {
  const cleanQ = query.trim();
  if (!cleanQ) {
    return { status: 'EMPTY_QUERY', query: '' };
  }

  const t0 = performance.now();

  // 1. Primary: Python FastAPI Backend (< 3ms)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 500); // 500ms failover cutoff
    const url = new URL(`${API_BASE}/api/search`);
    url.searchParams.set('q', cleanQ);
    if (strength) url.searchParams.set('strength', strength);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data: SearchResponse = await res.json();
      const roundTripMs = performance.now() - t0;
      updateEngineStatus('python_fastapi', data.execution_time_ms || roundTripMs);
      return data;
    }
  } catch (_err) {
    // Stage Wi-Fi dropped or backend offline
  }

  // 2. Zero-Wi-Fi Failover Mode (0ms)
  const fallbackData = executeOfflineSearch(cleanQ, strength);
  updateEngineStatus('offline_failover', fallbackData.execution_time_ms || 0.5);
  return fallbackData as SearchResponse;
}

export async function fetchNearestKendras(lat: number, lon: number): Promise<JanAushadhiKendra[]> {
  const t0 = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600);
    const res = await fetch(`${API_BASE}/api/nearest-kendra?lat=${lat}&lon=${lon}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'SUCCESS' && Array.isArray(data.nearest_kendras)) {
        updateEngineStatus('python_fastapi', performance.now() - t0);
        return data.nearest_kendras;
      }
    }
  } catch (_e) {
    // Offline failover
  }

  updateEngineStatus('offline_failover', 0.2);
  return calculateOfflineNearestKendras(lat, lon, 3);
}

export async function calculatePrescriptionCart(items: Array<{ drug_id: string; monthly_units: number }>) {
  try {
    const res = await fetch(`${API_BASE}/api/prescription-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Handled in client prescription tray
  }
  return null;
}
