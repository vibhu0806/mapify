import { z } from 'zod';

export type JourneyStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  index: number;
  start: RoutePoint;
  end: RoutePoint;
  distanceMeters: number;
  cumulativeDistanceMeters: number;
  bearing: number;
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
  cumulativeDistances: number[]; // meters at each point
  stops: BusStop[];
}

export interface Journey {
  id: string;
  origin: string;
  destination: string;
  status: JourneyStatus;
  started_at: string | null; // ISO UTC
  paused_at: string | null;  // ISO UTC
  elapsed_before_pause_seconds: number;
  duration_seconds: number;
  total_distance_meters: number;
  pnr_code?: string;
  pnr_hash?: string;
  created_at: string;
  updated_at: string;
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
    progress: number; // 0.0 to 1.0
    progressPercentage: number; // 0 to 100
    currentElapsedSeconds: number;
    remainingSeconds: number;
    totalDurationSeconds: number;
    distanceTravelledMeters: number;
    distanceRemainingMeters: number;
    totalDistanceMeters: number;
    etaTimestamp: string | null;
    serverTime: string; // ISO UTC
  };
  vehicle: {
    position: RoutePoint;
    heading: number; // 0 - 360 degrees
    segmentIndex: number;
  };
  bus: {
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

// Zod validation schemas for requests
export const UpdateConfigSchema = z.object({
  duration_seconds: z.number().min(10, 'Duration must be at least 10 seconds').max(864000, 'Duration cannot exceed 10 days'),
});

export const AdminActionSchema = z.object({
  confirm: z.boolean().optional(),
});

export const ValidatePnrSchema = z.object({
  pnr: z.string().min(1, 'PNR is required').max(30, 'PNR too long'),
  lastName: z.string().min(1, 'Passenger last name is required').max(50, 'Last name too long'),
});

export const UpdatePnrSchema = z.object({
  pnr: z.string().min(3, 'PNR must be at least 3 characters').max(30, 'PNR too long'),
});
