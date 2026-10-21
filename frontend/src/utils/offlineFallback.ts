/**
 * JanAushadhi Satya - Zero-Wi-Fi Failover Engine
 * 100% Offline, In-Memory Deterministic Search, Disambiguation & Haversine Locator
 * Bundled directly into the client bundle to guarantee 0ms fallback on stage.
 */

import goldenDrugsData from '../../../src/data/golden_drugs.json';
import janAushadhiKendrasData from '../../../src/data/jan_aushadhi_kendras.json';
import { DrugRecord, JanAushadhiKendra, BasketItem } from '../../../src/types/drug';

export type EngineMode = 'python_fastapi' | 'offline_failover';

export interface EngineStatus {
  mode: EngineMode;
  label: string;
  latencyMs: number;
  lastChecked: number;
}

// Global active status tracking for UI badge
let currentEngineStatus: EngineStatus = {
  mode: 'offline_failover',
  label: '⚡ Zero-Wi-Fi Failover Active (0ms)',
  latencyMs: 0.5,
  lastChecked: Date.now(),
};

type StatusListener = (status: EngineStatus) => void;
const listeners = new Set<StatusListener>();

export function subscribeEngineStatus(fn: StatusListener): () => void {
  listeners.add(fn);
  fn(currentEngineStatus);
  return () => listeners.delete(fn);
}

export function updateEngineStatus(mode: EngineMode, latencyMs: number) {
  currentEngineStatus = {
    mode,
    label:
      mode === 'python_fastapi'
        ? `🐍 Python Engine Active (<${Math.max(1, Math.round(latencyMs))}ms)`
        : '⚡ Zero-Wi-Fi Failover Active (0ms)',
    latencyMs,
    lastChecked: Date.now(),
  };
  listeners.forEach((fn) => fn(currentEngineStatus));
}

export function getEngineStatus(): EngineStatus {
  return currentEngineStatus;
}

// ---------------------------------------------------------------------------
// 1. In-Memory Datasets
// ---------------------------------------------------------------------------
export const BUNDLED_DRUGS: DrugRecord[] = goldenDrugsData as unknown as DrugRecord[];
export const BUNDLED_KENDRAS: JanAushadhiKendra[] = janAushadhiKendrasData as unknown as JanAushadhiKendra[];

// ---------------------------------------------------------------------------
// 2. Client-Side Phonetic Normalizer (Matches backend/engine/matcher.py)
// ---------------------------------------------------------------------------
export function indianPhoneticHash(text: string): string {
  if (!text) return '';
  let s = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  s = s
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/bh/g, 'b')
    .replace(/gh/g, 'g')
    .replace(/kh/g, 'k')
    .replace(/sh/g, 's')
    .replace(/ch/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 'j')
    .replace(/v/g, 'w')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/ee/g, 'i')
    .replace(/ea/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/ai/g, 'e')
    .replace(/ou/g, 'u')
    .replace(/(.)\1+/g, '$1');
  return s.trim();
}

// ---------------------------------------------------------------------------
// 3. Fast Levenshtein & Token Ratio (Matches rapidfuzz logic)
// ---------------------------------------------------------------------------
function levenshteinRatio(s1: string, s2: string): number {
  if (s1 === s2) return 100.0;
  if (!s1.length || !s2.length) return 0.0;

  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(m, n);
  const dist = d[m][n];
  return Math.round((1 - dist / maxLen) * 100);
}

function tokenSetRatio(s1: string, s2: string): number {
  const set1 = new Set(s1.toLowerCase().split(/\s+/).filter(Boolean));
  const set2 = new Set(s2.toLowerCase().split(/\s+/).filter(Boolean));

  let intersectionCount = 0;
  set1.forEach((t) => {
    if (set2.has(t)) intersectionCount++;
  });

  const unionSize = new Set([...set1, ...set2]).size;
  if (unionSize === 0) return 100;
  return Math.round((intersectionCount / unionSize) * 100);
}

