import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { DrugRecord } from '../types/drug';

interface AmbiguityAlertProps {
  query: string;
  candidates: DrugRecord[];
  onSelectCandidate: (drug: DrugRecord) => void;
  lang: 'en' | 'hi';
}

export const AmbiguityAlert: React.FC<AmbiguityAlertProps> = ({
  query,
  candidates,
  onSelectCandidate,
  lang,
}) => {
  if (!candidates || candidates.length <= 1) return null;

  return (
    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 mb-5 text-amber-200 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-amber-100 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              {lang === 'en'
                ? `Clinical Ambiguity Guardrail: "${query}"`
                : `चिकित्सीय अस्पष्टता चेतावनी: "${query}"`}
            </h3>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-500/30 text-amber-300 rounded border border-amber-500/50">
              {lang === 'en' ? 'Dosage Required' : 'खुराक चयन आवश्यक'}
            </span>
          </div>

          <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
            {lang === 'en'
              ? `Multiple distinct strengths exist for "${query}". In clinical pharmacology, substituting without specifying the exact milligram strength carries severe risks of hypo/hypertension or glucose instability. Please select the precise prescribed dosage:`
              : `"${query}" के लिए बाज़ार में कई अलग-अलग ताकत (मिलीग्राम) उपलब्ध हैं। बिना सटीक मात्रा जाने दवा बदलना खतरनाक हो सकता है। कृपया अपने पर्चे के अनुसार सही ताकत चुनें:`}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {candidates.map((drug) => (
              <button
                key={drug.id}
                onClick={() => onSelectCandidate(drug)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-100 text-xs font-medium transition cursor-pointer active:scale-95 shadow-sm"
              >
                <span className="font-bold text-white">{drug.brand_name}</span>
                <span className="text-[11px] text-amber-300/80">({drug.composition_display})</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
