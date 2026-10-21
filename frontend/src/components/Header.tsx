import React from 'react';
import { ShieldCheck, HeartPulse, Languages, CheckCircle2 } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations/i18n';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenKendraModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, onToggleLang, onOpenKendraModal }) => {
  const t = TRANSLATIONS[lang];

  const handleHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (_e) {
        // ignore
      }
    }
    onToggleLang();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b-2 border-emerald-500/30 text-white shadow-lg">
      {/* Top Accessibility & Trust Ticker */}
      <div className="bg-emerald-800 text-emerald-50 px-3 py-1.5 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
          <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="font-semibold tracking-wide">{t.trustPill}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>PMBJP &amp; NPPA Fair Ceiling Compliance</span>
        </div>
      </div>

      {/* Main Bar with Giant Touch Targets */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
            <HeartPulse className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{t.appTitle}</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-black bg-emerald-500 text-slate-950 rounded-md">
                GOVT
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium leading-none mt-0.5">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* High-Contrast Giant Language Toggle (Min 48px height for accessibility) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleHaptic}
            aria-label="Switch Language / भाषा बदलें"
            className="h-12 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border-2 border-emerald-400/60 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer touch-manipulation"
          >
            <Languages className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5 font-mono">
              <span className={lang === 'en' ? 'text-emerald-400 underline underline-offset-4 decoration-2 font-black' : 'text-slate-400'}>
                EN
              </span>
              <span className="text-slate-600">|</span>
              <span className={lang === 'hi' ? 'text-emerald-400 underline underline-offset-4 decoration-2 font-black' : 'text-slate-400'}>
                हिंदी
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
