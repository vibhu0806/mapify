import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JourneyStatus } from '../types/index.js';
import { LogOut } from 'lucide-react';
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
          label: 'AWAITING DEPARTURE',
          dotClass: 'bg-primary-dim',
          textClass: 'text-primary-muted',
          pulse: false,
        };
      case 'running':
        return {
          label: 'IN TRANSIT',
          dotClass: 'bg-accent-green',
          textClass: 'text-accent-green',
          pulse: true,
        };
      case 'paused':
        return {
          label: 'BUS HALTED / IDLING',
          dotClass: 'bg-accent-amber',
          textClass: 'text-accent-amber',
          pulse: false,
        };
      case 'completed':
        return {
          label: 'JOURNEY COMPLETED',
          dotClass: 'bg-accent-green',
          textClass: 'text-primary',
          pulse: false,
        };
      default:
        return {
          label: 'INITIALIZING',
          dotClass: 'bg-primary-dim',
          textClass: 'text-primary-dim',
          pulse: false,
        };
    }
  };

  const statusConfig = getStatusDisplay();

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-background/85 backdrop-blur-md border-b border-border-subtle z-20 px-6 flex items-center justify-between transition-colors">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform" />
          <span className="font-mono text-xs tracking-widest text-primary uppercase font-semibold">
            TELEMETRY
          </span>
          <span className="text-border-muted text-xs">/</span>
          <span className="text-xs text-primary-muted font-sans hidden sm:inline tracking-wide">
            JAIPUR → DEHRADUN
          </span>
        </Link>
      </div>

      {/* Central Restrained Status Indicator */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border-subtle">
        <div className="relative flex items-center justify-center w-2 h-2">
          {statusConfig.pulse && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotClass}`} />
        </div>
        <span className={`font-mono text-[11px] tracking-widest uppercase font-medium ${statusConfig.textClass}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleExitPnr}
          title="Exit tracking session and return to PNR entry"
          className="text-xs font-mono tracking-wider text-primary-dim hover:text-primary transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded border border-transparent hover:border-border-subtle hover:bg-surface cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">EXIT</span>
        </button>
      </div>
    </header>
  );
};
