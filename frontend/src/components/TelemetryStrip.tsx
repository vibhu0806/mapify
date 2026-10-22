import React from 'react';
import { InterpolatedState, JourneyTelemetry } from '../types/index.js';
import { formatDuration, formatDistance, formatETA } from '../utils/interpolation.js';
import { Gauge, Navigation } from 'lucide-react';

interface TelemetryStripProps {
  telemetry: JourneyTelemetry | null;
  interpolated: InterpolatedState;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  telemetry,
  interpolated,
}) => {
  const status = telemetry?.journey.status || 'running';
  const progressPercent = (interpolated.progress * 100).toFixed(1);

  return (
    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-20 flex flex-col gap-2 font-sans select-none">
      {/* Upper Micro Telemetry Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-sans text-slate-600 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-[#108C38] animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[#00529B] font-mono tracking-wider">
              {telemetry?.bus?.vehicleNumber || 'RJ-14-PB-4289'}
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-500 font-medium text-[11px] hidden sm:inline">
              {telemetry?.bus?.operator || 'Maharani Travels'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs">
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            <span>Speed:</span>
            <span className="text-emerald-700 font-bold font-mono">
              {status === 'running' ? `${interpolated.currentSpeedKmh} km/h` : '0 km/h'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Navigation className="w-3 h-3 text-[#00529B] hidden sm:inline" />
            <span className="text-slate-400 hidden sm:inline">Next Stop:</span>
            <span className="text-slate-800 font-bold truncate max-w-[150px] sm:max-w-[200px]">
              {interpolated.nextStopName}
            </span>
            {interpolated.nextStopDistanceMeters > 0 && status !== 'completed' && (
              <span className="text-slate-500 font-mono text-[11px]">
                ({formatDistance(interpolated.nextStopDistanceMeters)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Authoritative Metrics Dock */}
      <div className="relative bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl overflow-hidden transition-all duration-300">
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full bg-[#108C38] transition-all duration-200 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-8">
          {/* Origin -> Destination Corridor */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                JAIPUR ➔ DEHRADUN CORRIDOR
              </div>
              <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Jaipur</span>
                <span className="text-[#00529B]">➔</span>
                <span>Dehradun</span>
              </div>
            </div>

            <div className="md:hidden font-mono text-xs font-bold text-[#108C38] bg-emerald-50 px-2 py-1">
              {progressPercent}%
            </div>
          </div>

          <div className="hidden md:block h-8 w-[1px] bg-slate-200" />

          {/* Metrics Columns */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10 w-full md:w-auto text-center md:text-left">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ELAPSED TIME
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-slate-800">
                {formatDuration(interpolated.currentElapsedSeconds)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                REMAINING
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-slate-800">
                {status === 'completed'
                  ? '0.0 km'
                  : formatDistance(interpolated.distanceRemainingMeters)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {status === 'completed' ? 'ARRIVED' : 'EST. ARRIVAL'}
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-[#00529B]">
                {status === 'idle'
                  ? '--:--'
                  : status === 'completed'
                  ? 'COMPLETED'
                  : formatETA(telemetry?.simulation.etaTimestamp || null)}
              </div>
            </div>
          </div>

          <div className="hidden md:block h-8 w-[1px] bg-slate-200" />

          <div className="hidden md:flex flex-col items-end min-w-[70px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              JOURNEY
            </div>
            <div className="font-mono text-lg font-extrabold text-[#108C38]">
              {progressPercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
