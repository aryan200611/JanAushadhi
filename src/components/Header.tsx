import React from 'react';
import { ShieldCheck, MapPin, ShoppingBag, GitBranch, HeartPulse, Languages } from 'lucide-react';

interface HeaderProps {
  basketCount: number;
  onOpenBasket: () => void;
  onOpenKendra: () => void;
  onOpenAudit: () => void;
  lang: 'en' | 'hi';
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  basketCount,
  onOpenBasket,
  onOpenKendra,
  onOpenAudit,
  lang,
  onToggleLang,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top statutory ticker */}
      <div className="bg-emerald-700 px-3 py-1 text-center text-xs text-emerald-100 flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
        <span className="font-medium">
          {lang === 'en'
            ? '100% Deterministic • Zero-Hallucination Price Transparency • PMBJP / NPPA Verified'
            : '१००% सत्यापित • शून्य-भ्रांति दवा मूल्य पारदर्शिता • पीएमबीजेपी एवं एनपीपीए प्रमाणित'}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand logo & title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                <span>{lang === 'en' ? 'JanAushadhi' : 'जनऔषधि'}</span>
                <span className="text-emerald-400">{lang === 'en' ? 'Satya' : 'सत्य'}</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 uppercase tracking-wider">
                PMBJP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {lang === 'en'
                ? 'Clinical Equivalence & Fair Price Auditor'
                : 'दवा मूल्य एवं समानता परीक्षक'}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          {/* Git Audit Button */}
          <button
            onClick={onOpenAudit}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
            title="Inspect Git Commits & Pydantic Validation"
          >
            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-[11px]">Git Audit</span>
          </button>

          {/* Kendra Locator Button */}
          <button
            onClick={onOpenKendra}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-xs font-medium transition shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">{lang === 'en' ? 'Find Kendras' : 'केंद्र खोजें'}</span>
            <span className="md:hidden">{lang === 'en' ? 'Kendras' : 'केंद्र'}</span>
          </button>

          {/* Prescription Basket Button */}
          <button
            onClick={onOpenBasket}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'en' ? 'Rx Basket' : 'पर्चा बचत'}</span>
            {basketCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center justify-center -ml-0.5 animate-pulse">
                {basketCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
