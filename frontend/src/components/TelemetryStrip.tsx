import React from 'react';
import { InterpolatedState, JourneyTelemetry } from '../types/index.js';
import { formatDuration, formatDistance, formatETA } from '../utils/interpolation.js';

interface TelemetryStripProps {
  telemetry: JourneyTelemetry | null;
  interpolated: InterpolatedState;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  telemetry,
  interpolated,
}) => {
  const status = telemetry?.journey.status || 'idle';
  const progressPercent = (interpolated.progress * 100).toFixed(1);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl z-20 flex flex-col gap-2">
      {/* Upper Micro Telemetry Bar: Live AIS-140 GPS Feed */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-[#0F0F0F]/90 backdrop-blur-md border border-[#222222] text-[10px] font-mono text-[#858585] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-[#10B981] animate-pulse' : 'bg-[#666666]'}`} />
            <span className="text-[#F5F5F5] font-semibold tracking-wider">RJ-14-PB-4289</span>
            <span className="text-[#555555] hidden sm:inline">|</span>
            <span className="text-[#A3A3A3] hidden sm:inline">AIS-140 GPS</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[#737373]">
            <span>SPEED:</span>
            <span className="text-[#10B981] font-semibold">
              {status === 'running' ? `${interpolated.currentSpeedKmh} KM/H` : status === 'paused' ? '0 KM/H (HALT)' : '0 KM/H'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Next Stop Indicator */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-[#555555] hidden sm:inline">NEXT:</span>
            <span className="text-[#E5E5E5] font-sans font-medium truncate max-w-[160px] sm:max-w-[220px]">
              {interpolated.nextStopName}
            </span>
            {interpolated.nextStopDistanceMeters > 0 && status !== 'completed' && (
              <span className="text-[#737373] font-mono">
                ({formatDistance(interpolated.nextStopDistanceMeters)})
              </span>
            )}
          </div>

          <div className="h-3 w-[1px] bg-[#333333] hidden sm:block" />

          {/* Realistic GPS Telemetry Lag Counter */}
          <div className="flex items-center gap-1 text-[#666666] font-mono">
            <span className="hidden sm:inline">PING:</span>
            <span className="text-[#A3A3A3]">
              {status === 'running' ? `${interpolated.lastPingSecondsAgo}s ago` : 'Locked'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Authoritative Metrics Dock */}
      <div className="relative bg-surface/95 backdrop-blur-md border border-border-subtle rounded-lg shadow-2xl overflow-hidden transition-all duration-300">
        {/* Subtle 2px progress bar at the very top of the dock */}
        <div className="h-[2px] w-full bg-border-muted/30">
          <div
            className="h-full bg-accent-green transition-all duration-200 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          {/* Origin -> Destination Route Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-primary-dim uppercase">
                EXPRESS CORRIDOR
              </div>
              <div className="text-sm font-medium tracking-tight text-primary flex items-center gap-2">
                <span>JAIPUR</span>
                <span className="text-primary-dim text-xs">→</span>
                <span>DEHRADUN</span>
              </div>
            </div>

            {/* Mobile Progress Metric */}
            <div className="text-right md:hidden font-mono text-xs text-primary-muted">
              {progressPercent}%
            </div>
          </div>

          <div className="hidden md:block h-7 w-[1px] bg-border-subtle" />

          {/* Key Authoritative Telemetry Columns */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10 w-full md:w-auto text-center md:text-left">
            {/* Elapsed Time */}
            <div>
              <div className="text-[10px] font-mono tracking-widest text-primary-dim uppercase">
                ELAPSED
              </div>
              <div className="font-mono text-sm sm:text-base text-primary font-medium">
                {formatDuration(interpolated.currentElapsedSeconds)}
              </div>
            </div>

            {/* Distance Remaining */}
            <div>
              <div className="text-[10px] font-mono tracking-widest text-primary-dim uppercase">
                REMAINING
              </div>
              <div className="font-mono text-sm sm:text-base text-primary font-medium">
                {status === 'completed'
                  ? '0.0 km'
                  : formatDistance(interpolated.distanceRemainingMeters)}
              </div>
            </div>

            {/* Estimated Arrival (ETA) */}
            <div>
              <div className="text-[10px] font-mono tracking-widest text-primary-dim uppercase">
                {status === 'completed' ? 'COMPLETED' : 'EST. ARRIVAL'}
              </div>
              <div className="font-mono text-sm sm:text-base text-primary font-medium">
                {status === 'idle'
                  ? '--:--'
                  : status === 'completed'
                  ? 'ARRIVED'
                  : formatETA(telemetry?.simulation.etaTimestamp || null)}
              </div>
            </div>
          </div>

          <div className="hidden md:block h-7 w-[1px] bg-border-subtle" />

          {/* Desktop Progress Percentage */}
          <div className="hidden md:flex flex-col items-end min-w-[70px]">
            <div className="text-[10px] font-mono tracking-widest text-primary-dim uppercase">
              JOURNEY
            </div>
            <div className="font-mono text-base font-semibold text-primary">
              {progressPercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
