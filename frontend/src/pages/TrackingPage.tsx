import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourneySync } from '../hooks/useJourneySync.js';
import { TopNavigation } from '../components/TopNavigation.js';
import { TelemetryStrip } from '../components/TelemetryStrip.js';
import { LeafletMapTracker } from '../map/LeafletMapTracker.js';
import { api } from '../services/api.js';
import { List, X, Clock, CheckCircle2, ExternalLink } from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { telemetry, routeData, interpolated, loading, error } = useJourneySync(3500);
  const [followMode, setFollowMode] = useState(false);
  const [showStopsDrawer, setShowStopsDrawer] = useState(false);
  const [showAdBanner, setShowAdBanner] = useState(true);

  // Guard: require valid session
  useEffect(() => {
    const pnrToken = api.getPnrToken();
    const adminToken = sessionStorage.getItem('jaipur_dehradun_admin_token');

    if (!pnrToken && !adminToken) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const status = telemetry?.journey.status || 'running';
  const stops = routeData?.stops || [];
  const currentDist = interpolated.distanceTravelledMeters;

  return (
    <div className="relative h-screen w-screen bg-slate-100 overflow-hidden select-none font-sans">
      {/* Top Header */}
      <TopNavigation status={status} />

      {/* Main Map Viewport */}
      <main className="h-full w-full">
        <LeafletMapTracker
          routeData={routeData}
          vehiclePosition={interpolated.vehiclePosition}
          vehicleHeading={interpolated.vehicleHeading}
          followMode={followMode}
          onToggleFollow={() => setFollowMode(prev => !prev)}
        />
      </main>

      {/* Side/Bottom Sponsored Ad Card */}
      {showAdBanner && (
        <div className="absolute bottom-32 sm:bottom-36 right-4 z-[1000] max-w-[280px] sm:max-w-[320px] bg-white/95 backdrop-blur-md border border-slate-300 p-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 mb-1 border-b border-slate-100">
            <span className="font-semibold text-slate-600">Sponsored · irctctourism.com</span>
            <button
              onClick={() => setShowAdBanner(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 text-xs font-bold cursor-pointer"
              title="Close Ad"
            >
              ✕
            </button>
          </div>
          <a
            href="https://www.irctctourism.com/bharatgaurav"
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded border border-amber-200 hover:opacity-95 transition-opacity"
            title="Shri Ramayana Yatra - Bharat Gaurav Deluxe AC Tourist Train"
          >
            <img
              src="/media/promotions/ramayana_yatra.png"
              alt="Shri Ramayana Yatra"
              className="w-full h-auto object-contain"
            />
          </a>
        </div>
      )}

      {/* Stops Drawer Toggle */}
      <div className="absolute left-4 top-20 sm:top-24 z-[1000]">
        <button
          type="button"
          onClick={() => setShowStopsDrawer(prev => !prev)}
          className={`px-3.5 py-2 rounded-none text-xs font-bold flex items-center gap-2 border shadow-xs transition-all ${
            showStopsDrawer
              ? 'bg-[#00529B] text-white border-[#00529B]'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-400'
          }`}
        >
          <List className="w-4 h-4 text-[#00529B]" />
          <span>STOPS & TIMETABLE</span>
        </button>
      </div>

      {/* Stops Drawer */}
      {showStopsDrawer && (
        <aside className={`absolute bottom-28 left-4 w-[92vw] sm:w-[380px] bg-white border border-slate-300 shadow-xl z-[1001] flex flex-col overflow-hidden ${showAdBanner ? 'top-26 sm:top-30' : 'top-20 sm:top-24'}`}>
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                JAIPUR ➔ DEHRADUN CORRIDOR
              </div>
              <div className="text-sm font-bold text-slate-900">
                Jaipur ➔ Dehradun (RJ-14-PB-4289)
              </div>
            </div>
            <button
              onClick={() => setShowStopsDrawer(false)}
              className="p-1 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {stops.map((stop, idx) => {
              const isPassed = currentDist >= stop.distanceMeters;
              const isNext = !isPassed && (idx === 0 || (currentDist < stop.distanceMeters && currentDist >= stops[idx - 1].distanceMeters));

              return (
                <div
                  key={stop.id}
                  className={`p-2.5 border text-xs ${
                    isNext
                      ? 'bg-amber-50 border-amber-400 text-slate-900'
                      : isPassed
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      STOP {stop.sequence} • {(stop.distanceMeters / 1000).toFixed(1)} KM
                    </span>
                    {isPassed ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PASSED
                      </span>
                    ) : isNext ? (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white font-mono text-[9px] font-bold">
                        NEXT STOP
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">SCHEDULED</span>
                    )}
                  </div>

                  <div className={`font-bold ${isPassed ? 'text-slate-500' : 'text-slate-900'}`}>
                    {stop.name}
                  </div>
                  <div className="text-[10px] text-slate-500">{stop.landmark}</div>

                  {stop.scheduledHaltMinutes > 0 && (
                    <div className="mt-1 pt-1 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-700 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>{stop.scheduledHaltMinutes} Mins Scheduled Halt</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Telemetry Strip Dock */}
      <TelemetryStrip
        telemetry={telemetry}
        interpolated={interpolated}
      />

      {/* Error Notice */}
      {error && !error.toLowerCase().includes('unauthorized') && (
        <div className="absolute top-20 right-6 z-30 px-3 py-1.5 bg-red-50 border border-red-300 text-red-800 text-xs shadow-xs">
          {error}
        </div>
      )}
    </div>
  );
};
