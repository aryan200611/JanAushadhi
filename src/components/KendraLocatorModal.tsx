import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Clock,
  Phone,
  CheckCircle,
  Footprints,
  Car,
  Search,
} from 'lucide-react';
import { JanAushadhiKendra } from '../types/drug';
import { findNearestKendras } from '../engine/clientSearch';

interface KendraLocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  kendras: JanAushadhiKendra[];
  lang: 'en' | 'hi';
}

interface CityPreset {
  nameEn: string;
  nameHi: string;
  lat: number;
  lon: number;
}

const CITY_PRESETS: CityPreset[] = [
  { nameEn: 'New Delhi (CP / AIIMS)', nameHi: 'नई दिल्ली', lat: 28.6315, lon: 77.2167 },
  { nameEn: 'Lucknow (Hazratganj / KGMU)', nameHi: 'लखनऊ', lat: 26.8500, lon: 80.9400 },
  { nameEn: 'Mumbai (Parel / Dadar)', nameHi: 'मुंबई', lat: 19.0031, lon: 72.8427 },
  { nameEn: 'Bengaluru (Victoria / Jayanagar)', nameHi: 'बेंगलुरु', lat: 12.9634, lon: 77.5755 },
  { nameEn: 'Kolkata (Medical College)', nameHi: 'कोलकाता', lat: 22.5735, lon: 88.3639 },
  { nameEn: 'Ahmedabad (Civil Hospital)', nameHi: 'अहमदाबाद', lat: 23.0537, lon: 72.6025 },
  { nameEn: 'Pune (Sassoon)', nameHi: 'पुणे', lat: 18.5262, lon: 73.8736 },
  { nameEn: 'Hyderabad (Osmania)', nameHi: 'हैदराबाद', lat: 17.3713, lon: 78.4738 },
  { nameEn: 'Chennai (Central Hospital)', nameHi: 'चेन्नई', lat: 13.0818, lon: 80.2783 },
  { nameEn: 'Chandigarh (PGIMER)', nameHi: 'चंडीगढ़', lat: 30.7656, lon: 76.7766 },
  { nameEn: 'Jaipur (SMS Hospital)', nameHi: 'जयपुर', lat: 26.8988, lon: 75.8166 },
  { nameEn: 'Patna (PMCH)', nameHi: 'पटना', lat: 25.6207, lon: 85.1588 },
  { nameEn: 'Varanasi (BHU Trauma)', nameHi: 'वाराणसी', lat: 25.2778, lon: 82.9986 },
  { nameEn: 'Kochi (Ernakulam GH)', nameHi: 'कोच्चि', lat: 9.9723, lon: 76.2847 },
];

export const KendraLocatorModal: React.FC<KendraLocatorModalProps> = ({
  isOpen,
  onClose,
  kendras,
  lang,
}) => {
  const [selectedCity, setSelectedCity] = useState<CityPreset>(CITY_PRESETS[0]);
  const [filterCityText, setFilterCityText] = useState('');
  const [userCustomLocation, setUserCustomLocation] = useState<{
    lat: number;
    lon: number;
    label: string;
  } | null>(null);

  const activeCoords = userCustomLocation || {
    lat: selectedCity.lat,
    lon: selectedCity.lon,
  };

  const nearestKendras = useMemo(() => {
    return findNearestKendras(activeCoords.lat, activeCoords.lon, kendras, 8);
  }, [activeCoords, kendras]);

  const handleUseBrowserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCustomLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: lang === 'en' ? 'Current GPS Location' : 'वर्तमान जीपीएस स्थान',
          });
        },
        () => {
          // If rejected or unavailable, fallback to New Delhi
          setUserCustomLocation(null);
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                {lang === 'en'
                  ? 'Offline Kendra Locator (Haversine Formula)'
                  : 'ऑफलाइन जनऔषधि केंद्र खोजक (हवेरसाइन सूत्र)'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'en'
                  ? 'Pure mathematical geodesic distance without external map API dependency'
                  : 'बिना इंटरनेट या मैप एपीआई के शुद्ध गणितीय दूरी गणना'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location selector toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleUseBrowserLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Use Device GPS' : 'जीपीएस स्थान उपयोग करें'}</span>
              </button>
              {userCustomLocation && (
                <span className="text-xs text-emerald-400 font-mono">
                  ✓ {userCustomLocation.label} ({userCustomLocation.lat.toFixed(3)},{' '}
                  {userCustomLocation.lon.toFixed(3)})
                </span>
              )}
            </div>

            <span className="text-[11px] text-slate-400">
              {lang === 'en'
                ? 'Showing 8 closest verified PMBJP Kendras'
                : 'निकटतम ८ प्रमाणित केंद्र दिखाए जा रहे हैं'}
            </span>
          </div>

          {/* Quick Metro City Selector */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">
              {lang === 'en' ? 'Or Choose Metropolitan City:' : 'या प्रमुख शहर चुनें:'}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {CITY_PRESETS.map((city) => (
                <button
                  key={city.nameEn}
                  onClick={() => {
                    setUserCustomLocation(null);
                    setSelectedCity(city);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    !userCustomLocation && selectedCity.nameEn === city.nameEn
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  {lang === 'en' ? city.nameEn.split(' ')[0] : city.nameHi}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kendra Results List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {nearestKendras.map((kendra, idx) => (
            <div
              key={kendra.kendra_id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center justify-center border border-emerald-500/30">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    {kendra.name}
                  </h4>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 rounded border border-slate-800">
                    {kendra.kendra_id}
                  </span>
                </div>

                <p className="text-slate-300 text-xs pl-7">
                  {kendra.address}, {kendra.city}, {kendra.state} - {kendra.pincode}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pl-7 pt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{kendra.operating_hours}</span>
                  </span>
                  {kendra.is_open_sunday && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>{lang === 'en' ? 'Open Sundays' : 'रविवार खुला'}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sky-400">
                    <Phone className="w-3 h-3" />
                    <span>{kendra.contact_phone}</span>
                  </span>
                </div>
              </div>

              {/* Distance & Travel Time Pillar */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80 shrink-0 min-w-32">
                <div className="text-right">
                  <div className="text-base font-black text-emerald-400 font-mono">
                    {kendra.distance_km} km
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Haversine Geodesic
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1">
                  <span className="flex items-center gap-0.5" title="Walking ETA">
                    <Footprints className="w-3 h-3 text-amber-400" />
                    <span>~{kendra.approx_walk_minutes}m</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-0.5" title="Driving ETA">
                    <Car className="w-3 h-3 text-sky-400" />
                    <span>~{kendra.approx_drive_minutes}m</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          {lang === 'en'
            ? 'All 25 Kendras pre-indexed for offline availability during power or connectivity failure'
            : 'सभी २५ केंद्र बिना नेटवर्क संपर्क के त्वरित खोज के लिए स्थानीय रूप से संग्रहीत हैं'}
        </div>
      </div>
    </div>
  );
};
