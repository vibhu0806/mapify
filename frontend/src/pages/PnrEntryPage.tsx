import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api.js';
import { TopNavigation } from '../components/TopNavigation.js';
import {
  MapPin,
  ArrowLeftRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  Shield,
  Ticket,
  Globe,
  Loader2,
  CheckCircle,
  X,
  Compass,
  Radio
} from 'lucide-react';

export const PnrEntryPage: React.FC = () => {
  const navigate = useNavigate();

  // Card Mode: 'book' or 'track'
  const [activeMode, setActiveMode] = useState<'book' | 'track'>('book');

  // Booking Card State
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [fromCity, setFromCity] = useState('Jaipur');
  const [toCity, setToCity] = useState('Hyderabad');
  const [departureDate, setDepartureDate] = useState('Today, 27 Oct');
  const [passengers, setPassengers] = useState('1 Adult');

  // Active Tab for "Popular Cities and Connections"
  const [popularTab, setPopularTab] = useState<'cities' | 'connections'>('cities');

  // Trip Tracker State (PNR ONLY)
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [pnrInput, setPnrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasExistingSession, setHasExistingSession] = useState(false);

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

  const handleSwapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  const handleLiveTrackSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPnr = pnrInput.trim().toUpperCase();

    if (!cleanPnr) {
      setErrorMessage('Please enter your Booking PNR.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.validatePnr(cleanPnr);
      if (response.valid && response.pnrToken) {
        navigate('/track');
      } else {
        setErrorMessage('Invalid PNR. Please verify your booking details.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setErrorMessage(err.message || 'Too many attempts. Please wait a moment and try again.');
      } else {
        setErrorMessage(err.message || 'Invalid PNR. Please verify your booking details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    // Switch to tracker or track
    setActiveMode('track');
    setShowTrackerModal(true);
  };

  const handleSelectCity = (city: string) => {
    setToCity(city);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Popular cities list matching Screenshot 1
  const citiesCol1 = ['Delhi', 'Dehradun', 'Pune', 'Greater Noida', 'Manali'];
  const citiesCol2 = ['Bengaluru', 'Gurugram', 'Jaipur', 'Lucknow', 'Haridwar'];
  const citiesCol3 = ['Hyderabad', 'Vijayawada', 'Rishikesh', 'Mumbai', 'Madurai'];
  const citiesCol4 = ['Chennai', 'Chandigarh', 'Visakhapatnam', 'Bareilly', 'Goa'];

  const connectionsCol1 = ['Delhi ➔ Jaipur', 'Delhi ➔ Dehradun', 'Delhi ➔ Chandigarh', 'Delhi ➔ Haridwar', 'Delhi ➔ Manali'];
  const connectionsCol2 = ['Jaipur ➔ Dehradun', 'Jaipur ➔ Delhi', 'Bengaluru ➔ Hyderabad', 'Bengaluru ➔ Chennai', 'Gurugram ➔ Jaipur'];
  const connectionsCol3 = ['Mumbai ➔ Pune', 'Mumbai ➔ Goa', 'Hyderabad ➔ Vijayawada', 'Hyderabad ➔ Bengaluru', 'Rishikesh ➔ Delhi'];
  const connectionsCol4 = ['Chennai ➔ Madurai', 'Chandigarh ➔ Manali', 'Dehradun ➔ Delhi', 'Lucknow ➔ Delhi', 'Pune ➔ Goa'];

  return (
    <div className="min-h-screen w-full bg-white text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. Header Navigation - FlixBus Lime Green */}
      <TopNavigation onOpenTripTracker={() => setShowTrackerModal(true)} />

      {/* 2. Hero Section with Scenic Bus Background & Floating Booking Card */}
      <section className="relative w-full min-h-[520px] sm:min-h-[580px] flex items-center justify-center overflow-hidden">
        {/* Background Image: Scenic FlixBus in mountain river valley */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('/media/flixbus_hero.jpg')`,
            backgroundPosition: 'center 40%',
          }}
        >
          {/* Subtle natural gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center">
          {/* Title: "Book bus tickets online" */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center tracking-tight mb-8 drop-shadow-md">
            Book bus tickets online
          </h1>

          {/* Floating Booking Search Card */}
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-100">
            {/* Top Navigation Tabs inside Card: Book Tickets & Trip Tracker */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('book');
                    setErrorMessage(null);
                  }}
                  className={`pb-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeMode === 'book'
                      ? 'border-[#73D200] text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Book Tickets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('track');
                    setErrorMessage(null);
                  }}
                  className={`pb-1 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeMode === 'track'
                      ? 'border-[#73D200] text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trip Tracker (PNR)</span>
                </button>
              </div>

              {activeMode === 'book' ? (
                <div className="flex items-center gap-5 text-sm font-semibold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="relative flex items-center justify-center w-4 h-4 rounded-full border-2 border-slate-700">
                      {tripType === 'oneway' && (
                        <span className="w-2 h-2 rounded-full bg-slate-900" />
                      )}
                    </span>
                    <input
                      type="radio"
                      name="tripType"
                      checked={tripType === 'oneway'}
                      onChange={() => setTripType('oneway')}
                      className="sr-only"
                    />
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">One Way</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="relative flex items-center justify-center w-4 h-4 rounded-full border-2 border-slate-400">
                      {tripType === 'roundtrip' && (
                        <span className="w-2 h-2 rounded-full bg-slate-900" />
                      )}
                    </span>
                    <input
                      type="radio"
                      name="tripType"
                      checked={tripType === 'roundtrip'}
                      onChange={() => setTripType('roundtrip')}
                      className="sr-only"
                    />
                    <span className="text-slate-600 font-medium hover:text-slate-900 text-xs sm:text-sm">Round Trip</span>
                  </label>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Real-time AIS-140 GPS Telematics
                </span>
              )}
            </div>

            {activeMode === 'track' ? (
              /* PNR-ONLY TRACKING INTERFACE */
              <form onSubmit={handleLiveTrackSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-9 relative flex flex-col justify-center border-2 border-[#73D200] rounded-xl px-4 py-2.5 bg-white shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Booking PNR
                    </span>
                    <div className="flex items-center gap-2.5 mt-1">
                      <Ticket className="w-5 h-5 text-emerald-600 shrink-0" />
                      <input
                        type="text"
                        value={pnrInput}
                        onChange={(e) => {
                          setPnrInput(e.target.value.toUpperCase());
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider bg-transparent focus:outline-none placeholder:text-slate-300"
                        placeholder="Enter PNR (e.g. JD-7842)"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[62px] rounded-xl bg-[#73D200] hover:bg-[#65be00] active:scale-[0.98] text-slate-950 font-black text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <span>Track Bus</span>
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}
              </form>
            ) : (
              /* BOOKING SEARCH INPUTS */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-center">
                {/* From & To inputs container */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
                  {/* From Box */}
                  <div className="sm:col-span-5 relative flex flex-col justify-center border border-slate-300 rounded-lg px-3.5 py-2 hover:border-slate-400 focus-within:border-[#73D200] focus-within:ring-1 focus-within:ring-[#73D200] transition-all bg-white">
                    <span className="text-[11px] font-semibold text-slate-500">From</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <input
                        type="text"
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 bg-transparent focus:outline-none"
                        placeholder="Origin city"
                      />
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="sm:col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleSwapCities}
                      title="Swap Origin and Destination"
                      className="w-9 h-9 rounded-full border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* To Box */}
                  <div className="sm:col-span-5 relative flex flex-col justify-center border border-slate-300 rounded-lg px-3.5 py-2 hover:border-slate-400 focus-within:border-[#73D200] focus-within:ring-1 focus-within:ring-[#73D200] transition-all bg-white">
                    <span className="text-[11px] font-semibold text-slate-500">To</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <input
                        type="text"
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 bg-transparent focus:outline-none"
                        placeholder="Destination city"
                      />
                    </div>
                  </div>
                </div>

                {/* Departure Date */}
                <div className="lg:col-span-3 relative flex flex-col justify-center border border-slate-300 rounded-lg px-3.5 py-2 hover:border-slate-400 focus-within:border-[#73D200] bg-white">
                  <span className="text-[11px] font-semibold text-slate-500">Departure</span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-sm font-bold text-slate-900 truncate">{departureDate}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => setDepartureDate('Yesterday, 26 Oct')}
                        className="hover:text-slate-800 p-0.5"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepartureDate('Tomorrow, 28 Oct')}
                        className="hover:text-slate-800 p-0.5"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                <div className="lg:col-span-2 relative flex flex-col justify-center border border-slate-300 rounded-lg px-3.5 py-2 hover:border-slate-400 focus-within:border-[#73D200] bg-white">
                  <span className="text-[11px] font-semibold text-slate-500">Passengers</span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-sm font-bold text-slate-900 truncate">{passengers}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                </div>

                {/* Search Button (Bright FlixBus Lime Green) */}
                <div className="lg:col-span-1 w-full">
                  <button
                    type="button"
                    onClick={handleSearchClick}
                    disabled={loading}
                    className="w-full h-[54px] rounded-lg bg-[#73D200] hover:bg-[#65be00] active:scale-[0.98] text-slate-950 font-black text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                    ) : (
                      <span>Search</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Active Live Session notification banner */}
            {hasExistingSession && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    Active live corridor session found: <strong>RJ-14-PB-4289 (Jaipur ➔ Dehradun)</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/track')}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Resume Live Tracking</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Four Value Props / Benefits (Screenshot 2) */}
      <section className="w-full bg-white py-14 px-4 sm:px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 text-center">
            {/* 1. Comfort on board */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-[#E8F8CE] flex items-center justify-center text-[#257800] mb-3.5 shadow-2xs">
                {/* Reclining seat icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M7 3C5.9 3 5 3.9 5 5v10c0 1.66 1.34 3 3 3h8c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1-.45-1-1V5c0-.55-.45-1-1-1zm10 2c-1.1 0-2 .9-2 2v7c0 .55.45 1 1 1s1-.45 1-1V7c0-1.1-.9-2-2-2zm-3 15H6c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Comfort on board
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-[240px]">
                Our modern buses are equipped with comfortable sleeper and semi-sleeper beds, USB plugs & A/C.
              </p>
            </div>

            {/* 2. Safety & Trust */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-[#E8F8CE] flex items-center justify-center text-[#257800] mb-3.5 shadow-2xs">
                <Shield className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Safety & Trust
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-[240px]">
                Less worries with real time GPS tracking, modern buses & host supervision.
              </p>
            </div>

            {/* 3. Travel made easy */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-[#E8F8CE] flex items-center justify-center text-[#257800] mb-3.5 shadow-2xs">
                <Ticket className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Travel made easy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-[240px]">
                Hassle free booking & secure payment system.
              </p>
            </div>

            {/* 4. Connecting you to the world */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-[#E8F8CE] flex items-center justify-center text-[#257800] mb-3.5 shadow-2xs">
                <Globe className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Connecting you to the world
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-[240px]">
                Endless possibilities. Discover over 8,000 destinations across more than 40 countries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. "Trusted by 50 Crore+ passengers globally" & Logos (Screenshot 2) */}
      <section className="w-full bg-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-center mb-8">
            Trusted by 50 Crore+ passengers globally.
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-85 grayscale hover:grayscale-0 transition-all duration-300">
            {/* FLIXBUS */}
            <span className="font-black text-2xl sm:text-3xl tracking-tight text-slate-800">
              FLIXBUS
            </span>

            {/* FLIXTRAIN */}
            <span className="font-black text-2xl sm:text-3xl tracking-tight text-slate-800">
              FLIXTRAIN
            </span>

            {/* Greyhound with leaping dog */}
            <div className="flex items-center gap-2">
              <svg className="w-10 h-6 text-slate-800 fill-current" viewBox="0 0 100 50">
                <path d="M10 25 Q30 10 50 20 Q70 5 95 15 Q75 30 60 25 Q45 40 25 35 Z" />
              </svg>
              <span className="font-serif italic font-bold text-xl sm:text-2xl text-slate-800">
                Greyhound
              </span>
            </div>

            {/* KAMILKOC */}
            <div className="flex flex-col items-center leading-none">
              <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">1926</span>
              <span className="font-black text-xl sm:text-2xl tracking-wide text-slate-800 uppercase">
                KÂMİLKOC
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Green Mobile App Promo Section (Screenshot 2) */}
      <section className="w-full bg-[#73D200] overflow-hidden py-10 sm:py-14 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
          {/* Left Text & Badges (Col 7) */}
          <div className="lg:col-span-7 text-slate-900 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-2">
              Get the app and travel with ease of mind
            </h2>
            <p className="text-base sm:text-lg font-bold text-slate-800 mb-6">
              Digital ticket & Live tracking
            </p>

            {/* 4 Feature Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-sm font-bold text-slate-950">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                <span>Book trips</span>
              </div>
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                <span>Your tickets</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                <span>Track your trip</span>
              </div>
              <div className="flex items-center gap-3">
                <Compass className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                <span>Always in-the-know</span>
              </div>
            </div>

            {/* Store Download Badges */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Google Play */}
              <div className="h-11 px-4 rounded-lg bg-black text-white flex items-center gap-2.5 shadow-md cursor-pointer hover:bg-slate-900 transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.94 1.94 0 0 1-.22-.96V2.774c0-.36.08-.7.22-.96zm11.3 11.3l2.25 2.25-11.66 6.64 9.41-8.89zm0-2.228L5.5 1.996l11.66 6.64-2.251 2.25zM15.89 12l2.67-2.67 3.32 1.89c.94.54.94 1.42 0 1.96l-3.32 1.89L15.89 12z" />
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] uppercase tracking-wide text-slate-300">GET IT ON</span>
                  <span className="text-xs font-bold text-white mt-0.5">Google Play</span>
                </div>
              </div>

              {/* App Store */}
              <div className="h-11 px-4 rounded-lg bg-black text-white flex items-center gap-2.5 shadow-md cursor-pointer hover:bg-slate-900 transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.02.63-2.67 1.39-.58.67-.99 1.77-.85 2.81 1.04.08 2.06-.54 2.58-1.27z" />
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] uppercase tracking-wide text-slate-300">Download on the</span>
                  <span className="text-xs font-bold text-white mt-0.5">App Store</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Smartphone QR Code Mockup (Col 5) */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            {/* Phone Bezel */}
            <div className="w-[230px] sm:w-[250px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 relative z-10">
              <div className="bg-white rounded-[28px] overflow-hidden p-4 flex flex-col items-center text-center">
                {/* Phone Notch/Camera */}
                <div className="w-16 h-4 bg-slate-900 rounded-b-xl mx-auto mb-3" />

                {/* QR Code Graphic */}
                <div className="p-2 border border-slate-200 rounded-xl bg-white shadow-xs">
                  <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none">
                    {/* Stylized high precision QR code pattern */}
                    <rect width="100" height="100" fill="white" />
                    {/* Top Left Marker */}
                    <rect x="10" y="10" width="24" height="24" rx="3" fill="#111827" />
                    <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="18" width="8" height="8" rx="1" fill="#73D200" />

                    {/* Top Right Marker */}
                    <rect x="66" y="10" width="24" height="24" rx="3" fill="#111827" />
                    <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="74" y="18" width="8" height="8" rx="1" fill="#73D200" />

                    {/* Bottom Left Marker */}
                    <rect x="10" y="66" width="24" height="24" rx="3" fill="#111827" />
                    <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="74" width="8" height="8" rx="1" fill="#73D200" />

                    {/* QR Data Dots */}
                    <rect x="38" y="12" width="4" height="4" fill="#111827" />
                    <rect x="46" y="12" width="4" height="4" fill="#111827" />
                    <rect x="54" y="12" width="4" height="4" fill="#111827" />
                    <rect x="42" y="20" width="4" height="4" fill="#111827" />
                    <rect x="50" y="20" width="4" height="4" fill="#111827" />
                    <rect x="38" y="28" width="4" height="4" fill="#111827" />
                    <rect x="46" y="28" width="4" height="4" fill="#111827" />
                    <rect x="54" y="28" width="4" height="4" fill="#111827" />

                    <rect x="12" y="42" width="4" height="4" fill="#111827" />
                    <rect x="20" y="42" width="4" height="4" fill="#111827" />
                    <rect x="28" y="42" width="4" height="4" fill="#111827" />
                    <rect x="38" y="42" width="4" height="4" fill="#111827" />
                    <rect x="46" y="42" width="4" height="4" fill="#111827" />
                    <rect x="54" y="42" width="4" height="4" fill="#111827" />
                    <rect x="64" y="42" width="4" height="4" fill="#111827" />
                    <rect x="76" y="42" width="4" height="4" fill="#111827" />

                    <rect x="12" y="52" width="4" height="4" fill="#111827" />
                    <rect x="24" y="52" width="4" height="4" fill="#111827" />
                    <rect x="36" y="52" width="4" height="4" fill="#111827" />
                    <rect x="48" y="52" width="4" height="4" fill="#111827" />
                    <rect x="68" y="52" width="4" height="4" fill="#111827" />
                    <rect x="80" y="52" width="4" height="4" fill="#111827" />

                    <rect x="38" y="66" width="4" height="4" fill="#111827" />
                    <rect x="50" y="66" width="4" height="4" fill="#111827" />
                    <rect x="62" y="66" width="4" height="4" fill="#111827" />
                    <rect x="74" y="66" width="4" height="4" fill="#111827" />
                    <rect x="86" y="66" width="4" height="4" fill="#111827" />

                    <rect x="42" y="78" width="4" height="4" fill="#111827" />
                    <rect x="54" y="78" width="4" height="4" fill="#111827" />
                    <rect x="66" y="78" width="4" height="4" fill="#111827" />
                    <rect x="78" y="78" width="4" height="4" fill="#111827" />
                  </svg>
                </div>

                <span className="text-[11px] font-bold text-blue-600 mt-2.5">
                  Scan to download the App
                </span>
              </div>
            </div>

            {/* Dark Floating Circular Badge */}
            <div className="absolute -bottom-4 -right-4 sm:-right-8 w-36 h-36 rounded-full bg-slate-900 text-white p-3 flex flex-col items-center justify-center text-center shadow-xl border-2 border-slate-700 select-none z-20">
              <span className="text-[11px] font-bold leading-tight">
                Trusted by 50 Crore+ passengers globally
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "Popular Cities and Connections" (Screenshot 1) */}
      <section className="w-full bg-[#FAFAFA] py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          {/* Section Heading */}
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Popular Cities and Connections
          </h2>

          {/* Pill Tabs: Cities / Connections */}
          <div className="flex items-center gap-1 mb-8 border-b border-slate-200 w-full justify-center pb-2">
            <button
              type="button"
              onClick={() => setPopularTab('cities')}
              className={`px-4 py-1.5 rounded-t-md text-sm font-bold transition-all cursor-pointer ${
                popularTab === 'cities'
                  ? 'bg-[#E8F8CE] text-slate-900 border-b-2 border-[#73D200]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cities
            </button>
            <button
              type="button"
              onClick={() => setPopularTab('connections')}
              className={`px-4 py-1.5 rounded-t-md text-sm font-bold transition-all cursor-pointer ${
                popularTab === 'connections'
                  ? 'bg-[#E8F8CE] text-slate-900 border-b-2 border-[#73D200]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Connections
            </button>
          </div>

          {/* 4 Column List */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-slate-700">
            {popularTab === 'cities' ? (
              <>
                <div className="flex flex-col gap-3">
                  {citiesCol1.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c)}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {citiesCol2.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c)}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {citiesCol3.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c)}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {citiesCol4.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c)}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {connectionsCol1.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c.split('➔')[1]?.trim() || 'Dehradun')}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {connectionsCol2.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c.split('➔')[1]?.trim() || 'Dehradun')}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {connectionsCol3.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c.split('➔')[1]?.trim() || 'Dehradun')}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {connectionsCol4.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectCity(c.split('➔')[1]?.trim() || 'Dehradun')}
                      className="text-left hover:text-[#257800] transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 7. Footer Section (Screenshot 1) */}
      <footer className="w-full bg-white border-t border-slate-200 py-12 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto">
          {/* 4 Column Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            {/* Bus Travel */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Bus Travel</h4>
              <ul className="space-y-2.5 text-slate-700">
                <li><a href="#destinations" className="hover:text-slate-900">All Bus Destinations</a></li>
                <li><a href="#routemap" className="hover:text-slate-900">Route Map</a></li>
                <li><a href="#travelindia" className="hover:text-slate-900">Bus Travel in India</a></li>
                <li><a href="#overnight" className="hover:text-slate-900">Overnight Buses</a></li>
                <li><a href="#getapp" className="hover:text-slate-900">Get the App</a></li>
              </ul>
            </div>

            {/* Discover */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Discover</h4>
              <ul className="space-y-2.5 text-slate-700">
                <li><a href="#delhi" className="hover:text-slate-900">Bus to Delhi</a></li>
                <li><a href="#bangalore" className="hover:text-slate-900">Bus to Bangalore</a></li>
                <li><a href="#hyderabad" className="hover:text-slate-900">Bus to Hyderabad</a></li>
                <li><a href="#manali" className="hover:text-slate-900">Bus to Manali</a></li>
                <li>
                  <a
                    href="#jodhpur"
                    className="inline-block px-2.5 py-1 -ml-2.5 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-900"
                  >
                    Bus to Jodhpur
                  </a>
                </li>
                <li><a href="#dehradun" className="hover:text-slate-900">Bus to Dehradun</a></li>
                <li><a href="#lucknow" className="hover:text-slate-900">Bus to Lucknow</a></li>
              </ul>
            </div>

            {/* FlixBus */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">FlixBus</h4>
              <ul className="space-y-2.5 text-slate-700">
                <li><a href="#about" className="hover:text-slate-900">About Flix</a></li>
                <li><a href="#conditions" className="hover:text-slate-900">General Conditions for Business and Booking</a></li>
                <li><a href="#terms" className="hover:text-slate-900">General Terms and Conditions of Travel</a></li>
                <li><a href="#jobs" className="hover:text-slate-900">Jobs</a></li>
                <li><a href="#news" className="hover:text-slate-900">News Room</a></li>
                <li><a href="#partner" className="hover:text-slate-900">Partner Agents Login</a></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Customer Care</h4>
              <ul className="space-y-2.5 text-slate-700">
                <li><a href="#help" className="hover:text-slate-900">Help</a></li>
                <li><a href="#services" className="hover:text-slate-900">Services</a></li>
                <li><a href="#lounge" className="hover:text-slate-900">Flix Lounge</a></li>
                <li><a href="#manage" className="hover:text-slate-900">Manage My Booking</a></li>
                <li><a href="#seats" className="hover:text-slate-900">Seat Reservations</a></li>
                <li><a href="#luggage" className="hover:text-slate-900">Luggage</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Telemetry note */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Flix SE. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>AIS-140 GPS Compliance</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowTrackerModal(true)}
                className="text-emerald-700 font-semibold hover:underline"
              >
                Live Fleet GPS Tracker
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 8. Interactive Trip Tracker Dialog / Modal */}
      {showTrackerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#73D200] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-950 uppercase tracking-tight">FLIXBUS</span>
                <span className="text-slate-800 text-sm font-bold">• Trip Tracker</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackerModal(false)}
                className="p-1 rounded-full text-slate-900 hover:bg-black/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Enter your booking PNR to view real-time location, vehicle speed, and live stop telematics.
              </p>

              <form onSubmit={handleLiveTrackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Booking PNR
                  </label>
                  <div className="relative">
                    <Ticket className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Enter PNR (e.g. JD-7842)"
                      value={pnrInput}
                      onChange={(e) => {
                        setPnrInput(e.target.value.toUpperCase());
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoFocus
                      className="w-full h-12 pl-11 pr-4 rounded-lg border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 text-base font-bold uppercase tracking-wider focus:outline-none focus:border-[#73D200] focus:ring-1 focus:ring-[#73D200]"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-snug">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-[#73D200] hover:bg-[#65be00] active:scale-[0.98] text-slate-950 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      <span>Connecting to GPS...</span>
                    </>
                  ) : (
                    <span>Live Track Bus</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PnrEntryPage;
