export type JourneyStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface BusStop {
  id: string;
  name: string;
  city: string;
  landmark: string;
  coordinates: RoutePoint;
  scheduledHaltMinutes: number;
  type: 'boarding' | 'food_halt' | 'transit_stop' | 'destination';
  distanceMeters: number;
  sequence: number;
}

export interface RouteData {
  origin: {
    name: string;
    coordinates: RoutePoint;
  };
  destination: {
    name: string;
    coordinates: RoutePoint;
  };
  totalDistanceMeters: number;
  polyline: string;
  points: RoutePoint[];
  cumulativeDistances: number[];
  stops: BusStop[];
}

export interface JourneyTelemetry {
  journey: {
    id: string;
    origin: string;
    destination: string;
    status: JourneyStatus;
    started_at: string | null;
    paused_at: string | null;
    duration_seconds: number;
    updated_at: string;
  };
  simulation: {
    progress: number;
    progressPercentage: number;
    currentElapsedSeconds: number;
    remainingSeconds: number;
    totalDurationSeconds: number;
    distanceTravelledMeters: number;
    distanceRemainingMeters: number;
    totalDistanceMeters: number;
    etaTimestamp: string | null;
    serverTime: string;
  };
  vehicle: {
    position: RoutePoint;
    heading: number;
    segmentIndex: number;
  };
  bus?: {
    vehicleNumber: string;
    operator: string;
    busModel: string;
    serviceType: string;
    currentSpeedKmh: number;
    telemetryStatus: string;
    gpsLock: string;
    lastPingSecondsAgo: number;
    nextStop: string | null;
    nextStopDistanceMeters: number | null;
  };
}

export interface InterpolatedState {
  currentElapsedSeconds: number;
  progress: number;
  distanceTravelledMeters: number;
  distanceRemainingMeters: number;
  vehiclePosition: RoutePoint;
  vehicleHeading: number;
  isCompleted: boolean;
  currentSpeedKmh: number;
  lastPingSecondsAgo: number;
  nextStopName: string;
  nextStopDistanceMeters: number;
  gpsSignal: string;
}
