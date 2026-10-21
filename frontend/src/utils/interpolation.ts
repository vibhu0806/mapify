import { RoutePoint } from '../types/index.js';

export function haversineMeters(p1: RoutePoint, p2: RoutePoint): number {
  const R = 6371000;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateBearing(p1: RoutePoint, p2: RoutePoint): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function interpolatePositionAlongRoute(
  points: RoutePoint[],
  cumulativeDistances: number[],
  targetDistanceMeters: number
): { position: RoutePoint; heading: number; segmentIndex: number } {
  if (!points || points.length === 0) {
    return { position: { lat: 26.9124, lng: 75.7873 }, heading: 0, segmentIndex: 0 };
  }

  const totalDist = cumulativeDistances[cumulativeDistances.length - 1] || 1;

  if (targetDistanceMeters <= 0 || points.length === 1) {
    const heading = points.length > 1 ? calculateBearing(points[0], points[1]) : 0;
    return { position: points[0], heading, segmentIndex: 0 };
  }

  if (targetDistanceMeters >= totalDist) {
    const lastIdx = points.length - 1;
    const heading = calculateBearing(points[lastIdx - 1], points[lastIdx]);
    return { position: points[lastIdx], heading, segmentIndex: lastIdx - 1 };
  }

  // Binary search for segment
  let low = 0;
  let high = cumulativeDistances.length - 2;
  let segmentIndex = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (cumulativeDistances[mid] <= targetDistanceMeters) {
      segmentIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const p1 = points[segmentIndex];
  const p2 = points[segmentIndex + 1];
  const segStartDist = cumulativeDistances[segmentIndex];
  const segEndDist = cumulativeDistances[segmentIndex + 1];
  const segLength = segEndDist - segStartDist;

  const fraction = segLength > 0 ? (targetDistanceMeters - segStartDist) / segLength : 0;
  const clampedFraction = Math.max(0, Math.min(1, fraction));

  const lat = p1.lat + (p2.lat - p1.lat) * clampedFraction;
  const lng = p1.lng + (p2.lng - p1.lng) * clampedFraction;
  const heading = calculateBearing(p1, p2);

  return {
    position: { lat, lng },
    heading,
    segmentIndex,
  };
}

export function formatDuration(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

export function formatDistance(meters: number): string {
  const km = Math.max(0, meters / 1000);
  return `${km.toFixed(1)} km`;
}

export function formatETA(isoString: string | null): string {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch {
    return '--:--';
  }
}
