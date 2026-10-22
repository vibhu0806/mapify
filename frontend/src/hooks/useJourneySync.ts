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

export function useJourneySync(pollIntervalMs = 3500): UseJourneySyncResult {
  const [telemetry, setTelemetry] = useState<JourneyTelemetry | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }>({
    serverTimeMs: Date.now(),
    localFetchTimeMs: Date.now(),
    clockOffsetMs: 0,
    status: 'idle',
    startedAtMs: null,
    elapsedBeforePause: 0,
    durationSeconds: 21600,
    totalDistanceMeters: 548200,
    lastPingReceivedAt: Date.now(),
    targetDistanceMeters: 0,
    currentDisplayDistanceMeters: 0,
  });

  const [interpolated, setInterpolated] = useState<InterpolatedState>({
    currentElapsedSeconds: 0,
    progress: 0,
    distanceTravelledMeters: 0,
    distanceRemainingMeters: 205000,
    vehiclePosition: { lat: 28.5900, lng: 77.2580 },
    vehicleHeading: 145,
    isCompleted: false,
    currentSpeedKmh: 0,
    lastPingSecondsAgo: 0,
    nextStopName: 'Delhi Sarai Kale Khan ISBT',
    nextStopDistanceMeters: 0,
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
      const data = await api.getJourney();
      const localNow = Date.now();
      const serverNow = new Date(data.simulation.serverTime).getTime();

      const serverDistance = data.simulation.distanceTravelledMeters;

      syncRef.current = {
        serverTimeMs: serverNow,
        localFetchTimeMs: localNow,
        clockOffsetMs: localNow - serverNow,
        status: data.journey.status,
        startedAtMs: data.journey.started_at ? new Date(data.journey.started_at).getTime() : null,
        elapsedBeforePause: data.journey.status === 'paused'
          ? data.simulation.currentElapsedSeconds
          : (data.simulation.currentElapsedSeconds - (data.journey.started_at ? Math.max(0, (serverNow - new Date(data.journey.started_at).getTime()) / 1000) : 0)),
        durationSeconds: data.simulation.totalDurationSeconds,
        totalDistanceMeters: data.simulation.totalDistanceMeters,
        lastPingReceivedAt: localNow,
        targetDistanceMeters: serverDistance,
        currentDisplayDistanceMeters: syncRef.current.currentDisplayDistanceMeters || serverDistance,
      };

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

      // Realistic GPS movement:
      // When a packet arrives, the vehicle gently catches up to the new GPS fix over ~1.2s
      // and then holds steady at the received GPS coordinates until the next packet!
      if (status === 'running') {
        const diff = targetDistanceMeters - sync.currentDisplayDistanceMeters;
        if (Math.abs(diff) > 0.5) {
          // Easing catch-up step to new GPS fix (simulates cellular packet arrival)
          sync.currentDisplayDistanceMeters += diff * 0.08;
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

      setInterpolated({
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
      });

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
