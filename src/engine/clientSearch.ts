import { DrugRecord, JanAushadhiKendra } from '../types/drug';

export function computeIndianSoundex(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return '0000';
  const first = clean[0];
  const mapping: Record<string, string> = {
    BFPV: '1',
    CGJKQSXZ: '2',
    DT: '3',
    L: '4',
    MN: '5',
    R: '6'
  };
  const encoded = [first];
  let prev: string | null = null;
  for (let i = 1; i < clean.length; i++) {
    const char = clean[i];
    let digit: string | null = null;
    for (const [key, val] of Object.entries(mapping)) {
      if (key.includes(char)) {
        digit = val;
        break;
      }
    }
    if (digit && digit !== prev) {
      encoded.push(digit);
      prev = digit;
    } else if (!digit) {
      prev = null;
    }
  }
  return encoded.join('').padEnd(4, '0').slice(0, 4);
}

export function computeIndianPhoneticToken(name: string): string {
  let token = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  token = token
    .replace(/PH/g, 'F')
    .replace(/TH/g, 'T')
    .replace(/DH/g, 'D')
    .replace(/BH/g, 'B')
    .replace(/GH/g, 'G')
    .replace(/KH/g, 'K')
    .replace(/SH/g, 'S')
    .replace(/CH/g, 'S')
    .replace(/EE/g, 'I')
    .replace(/EA/g, 'I')
    .replace(/OO/g, 'U')
    .replace(/CK/g, 'K')
    .replace(/C/g, 'K')
    .replace(/Q/g, 'K')
    .replace(/X/g, 'KS')
    .replace(/Z/g, 'S')
    .replace(/W/g, 'V')
    .replace(/(.)\1+/g, '$1');
  return token;
}

export function detectStrengthAmbiguity(
  query: string,
  allDrugs: DrugRecord[]
): DrugRecord[] | null {
  const cleanQ = query.trim().toLowerCase();
  if (cleanQ.length < 3) return null;

  const matched = allDrugs.filter((d) =>
    d.brand_name.toLowerCase().includes(cleanQ)
  );

  if (matched.length > 1) {
    const firstWord = matched[0].brand_name.split(' ')[0].toLowerCase();
    const allShareFirstWord = matched.every((d) =>
      d.brand_name.toLowerCase().startsWith(firstWord)
    );
    // Check if user has NOT already typed a number/strength
    const hasNumber = /\d+/.test(cleanQ);
    if (allShareFirstWord && !hasNumber) {
      return matched;
    }
  }
  return null;
}

export function searchDrugs(query: string, allDrugs: DrugRecord[]): {
  results: DrugRecord[];
  isAmbiguous: boolean;
  ambiguityCandidates: DrugRecord[];
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { results: allDrugs, isAmbiguous: false, ambiguityCandidates: [] };
  }

  const ambiguityCandidates = detectStrengthAmbiguity(q, allDrugs) || [];
  const isAmbiguous = ambiguityCandidates.length > 1;

  const qSoundex = computeIndianSoundex(q);
  const qPhonetic = computeIndianPhoneticToken(q);

  const exactMatches: DrugRecord[] = [];
  const partialMatches: DrugRecord[] = [];
  const phoneticMatches: DrugRecord[] = [];

  for (const drug of allDrugs) {
    const bname = drug.brand_name.toLowerCase();
    const gname = drug.generic_name.toLowerCase();
    const mols = drug.composition.map((c) => c.molecule.toLowerCase());
    const syns = drug.search_synonyms.map((s) => s.toLowerCase());
    const pkeys = drug.phonetic_keys || [];

    if (q === bname || syns.includes(q)) {
      exactMatches.push(drug);
    } else if (
      bname.includes(q) ||
      gname.includes(q) ||
      mols.some((m) => m.includes(q)) ||
      syns.some((s) => s.includes(q))
    ) {
      partialMatches.push(drug);
    } else if (pkeys.includes(qSoundex) || pkeys.includes(qPhonetic)) {
      phoneticMatches.push(drug);
    }
  }

  const merged = [
    ...exactMatches,
    ...partialMatches.filter((d) => !exactMatches.includes(d)),
  ];

  const results = merged.length > 0 ? merged : phoneticMatches;

  return {
    results,
    isAmbiguous,
    ambiguityCandidates,
  };
}

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function findNearestKendras(
  userLat: number,
  userLon: number,
  kendras: JanAushadhiKendra[],
  limit = 5
): JanAushadhiKendra[] {
  const list = kendras.map((k) => {
    const dist = calculateHaversineDistanceKm(userLat, userLon, k.latitude, k.longitude);
    const walkMin = Math.max(1, Math.round((dist / 4.0) * 60));
    const driveMin = Math.max(1, Math.round((dist / 25.0) * 60));
    return {
      ...k,
      distance_km: dist,
      approx_walk_minutes: walkMin,
      approx_drive_minutes: driveMin,
    };
  });

  list.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  return list.slice(0, limit);
}
