import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations/i18n';
import { subscribeEngineStatus, EngineStatus } from '../utils/offlineFallback';

interface DisclaimerDockProps {
  lang: Language;
}

export const DisclaimerDock: React.FC<DisclaimerDockProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [engineStatus, setEngineStatus] = useState<EngineStatus>({
    mode: 'offline_failover',
    label: '⚡ Zero-Wi-Fi Failover Active (0ms)',
    latencyMs: 0.5,
    lastChecked: Date.now(),
  });

  useEffect(() => {
    const unsub = subscribeEngineStatus((status) => {
      setEngineStatus(status);
    });
    return unsub;
  }, []);

  return (
    <aside
      role="note"
      aria-label="Statutory Clinical Disclaimer & Engine Status"
      className="sticky bottom-0 z-30 bg-slate-950/95 border-t-2 border-slate-800 backdrop-blur-md px-3 py-2 sm:py-2.5 shadow-2xl text-slate-300 text-xs"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-col sm:flex-row text-center sm:text-left">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 hidden sm:block" />
          <p className="text-[11px] text-slate-300 leading-tight font-medium">
            <strong className="text-amber-300 font-bold">
              {lang === 'en' ? 'Statutory Notice:' : 'वैधानिक सूचना:'}
            </strong>{' '}
            {t.disclaimer}
          </p>
        </div>

        {/* Live Zero-Wi-Fi / Python Engine Status Indicator */}
        <div className="shrink-0 flex items-center gap-2 text-[10px] sm:text-[11px] font-mono">
          <div
            className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border shadow-sm transition-all ${
              engineStatus.mode === 'python_fastapi'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                : 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                engineStatus.mode === 'python_fastapi' ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            ></span>
            <span>{engineStatus.label}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Deterministic</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
