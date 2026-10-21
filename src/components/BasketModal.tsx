import React from 'react';
import {
  X,
  Trash2,
  Calendar,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  Printer,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { BasketItem } from '../types/drug';

interface BasketModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BasketItem[];
  onUpdateQuantity: (drugId: string, units: number) => void;
  onRemoveItem: (drugId: string) => void;
  onClearBasket: () => void;
  lang: 'en' | 'hi';
}

export const BasketModal: React.FC<BasketModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearBasket,
  lang,
}) => {
  if (!isOpen) return null;

  const totalMonthlyBranded = items.reduce(
    (sum, item) => sum + item.drug.branded_unit_price * item.monthly_units,
    0
  );

  const totalMonthlyGeneric = items.reduce(
    (sum, item) => sum + item.drug.generic_unit_price * item.monthly_units,
    0
  );

  const monthlySavings = Math.max(0, totalMonthlyBranded - totalMonthlyGeneric);
  const annualSavings = monthlySavings * 12;
  const overallSavingsPct =
    totalMonthlyBranded > 0
      ? ((monthlySavings / totalMonthlyBranded) * 100).toFixed(1)
      : '0.0';

  const hasNti = items.some((i) => i.drug.is_narrow_therapeutic_index);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                {lang === 'en' ? 'Prescription Basket Auditor' : 'पर्चा बचत एवं मूल्य परीक्षक'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'en'
                  ? `${items.length} prescribed items in basket`
                  : `पर्चे में ${items.length} दवाएं शामिल`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearBasket}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition"
                title="Clear Basket"
              >
                {lang === 'en' ? 'Clear' : 'खाली करें'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {hasNti && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {lang === 'en'
                  ? 'Note: Your basket contains Narrow Therapeutic Index (NTI) medication (e.g. Thyronorm). Prior physician consultation recommended.'
                  : 'सूचना: आपके पर्चे में संकीर्ण चिकित्सीय सूचकांक (NTI) दवा शामिल है। डॉक्टर से सलाह अवश्य लें।'}
              </span>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">
                {lang === 'en' ? 'Your prescription basket is empty' : 'आपका पर्चा अभी खाली है'}
              </p>
              <p className="text-xs text-slate-500">
                {lang === 'en'
                  ? 'Add your daily or monthly medicines from the search list to see exact family savings.'
                  : 'मासिक बचत देखने के लिए खोज सूची से अपनी दवाएं जोड़ें।'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const bTotal = item.drug.branded_unit_price * item.monthly_units;
                const gTotal = item.drug.generic_unit_price * item.monthly_units;
                const diff = bTotal - gTotal;

                return (
                  <div
                    key={item.drug.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">
                          {item.drug.brand_name}
                        </h4>
                        <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
                          {item.drug.release_type}
                        </span>
                        {item.drug.is_narrow_therapeutic_index && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-rose-500/20 text-rose-300 rounded font-bold">
                            NTI
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-400 text-xs mt-0.5">
                        PMBJP Generic: {item.drug.generic_name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Branded: ₹{item.drug.branded_unit_price.toFixed(2)}/u • Generic: ₹{item.drug.generic_unit_price.toFixed(2)}/u
                      </p>
                    </div>

                    {/* Quantity Selector & Cost Breakdown */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">Units/mo:</span>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={item.monthly_units}
                          onChange={(e) =>
                            onUpdateQuantity(
                              item.drug.id,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-400 line-through">
                          ₹{bTotal.toFixed(2)}
                        </div>
                        <div className="text-sm font-bold text-emerald-400">
                          ₹{gTotal.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-emerald-300/80 font-medium">
                          Save ₹{diff.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.drug.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                        title="Remove from basket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Savings Calculation Summary Box */}
          {items.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-emerald-900/50">
                <span>{lang === 'en' ? 'Branded Retail Monthly Bill:' : 'ब्रांडेड दवाइयों का मासिक खर्च:'}</span>
                <span className="font-mono text-rose-300 font-bold text-sm">
                  ₹{totalMonthlyBranded.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-emerald-900/50">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {lang === 'en' ? 'Jan Aushadhi Generic Monthly Bill:' : 'जनऔषधि जेनेरिक का मासिक खर्च:'}
                </span>
                <span className="font-mono text-emerald-400 font-bold text-base">
                  ₹{totalMonthlyGeneric.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3">
                  <div className="text-[11px] text-emerald-300/90 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'en' ? 'Monthly Savings' : 'मासिक बचत'}</span>
                  </div>
                  <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">
                    ₹{monthlySavings.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-semibold mt-0.5">
                    Save {overallSavingsPct}% Out-of-Pocket
                  </div>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3">
                  <div className="text-[11px] text-amber-300/90 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'en' ? 'Annual Family Relief' : 'सालाना पारिवारिक बचत'}</span>
                  </div>
                  <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                    ₹{annualSavings.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-semibold mt-0.5">
                    Per Year in Household Savings
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Govt. of India PMBJP Certified Pricing</span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Print Summary' : 'प्रिंट करें'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              {lang === 'en' ? 'Done' : 'पूर्ण'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
