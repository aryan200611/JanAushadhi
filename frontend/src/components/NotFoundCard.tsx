import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles, HelpCircle, PhoneCall } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations/i18n';

interface NotFoundCardProps {
  query: string;
  lang: Language;
}

export const NotFoundCard: React.FC<NotFoundCardProps> = ({ query, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-gradient-to-b from-amber-950/60 to-slate-900 border-3 border-amber-500/70 rounded-3xl p-6 sm:p-8 text-amber-100 shadow-2xl space-y-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shrink-0 text-amber-300">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <span>Zero-Hallucination Safety Guardrail</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-amber-50 tracking-tight leading-snug">
            {t.notFoundTitle}
          </h3>

          <p className="text-sm sm:text-base text-amber-200/90 leading-relaxed font-medium">
            {t.notFoundDesc}
          </p>
        </div>
      </div>

      <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 text-xs sm:text-sm text-slate-300 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span>{lang === 'en' ? 'Searched Term:' : 'खोजा गया शब्द:'}</span>
          <span className="font-mono text-amber-300 font-bold bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
            &ldquo;{query}&rdquo;
          </span>
        </div>

        <div className="text-xs text-amber-200/90 leading-relaxed pt-1">
          <strong>{lang === 'en' ? 'Why are no results showing?' : 'कोई परिणाम क्यों नहीं दिखा?'}</strong>
          <p className="mt-0.5 text-slate-400">
            {lang === 'en'
              ? 'Our engine only serves verified medicines from the official Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) catalogue. Generic substitution with hallucinated or unverified drugs can be hazardous to health.'
              : 'हमारा सिस्टम केवल आधिकारिक सरकारी जन औषधि सूची से प्रमाणित दवाओं की जानकारी देता है। AI से गलत दवा या गलत खुराक बताना मरीज़ के स्वास्थ्य के लिए हानिकारक हो सकता है।'}
          </p>
        </div>

        <div className="pt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{t.notFoundAction}</span>
        </div>
      </div>
    </div>
  );
};
