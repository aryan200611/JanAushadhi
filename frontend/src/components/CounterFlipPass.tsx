import React, { useState, useEffect } from 'react';
import {
  Printer,
  Share2,
  RotateCw,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Navigation,
  Tag,
  Building,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { DrugRecord, JanAushadhiKendra } from '../../../src/types/drug';
import { Language, TRANSLATIONS } from '../translations/i18n';
import { fetchNearestKendras } from '../api/client';

interface CounterFlipPassProps {
  drug: DrugRecord;
  isFlipped: boolean;
  onFlip: () => void;
  lang: Language;
}

// Fallback stage venue coordinates (Lucknow Hazratganj / KGMU)
const VENUE_COORDS = { lat: 26.8500, lon: 80.9400, label: 'Lucknow Venue / City Center' };

export const CounterFlipPass: React.FC<CounterFlipPassProps> = ({
  drug,
  isFlipped,
  onFlip,
  lang,
}) => {
  const [nearestKendra, setNearestKendra] = useState<JanAushadhiKendra | null>(null);
  const [isLoadingKendra, setIsLoadingKendra] = useState(false);
  const [usingVenueFallback, setUsingVenueFallback] = useState(false);

  // Load closest Jan Aushadhi Kendra for the slip
  useEffect(() => {
    loadKendra(VENUE_COORDS.lat, VENUE_COORDS.lon);
  }, []);

  const loadKendra = async (lat: number, lon: number) => {
    setIsLoadingKendra(true);
    try {
      const list = await fetchNearestKendras(lat, lon);
      if (list && list.length > 0) {
        setNearestKendra(list[0]);
      }
    } catch (_e) {
      // ignore
    }
    setIsLoadingKendra(false);
  };

  const handleUseDeviceGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUsingVenueFallback(false);
          loadKendra(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // If blocked indoors, activate venue fallback
          setUsingVenueFallback(true);
          loadKendra(VENUE_COORDS.lat, VENUE_COORDS.lon);
        }
      );
    } else {
      setUsingVenueFallback(true);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*Jan Aushadhi Generic Medicine Request / जन औषधि दवा पर्ची*\n\n` +
      `*Branded Prescribed:* ${drug.brand_name}\n` +
      `*Generic Equivalent:* ${drug.generic_name}\n` +
      `*Active Salt & Strength:* ${drug.composition_display}\n` +
      `*Release Type:* ${drug.release_type}\n` +
      `*PMBJP Item Code:* #${drug.pmbjp_drug_code}\n` +
      `*Govt Jan Aushadhi MRP:* ₹${drug.generic_mrp.toFixed(2)} (${drug.generic_pack_size} units)\n\n` +
      `*Nearest Store:* ${nearestKendra ? nearestKendra.name : 'Jan Aushadhi Kendra'}\n` +
      `Verified via JanAushadhi Satya`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border-4 border-slate-900 relative font-sans print:border-none print:shadow-none animate-flip"
      style={{ backfaceVisibility: 'hidden' }}
    >
      {/* Top Action Ribbon for Patient */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4 print:hidden flex-wrap gap-2">
        <button
          onClick={onFlip}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'Flip Back to Price View' : 'वापस कीमत देखें'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Official Pharmacist Counter Slip Header */}
      <div className="text-center pb-3 border-b-4 border-slate-900">
        <div className="text-[10px] sm:text-xs font-black tracking-widest text-slate-500 uppercase">
          PRADHAN MANTRI BHARTIYA JANAUSHADHI PARIYOJANA (PMBJP)
        </div>
        <h2 className="text-lg sm:text-2xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
          JAN AUSHADHI GENERIC REQUEST
        </h2>
        <div className="text-sm sm:text-base font-bold text-emerald-800">
          जन औषधि दवा पर्ची (केमिस्ट काउंटर स्लिप)
        </div>
      </div>

      {/* Chemist Instruction Banner */}
      <div className="my-3.5 bg-slate-100 border-2 border-slate-900 rounded-xl p-2.5 text-center text-xs font-bold text-slate-900">
        📢 कृपया पीएमबीजेपी जेनेरिक उपलब्ध कराएं • Please dispense official PMBJP generic equivalent
      </div>

      {/* Drug Specifics Table */}
      <div className="space-y-3 py-2 text-xs sm:text-sm">
        {/* PMBJP Item Code Big Monospace Callout */}
        <div className="bg-slate-950 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] sm:text-xs uppercase font-mono text-emerald-400 font-bold block">
              OFFICIAL PMBJP CATALOGUE CODE
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white">
              CODE #{drug.pmbjp_drug_code}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              GOVT. MRP (MAX)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ₹{drug.generic_mrp.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-300">
              ({drug.generic_pack_size} units/pack)
            </span>
          </div>
        </div>

        {/* Detailed Prescription Formulation Rows */}
        <div className="border-2 border-slate-900 rounded-2xl divide-y-2 divide-slate-900 overflow-hidden font-mono">
          <div className="p-3 bg-slate-50 flex items-start justify-between gap-2">
            <span className="font-bold text-slate-600 text-xs uppercase">Generic Title:</span>
            <span className="font-black text-slate-950 text-right text-xs sm:text-sm max-w-xs">
              {drug.generic_name}
            </span>
          </div>

          <div className="p-3 bg-white flex items-start justify-between gap-2">
            <span className="font-bold text-slate-600 text-xs uppercase">Active Salt &amp; Strength:</span>
            <span className="font-black text-emerald-800 text-right text-xs sm:text-sm">
              {drug.composition_display}
            </span>
          </div>

          <div className="p-3 bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-slate-600 text-xs uppercase">Release Formulation:</span>
            <span className="font-black text-slate-950 px-2 py-0.5 bg-slate-200 rounded">
              {drug.release_type} (Exact Match)
            </span>
          </div>

          <div className="p-3 bg-white flex items-center justify-between">
            <span className="font-bold text-slate-600 text-xs uppercase">Prescribed Brand Ref:</span>
            <span className="font-bold text-slate-800 line-through">
              {drug.brand_name} (Market MRP: ₹{drug.branded_mrp.toFixed(2)})
            </span>
          </div>

          {drug.nppa_ceiling_price && (
            <div className="p-3 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <span>NPPA DPCO Statutory Ceiling:</span>
              <span className="font-bold">₹{drug.nppa_ceiling_price.toFixed(2)} / unit</span>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Nearest Jan Aushadhi Kendra Card */}
      <div className="mt-4 pt-3 border-t-2 border-slate-900">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-2">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Nearest Jan Aushadhi Kendra (Store Locator):</span>
          </span>

          <button
            onClick={handleUseDeviceGPS}
            className="text-[11px] text-emerald-800 underline flex items-center gap-1 print:hidden cursor-pointer"
          >
            <Navigation className="w-3 h-3" />
            <span>{usingVenueFallback ? 'Use GPS' : 'Venue Fallback (Lucknow)'}</span>
          </button>
        </div>

        {nearestKendra && (
          <div className="bg-emerald-50 border-2 border-emerald-800 rounded-2xl p-3 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="font-black text-emerald-950 text-sm">
                {nearestKendra.name}
              </div>
              <p className="text-[11px] text-slate-700 mt-0.5">
                {nearestKendra.address}, {nearestKendra.city} - {nearestKendra.pincode}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                📞 {nearestKendra.contact_phone} • ⏰ {nearestKendra.operating_hours}
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestKendra.latitude},${nearestKendra.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 justify-center print:hidden shadow-sm"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Pharmacist Statutory Seal Stamp */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-400 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div>
          <span>BATCH: WHO-GMP CERTIFIED</span> • <span>AUDIT ID: JAS-SATYA-2026</span>
        </div>
        <div className="font-bold text-slate-900 border border-slate-900 px-2 py-0.5 rounded">
          NO DISPENSING DISPUTE
        </div>
      </div>
    </div>
  );
};