export function computeCompositeScore(query: string, target: string): {
  composite: number;
  fuzzy: number;
  phonetic: number;
} {
  const qClean = query.toLowerCase().trim();
  const tClean = target.toLowerCase().trim();

  if (qClean === tClean) {
    return { composite: 100, fuzzy: 100, phonetic: 100 };
  }

  const lev = levenshteinRatio(qClean, tClean);
  const tokenRatio = tokenSetRatio(qClean, tClean);
  const fuzzy = Math.max(tokenRatio, lev);

  const qHash = indianPhoneticHash(qClean);
  const tHash = indianPhoneticHash(tClean);
  let phonetic = levenshteinRatio(qHash, tHash);

  if (qHash === tHash && qHash.length > 2) {
    phonetic = 100;
  } else if (qHash.length >= 3 && (qHash.includes(tHash) || tHash.includes(qHash))) {
    phonetic = 92;
  }

  // Exact composite formula: 0.60 * Fuzzy + 0.40 * Phonetic
  const composite = Math.round((0.6 * fuzzy + 0.4 * phonetic) * 100) / 100;
  return { composite, fuzzy, phonetic };
}

// ---------------------------------------------------------------------------
// 4. Tokenizer & Spoken Voice Normalizer
// ---------------------------------------------------------------------------
const SPOKEN_NUMBERS: Record<string, string> = {
    one: '1', two: '2', three: '3', four: '4', five: '5',
    six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
    forty: '40', twenty: '20', eighty: '80', fifty: '50',
    'six twenty five': '625', 'six fifty': '650', 'five hundred': '500'
};

export function normalizeVoiceTranscripts(text: string): string {
  let lowered = text.toLowerCase().trim();
  for (const [spoken, digit] of Object.entries(SPOKEN_NUMBERS)) {
    lowered = lowered.replace(new RegExp(`\\b${spoken}\\b`, 'g'), digit);
  }
  return lowered;
}

