import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JourneyStatus } from '../types/index.js';
import { LogOut, MapPin, Phone, User, ChevronDown } from 'lucide-react';
import { api } from '../services/api.js';

interface TopNavigationProps {
  status?: JourneyStatus;
  onOpenTripTracker?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ status, onOpenTripTracker }) => {
  const navigate = useNavigate();

  const handleExitPnr = () => {
    api.clearPnrToken();
    navigate('/');
  };

  return (
    <header className="w-full bg-[#73D200] text-slate-900 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
        {/* Left: FLIXBUS Logo & Main Nav */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/" className="flex items-center group cursor-pointer focus:outline-none">
            {/* Iconic FLIXBUS wordmark */}
            <span className="text-white font-black text-2xl sm:text-3xl tracking-tight uppercase select-none font-sans flex items-center">
              FLIXBUS
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-semibold text-slate-900">
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-white transition-colors">
              <span>Plan Your Journey</span>
              <ChevronDown className="w-4 h-4 text-slate-800 group-hover:text-white transition-transform group-hover:rotate-180" />
            </div>

            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-white transition-colors">
              <span>Service</span>
              <ChevronDown className="w-4 h-4 text-slate-800 group-hover:text-white transition-transform group-hover:rotate-180" />
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenTripTracker) {
                  onOpenTripTracker();
                } else {
                  navigate('/');
                }
              }}
              className="hover:text-white transition-colors font-semibold flex items-center gap-1 cursor-pointer"
            >
              Trip Tracker
            </button>

            <a href="#help" className="hover:text-white transition-colors">
              Help
            </a>

            <a
              href="tel:8404855555"
              className="flex items-center gap-1.5 hover:text-white transition-colors text-xs sm:text-sm font-bold"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Call to book 8404855555</span>
            </a>
          </nav>
        </div>

        {/* Right Actions: Language Selector & Sign In */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Status Indicator (Shown when actively on tracking page) */}
          {status && status !== 'idle' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-slate-900 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-800 text-xs">Live Telemetry</span>
            </div>
          )}

          {/* Country / Language Selector */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-white transition-colors cursor-pointer"
          >
            {/* India Flag circle */}
            <span className="w-5 h-5 rounded-full overflow-hidden border border-white/60 flex flex-col shadow-2xs shrink-0">
              <span className="h-1/3 bg-[#FF9933] w-full" />
              <span className="h-1/3 bg-white w-full flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-[#000080]" />
              </span>
              <span className="h-1/3 bg-[#128807] w-full" />
            </span>
            <span>EN</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-800" />
          </button>

          {/* User Sign In / Register */}
          <button
            type="button"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900/10 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-900" />
            </div>
            <span className="hidden sm:inline">Register / Sign In</span>
          </button>
        </div>
      </div>
    </header>
  );
};
