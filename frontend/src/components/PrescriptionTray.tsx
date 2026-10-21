import React, { useState } from 'react';
import {
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  Trash2,
  Calendar,
  Sparkles,
  TrendingDown,
  Zap,
  CheckCircle2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { DrugRecord, BasketItem } from '../../../src/types/drug';
import { Language, TRANSLATIONS } from '../translations/i18n';
import goldenDrugsData from '../../../src/data/golden_drugs.json';

interface PrescriptionTrayProps {
  items: BasketItem[];
  onUpdateQuantity: (drugId: string, units: number) => void;
  onRemoveItem: (drugId: string) => void;
  onClearBasket: () => void;
  onLoadSamplePrescription: () => void;
  lang: Language;
}

type ChronicImpactView = 'strip' | 'monthly' | 'annual';

export const PrescriptionTray: React.FC<PrescriptionTrayProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearBasket,
  onLoadSamplePrescription,
  lang,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [impactView, setImpactView] = useState<ChronicImpactView>('annual');

  const t = TRANSLATIONS[lang];

  // 1-Strip Calculation (1 standard pack each)
  const singleStripBrandedTotal = items.reduce(
    (acc, i) => acc + i.drug.branded_mrp,
    0
  );
  const singleStripGenericTotal = items.reduce(
    (acc, i) => acc + (i.drug.generic_unit_price * i.drug.branded_pack_size),
    0
  );
  const singleStripSavings = Math.max(0, singleStripBrandedTotal - singleStripGenericTotal);

  // Monthly Calculation (based on monthly_units, default 30)
  const monthlyBrandedTotal = items.reduce(
    (acc, i) => acc + i.drug.branded_unit_price * i.monthly_units,
    0
  );
  const monthlyGenericTotal = items.reduce(
    (acc, i) => acc + i.drug.generic_unit_price * i.monthly_units,
    0
  );
  const monthlySavings = Math.max(0, monthlyBrandedTotal - monthlyGenericTotal);

  // 1-Year Chronic Savings
  const annualSavings = monthlySavings * 12;

  const currentSavings =
    impactView === 'strip'
      ? singleStripSavings
      : impactView === 'monthly'
      ? monthlySavings
      : annualSavings;

  const currentBranded =
    impactView === 'strip'
      ? singleStripBrandedTotal
      : impactView === 'monthly'
      ? monthlyBrandedTotal
      : monthlyBrandedTotal * 12;

  const currentGeneric =
    impactView === 'strip'
      ? singleStripGenericTotal
      : impactView === 'monthly'
      ? monthlyGenericTotal
      : monthlyGenericTotal * 12;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t-2 border-emerald-500/50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      {/* Collapsed Sticky Header Bar */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Prescription summary pill */}
        <div
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(20);
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-3 cursor-pointer flex-1 select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 relative shadow-inner">
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center shadow-md animate-pulse">
                {items.length}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-white text-sm sm:text-base">
                {items.length} {lang === 'en' ? 'Medicines in Rx' : 'दवाएं पर्चे में'}
              </span>
              {items.length > 0 && (
                <span className="text-xs font-mono font-bold text-slate-300">
                  <span className="line-through text-rose-400">₹{monthlyBrandedTotal.toFixed(0)}</span>{' '}
                  &rarr;{' '}
                  <span className="text-emerald-400 text-sm font-black">₹{monthlyGenericTotal.toFixed(0)}</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-emerald-400 font-bold">
              {items.length > 0
                ? `${lang === 'en' ? 'Save' : 'बचत'} ₹${monthlySavings.toFixed(0)} / mo • ₹${annualSavings.toFixed(0)} / yr`
                : (lang === 'en' ? 'Prescription Tray is Empty' : 'पर्चा ट्रे खाली है')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {items.length === 0 && (
            <button
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(30);
                onLoadSamplePrescription();
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Load Sample Rx (Diabetes + BP)</span>
              <span className="sm:hidden">Sample Rx</span>
            </button>
          )}

          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(20);
              setIsExpanded(!isExpanded);
            }}
            className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            <span>{isExpanded ? (lang === 'en' ? 'Minimize' : 'छुपाएं') : (lang === 'en' ? 'View Impact' : 'बचत देखें')}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Drawer Sheet */}
      {isExpanded && (
        <div className="max-w-4xl mx-auto px-4 pb-5 pt-2 max-h-[72vh] overflow-y-auto space-y-4 animate-slide-up border-t border-slate-800">
          {/* 1-Tap Sample Rx Demo Loader */}
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-medium">
              💡 {lang === 'en' ? 'Live Stage Demo:' : 'लाइव स्टेज डेमो:'}
            </span>
            <button
              onClick={onLoadSamplePrescription}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Real Chronic Rx: Telma 40 + Glycomet-GP 2 + Atorva 20 + Pan-D</span>
            </button>
            {items.length > 0 && (
              <button
                onClick={onClearBasket}
                className="text-slate-500 hover:text-rose-400 text-xs"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Chronic Care Impact Toggle (3-Way: 1 Strip | Monthly | 1-Year Chronic) */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>{lang === 'en' ? 'CHRONIC CARE IMPACT HORIZON:' : 'पारिवारिक बचत समय सीमा:'}</span>
              <span className="text-emerald-400 font-mono">
                {impactView === 'strip' ? 'Per Strip' : impactView === 'monthly' ? 'Monthly Care' : '1-Year Chronic Care'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setImpactView('strip')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  impactView === 'strip' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                1 Strip Bill
              </button>
              <button
                onClick={() => setImpactView('monthly')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  impactView === 'monthly' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Bill
              </button>
              <button
                onClick={() => setImpactView('annual')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  impactView === 'annual' ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-2 ring-emerald-400/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                1-Year Chronic
              </button>
            </div>

            {/* Massive Impact Banner */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>
                    {impactView === 'annual'
                      ? '1-Year Chronic Savings (Diabetes + BP Household Relief)'
                      : impactView === 'monthly'
                      ? 'Monthly Household Out-of-Pocket Savings'
                      : 'Single Prescription Strip Savings'}
                  </span>
                </span>
                <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight mt-1">
                  You Save{' '}
                  <span className="text-emerald-400 drop-shadow">
                    ₹{currentSavings.toFixed(0)}
                  </span>
                  {impactView === 'annual' ? ' / yr' : impactView === 'monthly' ? ' / mo' : ''}
                </div>
              </div>

              <div className="text-center sm:text-right font-mono shrink-0">
                <div className="text-xs text-slate-400">
                  Branded: <span className="line-through text-rose-300">₹{currentBranded.toFixed(0)}</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-300">
                  Generic: ₹{currentGeneric.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Prescription List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'en' ? 'Itemized Prescription Breakdown:' : 'दवाओं का विस्तृत बिल:'}
            </h4>

            {items.map((item) => {
              const bItemTotal = item.drug.branded_unit_price * item.monthly_units;
              const gItemTotal = item.drug.generic_unit_price * item.monthly_units;
              const itemSavings = bItemTotal - gItemTotal;

              return (
                <div
                  key={item.drug.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {item.drug.brand_name}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 text-slate-300 font-mono rounded">
                        {item.drug.release_type}
                      </span>
                      <span className="text-emerald-400 font-mono text-[11px]">
                        PMBJP #{item.drug.pmbjp_drug_code}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {item.drug.generic_name}
                    </div>
                  </div>

                  {/* Quantity & Calculations */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Pills/mo:</span>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={item.monthly_units}
                        onChange={(e) =>
                          onUpdateQuantity(
                            item.drug.id,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="text-right font-mono min-w-24">
                      <div className="text-slate-400 line-through text-[11px]">
                        ₹{bItemTotal.toFixed(0)}
                      </div>
                      <div className="text-emerald-400 font-bold text-sm">
                        ₹{gItemTotal.toFixed(0)}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.drug.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
