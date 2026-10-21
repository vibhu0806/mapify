import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourneySync } from '../hooks/useJourneySync.js';
import { TopNavigation } from '../components/TopNavigation.js';
import { TelemetryStrip } from '../components/TelemetryStrip.js';
import { LeafletMapTracker } from '../map/LeafletMapTracker.js';
import { api } from '../services/api.js';
import { List, X, Clock, CheckCircle2 } from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { telemetry, routeData, interpolated, loading, error } = useJourneySync(3500);
  const [followMode, setFollowMode] = useState(false);
  const [showStopsDrawer, setShowStopsDrawer] = useState(false);

  // Guard: require valid PNR session or Admin token
  useEffect(() => {
    const pnrToken = api.getPnrToken();
    const adminToken = sessionStorage.getItem('jaipur_dehradun_admin_token');

    if (!pnrToken && !adminToken) {
      navigate('/');
      return;
    }

    if (pnrToken) {
      api.verifyPnrSession(pnrToken).then((valid) => {
        if (!valid && !adminToken) {
          api.clearPnrToken();
          navigate('/');
        }
      });
    }
  }, [navigate]);

  // If telemetry polling returns 401 Unauthorized, redirect to PNR entry
  useEffect(() => {
    if (error && (error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('pnr'))) {
      api.clearPnrToken();
      navigate('/');
    }
  }, [error, navigate]);

  const status = telemetry?.journey.status || 'idle';
  const stops = routeData?.stops || [];
  const currentDist = interpolated.distanceTravelledMeters;

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden select-none font-sans">
      {/* Minimal Top Header */}
      <TopNavigation status={status} />

      {/* Main Map Viewport (Leaflet + OpenStreetMap + OSRM Route) */}
      <main className="h-full w-full">
        <LeafletMapTracker
          routeData={routeData}
          vehiclePosition={interpolated.vehiclePosition}
          vehicleHeading={interpolated.vehicleHeading}
          followMode={followMode}
          onToggleFollow={() => setFollowMode(prev => !prev)}
        />
      </main>

      {/* Floating Toggle for Route Stops Schedule */}
      <div className="absolute top-20 left-4 z-[1000]">
        <button
          type="button"
          onClick={() => setShowStopsDrawer(prev => !prev)}
          className={`px-3 py-2 rounded-md font-mono text-xs flex items-center gap-2 border shadow-lg transition-all ${
            showStopsDrawer
              ? 'bg-[#F5F5F5] text-[#0A0A0A] border-[#FFFFFF]'
              : 'bg-[#121212]/90 hover:bg-[#1C1C1C] text-[#F5F5F5] border-[#2E2E2E] backdrop-blur-md'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">BUS STOPS & SCHEDULE</span>
          <span className="sm:hidden">STOPS</span>
        </button>
      </div>

      {/* Route Stops Slide-out Panel */}
      {showStopsDrawer && (
        <aside className="absolute top-16 bottom-28 left-4 w-[92vw] sm:w-[380px] bg-[#0E0E0E]/95 backdrop-blur-xl border border-[#262626] rounded-xl shadow-2xl z-[1001] flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200">
          <div className="p-4 border-b border-[#222222] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider font-semibold">
                SCHEDULED ROUTE HALTS
              </div>
              <div className="text-sm font-semibold text-[#F5F5F5]">
                Jaipur ⇄ Dehradun Express
              </div>
            </div>
            <button
              onClick={() => setShowStopsDrawer(false)}
              className="p-1.5 rounded-md hover:bg-[#1E1E1E] text-[#888888] hover:text-[#FFFFFF] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {stops.map((stop, idx) => {
              const isPassed = currentDist >= stop.distanceMeters;
              const isNext = !isPassed && (idx === 0 || currentDist < stop.distanceMeters && (idx === 0 || currentDist >= stops[idx - 1].distanceMeters));

              return (
                <div
                  key={stop.id}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isNext
                      ? 'bg-[#15231B] border-[#10B981]/50 text-[#F5F5F5]'
                      : isPassed
                      ? 'bg-[#121212] border-[#1F1F1F] text-[#737373]'
                      : 'bg-[#121212] border-[#222222] text-[#A3A3A3]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                      STOP {stop.sequence} • {(stop.distanceMeters / 1000).toFixed(1)} KM
                    </span>
                    {isPassed ? (
                      <span className="flex items-center gap-1 text-[10px] text-[#10B981] font-mono font-medium">
                        <CheckCircle2 className="w-3 h-3" /> PASSED
                      </span>
                    ) : isNext ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#10B981] text-[#0A0A0A] font-mono text-[10px] font-bold">
                        NEXT STOP
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#555555]">SCHEDULED</span>
                    )}
                  </div>

                  <div className={`font-semibold text-sm ${isPassed ? 'text-[#888888]' : 'text-[#FFFFFF]'}`}>
                    {stop.name}
                  </div>
                  <div className="text-[11px] text-[#666666] mt-0.5">{stop.landmark}</div>

                  {stop.scheduledHaltMinutes > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-[#1C1C1C] flex items-center gap-1.5 font-mono text-[10px] text-[#F59E0B]">
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

      {/* Authoritative Minimal Telemetry Strip */}
      <TelemetryStrip
        telemetry={telemetry}
        interpolated={interpolated}
      />

      {/* Loading Overlay (only on initial cold start) */}
      {loading && !routeData && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-primary-dim border-t-accent-green animate-spin" />
            <span className="font-mono text-xs tracking-widest text-primary-muted uppercase">
              CONNECTING TO VEHICLE TELEMATICS...
            </span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !error.toLowerCase().includes('unauthorized') && (
        <div className="absolute top-16 right-6 z-30 px-3 py-1.5 rounded bg-accent-red/10 border border-accent-red/30 text-accent-red font-mono text-xs shadow-md">
          {error}
        </div>
      )}
    </div>
  );
};