// ---------------------------------------------------------------------------
// 5. Zero-Wi-Fi Failover Deterministic Search Function
// ---------------------------------------------------------------------------
export function executeOfflineSearch(query: string, strength?: string) {
  const t0 = performance.now();
  const normalizedQ = normalizeVoiceTranscripts(query);
  const cleanQ = normalizedQ.toLowerCase().trim();

  if (!cleanQ) {
    return {
      status: 'EMPTY_QUERY',
      query: '',
      execution_time_ms: 0.1,
    };
  }

  // Check Ambiguity Guardrail (e.g. 'telma' without strength)
  const rootName = cleanQ.split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
  const rootMatches = BUNDLED_DRUGS.filter((d) => {
    const dRoot = d.brand_name.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
    return dRoot.startsWith(rootName) || rootName.startsWith(dRoot);
  });

  const hasExplicitStrength = Boolean(strength || /\d+/.test(cleanQ));

  if (rootMatches.length > 1 && !hasExplicitStrength) {
    const strengths = Array.from(
      new Set(
        rootMatches.map((d) => {
          const val = d.composition[0]?.strength_val;
          const unit = d.composition[0]?.strength_unit || 'mg';
          return `${val}${unit}`;
        })
      )
    );

    return {
      status: 'AMBIGUOUS_STRENGTH',
      query: cleanQ,
      message: `Clinical Guardrail Alert: Multiple distinct dosage strengths found for '${cleanQ}'. For patient safety, select prescribed strength:`,
      available_strengths: strengths,
      candidates: rootMatches.map((d) => ({
        brand_id: d.id,
        brand_name: d.brand_name,
        strength: `${d.composition[0]?.strength_val}${d.composition[0]?.strength_unit || 'mg'}`,
        composition_display: d.composition_display,
        dosage_form: d.dosage_form,
        generic_name: d.generic_name,
        pmbjp_drug_code: d.pmbjp_drug_code,
      })),
      execution_time_ms: Math.round((performance.now() - t0) * 100) / 100,
    };
  }

  // Scored candidate search
  const reqNum = (strength || '').replace(/[^\d.]/g, '');
  const queryNums = cleanQ.match(/\b\d+(\.\d+)?\b/g) || [];

  const scored = BUNDLED_DRUGS.map((drug) => {
    const targets = [
      drug.brand_name,
      drug.generic_name,
      drug.composition_display,
      ...drug.search_synonyms,
    ];

    let bestComposite = 0;
    let bestFuzzy = 0;
    let bestPhonetic = 0;
    let bestTarget = drug.brand_name;

    for (const target of targets) {
      const { composite, fuzzy, phonetic } = computeCompositeScore(cleanQ, target);
      if (composite > bestComposite) {
        bestComposite = composite;
        bestFuzzy = fuzzy;
        bestPhonetic = phonetic;
        bestTarget = target;
      }
    }

    // Dosage strength bonuses
    let adjustedScore = bestComposite;
    const bLower = drug.brand_name.toLowerCase();
    const drugStrengths = drug.composition.map((c) => String(c.strength_val));

    if (reqNum) {
      if (bLower.includes(reqNum) || drugStrengths.includes(reqNum)) {
        adjustedScore += 20;
      } else if (rootMatches.includes(drug)) {
        adjustedScore -= 35;
      }
    }

    for (const num of queryNums) {
      if (bLower.includes(num) || drugStrengths.includes(num)) {
        adjustedScore += 10;
        break;
      }
    }

    return {
      drug,
      score: adjustedScore,
      fuzzy: bestFuzzy,
      phonetic: bestPhonetic,
      matchedTarget: bestTarget,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Hard Safe Fallback: Score < 65.0
  if (!best || best.score < 65.0) {
    return {
      status: 'NOT_FOUND',
      query: cleanQ,
      message:
        'Not found in verified database. For patient safety, we never guess or generate drug data. Please confirm with your doctor or pharmacist.',
      match_explanation: {
        matched_via: 'None (Below Confidence Threshold)',
        confidence: Math.round(best ? best.score : 0),
        input_token: cleanQ,
        matched_brand: best ? best.drug.brand_name : 'None',
        threshold_required: 65.0,
      },
      execution_time_ms: Math.round((performance.now() - t0) * 100) / 100,
    };
  }

  const matchedDrug = best.drug;
  const execTime = Math.round((performance.now() - t0) * 100) / 100;

  return {
    status: 'SUCCESS',
    query: cleanQ,
    execution_time_ms: execTime,
    match_explanation: {
      matched_via: best.phonetic >= 92 ? 'Indian Phonetic Normalizer' : 'Phonetic + Fuzzy Scorer',
      confidence: Math.min(100, Math.round(best.score)),
      input_token: cleanQ,
      matched_brand: matchedDrug.brand_name,
      fuzzy_score: best.fuzzy,
      phonetic_score: best.phonetic,
    },
    drug: matchedDrug,
    pack_size_normalization: {
      branded_pack_size: matchedDrug.branded_pack_size,
      branded_mrp: matchedDrug.branded_mrp,
      branded_unit_price: matchedDrug.branded_unit_price,
      normalized_10_unit_branded_price: matchedDrug.normalized_10_unit_branded_price,
      generic_pack_size: matchedDrug.generic_pack_size,
      generic_mrp: matchedDrug.generic_mrp,
      generic_unit_price: matchedDrug.generic_unit_price,
      normalized_10_unit_generic_price: matchedDrug.normalized_10_unit_generic_price,
      savings_percentage: matchedDrug.savings_percentage,
      savings_per_10_units: matchedDrug.savings_per_10_units,
      formula_note: 'Branded Unit = MRP / PackSize; Generic Unit = MRP / PackSize; 10-Unit = Unit * 10',
    },
    clinical_safety: {
      is_release_match: matchedDrug.release_match_status === 'EXACT_MATCH',
      release_lock_warning:
        matchedDrug.release_match_status === 'RELEASE_MISMATCH'
          ? 'Release formulation mismatch between Brand and Generic'
          : null,
      brand_release: matchedDrug.release_type,
      generic_release: matchedDrug.generic_release_type,
      is_narrow_therapeutic_index: matchedDrug.is_narrow_therapeutic_index,
      clinical_notes: matchedDrug.clinical_notes,
    },
  };
}

// ---------------------------------------------------------------------------
// 6. Offline Haversine Formula Calculator
// ---------------------------------------------------------------------------
export function calculateOfflineNearestKendras(
  userLat: number,
  userLon: number,
  limit = 3
): JanAushadhiKendra[] {
  const R = 6371.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const list = BUNDLED_KENDRAS.map((k) => {
    const phi1 = toRad(userLat);
    const phi2 = toRad(k.latitude);
    const deltaPhi = toRad(k.latitude - userLat);
    const deltaLambda = toRad(k.longitude - userLon);

    const a =
      Math.sin(deltaPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(R * c * 100) / 100;

    return {
      ...k,
      distance_km: dist,
      approx_walk_minutes: Math.max(1, Math.round((dist / 4.0) * 60)),
      approx_drive_minutes: Math.max(1, Math.round((dist / 25.0) * 60)),
      directions_url: `https://www.google.com/maps/dir/?api=1&destination=${k.latitude},${k.longitude}`,
    };
  });

  list.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  return list.slice(0, limit);
}
