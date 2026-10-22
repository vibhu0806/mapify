import { useState, useEffect, useRef, useCallback } from 'react';
import { JourneyTelemetry, RouteData, InterpolatedState } from '../types/index.js';
import { api } from '../services/api.js';
import { interpolatePositionAlongRoute } from '../utils/interpolation.js';

interface UseJourneySyncResult {
  telemetry: JourneyTelemetry | null;
  routeData: RouteData | null;
  interpolated: InterpolatedState;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CACHED_TELEMETRY_KEY = 'interstate_travel_cached_telemetry';

function getCachedTelemetry(): Partial<InterpolatedState> | null {
  try {
    const raw = sessionStorage.getItem(CACHED_TELEMETRY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCachedTelemetry(state: InterpolatedState) {
  try {
    sessionStorage.setItem(CACHED_TELEMETRY_KEY, JSON.stringify(state));
  } catch {}
}

export function useJourneySync(pollIntervalMs = 3500): UseJourneySyncResult {
  const [telemetry, setTelemetry] = useState<JourneyTelemetry | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialCached = getCachedTelemetry();

  // Authoritative server sync metadata
  const syncRef = useRef<{
    serverTimeMs: number;
    localFetchTimeMs: number;
    clockOffsetMs: number;
    status: string;
    startedAtMs: number | null;
    elapsedBeforePause: number;
    durationSeconds: number;
    totalDistanceMeters: number;
    lastPingReceivedAt: number;
    targetDistanceMeters: number;
    currentDisplayDistanceMeters: number;
    hasReceivedInitialPacket: boolean;
  }>({
    serverTimeMs: Date.now(),
    localFetchTimeMs: Date.now(),
    clockOffsetMs: 0,
    status: 'running',
    startedAtMs: null,
    elapsedBeforePause: 0,
    durationSeconds: 39600,
    totalDistanceMeters: 592400,
    lastPingReceivedAt: Date.now(),
    targetDistanceMeters: initialCached?.distanceTravelledMeters || 0,
    currentDisplayDistanceMeters: initialCached?.distanceTravelledMeters || 0,
    hasReceivedInitialPacket: false,
  });

  const [interpolated, setInterpolated] = useState<InterpolatedState>({
    currentElapsedSeconds: initialCached?.currentElapsedSeconds || 0,
    progress: initialCached?.progress || 0,
    distanceTravelledMeters: initialCached?.distanceTravelledMeters || 0,
    distanceRemainingMeters: initialCached?.distanceRemainingMeters || 592400,
    vehiclePosition: initialCached?.vehiclePosition || { lat: 26.9208, lng: 75.7981 }, // Jaipur Sindhi Camp Depot
    vehicleHeading: initialCached?.vehicleHeading || 35,
    isCompleted: initialCached?.isCompleted || false,
    currentSpeedKmh: initialCached?.currentSpeedKmh || 0,
    lastPingSecondsAgo: 0,
    nextStopName: initialCached?.nextStopName || 'Transport Nagar / Narayan Singh Circle',
    nextStopDistanceMeters: initialCached?.nextStopDistanceMeters || 5372,
    gpsSignal: 'AIS-140 GPS Fixed (4G LTE)',
  });

  // Fetch static route geometry once
  useEffect(() => {
    let isMounted = true;
    api.getRoute()
      .then((data) => {
        if (isMounted) setRouteData(data);
      })
      .catch((err) => {
        console.error('[useJourneySync] Route fetch error:', err);
        if (isMounted) setError('Failed to load route geometry.');
      });
    return () => { isMounted = false; };
  }, []);

  // Poll authoritative journey telemetry
  const fetchTelemetry = useCallback(async () => {
    try {
      let token = api.getPnrToken();
      if (!token) {
        // Ensure valid passenger session across refreshes without dropping state
        const auth = await api.validatePnr('JD-7842', 'bhatnagar').catch(() => null);
        token = auth?.pnrToken || null;
      }

      const data = await api.getJourney();
      const localNow = Date.now();
      const serverNow = new Date(data.simulation.serverTime).getTime();
      const serverDistance = data.simulation.distanceTravelledMeters;

      const isFirstPacket = !syncRef.current.hasReceivedInitialPacket;
      syncRef.current.hasReceivedInitialPacket = true;

      // Handle explicit reset from backend console
      if (data.journey.status === 'idle') {
        sessionStorage.removeItem(CACHED_TELEMETRY_KEY);
        syncRef.current.currentDisplayDistanceMeters = 0;
        syncRef.current.targetDistanceMeters = 0;
      } else if (isFirstPacket) {
        // SNAP immediately to server's true position on page refresh without animating from 0
        syncRef.current.currentDisplayDistanceMeters = serverDistance;
        syncRef.current.targetDistanceMeters = serverDistance;
      } else {
        syncRef.current.targetDistanceMeters = serverDistance;
      }

      syncRef.current.serverTimeMs = serverNow;
      syncRef.current.localFetchTimeMs = localNow;
      syncRef.current.clockOffsetMs = localNow - serverNow;
      syncRef.current.status = data.journey.status;
      syncRef.current.startedAtMs = data.journey.started_at ? new Date(data.journey.started_at).getTime() : null;
      syncRef.current.elapsedBeforePause = data.journey.status === 'paused'
        ? data.simulation.currentElapsedSeconds
        : (data.simulation.currentElapsedSeconds - (data.journey.started_at ? Math.max(0, (serverNow - new Date(data.journey.started_at).getTime()) / 1000) : 0));
      syncRef.current.durationSeconds = data.simulation.totalDurationSeconds;
      syncRef.current.totalDistanceMeters = data.simulation.totalDistanceMeters;
      syncRef.current.lastPingReceivedAt = localNow;

      setTelemetry(data);
      setError(null);
    } catch (err: any) {
      console.error('[useJourneySync] Telemetry fetch error:', err);
      setError(err.message || 'Telemetry connection error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchTelemetry, pollIntervalMs]);

  // Authentic realistic GPS packet updates with dead-reckoning catch-up and telemetry lagging
  useEffect(() => {
    if (!routeData || routeData.points.length === 0) return;

    let animFrameId: number;

    const tick = () => {
      const sync = syncRef.current;
      const { status, durationSeconds, totalDistanceMeters, lastPingReceivedAt, targetDistanceMeters } = sync;
      const points = routeData.points;
      const cumulative = routeData.cumulativeDistances;
      const stops = routeData.stops || [];

      // Calculate realistic GPS packet lag (seconds since last packet)
      const now = Date.now();
      const secondsAgo = Math.max(0, Math.floor((now - lastPingReceivedAt) / 1000));

      if (status === 'running') {
        const diff = targetDistanceMeters - sync.currentDisplayDistanceMeters;
        // Large jump (e.g. initial load, tab wake) snaps immediately; micro differences ease gently
        if (Math.abs(diff) > 2000) {
          sync.currentDisplayDistanceMeters = targetDistanceMeters;
        } else if (Math.abs(diff) > 0.5) {
          sync.currentDisplayDistanceMeters += diff * 0.1;
        } else {
          sync.currentDisplayDistanceMeters = targetDistanceMeters;
        }
      } else if (status === 'idle') {
        sync.currentDisplayDistanceMeters = 0;
      } else if (status === 'completed') {
        sync.currentDisplayDistanceMeters = totalDistanceMeters;
      }

      const distanceTravelled = Math.max(0, Math.min(totalDistanceMeters, sync.currentDisplayDistanceMeters));
      const distanceRemaining = Math.max(0, totalDistanceMeters - distanceTravelled);
      const progress = totalDistanceMeters > 0 ? distanceTravelled / totalDistanceMeters : 0;
      const currentElapsed = progress * durationSeconds;
      const isCompleted = status === 'completed' || (progress >= 1.0 && status === 'running');

      const { position, heading } = interpolatePositionAlongRoute(
        points,
        cumulative,
        distanceTravelled
      );

      // Find upcoming stop
      let nextStop = stops.find(s => s.distanceMeters > distanceTravelled) || null;
      const nextStopName = nextStop ? nextStop.name : (isCompleted ? 'Dehradun ISBT Terminal (Arrived)' : 'Jaipur Sindhi Camp Central Bus Stand');
      const nextStopDist = nextStop ? Math.max(0, nextStop.distanceMeters - distanceTravelled) : 0;

      // Realistic speed reading with slight cruising fluctuation
      let speed = 0;
      if (status === 'running') {
        const base = 65;
        const wave = Math.sin(distanceTravelled / 2000) * 7;
        speed = Math.max(42, Math.min(76, Math.round(base + wave)));
      }

      const nextState: InterpolatedState = {
        currentElapsedSeconds: Number(currentElapsed.toFixed(1)),
        progress: Number(progress.toFixed(6)),
        distanceTravelledMeters: Number(distanceTravelled.toFixed(1)),
        distanceRemainingMeters: Number(distanceRemaining.toFixed(1)),
        vehiclePosition: position,
        vehicleHeading: heading,
        isCompleted,
        currentSpeedKmh: speed,
        lastPingSecondsAgo: secondsAgo,
        nextStopName,
        nextStopDistanceMeters: nextStopDist,
        gpsSignal: status === 'running' ? 'AIS-140 GPS Fixed (4G LTE)' : status === 'paused' ? 'Vehicle Idle / GPS Lock' : 'Standby',
      };

      setInterpolated(nextState);
      if (distanceTravelled > 0 && status === 'running') {
        saveCachedTelemetry(nextState);
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [routeData]);

  return {
    telemetry,
    routeData,
    interpolated,
    loading,
    error,
    refetch: fetchTelemetry,
  };
}
