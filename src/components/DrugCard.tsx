import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Plus,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { DrugRecord, ReleaseType } from '../types/drug';

interface DrugCardProps {
  drug: DrugRecord;
  onAddToBasket: (drug: DrugRecord) => void;
  isInBasket: boolean;
  lang: 'en' | 'hi';
}

const RELEASE_BADGE_INFO: Record<
  ReleaseType,
  { label: string; full: string; descEn: string; descHi: string; color: string }
> = {
  IR: {
    label: 'IR',
    full: 'Immediate Release',
    descEn: 'Releases active pharmaceutical ingredient immediately upon dissolution.',
    descHi: 'घुलने के तुरंत बाद दवा का असर शुरू होता है।',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  SR: {
    label: 'SR',
    full: 'Sustained Release',
    descEn: 'Gradual drug release over extended hours for continuous plasma levels.',
    descHi: 'लगातार असर बनाए रखने के लिए धीरे-धीरे दवा छोड़ता है।',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  XR: {
    label: 'XR',
    full: 'Extended Release',
    descEn: 'Specialized dissolution matrix. Must NOT be crushed or chewed.',
    descHi: 'विशेष रिलीज फॉर्मूला। इसे चबाएं या तोड़ें नहीं।',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  EC: {
    label: 'EC',
    full: 'Enteric Coated / Gastro-Resistant',
    descEn: 'Passes stomach safely and dissolves in alkaline small intestine.',
    descHi: 'पेट के एसिड से बचाकर आंतों में घुलने के लिए लेपित।',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  DT: {
    label: 'DT',
    full: 'Dispersible Tablet',
    descEn: 'Quickly disintegrates in water before swallowing.',
    descHi: 'पानी में आसानी से घोलकर पीने वाली गोली।',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
};

export const DrugCard: React.FC<DrugCardProps> = ({
  drug,
  onAddToBasket,
  isInBasket,
  lang,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const releaseInfo = RELEASE_BADGE_INFO[drug.release_type] || RELEASE_BADGE_INFO.IR;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200">
      {/* Top Clinical Badge Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-800/80 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
            {drug.therapeutic_category}
          </span>
          {/* Release Type Badge */}
          <div
            className={`px-2 py-0.5 text-[10px] font-bold rounded border flex items-center gap-1 ${releaseInfo.color}`}
            title={lang === 'en' ? releaseInfo.descEn : releaseInfo.descHi}
          >
            <span>{releaseInfo.label}</span>
            <span className="opacity-70 font-normal">({releaseInfo.full})</span>
          </div>

          {/* Release Match Check */}
          {drug.release_match_status === 'EXACT_MATCH' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {lang === 'en' ? 'Equivalence Verified' : 'समानता प्रमाणित'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              {lang === 'en' ? 'Release Mismatch' : 'रिलीज़ भिन्नता'}
            </span>
          )}
        </div>

        {/* PMBJP Official Item Code */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-300/90 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
          <Tag className="w-3 h-3 text-emerald-400" />
          <span>PMBJP Code: #{drug.pmbjp_drug_code}</span>
        </div>
      </div>

      {/* Narrow Therapeutic Index (NTI) Critical Alert Banner */}
      {drug.is_narrow_therapeutic_index && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 mb-4 text-rose-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-rose-300">
              {lang === 'en'
                ? 'Clinical Guardrail: Narrow Therapeutic Index (NTI)'
                : 'चिकित्सीय सतर्कता: संकीर्ण चिकित्सीय सूचकांक (NTI)'}
            </strong>
            <p className="mt-0.5 text-rose-200/90">
              {lang === 'en'
                ? 'This medicine requires precise blood serum levels. While PMBJP generics meet strict Indian Pharmacopoeia standards, consult your doctor for TSH/plasma monitoring before switching.'
                : 'इस दवा के लिए रक्त में सटीक स्तर आवश्यक है। जेनेरिक में बदलने से पहले डॉक्टर की सलाह से सीरम टीएसएच की जांच अवश्य कराएं।'}
            </p>
          </div>
        </div>
      )}

      {/* Main Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Left Card: Commercial Branded Medicine */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">
                {lang === 'en' ? 'Commercial Brand' : 'बाज़ार का ब्रांड'}
              </span>
              <span className="text-slate-500">{drug.dosage_form}</span>
            </div>

            <h4 className="text-base font-bold text-white tracking-tight leading-snug">
              {drug.brand_name}
            </h4>

            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{drug.brand_manufacturer}</span>
            </p>

            <div className="mt-2.5 text-xs text-slate-300 font-mono bg-slate-900/90 px-2 py-1.5 rounded border border-slate-800">
              {drug.composition_display}
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-end justify-between">
            <div>
              <div className="text-[11px] text-slate-400">
                {lang === 'en' ? 'Market Pack MRP' : 'पैक मूल्य (MRP)'}
              </div>
              <div className="text-lg font-bold text-rose-300">
                ₹{drug.branded_mrp.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({drug.branded_pack_size} units)
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                {lang === 'en' ? 'Unit Price' : 'प्रति इकाई'}
              </div>
              <div className="text-sm font-semibold text-slate-200">
                ₹{drug.branded_unit_price.toFixed(2)} / unit
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: PMBJP Jan Aushadhi Generic */}
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
          {/* Savings Ribbon */}
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>SAVE {drug.savings_percentage.toFixed(1)}%</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1 pr-18">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {lang === 'en' ? 'PMBJP Generic' : 'जनऔषधि जेनेरिक'}
              </span>
            </div>

            <h4 className="text-base font-bold text-emerald-100 tracking-tight leading-snug">
              {drug.generic_name}
            </h4>

            <p className="text-[11px] text-emerald-400/80 mt-0.5 flex items-center gap-1">
              <span>Govt. of India PMBJP Certified • WHO-GMP</span>
            </p>

            <div className="mt-2.5 text-xs text-emerald-200/90 font-mono bg-emerald-950/60 px-2 py-1.5 rounded border border-emerald-800/50 truncate">
              {drug.composition_display}
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-emerald-800/40 flex items-end justify-between">
            <div>
              <div className="text-[11px] text-emerald-300/80">
                {lang === 'en' ? 'Jan Aushadhi MRP' : 'जनऔषधि मूल्य'}
              </div>
              <div className="text-lg font-bold text-emerald-300">
                ₹{drug.generic_mrp.toFixed(2)}
                <span className="text-xs font-normal text-emerald-400/70 ml-1">
                  ({drug.generic_pack_size} units)
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-emerald-400/90 uppercase font-semibold">
                {lang === 'en' ? 'Unit Price' : 'प्रति इकाई'}
              </div>
              <div className="text-sm font-semibold text-emerald-200">
                ₹{drug.generic_unit_price.toFixed(2)} / unit
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pack-Size Normalization Banner (Crucial Requirement: 15 vs 10 tabs normalization) */}
      <div className="mt-3.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-400">
            {lang === 'en'
              ? 'Fair Pack-Size Normalization (10-Unit Standard Benchmark):'
              : 'सटीक पैक सामान्यीकरण (१० इकाई मानक तुलना):'}
          </span>
          <span className="font-mono text-slate-300 line-through">
            ₹{drug.normalized_10_unit_branded_price.toFixed(2)}
          </span>
          <span className="text-slate-500">vs</span>
          <span className="font-mono font-bold text-emerald-400">
            ₹{drug.normalized_10_unit_generic_price.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-xs">
          <span>{lang === 'en' ? 'Net Patient Savings:' : 'मरीज़ की बचत:'}</span>
          <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-mono font-bold border border-emerald-500/30">
            ₹{drug.savings_per_10_units.toFixed(2)} / 10 units
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-3.5 flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>{lang === 'en' ? 'Clinical Bioequivalence Details' : 'बायोइक्विवेलेंस विवरण'}</span>
          {showDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={() => onAddToBasket(drug)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm cursor-pointer ${
            isInBasket
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isInBasket ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'Added to Basket' : 'पर्चे में जोड़ा'}</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Add to Rx Basket' : 'पर्चे में जोड़ें'}</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Clinical Notes */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 animate-fade-in">
          <div>
            <span className="font-semibold text-slate-200">
              {lang === 'en' ? 'Pharmacology & Equivalence Note:' : 'फार्माकोलॉजी एवं समानता विवरण:'}
            </span>{' '}
            <span className="text-slate-300 leading-relaxed">{drug.clinical_notes}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
            <div>
              <span className="text-slate-500">
                {lang === 'en' ? 'Branded Release Type:' : 'ब्रांड रिलीज़ प्रकार:'}
              </span>{' '}
              <span className="text-slate-300 font-mono font-medium">{drug.release_type}</span>
            </div>
            <div>
              <span className="text-slate-500">
                {lang === 'en' ? 'Generic Release Type:' : 'जेनेरिक रिलीज़ प्रकार:'}
              </span>{' '}
              <span className="text-emerald-400 font-mono font-medium">
                {drug.generic_release_type}
              </span>
            </div>
            {drug.nppa_ceiling_price && (
              <div>
                <span className="text-slate-500">NPPA Ceiling Price:</span>{' '}
                <span className="text-slate-300 font-mono">
                  ₹{drug.nppa_ceiling_price.toFixed(2)}/unit
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Phonetic Soundex:</span>{' '}
              <span className="text-slate-300 font-mono">
                {drug.phonetic_keys.join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
