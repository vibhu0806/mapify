import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api.js';
import { TopNavigation } from '../components/TopNavigation.js';
import {
  MapPin,
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Ticket,
  Loader2,
  X,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

export const PnrEntryPage: React.FC = () => {
  const navigate = useNavigate();

  // Search Bar State
  const [origin, setOrigin] = useState('Jaipur');
  const [destination, setDestination] = useState('Dehradun');
  const [journeyDate, setJourneyDate] = useState('28/10/2026');
  const [returnDate, setReturnDate] = useState('');

  // Trip Tracker (PNR ONLY)
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [pnrInput, setPnrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSwapCities = () => {
    setOrigin(destination);
    setDestination(origin);
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
    // If the user entered a PNR, track it directly; otherwise open the tracker modal
    if (pnrInput.trim()) {
      handleLiveTrackSubmit();
    } else {
      setShowTrackerModal(true);
    }
  };

  const handleSelectRoute = (from: string, to: string) => {
    setOrigin(from);
    setDestination(to);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // 12 Top Destinations pills matching Screenshot 2
  const topDestinations = [
    { from: 'Kota', to: 'Delhi' },
    { from: 'Manali', to: 'Delhi' },
    { from: 'Amritsar', to: 'Udaipur' },
    { from: 'Dehradun', to: 'Gurugram' },
    { from: 'Dharamsala', to: 'Haridwar' },
    { from: 'Katra', to: 'Kathua' },
    { from: 'Nangal', to: 'Delhi' },
    { from: 'Delhi', to: 'Indore' },
    { from: 'Jaipur', to: 'Meerut' },
    { from: 'Nainital', to: 'Jaipur' },
    { from: 'Manali', to: 'Jaipur' },
    { from: 'Jaipur', to: 'Ludhiana' },
  ];

  // 4 Popular Destination Photo Cards matching Screenshot 1
  const popularDestinations = [
    {
      name: 'Tirupati',
      image: '/media/tirupati.jpg',
      alt: 'Tirupati Balaji Sri Venkateswara Temple',
    },
    {
      name: 'Goa',
      image: '/media/goa.jpg',
      alt: 'Goa tropical coastal beach',
    },
    {
      name: 'Katra',
      image: '/media/katra.jpg',
      alt: 'Katra Vaishno Devi holy shrine',
    },
    {
      name: 'Dharamshala',
      image: '/media/dharamshala.jpg',
      alt: 'Dharamshala snow-capped mountain sanctuary',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-slate-800 flex flex-col font-sans antialiased relative">
      {/* 1. Header Navigation Bar (Ram Dalal Holidays) */}
      <TopNavigation onOpenTripTracker={() => setShowTrackerModal(true)} />

      {/* Left Fixed Floating Vertical Badge: "Packages" with bus icons */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden sm:flex items-center shadow-lg">
        {/* Black mini icon strip */}
        <div className="bg-black text-white py-3 px-1.5 flex flex-col gap-3 rounded-l-none text-xs items-center">
          <span>🚌</span>
          <span>🚗</span>
          <span>🚢</span>
        </div>
        {/* Red Packages Label tab */}
        <div
          className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-2 py-4 font-bold text-xs uppercase tracking-widest cursor-pointer transition-colors shadow-md"
          style={{ writingMode: 'vertical-rl' }}
          onClick={() => setShowTrackerModal(true)}
        >
          Packages
        </div>
      </div>

      {/* Right Bottom Floating WhatsApp Icon */}
      <a
        href="https://wa.me/919953731731"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform cursor-pointer"
        title="Chat with Ram Dalal Holidays on WhatsApp"
      >
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 2C6.516 2 2.031 6.484 2.031 12c0 2.203.719 4.25 1.953 5.922L2 22l4.203-1.922C7.844 21.234 9.875 22 12.031 22c5.516 0 10-4.484 10-10s-4.484-10-10-10zm5.953 14.281c-.25.703-1.25 1.297-1.75 1.344-.484.047-1.109.078-3.563-.922-3.125-1.281-5.156-4.469-5.313-4.672-.156-.203-1.266-1.688-1.266-3.219 0-1.531.813-2.281 1.094-2.594.281-.313.625-.391.828-.391.203 0 .422 0 .609.016.203.016.484-.078.75.563.281.688.953 2.328 1.031 2.5.078.172.141.375.016.609-.109.234-.172.375-.344.578-.172.203-.359.453-.516.609-.172.172-.359.359-.156.703.203.344.891 1.469 1.922 2.375 1.328 1.172 2.453 1.547 2.797 1.719.344.172.547.141.75-.094.203-.234.875-1.016 1.109-1.375.234-.359.469-.297.781-.172.313.125 1.984.938 2.328 1.109.344.172.578.25.656.391.078.141.078.813-.172 1.516z" />
        </svg>
      </a>

      {/* 2. Hero Section with Fleet Image & Floating Pill Search Bar (Screenshot 3) */}
      <section className="relative w-full min-h-[460px] sm:min-h-[520px] flex items-center justify-center overflow-hidden">
        {/* Fleet Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('/media/ramdalal_hero.jpg')`,
            backgroundPosition: 'center 48%',
          }}
        >
          {/* Subtle natural gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
        </div>

        {/* Carousel Arrow Controls */}
        <button
          type="button"
          onClick={() => {}}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer z-20 backdrop-blur-xs"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => {}}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer z-20 backdrop-blur-xs"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Floating Pill Search Bar Container (Centered over the hero) */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center">
          {/* Main Floating Pill Search Bar */}
          <div className="w-full bg-white/95 backdrop-blur-md rounded-full shadow-2xl p-2 sm:p-2.5 border border-slate-200/90 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
            {/* Origin Pill Box */}
            <div className="flex-1 min-w-[150px] flex items-center justify-between px-4 py-2 border border-slate-200 rounded-full bg-white hover:border-slate-400 transition-colors">
              <div className="flex items-center gap-2 overflow-hidden">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Origin"
                  className="w-full text-sm font-semibold text-slate-800 bg-transparent focus:outline-none"
                />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwapCities}
              title="Swap Origin and Destination"
              className="w-8 h-8 rounded-full border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Destination Pill Box */}
            <div className="flex-1 min-w-[150px] flex items-center justify-between px-4 py-2 border border-slate-200 rounded-full bg-white hover:border-slate-400 transition-colors">
              <div className="flex items-center gap-2 overflow-hidden">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destination"
                  className="w-full text-sm font-semibold text-slate-800 bg-transparent focus:outline-none"
                />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </div>

            {/* Journey Date Box */}
            <div className="w-[140px] flex items-center px-4 py-2 border border-slate-200 rounded-full bg-white hover:border-slate-400 transition-colors">
              <input
                type="text"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full text-sm font-semibold text-slate-800 bg-transparent focus:outline-none text-center"
              />
            </div>

            {/* Return Date Box */}
            <div className="w-[130px] flex items-center px-4 py-2 border border-slate-200 rounded-full bg-white hover:border-slate-400 transition-colors">
              <input
                type="text"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                placeholder="Return"
                className="w-full text-sm font-medium text-slate-500 bg-transparent focus:outline-none text-center"
              />
            </div>

            {/* Crimson Red Search Button */}
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={loading}
              className="h-11 px-8 rounded-full bg-[#E32636] hover:bg-[#C91A2A] active:scale-95 text-white font-black text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>SEARCH</span>
              )}
            </button>
          </div>

          {/* Quick PNR Live Tracker Trigger under search bar */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowTrackerModal(true)}
              className="text-xs font-bold text-white drop-shadow-md bg-black/40 hover:bg-black/60 px-4 py-1.5 rounded-full transition-all flex items-center gap-2 backdrop-blur-xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Track Bus with Booking PNR (Live GPS Telematics) ➔</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. "OUR TOP DESTINATIONS" (Screenshot 2) */}
      <section className="w-full py-16 px-4 sm:px-8 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: 3D Illustrated Map of India with Pins & Bus Graphic */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Illustrated Route Map Graphic Container */}
            <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl p-4 flex items-center justify-center">
              {/* Stylized SVG Map of India Route Network */}
              <svg className="w-full h-full drop-shadow-md" viewBox="0 0 400 340" fill="none">
                {/* India Outline Silhouette */}
                <path
                  d="M140 30 Q160 10 180 30 T200 60 T220 80 T260 90 T280 120 T240 160 T220 200 T200 240 T180 280 T160 310 Q150 280 140 250 T120 210 T100 180 T80 140 T90 100 T120 60 Z"
                  fill="#EDE8DF"
                  stroke="#D3CDC2"
                  strokeWidth="2"
                />

                {/* Major Highway Corridors */}
                <path d="M150 70 L170 120 L160 180 L180 250" stroke="#7DD3FC" strokeWidth="2.5" strokeDasharray="4 4" />
                <path d="M170 120 L230 140 L210 210" stroke="#7DD3FC" strokeWidth="2.5" strokeDasharray="4 4" />
                <path d="M170 120 L120 150 L140 220" stroke="#7DD3FC" strokeWidth="2.5" strokeDasharray="4 4" />

                {/* City Pins */}
                <circle cx="150" cy="70" r="5" fill="#0284C7" />
                <text x="158" y="73" fill="#334155" fontSize="9" fontWeight="bold">MANALI / SHIMLA</text>

                <circle cx="170" cy="120" r="7" fill="#0284C7" stroke="white" strokeWidth="2" />
                <text x="182" y="124" fill="#0F172A" fontSize="12" fontWeight="900">DELHI</text>

                <circle cx="130" cy="140" r="5" fill="#0284C7" />
                <text x="75" y="144" fill="#334155" fontSize="9" fontWeight="bold">JAIPUR</text>

                <circle cx="225" cy="140" r="5" fill="#0284C7" />
                <text x="233" y="143" fill="#334155" fontSize="9" fontWeight="bold">LUCKNOW</text>

                <circle cx="160" cy="180" r="5" fill="#0284C7" />
                <text x="168" y="184" fill="#334155" fontSize="9" fontWeight="bold">INDORE</text>

                <circle cx="130" cy="220" r="5" fill="#0284C7" />
                <text x="85" y="224" fill="#334155" fontSize="9" fontWeight="bold">PUNE / GOA</text>

                <circle cx="180" cy="250" r="5" fill="#0284C7" />
                <text x="188" y="254" fill="#334155" fontSize="9" fontWeight="bold">BANGALORE</text>
              </svg>

              {/* Emerging Luxury Bus Graphic */}
              <div className="absolute -bottom-2 -right-2 sm:right-2 w-48 sm:w-56 drop-shadow-2xl">
                <img
                  src="/media/ramdalal_hero.jpg"
                  alt="Ram Dalal Luxury Coach Bus"
                  className="w-full h-24 sm:h-28 object-cover rounded-xl border-2 border-white shadow-xl"
                />
              </div>
            </div>
          </div>

          {/* Right: Section Titles & 4x3 Destinations Grid */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Title Header */}
            <div className="mb-8">
              <span className="block text-2xl sm:text-3xl font-light text-slate-800 tracking-wider uppercase font-sans">
                OUR TOP
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 uppercase tracking-tight">
                DESTINATIONS
              </h2>
            </div>

            {/* 4x3 Pills Grid matching Screenshot 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
              {topDestinations.map((route, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRoute(route.from, route.to)}
                  className="px-3 py-3 rounded-2xl bg-[#F4EFE6] hover:bg-[#EAE3D6] active:scale-95 text-slate-900 font-bold text-xs text-center transition-all shadow-2xs border border-amber-900/5 cursor-pointer truncate"
                  title={`Book ${route.from} to ${route.to}`}
                >
                  {route.from} - {route.to}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. "POPULAR DESTINATIONS" Photo Cards (Screenshot 1) */}
      <section className="w-full py-16 px-4 sm:px-8 bg-[#FAF7F2] border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          {/* Centered Heading */}
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 uppercase tracking-tight text-center mb-10">
            POPULAR DESTINATIONS
          </h2>

          {/* 4 Cards Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {popularDestinations.map((dest, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setDestination(dest.name);
                  window.scrollTo({ top: 100, behavior: 'smooth' });
                }}
                className="group flex flex-col items-start cursor-pointer"
              >
                {/* Card Photo Frame with rounded-3xl corners */}
                <div className="w-full aspect-square rounded-[28px] overflow-hidden bg-slate-200 shadow-md transition-transform duration-300 group-hover:scale-[1.02] border border-slate-200/60">
                  <img
                    src={dest.image}
                    alt={dest.alt}
                    className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                  />
                </div>

                {/* City Name below photo */}
                <span className="mt-3.5 text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#D32F2F] transition-colors">
                  {dest.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full bg-[#181920] text-slate-400 py-12 px-4 sm:px-8 mt-auto text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
              Ram Dalal Holidays
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Premium Intercity Volvo & Sleeper Coach Fleet • AIS-140 Live GPS Telematics Enabled
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-300 font-semibold">
            <a href="#about" className="hover:text-white transition-colors">About Us</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <button
              type="button"
              onClick={() => setShowTrackerModal(true)}
              className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              Live Bus GPS Tracker
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© 2026 Ram Dalal Holidays. All rights reserved.</p>
          <p>Connecting Destinations and Dreams • Support: 9953731731</p>
        </div>
      </footer>

      {/* 6. Interactive PNR Live Tracker Modal */}
      {showTrackerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#D32F2F] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                  Ram Dalal Holidays
                </span>
                <span className="text-white/80 text-xs font-semibold">• Live Bus Tracker</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackerModal(false)}
                className="p-1 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Enter your booking PNR number to access real-time vehicle speed, route progression, and live GPS telematics.
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
                      className="w-full h-12 pl-11 pr-4 rounded-lg border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 text-base font-bold uppercase tracking-wider focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]"
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
                  className="w-full h-12 rounded-lg bg-[#D32F2F] hover:bg-[#B71C1C] active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Connecting to GPS Telematics...</span>
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
