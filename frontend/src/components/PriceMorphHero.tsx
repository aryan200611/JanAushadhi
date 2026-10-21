import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Scale,
  Lock,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { DrugRecord } from '../../../src/types/drug';
import { Language, TRANSLATIONS } from '../translations/i18n';

interface PriceMorphHeroProps {
  drug: DrugRecord;
  lang: Language;
  onFlipToCounter: () => void;
  onAddToPrescription: (drug: DrugRecord) => void;
  isInPrescription?: boolean;
}

type NormalizationMode = '1' | '10' | '30';

export const PriceMorphHero: React.FC<PriceMorphHeroProps> = ({
  drug,
  lang,
  onFlipToCounter,
  onAddToPrescription,
  isInPrescription,
}) => {
  const t = TRANSLATIONS[lang];
  const [mode, setMode] = useState<NormalizationMode>('10');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const multiplier = mode === '1' ? 1 : mode === '10' ? 10 : 30;

  const brandedPrice = Math.round(drug.branded_unit_price * multiplier * 100) / 100;
  const genericPrice = Math.round(drug.generic_unit_price * multiplier * 100) / 100;
  const savingsAmount = Math.round((brandedPrice - genericPrice) * 100) / 100;
  const savingsPercent = Math.round(
    ((brandedPrice - genericPrice) / (brandedPrice || 1)) * 100
  );

  // Stop speaking when drug changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [drug, mode]);

  const handleSpeakHindi = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const modeTextHi =
      mode === '1'
        ? '१ गोली'
        : mode === '10'
        ? '१० गोली के पत्ते'
        : 'महीने की ३० गोली';

    const speechText =
      lang === 'hi'
        ? `${drug.brand_name} की ${modeTextHi} का बाज़ार भाव ${Math.round(
            brandedPrice
          )} रुपये है। जन औषधि केंद्र पर बिल्कुल वही दवा सिर्फ ${Math.round(
            genericPrice
          )} रुपये में मिलती है। आपकी सीधी बचत ${Math.round(
            savingsAmount
          )} रुपये है।`
        : `The market branded price of ${drug.brand_name} for ${modeTextHi} is ₹${brandedPrice.toFixed(
            0
          )}. At Jan Aushadhi Kendra, the identical generic is only ₹${genericPrice.toFixed(
            0
          )}. You save ₹${savingsAmount.toFixed(0)}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower for elderly comprehension

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    if ('vibrate' in navigator) navigator.vibrate(30);
    window.speechSynthesis.speak(utterance);
  };

  const handleModeChange = (newMode: NormalizationMode) => {
    if ('vibrate' in navigator) navigator.vibrate(25);
    setMode(newMode);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-3 border-emerald-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background radial glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/40 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>PMBJP Generic Equivalent</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            #{drug.pmbjp_drug_code}
          </span>
        </div>

        {/* 1-Tap Audio Readout Button */}
        <button
          onClick={handleSpeakHindi}
          aria-label={t.listenHindi}
          className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95 touch-manipulation ${
            isSpeaking
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50'
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-4 h-4 animate-bounce" />
              <span>{t.listeningPlaying}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>{t.listenHindi}</span>
            </>
          )}
        </button>
      </div>

      {/* Medicine Title Header */}
      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {drug.brand_name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {drug.brand_manufacturer} • {drug.dosage_form}
          </p>
        </div>

        {/* Generic Name */}
        <div className="text-left sm:text-right text-xs text-emerald-300/90 font-medium">
          <span className="text-slate-500">Jan Aushadhi:</span>{' '}
          <span className="font-semibold">{drug.generic_name}</span>
        </div>
      </div>

      {/* =========================================================================
          THE "SHOCK-VALUE" PRICE MORPH (OCCUPIES 50% OF VISUAL HIERARCHY)
          ========================================================================= */}
      <div className="my-6 sm:my-8 bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-5 sm:p-6 shadow-inner text-center">
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
          {mode === '1'
            ? t.oneUnit
            : mode === '10'
            ? t.tenStrip
            : t.monthlyThirty}{' '}
          • {lang === 'en' ? 'Direct Price Comparison' : 'सीधी कीमत तुलना'}
        </div>

        {/* The Massive Price Morph Display */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
          {/* Strikethrough Branded Price */}
          <div className="text-center">
            <span className="block text-[11px] text-slate-400 font-semibold mb-0.5">
              {t.brandedPriceLabel}
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold text-rose-400 line-through decoration-rose-500 decoration-[3px] sm:decoration-[4px] font-mono opacity-80 transition-all">
              ₹{brandedPrice.toFixed(0)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              (₹{drug.branded_unit_price.toFixed(2)}/pill)
            </span>
          </div>

          {/* Morph Arrow */}
          <div className="flex flex-col items-center justify-center text-slate-500 font-bold text-2xl sm:text-3xl">
            <ArrowRight className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          {/* Massive Emerald Jan Aushadhi Price */}
          <div className="text-center">
            <span className="block text-[11px] text-emerald-300 font-semibold mb-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.janAushadhiPriceLabel}</span>
            </span>
            <div className="text-5xl sm:text-7xl font-black text-emerald-400 font-mono tracking-tight transition-all drop-shadow-md">
              ₹{genericPrice.toFixed(0)}
            </div>
            <span className="text-[11px] text-emerald-300/80 font-mono">
              (₹{drug.generic_unit_price.toFixed(2)}/pill)
            </span>
          </div>
        </div>

        {/* Massive Shock-Value Save Pill */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow-lg uppercase">
            {t.youSave} {savingsPercent}% (₹{savingsAmount.toFixed(0)})
          </span>
        </div>

        {/* Counter Pass & Add to Rx Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(35);
              onFlipToCounter();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition cursor-pointer touch-manipulation border-2 border-slate-200"
          >
            <span className="text-lg">🪪</span>
            <span>{lang === 'en' ? 'Show to Chemist (Counter Pass)' : 'केमिस्ट को दिखाएं (काउंटर पर्ची)'}</span>
          </button>

          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(25);
              onAddToPrescription(drug);
            }}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer touch-manipulation shadow-md ${
              isInPrescription
                ? 'bg-slate-800 text-emerald-300 border-2 border-emerald-500/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isInPrescription ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{lang === 'en' ? 'Added to Prescription Tray' : 'पर्चे में शामिल'}</span>
              </>
            ) : (
              <>
                <span className="text-lg">+</span>
                <span>{lang === 'en' ? 'Add to Prescription' : 'पर्चे में जोड़ें'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE 3-WAY UNIT NORMALIZATION SLIDER / SEGMENTED CONTROL
          ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'en' ? 'Select Quantity to Compare:' : 'मात्रा चुनकर बचत देखें:'}</span>
          </span>
          <span className="text-emerald-400 font-mono font-bold">
            {mode === '1' ? '1 Unit' : mode === '10' ? '10 Units' : '30 Units'}
          </span>
        </div>

        {/* Giant Tactile 3-Way Segmented Control */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800">
          <button
            onClick={() => handleModeChange('1')}
            className={`h-12 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center ${
              mode === '1'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.oneUnit}
          </button>

          <button
            onClick={() => handleModeChange('10')}
            className={`h-12 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center ${
              mode === '10'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-2 ring-emerald-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.tenStrip}
          </button>

          <button
            onClick={() => handleModeChange('30')}
            className={`h-12 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center ${
              mode === '30'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.monthlyThirty}
          </button>
        </div>

        {/* Normalization Math Note (Crucial for 15 vs 10 tab transparency) */}
        <p className="text-[11px] text-slate-400 italic text-center pt-1 leading-relaxed">
          {lang === 'en'
            ? `*Fair Comparison Note: Branded strip has ${drug.branded_pack_size} pills (₹${drug.branded_unit_price.toFixed(2)}/pill) while Jan Aushadhi generic has ${drug.generic_pack_size} pills (₹${drug.generic_unit_price.toFixed(2)}/pill). Normalized to prevent deception.`
            : `*निष्पक्ष तुलना नोट: ब्रांडेड पत्ता ${drug.branded_pack_size} गोली का है (₹${drug.branded_unit_price.toFixed(2)}/गोली) जबकि जन औषधि पत्ता ${drug.generic_pack_size} गोली का है (₹${drug.generic_unit_price.toFixed(2)}/गोली)।`}
        </p>
      </div>

      {/* =========================================================================
          CLINICAL LOCK & BIOEQUIVALENCE BADGE
          ========================================================================= */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 flex-wrap">
              <span>{t.identicalSalt}:</span>
              <span className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {drug.composition_display}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
              <span>
                {t.releaseType}:{' '}
                <strong className="text-emerald-400 font-mono">
                  {drug.release_type}
                </strong>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>WHO-GMP Batch Certified</span>
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 inline-block">
            PMBJP Item #{drug.pmbjp_drug_code}
          </span>
        </div>
      </div>
    </div>
  );
};
