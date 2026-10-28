import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JourneyStatus } from '../types/index.js';
import { MapPin, Phone, Mail, User, ChevronDown, Radio } from 'lucide-react';
import { api } from '../services/api.js';

interface TopNavigationProps {
  status?: JourneyStatus;
  onOpenTripTracker?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ status, onOpenTripTracker }) => {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white text-slate-800 border-b border-slate-100 sticky top-0 z-50 shadow-2xs">
      {/* Topmost Contact & Store Bar */}
      <div className="w-full bg-[#FAF7F2] border-b border-slate-200/60 px-4 sm:px-8 py-1.5 text-xs text-slate-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Contact Info */}
          <div className="flex items-center gap-4 sm:gap-6 font-medium">
            <a
              href="mailto:ramdalaltravels@gmail.com"
              className="flex items-center gap-1.5 hover:text-red-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>ramdalaltravels@gmail.com</span>
            </a>
            <a
              href="tel:9953731731"
              className="flex items-center gap-1.5 hover:text-red-700 transition-colors font-bold text-slate-900"
            >
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              <span>9953731731</span>
            </a>
          </div>

          {/* Right Store Badges & Agent Login */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Google Play Small Badge */}
            <div className="flex items-center gap-1.5 bg-black text-white px-2.5 py-1 rounded-sm text-[10px] font-bold cursor-pointer hover:bg-slate-800 transition-colors">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.94 1.94 0 0 1-.22-.96V2.774c0-.36.08-.7.22-.96zm11.3 11.3l2.25 2.25-11.66 6.64 9.41-8.89zm0-2.228L5.5 1.996l11.66 6.64-2.251 2.25zM15.89 12l2.67-2.67 3.32 1.89c.94.54.94 1.42 0 1.96l-3.32 1.89L15.89 12z" />
              </svg>
              <span>Google Play</span>
            </div>

            {/* App Store Small Badge */}
            <div className="flex items-center gap-1.5 bg-black text-white px-2.5 py-1 rounded-sm text-[10px] font-bold cursor-pointer hover:bg-slate-800 transition-colors">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.02.63-2.67 1.39-.58.67-.99 1.77-.85 2.81 1.04.08 2.06-.54 2.58-1.27z" />
              </svg>
              <span>App Store</span>
            </div>

            <a
              href="#agent"
              className="text-slate-800 hover:text-red-600 font-semibold transition-colors flex items-center gap-1"
            >
              <User className="w-3 h-3 text-slate-500" />
              <span>Agent Login</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Logo: Ram Dalal Holidays */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* Logo Icon Graphic */}
          <div className="relative w-12 h-10 flex items-center justify-center">
            {/* Sun & Sea / Hills Emblem */}
            <div className="w-11 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-orange-400 to-amber-300 relative overflow-hidden shadow-xs flex items-center justify-center">
              {/* Palm trees silhouette */}
              <span className="absolute bottom-1 right-2 text-emerald-800 text-sm">🌴</span>
              {/* Green waves */}
              <div className="absolute -bottom-1 inset-x-0 h-3 bg-emerald-600 rounded-t-full opacity-90" />
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[#D32F2F] group-hover:text-[#B71C1C] transition-colors"
              style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive, sans-serif" }}
            >
              Ram Dalal Holidays
            </span>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-6 sm:gap-10 text-sm font-semibold">
          <Link
            to="/"
            className="text-[#D32F2F] font-bold border-b-2 border-[#D32F2F] pb-0.5 transition-colors"
          >
            Home
          </Link>
          <a
            href="#about"
            className="text-slate-700 hover:text-[#D32F2F] transition-colors"
          >
            About Us
          </a>
          <a
            href="#contact"
            className="text-slate-700 hover:text-[#D32F2F] transition-colors"
          >
            Contact
          </a>

          {/* Direct Trip Tracker / PNR Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenTripTracker) {
                onOpenTripTracker();
              } else {
                navigate('/');
              }
            }}
            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#D32F2F] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Track Bus (PNR)</span>
          </button>

          {/* Live Status Pill when on Tracking Page */}
          {status && status !== 'idle' && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Telemetry Active</span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
