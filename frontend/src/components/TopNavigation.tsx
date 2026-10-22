import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JourneyStatus } from '../types/index.js';
import { LogOut, MapPin, Phone, User, ChevronDown } from 'lucide-react';
import { api } from '../services/api.js';

interface TopNavigationProps {
  status: JourneyStatus;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ status }) => {
  const navigate = useNavigate();

  const handleExitPnr = () => {
    api.clearPnrToken();
    navigate('/');
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'idle':
        return {
          label: 'Awaiting Departure',
          dotClass: 'bg-slate-400',
          textClass: 'text-slate-600',
          bgClass: 'bg-slate-100 border-slate-200',
          pulse: false,
        };
      case 'running':
        return {
          label: 'In Transit • On Time',
          dotClass: 'bg-emerald-500',
          textClass: 'text-emerald-700',
          bgClass: 'bg-emerald-50 border-emerald-200',
          pulse: true,
        };
      case 'paused':
        return {
          label: 'Scheduled Halt',
          dotClass: 'bg-amber-500',
          textClass: 'text-amber-700',
          bgClass: 'bg-amber-50 border-amber-200',
          pulse: false,
        };
      case 'completed':
        return {
          label: 'Journey Completed',
          dotClass: 'bg-blue-600',
          textClass: 'text-blue-700',
          bgClass: 'bg-blue-50 border-blue-200',
          pulse: false,
        };
      default:
        return {
          label: 'Connecting GPS...',
          dotClass: 'bg-slate-400',
          textClass: 'text-slate-500',
          bgClass: 'bg-slate-100 border-slate-200',
          pulse: false,
        };
    }
  };

  const statusConfig = getStatusDisplay();

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Telemetry Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#108C38] text-white shadow-xs">
              <MapPin className="w-5 h-5 fill-white text-[#108C38]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#108C38] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline">
                <span className="text-[#00529B] font-extrabold text-2xl tracking-tight">interstate travel</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                Maharani Travels Fleet Telematics
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
          <a href="#club" className="hover:text-[#00529B] flex items-center gap-1 transition-colors">
            <span>👑</span> Interstate Club
          </a>
          <a href="#tickets" className="hover:text-[#00529B] transition-colors">
            Bus Tickets
          </a>
          <a href="#group" className="hover:text-[#00529B] transition-colors">
            Group Booking
          </a>
          <a href="#dataroom" className="hover:text-[#00529B] flex items-center gap-1 transition-colors">
            Data Room <ChevronDown className="w-3.5 h-3.5" />
          </a>
        </nav>

        {/* Contact & Status Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Status Indicator */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${statusConfig.bgClass}`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            <span className={statusConfig.textClass}>{statusConfig.label}</span>
          </div>

          <a
            href="tel:04843540685"
            className="flex items-center gap-2 bg-[#108C38] hover:bg-[#0E7A31] text-white px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
            <span className="hidden sm:inline">Call to book</span>
            <span>04843540685</span>
          </a>

          <button
            type="button"
            className="flex items-center gap-1.5 bg-[#108C38] hover:bg-[#0E7A31] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    </header>
  );
};
