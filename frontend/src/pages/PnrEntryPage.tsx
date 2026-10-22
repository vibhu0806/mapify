import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api.js';
import { TopNavigation } from '../components/TopNavigation.js';
import {
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle,
  ExternalLink,
  Navigation,
  Clock
} from 'lucide-react';

export const PnrEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileOrNameInput, setMobileOrNameInput] = useState('');
  const [pnrInput, setPnrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [activeAd, setActiveAd] = useState<'ramayana' | 'myntra' | 'meesho'>('ramayana');

  useEffect(() => {
    const existingToken = api.getPnrToken();
    if (existingToken) {
      api.verifyPnrSession(existingToken).then((isValid) => {
        if (isValid) {
          setHasExistingSession(true);
        } else {
          api.clearPnrToken();
        }
      });
    }
  }, []);

  const handleQuickFill = () => {
    setPnrInput('JD-7842');
    setMobileOrNameInput('Bhatnagar');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPnr = pnrInput.trim();
    const cleanSecond = mobileOrNameInput.trim();

    if (!cleanPnr && !cleanSecond) {
      setErrorMessage('Please enter either your PNR Number or Mobile Number.');
      return;
    }

    const pnrToUse = cleanPnr || 'JD-7842';
    const isMobileDigits = /^\d+$/.test(cleanSecond);
    const lastNameToUse = (!cleanSecond || isMobileDigits) ? 'Bhatnagar' : cleanSecond;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.validatePnr(pnrToUse, lastNameToUse);
      if (response.valid && response.pnrToken) {
        navigate('/track');
      } else {
        setErrorMessage('Invalid PNR or Passenger Details. Please use Demo PNR: JD-7842 / Bhatnagar.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setErrorMessage(err.message || 'Too many attempts. Please wait a moment and try again.');
      } else {
        setErrorMessage('Invalid PNR or Passenger Details. Click "Demo PNR: JD-7842" to test.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResumeExistingSession = () => {
    navigate('/track');
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. Header Navigation */}
      <TopNavigation status="running" />

      {/* 2. Breadcrumb Bar */}
      <div className="w-full bg-[#F8FAFC] border-b border-slate-200 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <a href="/" className="text-[#00529B] hover:underline">Home</a>
            <span>|</span>
            <span className="text-slate-900 font-semibold">Live Tracking</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Jaipur ➔ Dehradun Live Corridor Active
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>AIS-140 GPS TELEMATICS</span>
            <span>•</span>
            <span>JAIPUR ⇄ DEHRADUN CORRIDOR</span>
          </div>
        </div>
      </div>

      {/* 2. Main Hero Tracking Section */}
      <section className="relative w-full bg-gradient-to-b from-[#F1F5F9]/50 via-white to-white overflow-hidden py-8 sm:py-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: The Signature Blue Tracking Card */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-[#00529B] text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Track Your Bus
                    </h1>
                    <span className="text-2xl">🚌</span>
                  </div>

                  <p className="text-blue-100 text-xs mb-6 leading-relaxed">
                    Enter your registered mobile number or PNR to view real-time location, speed and upcoming halts.
                  </p>

                  {/* Active Session Resume Prompt */}
                  {hasExistingSession && (
                    <div className="mb-5 p-3 rounded-lg bg-white/10 border border-white/20 flex items-center justify-between">
                      <div className="text-left">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> LIVE TRIP IN PROGRESS
                        </div>
                        <div className="text-xs text-white/90 font-mono mt-0.5">
                          RJ-14-PB-4289 (Jaipur-Dehradun)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleResumeExistingSession}
                        className="px-3 py-1 bg-white text-[#00529B] rounded-md font-bold text-xs hover:bg-blue-50 transition-colors flex items-center gap-1"
                      >
                        Resume <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Enter mobile number"
                        value={mobileOrNameInput}
                        onChange={(e) => {
                          setMobileOrNameInput(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full h-12 px-4 rounded-md bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs font-bold text-white/80">
                      <div className="h-[1px] flex-1 bg-white/30" />
                      <span>OR</span>
                      <div className="h-[1px] flex-1 bg-white/30" />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="PNR"
                        value={pnrInput}
                        onChange={(e) => {
                          setPnrInput(e.target.value.toUpperCase());
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full h-12 px-4 rounded-md bg-white text-slate-900 placeholder:text-slate-400 text-sm font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs transition-all"
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-2.5 rounded bg-red-500/25 border border-red-300 text-white text-xs leading-snug">
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 mt-1 rounded-md bg-[#F1F5F9] hover:bg-white active:bg-slate-200 text-[#00529B] font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#00529B]" />
                          <span>Connecting to GPS...</span>
                        </>
                      ) : (
                        <span>Live Track</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Dedicated Myntra Google Display Ad Card on Login Page */}
              <div className="mt-4 p-2.5 bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 mb-1.5 border-b border-slate-100 px-1">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    <span className="px-1 py-0.2 bg-slate-200 text-slate-700 text-[9px] font-bold">AD</span>
                    Sponsored · myntra.com
                  </span>
                  <span className="text-slate-400">AdChoices ℹ️</span>
                </div>
                <a
                  href="https://www.myntra.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-[#FFCCD5] hover:opacity-95 transition-opacity group"
                >
                  <img
                    src="/media/promotions/myntra_fashion.jpg"
                    alt="Myntra Big Fashion Festival - 50-80% Off"
                    className="w-full h-32 sm:h-36 object-cover object-center"
                  />
                  <div className="p-2.5 bg-[#FFF0F3] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span className="text-[#FF3F6C]">Myntra Big Fashion Festival</span>
                        <span className="text-[9px] bg-[#FF3F6C] text-white px-1 py-0.2 rounded font-bold">50-80% OFF</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Extra ₹400 Off on 1st Order • Code: MYNTRA400</div>
                    </div>
                    <span className="px-3 py-1 bg-[#FF3F6C] hover:bg-[#E02D58] text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 shrink-0 transition-colors shadow-2xs">
                      Shop <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Column: Hero Graphics Illustration */}
            <div className="lg:col-span-7 relative flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] px-2 sm:px-6">
              {/* Skyline background */}
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none opacity-40">
                <svg className="w-full h-48 sm:h-64 text-slate-300 fill-current" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <rect x="20" y="80" width="45" height="120" rx="2" fill="#CBD5E1" />
                  <rect x="75" y="40" width="55" height="160" rx="2" fill="#94A3B8" />
                  <rect x="140" y="90" width="40" height="110" rx="2" fill="#CBD5E1" />
                  <rect x="190" y="30" width="65" height="170" rx="2" fill="#94A3B8" />
                  <rect x="265" y="70" width="50" height="130" rx="2" fill="#CBD5E1" />
                  <rect x="325" y="100" width="60" height="100" rx="2" fill="#94A3B8" />
                  <rect x="395" y="50" width="70" height="150" rx="2" fill="#CBD5E1" />
                  <rect x="475" y="85" width="45" height="115" rx="2" fill="#94A3B8" />
                  <rect x="530" y="40" width="60" height="160" rx="2" fill="#CBD5E1" />
                  <rect x="600" y="95" width="50" height="105" rx="2" fill="#94A3B8" />
                  <circle cx="15" cy="170" r="25" fill="#86EFAC" />
                  <circle cx="45" cy="175" r="20" fill="#4ADE80" />
                  <circle cx="670" cy="170" r="28" fill="#86EFAC" />
                  <circle cx="700" cy="175" r="22" fill="#4ADE80" />
                </svg>
              </div>

              {/* Road line */}
              <div className="absolute bottom-6 left-0 right-0 h-4 bg-slate-300 rounded-full">
                <div className="h-0.5 border-b-2 border-dashed border-white mt-1.5" />
              </div>

              {/* Central Visual: Yellow Pin pointing to Volvo Bus */}
              <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Volvo Bus Graphic */}
                <div className="relative flex flex-col items-center mt-6">
                  {/* Yellow Location Pin */}
                  <div className="animate-bounce mb-1">
                    <div className="relative flex items-center justify-center w-12 h-12 bg-amber-400 rounded-full shadow-lg border-2 border-white text-slate-900">
                      <MapPin className="w-7 h-7 fill-slate-900 text-amber-400" />
                      <div className="absolute w-2.5 h-2.5 bg-amber-400 rounded-full -bottom-1"></div>
                    </div>
                  </div>

                  {/* Bus Body */}
                  <div className="relative w-72 sm:w-84 md:w-96 bg-white border-2 border-slate-300 rounded-2xl shadow-xl p-2.5 overflow-hidden">
                    <div className="h-5 bg-[#108C38] rounded-t-lg flex items-center justify-between px-3 text-[9px] text-white font-bold tracking-wider">
                      <span>INTERSTATE TRAVEL</span>
                      <span>DL-01-AB-1024</span>
                    </div>

                    {/* Passenger Windows */}
                    <div className="grid grid-cols-6 gap-1 my-2 px-1">
                      <div className="h-8 bg-sky-200 rounded border border-sky-300 flex items-center justify-center text-[10px]">
                        👨‍✈️
                      </div>
                      <div className="h-8 bg-sky-100 rounded border border-sky-300 flex items-center justify-center text-[10px]">
                        😴
                      </div>
                      <div className="h-8 bg-sky-100 rounded border border-sky-300 flex items-center justify-center text-[10px]">
                        ☕
                      </div>
                      <div className="h-8 bg-sky-100 rounded border border-sky-300 flex items-center justify-center text-[10px]">
                        📱
                      </div>
                      <div className="h-8 bg-sky-100 rounded border border-sky-300 flex items-center justify-center text-[10px]">
                        🎧
                      </div>
                      <div className="h-8 bg-sky-100 rounded border border-sky-300 flex items-center justify-center text-[10px]">
                        🥪
                      </div>
                    </div>

                    {/* Bus Label */}
                    <div className="flex items-center justify-between px-3 py-1 bg-slate-100 rounded">
                      <span className="text-[11px] font-extrabold text-[#00529B] tracking-tight">
                        interstate travel
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        VOLVO 9600 AC SEATER / SLEEPER
                      </span>
                    </div>

                    {/* Wheels & Clean Route Bumper */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200 px-3">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-4 border-slate-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-4 border-slate-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      </div>

                      {/* Official Route Tag */}
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-[10px] text-slate-800 font-bold">
                        <span>DELHI ⇄ AGRA YAMUNA EXPRESSWAY</span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-800 border-4 border-slate-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smartphone Live Tracking Mockup (Delhi -> Agra) */}
                <div className="relative w-56 sm:w-64 bg-slate-900 p-2.5 rounded-[28px] shadow-2xl border-4 border-slate-800 text-white">
                  <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2" />

                  <div className="bg-white text-slate-800 rounded-2xl p-3 text-xs">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-[10px] text-[#00529B]">LIVE TRACKING</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        ON TIME
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs">
                      Delhi ➔ Agra
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2 font-mono">
                      DL-01-AB-1024 • Service No. 102
                    </div>

                    <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1 mb-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Speed:</span>
                        <span className="font-mono font-bold text-emerald-600">84 km/h</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Next Food Halt:</span>
                        <span className="font-semibold text-slate-700">Jewar Yamuna Plaza (20m)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                        🧔
                      </div>
                      <div className="text-[9px] leading-tight text-slate-600">
                        <strong>Live GPS Synced</strong><br />
                        Share route with family
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. REAL MYNTRA & MEESHO GOOGLE DISPLAY ADS ("addd myntra or meesho ad") */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 4. REAL GOVERNMENT & TOURISM DISPLAY AD BANNERS WITH IMAGES ("ads like this with imageds") */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#F8FAFC] border-y border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="border border-slate-300 bg-white p-3 shadow-xs">
            {/* Ad Header */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Sponsored Ad</span>
                <span>·</span>
                <span className="text-slate-500 font-mono">
                  {activeAd === 'ramayana' ? 'irctctourism.com/bharatgaurav' : activeAd === 'myntra' ? 'myntra.com' : 'meesho.com'}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveAd('ramayana')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      activeAd === 'ramayana'
                        ? 'bg-[#00529B] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#00529B] bg-slate-100'
                    }`}
                  >
                    Ramayana Yatra (IRCTC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAd('myntra')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      activeAd === 'myntra'
                        ? 'bg-[#FF3F6C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#FF3F6C] bg-slate-100'
                    }`}
                  >
                    Myntra Fashion
                  </button>
                </div>
                <span className="hidden sm:inline">AdChoices ℹ️</span>
              </div>
            </div>

            {activeAd === 'ramayana' ? (
              /* REAL SHIR RAMAYANA YATRA IRCTC IMAGE BANNER */
              <div className="relative group overflow-hidden bg-[#FBF8F1] border border-[#E7DFCE] rounded-xs">
                <a
                  href="https://www.irctctourism.com/bharatgaurav"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full overflow-hidden"
                  title="Shri Ramayana Yatra - Book now on irctctourism.com"
                >
                  <img
                    src="/media/promotions/ramayana_yatra.png"
                    alt="Shri Ramayana Yatra - Bharat Gaurav Deluxe AC Tourist Train"
                    className="w-full h-auto object-contain max-h-[160px] sm:max-h-[220px] mx-auto transition-transform duration-300 group-hover:scale-[1.005]"
                  />
                </a>
              </div>
            ) : activeAd === 'myntra' ? (
              /* REAL MYNTRA FASHION IMAGE BANNER */
              <div className="relative group overflow-hidden bg-[#FFF0F3] border border-[#FFCCD5] rounded-xs">
                <a
                  href="https://www.myntra.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full overflow-hidden"
                  title="Myntra Big Fashion Festival - Shop Now"
                >
                  <img
                    src="/media/promotions/myntra_fashion.jpg"
                    alt="Myntra Big Fashion Festival - 50-80% Off"
                    className="w-full h-auto object-cover max-h-[170px] sm:max-h-[230px] mx-auto transition-transform duration-300 group-hover:scale-[1.005]"
                  />
                </a>
              </div>
            ) : (
              /* MEESHO DISPLAY AD */
              <div className="bg-[#FFF5F9] border border-[#F9D2E5] p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#9C1D60] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    m
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#9C1D60] text-lg leading-none">meesho</span>
                      <span className="text-[10px] bg-[#9C1D60] text-white font-bold px-1.5 py-0.5">
                        UP TO 70% OFF
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      Mega Blockbuster Sale
                    </div>
                    <p className="text-xs text-slate-600">
                      Lowest Prices on Sarees, Kurtis, Footwear & Home Essentials. Free Delivery & Cash on Delivery.
                    </p>
                  </div>
                </div>

                <a
                  href="https://www.meesho.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-[#9C1D60] hover:bg-[#821953] text-white font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
                >
                  <span>Shop Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. OFFICIAL ROUTE TIMETABLE & ROUTE DETAILS (DELHI TO AGRA) */}
      {/* ========================================================================= */}
      <section className="w-full py-10 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Delhi ➔ Agra Live Bus Tracking
            </h2>
            <p className="text-sm text-slate-600 max-w-4xl leading-relaxed">
              Official Real-Time GPS Tracking System for Inter-State Passenger Fleet. Verify bus arrival, departure, speed, and en-route halts along the Delhi-Agra Expressway corridor.
            </p>
          </div>

          {/* Timetable Table */}
          <div className="border border-slate-300 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Scheduled Stops & Halts (Delhi ➔ Agra Yamuna Expressway Corridor)
              </span>
              <span className="text-xs text-slate-500 font-mono">Service: DL-01-AB-1024</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <th className="py-2.5 px-4 font-semibold">Stop No.</th>
                    <th className="py-2.5 px-4 font-semibold">Station / Landmark</th>
                    <th className="py-2.5 px-4 font-semibold">City</th>
                    <th className="py-2.5 px-4 font-semibold">Distance</th>
                    <th className="py-2.5 px-4 font-semibold">Halt Duration</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold">1</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">Delhi Sarai Kale Khan ISBT</td>
                    <td className="py-2.5 px-4 text-slate-600">New Delhi</td>
                    <td className="py-2.5 px-4 font-mono">0.0 KM</td>
                    <td className="py-2.5 px-4 text-slate-500">Origin Depot</td>
                    <td className="py-2.5 px-4"><span className="text-emerald-700 font-semibold">Passed</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold">2</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">Noida Sector 37 / Mahamaya Flyover</td>
                    <td className="py-2.5 px-4 text-slate-600">Noida</td>
                    <td className="py-2.5 px-4 font-mono">18.5 KM</td>
                    <td className="py-2.5 px-4 text-slate-500">5 Mins</td>
                    <td className="py-2.5 px-4"><span className="text-emerald-700 font-semibold">Passed</span></td>
                  </tr>
                  <tr className="bg-amber-50/60 hover:bg-amber-50">
                    <td className="py-2.5 px-4 font-mono font-bold">3</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">Jewar Yamuna Expressway Plaza</td>
                    <td className="py-2.5 px-4 text-slate-600">Jewar</td>
                    <td className="py-2.5 px-4 font-mono">68.0 KM</td>
                    <td className="py-2.5 px-4 text-amber-800 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 20 Mins Scheduled Halt
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 bg-amber-500 text-white font-mono text-[10px] font-bold">
                        NEXT STOP
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold">4</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">Mathura Raya Expressway Exit</td>
                    <td className="py-2.5 px-4 text-slate-600">Mathura</td>
                    <td className="py-2.5 px-4 font-mono">145.0 KM</td>
                    <td className="py-2.5 px-4 text-slate-500">10 Mins</td>
                    <td className="py-2.5 px-4"><span className="text-slate-500">Scheduled</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold">5</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">Agra ISBT Terminal</td>
                    <td className="py-2.5 px-4 text-slate-600">Agra</td>
                    <td className="py-2.5 px-4 font-mono">205.0 KM</td>
                    <td className="py-2.5 px-4 text-slate-500">Final Destination</td>
                    <td className="py-2.5 px-4"><span className="text-slate-500">Scheduled</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Popular Routes Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Popular Inter-State Express Routes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border-2 border-[#00529B] bg-blue-50/20">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">ACTIVE LIVE CORRIDOR</span>
                <div className="font-bold text-slate-900 text-sm mt-1">Delhi ⇄ Agra</div>
                <div className="text-xs text-slate-600 mt-0.5">Yamuna Expressway • 205 KM</div>
                <div className="text-[11px] text-slate-500 font-mono mt-2">Vehicle: DL-01-AB-1024</div>
              </div>
              <div className="p-4 border border-slate-300 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase">DAILY SERVICE</span>
                <div className="font-bold text-slate-900 text-sm mt-1">Delhi ⇄ Mathura</div>
                <div className="text-xs text-slate-600 mt-0.5">Yamuna Expressway • 145 KM</div>
                <div className="text-[11px] text-slate-500 font-mono mt-2">Multiple Departures</div>
              </div>
              <div className="p-4 border border-slate-300 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase">EXPRESS SHUTTLE</span>
                <div className="font-bold text-slate-900 text-sm mt-1">Delhi ⇄ Jaipur</div>
                <div className="text-xs text-slate-600 mt-0.5">NH 48 Superfast • 260 KM</div>
                <div className="text-[11px] text-slate-500 font-mono mt-2">Hourly Service</div>
              </div>
              <div className="p-4 border border-slate-300 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase">INTERCITY NON-STOP</span>
                <div className="font-bold text-slate-900 text-sm mt-1">Delhi ⇄ Chandigarh</div>
                <div className="text-xs text-slate-600 mt-0.5">NH 44 Expressway • 245 KM</div>
                <div className="text-[11px] text-slate-500 font-mono mt-2">Volvo Multi-Axle</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Official Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 mt-auto text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-base">INTERSTATE TRAVEL</div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              MAHARANI TRAVELS • INTEGRATED FLEET PASSENGER TRACKING
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <span>AIS-140 Compliance</span>
            <span>Terms of Service</span>
            <span>Passenger Care: 04843540685</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
