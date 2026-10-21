import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ReactiveSearchBar } from './components/ReactiveSearchBar';
import { PriceMorphHero } from './components/PriceMorphHero';
import { CounterFlipPass } from './components/CounterFlipPass';
import { StripScannerHUD } from './components/StripScannerHUD';
import { PrescriptionTray } from './components/PrescriptionTray';
import { NotFoundCard } from './components/NotFoundCard';
import { DisclaimerDock } from './components/DisclaimerDock';
import { fetchDrugSearch, SearchResponse } from './api/client';
import { Language, TRANSLATIONS } from './translations/i18n';
import goldenDrugsData from '../../src/data/golden_drugs.json';
import { DrugRecord, BasketItem } from '../../src/types/drug';
import { MapPin, Sparkles, Building, Phone, Clock, ArrowUpRight, Zap } from 'lucide-react';
import { KendraLocatorModal } from '../../src/components/KendraLocatorModal';
import janAushadhiKendrasData from '../../src/data/jan_aushadhi_kendras.json';

const ALL_DRUGS = goldenDrugsData as unknown as DrugRecord[];
// Default showcase drug with high shock-value (Pan-D: 15 caps @ ₹210 vs 10 caps @ ₹24, Saves 83%)
const DEFAULT_DRUG = ALL_DRUGS.find((d) => d.id === 'DRUG-002') || ALL_DRUGS[0];

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [query, setQuery] = useState('Pan-D');
  const [selectedStrength, setSelectedStrength] = useState<string | undefined>(undefined);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stretch Feature States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCounterFlipped, setIsCounterFlipped] = useState(false);
  const [prescriptionBasket, setPrescriptionBasket] = useState<BasketItem[]>([]);
  const [isKendraModalOpen, setIsKendraModalOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  // Debounced search query function (80ms)
  const performSearch = useCallback(async (q: string, strength?: string) => {
    if (!q.trim()) {
      setSearchResponse(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const res = await fetchDrugSearch(q, strength);
    setSearchResponse(res);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query, selectedStrength);
    }, 80);

    return () => clearTimeout(handler);
  }, [query, selectedStrength, performSearch]);

  const handleQueryChange = (newVal: string) => {
    setQuery(newVal);
    setSelectedStrength(undefined);
    setIsCounterFlipped(false); // Reset flip on new search
  };

  const handleSelectStrength = (str: string) => {
    setSelectedStrength(str);
    performSearch(query, str);
  };

  const handleScanComplete = (extractedQuery: string) => {
    setQuery(extractedQuery);
    setSelectedStrength(undefined);
    performSearch(extractedQuery);
    if ('vibrate' in navigator) navigator.vibrate([30, 40, 30]);
  };

  // Prescription Tray Management
  const handleAddToPrescription = (drugToAdd: DrugRecord) => {
    setPrescriptionBasket((prev) => {
      const exists = prev.find((item) => item.drug.id === drugToAdd.id);
      if (exists) {
        return prev.filter((item) => item.drug.id !== drugToAdd.id);
      }
      return [...prev, { drug: drugToAdd, monthly_units: 30 }];
    });
  };

  const handleUpdateQuantity = (drugId: string, units: number) => {
    setPrescriptionBasket((prev) =>
      prev.map((item) =>
        item.drug.id === drugId ? { ...item, monthly_units: units } : item
      )
    );
  };

  const handleRemoveItem = (drugId: string) => {
    setPrescriptionBasket((prev) => prev.filter((item) => item.drug.id !== drugId));
  };

  const handleClearBasket = () => {
    setPrescriptionBasket([]);
  };

  // 1-Tap Demo Loader: Telma 40 + Glycomet-GP 2 + Atorva 20 + Pan-D
  const handleLoadSamplePrescription = () => {
    const sampleIds = ['DRUG-004', 'DRUG-007', 'DRUG-009', 'DRUG-002'];
    const sampleDrugs = ALL_DRUGS.filter((d) => sampleIds.includes(d.id));
    const items: BasketItem[] = sampleDrugs.map((d) => ({
      drug: d,
      monthly_units: 30,
    }));
    setPrescriptionBasket(items);
    if ('vibrate' in navigator) navigator.vibrate([40, 50, 40]);
  };

  const activeDrug: DrugRecord =
    searchResponse?.status === 'SUCCESS' && searchResponse.drug
      ? searchResponse.drug
      : DEFAULT_DRUG;

  const isInPrescription = prescriptionBasket.some(
    (item) => item.drug.id === activeDrug.id
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased pb-28">
      {/* 1. Top Accessibility Header & Language Switcher */}
      <Header
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'hi' : 'en')}
        onOpenKendraModal={() => setIsKendraModalOpen(true)}
      />

      {/* Main Responsive Mobile-First Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 sm:py-6 space-y-5">
        {/* 2. Reactive As-You-Type Search & Voice Bar with Strip Scanner button */}
        <section aria-label="Search Prescription Medicine">
          <ReactiveSearchBar
            value={query}
            onChange={handleQueryChange}
            onSelectStrength={handleSelectStrength}
            onOpenScanner={() => setIsScannerOpen(true)}
            searchResponse={searchResponse}
            isLoading={isLoading}
            lang={lang}
          />
        </section>

        {/* 3. Conditional Results State */}
        {searchResponse?.status === 'NOT_FOUND' ? (
          <NotFoundCard query={query} lang={lang} />
        ) : (
          /* 3. The "Shock-Value" Price Morph Hero Card OR 3D Counter Pass */
          <section aria-label="Medicine Price Comparison and Counter Pass">
            {isCounterFlipped ? (
              <CounterFlipPass
                drug={activeDrug}
                isFlipped={isCounterFlipped}
                onFlip={() => setIsCounterFlipped(false)}
                lang={lang}
              />
            ) : (
              <PriceMorphHero
                drug={activeDrug}
                lang={lang}
                onFlipToCounter={() => setIsCounterFlipped(true)}
                onAddToPrescription={handleAddToPrescription}
                isInPrescription={isInPrescription}
              />
            )}
          </section>
        )}

        {/* Kendra Finder Callout Button */}
        <div className="pt-2 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setIsKendraModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border-2 border-emerald-500/50 text-emerald-300 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition cursor-pointer touch-manipulation"
          >
            <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{t.nearestKendraBtn}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border-2 border-slate-700 text-slate-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition cursor-pointer touch-manipulation"
          >
            <span>📷</span>
            <span>{lang === 'en' ? 'Scan Blister Strip' : 'दवा का पत्ता स्कैन करें'}</span>
          </button>
        </div>
      </main>

      {/* Stretch Feature 3: Whole Prescription Chronic Cart Drawer */}
      <PrescriptionTray
        items={prescriptionBasket}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearBasket={handleClearBasket}
        onLoadSamplePrescription={handleLoadSamplePrescription}
        lang={lang}
      />

      {/* 5. Persistent Legal Disclaimer Dock */}
      <DisclaimerDock lang={lang} />

      {/* Stretch Feature 1: Glare-Resistant Strip Scanner HUD Modal */}
      <StripScannerHUD
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanComplete}
        lang={lang}
      />

      {/* Kendra Locator Modal */}
      <KendraLocatorModal
        isOpen={isKendraModalOpen}
        onClose={() => setIsKendraModalOpen(false)}
        kendras={janAushadhiKendrasData as any}
        lang={lang}
      />
    </div>
  );
}
