export type ReleaseType = 'IR' | 'SR' | 'XR' | 'EC' | 'DT';

export interface MoleculeStrength {
  molecule: string;
  strength_val: number;
  strength_unit: string;
}

export interface DrugRecord {
  id: string;
  brand_name: string;
  brand_manufacturer: string;
  dosage_form: string;
  release_type: ReleaseType;
  generic_release_type: ReleaseType;
  composition: MoleculeStrength[];
  composition_display: string;
  branded_mrp: number;
  branded_pack_size: number;
  branded_unit_price: number;
  normalized_10_unit_branded_price: number;
  generic_name: string;
  pmbjp_drug_code: string;
  generic_pack_size: number;
  generic_mrp: number;
  generic_unit_price: number;
  normalized_10_unit_generic_price: number;
  savings_percentage: number;
  savings_per_10_units: number;
  nppa_ceiling_price?: number | null;
  therapeutic_category: string;
  clinical_notes: string;
  is_narrow_therapeutic_index: boolean;
  release_match_status: 'EXACT_MATCH' | 'RELEASE_MISMATCH';
  phonetic_keys: string[];
  search_synonyms: string[];
}

export interface JanAushadhiKendra {
  kendra_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  operating_hours: string;
  is_open_sunday: boolean;
  distance_km?: number;
  approx_walk_minutes?: number;
  approx_drive_minutes?: number;
}

export interface BasketItem {
  drug: DrugRecord;
  monthly_units: number;
}
