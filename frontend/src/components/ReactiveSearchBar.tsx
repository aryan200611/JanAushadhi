import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, X, Zap, AlertTriangle, ArrowRight, Camera } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations/i18n';
import { SearchResponse } from '../api/client';

interface ReactiveSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSelectStrength: (strength: string) => void;
  onOpenScanner: () => void;
  searchResponse: SearchResponse | null;
  isLoading: boolean;
  lang: Language;
}

export const ReactiveSearchBar: React.FC<ReactiveSearchBarProps> = ({
  value,
  onChange,
  onSelectStrength,
  onOpenScanner,
  searchResponse,
  isLoading,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition once
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        if ('vibrate' in navigator) navigator.vibrate(40);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onChange(transcript);
          if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
        }
      };

      recognition.onerror = (event: any) => {
        setSpeechError(event.error || 'Speech error');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang, onChange]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert(t.speechNotSupported);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (_e) {
        // Recognition already started
      }
    }
  };

  const handleStrengthTap = (strength: string) => {
    if ('vibrate' in navigator) navigator.vibrate(30);
    onSelectStrength(strength);
  };

  const isAmbiguous = searchResponse?.status === 'AMBIGUOUS_STRENGTH';
  const matchExplanation = searchResponse?.match_explanation;
  const showTypoChip =
    searchResponse?.status === 'SUCCESS' &&
    matchExplanation &&
    matchExplanation.confidence > 70 &&
    matchExplanation.input_token.toLowerCase() !==
      matchExplanation.matched_brand.toLowerCase();

  return (
    <div className="w-full space-y-3">
      {/* Giant Mobile Search Bar */}
      <div className="relative flex items-center bg-slate-900 border-2 border-slate-700 focus-within:border-emerald-400 rounded-2xl shadow-xl transition-all">
        <div className="pl-4 pr-2 text-slate-400 shrink-0">
          <Search className="w-6 h-6 text-emerald-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full h-14 sm:h-16 bg-transparent text-white text-base sm:text-lg font-medium placeholder-slate-500 focus:outline-none pr-28 sm:pr-32"
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear Search"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:scale-90 transition mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Camera Strip Scanner Button */}
        <button
          onClick={onOpenScanner}
          aria-label="Scan Medicine Strip / पत्ता स्कैन करें"
          title="Scan Medicine Blister Pack / Strip"
          className="h-12 w-12 sm:h-14 sm:w-14 m-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 border border-slate-700 flex items-center justify-center shrink-0 transition cursor-pointer shadow-md"
        >
          <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Giant Web Speech Mic Button with Waveform */}
        <button
          onClick={toggleMic}
          aria-label={isListening ? 'Stop Listening' : t.tapToSpeak}
          title={isListening ? t.listening : t.tapToSpeak}
          className={`h-12 w-12 sm:h-14 sm:w-14 m-1 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer relative shadow-lg ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/50 scale-105'
              : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
          }`}
        >
          {isListening ? (
            <>
              {/* Reactive pulsing waveform rings */}
              <span className="absolute inset-0 rounded-xl bg-rose-500 animate-ping opacity-60"></span>
              <MicOff className="w-6 h-6 z-10 animate-bounce" />
            </>
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Listening Banner */}
      {isListening && (
        <div className="bg-rose-950/80 border-2 border-rose-500 text-rose-200 px-4 py-2.5 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-bold text-sm sm:text-base">{t.listening}</span>
          </div>
          <span className="text-xs uppercase font-mono tracking-wider text-rose-300">
            {lang === 'hi' ? 'हिंदी' : 'English'}
          </span>
        </div>
      )}

      {/* Quick Click Search Pills */}
      {!value && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 text-xs scrollbar-none">
          <span className="text-slate-400 text-xs font-bold uppercase shrink-0 mr-1">
            {lang === 'en' ? 'Quick Test:' : 'त्वरित देखें:'}
          </span>
          {t.quickSearchPills.map((pill) => (
            <button
              key={pill}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(20);
                onChange(pill);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 cursor-pointer"
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      {/* Dynamic Typo Chip: e.g. Matched "augmntn" -> Augmentin 625 Duo (94% confidence) */}
      {showTypoChip && matchExplanation && (
        <div className="bg-slate-900/90 border border-emerald-500/50 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-300 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 truncate">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 fill-emerald-400/20" />
            <span className="truncate">
              <strong className="text-white font-mono">
                &ldquo;{matchExplanation.input_token}&rdquo;
              </strong>{' '}
              &rarr;{' '}
              <span className="text-emerald-400 font-bold underline">
                {matchExplanation.matched_brand}
              </span>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] shrink-0 ml-2">
            {Math.round(matchExplanation.confidence)}% {t.confidence}
          </span>
        </div>
      )}

      {/* Dynamic Strength Disambiguation Pills (e.g. for "Telma" -> 20mg, 40mg, 80mg) */}
      {isAmbiguous && searchResponse?.available_strengths && (
        <div className="bg-amber-950/70 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 text-amber-100 shadow-2xl animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/30 border border-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-amber-100 text-sm sm:text-base leading-snug">
                {t.whichStrength}
              </h3>
              <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                {lang === 'en'
                  ? `Clinical Safety Lock: Multiple strengths exist for "${value}". Select your exact prescribed dosage to calculate true savings without risk:`
                  : `चिकित्सीय सुरक्षा नियम: "${value}" के कई अलग-अलग पावर (मिलीग्राम) उपलब्ध हैं। सही बचत और सही दवा देखने के लिए अपना पावर चुनें:`}
              </p>

              {/* Giant thumb-friendly tactile pill buttons (Min 48px height) */}
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {searchResponse.available_strengths.map((str) => (
                  <button
                    key={str}
                    onClick={() => handleStrengthTap(str)}
                    className="h-12 sm:h-14 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 font-black text-base sm:text-lg flex items-center gap-2 shadow-lg transition cursor-pointer touch-manipulation"
                  >
                    <span>{str}</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
