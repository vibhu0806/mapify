import { RouteData, RoutePoint, BusStop } from '../types/journey.js';
import { config } from '../config/index.js';

// Haversine distance in meters between two lat/lng coordinates
export function haversineDistanceMeters(p1: RoutePoint, p2: RoutePoint): number {
  const R = 6371000; // Earth radius in meters
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

// Calculate initial forward azimuth (heading) in degrees (0 - 360) from p1 to p2
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

// Standard Encoded Polyline algorithm encoder (for compact storage/network transfer)
export function encodePolyline(points: RoutePoint[]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    encoded += encodeSignedNumber(dLat) + encodeSignedNumber(dLng);
  }

  return encoded;
}

function encodeSignedNumber(num: number): string {
  let sgn_num = num < 0 ? ~(num << 1) : num << 1;
  let encodeString = '';
  while (sgn_num >= 0x20) {
    encodeString += String.fromCharCode((0x20 | (sgn_num & 0x1f)) + 63);
    sgn_num >>= 5;
  }
  encodeString += String.fromCharCode(sgn_num + 63);
  return encodeString;
}

// Standard Encoded Polyline decoder
export function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

// Real Intercity Bus Stops along the Jaipur to Dehradun corridor (NH 48 -> Eastern Peripheral / Ring Rd -> NH 334)
export const REAL_BUS_STOPS: BusStop[] = [
  {
    id: 'stop-1',
    sequence: 1,
    name: 'Jaipur Sindhi Camp Central Bus Stand',
    city: 'Jaipur',
    landmark: 'Platform Bay 4, RSRTC Central Depot',
    coordinates: { lat: 26.9239, lng: 75.7997 },
    scheduledHaltMinutes: 0,
    type: 'boarding',
    distanceMeters: 0,
  },
  {
    id: 'stop-2',
    sequence: 2,
    name: 'Transport Nagar / Narayan Singh Circle',
    city: 'Jaipur',
    landmark: 'Under-Flyover Highway Passenger Bay',
    coordinates: { lat: 26.9030, lng: 75.8340 },
    scheduledHaltMinutes: 10,
    type: 'boarding',
    distanceMeters: 6200,
  },
  {
    id: 'stop-3',
    sequence: 3,
    name: 'Shahpura Toll Plaza',
    city: 'Shahpura',
    landmark: 'Bishangarh Highway Crossing',
    coordinates: { lat: 27.3880, lng: 75.9620 },
    scheduledHaltMinutes: 2,
    type: 'transit_stop',
    distanceMeters: 65400,
  },
  {
    id: 'stop-4',
    sequence: 4,
    name: 'Kotputli Highway King Halt',
    city: 'Kotputli',
    landmark: 'Hotel Highway King Complex, NH 48',
    coordinates: { lat: 27.7050, lng: 76.2050 },
    scheduledHaltMinutes: 10,
    type: 'transit_stop',
    distanceMeters: 108500,
  },
  {
    id: 'stop-5',
    sequence: 5,
    name: 'Behror RTDC Midway',
    city: 'Behror',
    landmark: 'Rajasthan Tourism Midway Restaurant & Rest Area',
    coordinates: { lat: 27.8920, lng: 76.2840 },
    scheduledHaltMinutes: 30,
    type: 'food_halt',
    distanceMeters: 138200,
  },
  {
    id: 'stop-6',
    sequence: 6,
    name: 'Neemrana Flyover',
    city: 'Neemrana',
    landmark: 'Japanese Zone Toll Crossing',
    coordinates: { lat: 28.0050, lng: 76.3880 },
    scheduledHaltMinutes: 3,
    type: 'transit_stop',
    distanceMeters: 158000,
  },
  {
    id: 'stop-7',
    sequence: 7,
    name: 'Dharuhera Express Checkpost',
    city: 'Dharuhera',
    landmark: 'Rewari-Bhiwadi Highway Cut',
    coordinates: { lat: 28.2040, lng: 76.6210 },
    scheduledHaltMinutes: 2,
    type: 'transit_stop',
    distanceMeters: 202400,
  },
  {
    id: 'stop-8',
    sequence: 8,
    name: 'Gurugram IFFCO Chowk',
    city: 'Gurugram',
    landmark: 'IFFCO Chowk Metro Flyover Bus Bay',
    coordinates: { lat: 28.4720, lng: 77.0725 },
    scheduledHaltMinutes: 10,
    type: 'boarding',
    distanceMeters: 246500,
  },
  {
    id: 'stop-9',
    sequence: 9,
    name: 'Delhi Dhaula Kuan',
    city: 'New Delhi',
    landmark: 'Ring Road Interstate Bus Stand',
    coordinates: { lat: 28.5920, lng: 77.1610 },
    scheduledHaltMinutes: 5,
    type: 'transit_stop',
    distanceMeters: 280100,
  },
  {
    id: 'stop-10',
    sequence: 10,
    name: 'Delhi ISBT Kashmiri Gate',
    city: 'Delhi',
    landmark: 'Inter-State Bus Terminal, Outer Ring Road Bay',
    coordinates: { lat: 28.6675, lng: 77.2280 },
    scheduledHaltMinutes: 15,
    type: 'boarding',
    distanceMeters: 298400,
  },
  {
    id: 'stop-11',
    sequence: 11,
    name: 'Dasna Toll Plaza (Delhi-Meerut Expy)',
    city: 'Ghaziabad',
    landmark: 'Eastern Peripheral Highway Toll Gate',
    coordinates: { lat: 28.6750, lng: 77.4950 },
    scheduledHaltMinutes: 2,
    type: 'transit_stop',
    distanceMeters: 325600,
  },
  {
    id: 'stop-12',
    sequence: 12,
    name: 'Meerut Bypass (Partapur)',
    city: 'Meerut',
    landmark: 'Partapur Interchange Toll Plaza',
    coordinates: { lat: 28.8950, lng: 77.6720 },
    scheduledHaltMinutes: 3,
    type: 'transit_stop',
    distanceMeters: 368200,
  },
  {
    id: 'stop-13',
    sequence: 13,
    name: 'Muzaffarnagar Cheetal Grand',
    city: 'Muzaffarnagar',
    landmark: 'Cheetal Grand Highway Resort & Food Court',
    coordinates: { lat: 29.4720, lng: 77.7080 },
    scheduledHaltMinutes: 20,
    type: 'food_halt',
    distanceMeters: 422100,
  },
  {
    id: 'stop-14',
    sequence: 14,
    name: 'Roorkee Military Cantt / Bus Stand',
    city: 'Roorkee',
    landmark: 'Civil Lines Road, Near IIT Main Gate',
    coordinates: { lat: 29.8550, lng: 77.8880 },
    scheduledHaltMinutes: 10,
    type: 'transit_stop',
    distanceMeters: 478500,
  },
  {
    id: 'stop-15',
    sequence: 15,
    name: 'Haridwar Bahadrabad Bypass',
    city: 'Haridwar',
    landmark: 'Haridwar-Roorkee Highway Cut',
    coordinates: { lat: 29.9850, lng: 78.0920 },
    scheduledHaltMinutes: 8,
    type: 'transit_stop',
    distanceMeters: 506300,
  },
  {
    id: 'stop-16',
    sequence: 16,
    name: 'Nepali Farm / Doiwala',
    city: 'Doiwala',
    landmark: 'Dehradun Entry Highway Junction',
    coordinates: { lat: 30.1850, lng: 78.1250 },
    scheduledHaltMinutes: 5,
    type: 'transit_stop',
    distanceMeters: 528700,
  },
  {
    id: 'stop-17',
    sequence: 17,
    name: 'Dehradun ISBT Terminal',
    city: 'Dehradun',
    landmark: 'Haridwar Bypass Road, Majra, Platform Bay 2',
    coordinates: { lat: 30.2862, lng: 78.0078 },
    scheduledHaltMinutes: 0,
    type: 'destination',
    distanceMeters: 548200,
  },
];

// High-fidelity highway nodes along NH 48 -> KMP/Ring Rd -> NH 334 -> Meerut -> Muzaffarnagar -> Roorkee -> Dehradun
const RAW_HIGHWAY_WAYPOINTS: RoutePoint[] = [
  { lat: 26.9239, lng: 75.7997 }, // Jaipur (Sindhi Camp ISBT Central Stand)
  { lat: 26.9030, lng: 75.8340 }, // Transport Nagar / Ghat ki Guni
  { lat: 26.9830, lng: 75.8230 }, // Daulatpura Toll
  { lat: 27.0510, lng: 75.8820 }, // Chandwaji (T-Junction Delhi Highway)
  { lat: 27.1650, lng: 75.9540 }, // Manoharpur
  { lat: 27.3880, lng: 75.9620 }, // Shahpura Toll
  { lat: 27.5300, lng: 76.0820 }, // Paota
  { lat: 27.7050, lng: 76.2050 }, // Kotputli Highway King
  { lat: 27.8920, lng: 76.2840 }, // Behror RTDC Midway
  { lat: 28.0050, lng: 76.3880 }, // Neemrana
  { lat: 28.1150, lng: 76.4920 }, // Bawal
  { lat: 28.2040, lng: 76.6210 }, // Dharuhera / Rewari interchange
  { lat: 28.2910, lng: 76.7350 }, // Bilaspur
  { lat: 28.3620, lng: 76.8450 }, // Pachgaon
  { lat: 28.3550, lng: 76.9360 }, // Manesar
  { lat: 28.4210, lng: 77.0180 }, // Kherki Daula
  { lat: 28.4720, lng: 77.0725 }, // Gurugram IFFCO Chowk
  { lat: 28.5080, lng: 77.1000 }, // Cyber City / Sirhaul Border
  { lat: 28.5420, lng: 77.1420 }, // Mahipalpur
  { lat: 28.5920, lng: 77.1610 }, // Dhaula Kuan
  { lat: 28.6675, lng: 77.2280 }, // Delhi ISBT Kashmiri Gate
  { lat: 28.6420, lng: 77.2650 }, // Akshardham / Delhi-Meerut Expressway Entry
  { lat: 28.6310, lng: 77.3750 }, // Ghazipur / Indirapuram
  { lat: 28.6750, lng: 77.4950 }, // Dasna Interchange (Delhi-Meerut Expy)
  { lat: 28.7500, lng: 77.5850 }, // Bhojpur
  { lat: 28.8950, lng: 77.6720 }, // Partapur / Meerut Bypass
  { lat: 29.0450, lng: 77.7050 }, // Daurala
  { lat: 29.1820, lng: 77.7280 }, // Khatauli
  { lat: 29.4720, lng: 77.7080 }, // Muzaffarnagar Cheetal Grand
  { lat: 29.6950, lng: 77.8020 }, // Purqazi
  { lat: 29.8550, lng: 77.8880 }, // Roorkee Military Cantt / Bus Stand
  { lat: 29.9850, lng: 78.0920 }, // Bahadrabad / Haridwar bypass
  { lat: 30.0450, lng: 78.1450 }, // Motichur
  { lat: 30.1250, lng: 78.1620 }, // Raiwala
  { lat: 30.1850, lng: 78.1250 }, // Doiwala / Nepali Farm
  { lat: 30.2250, lng: 78.0820 }, // Harrawala
  { lat: 30.2862, lng: 78.0078 }, // Dehradun (ISBT Dehradun Terminal)
];

function densifyRoadRoute(waypoints: RoutePoint[], stepMeters = 300): RoutePoint[] {
  const densePoints: RoutePoint[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const dist = haversineDistanceMeters(start, end);
    const steps = Math.max(1, Math.floor(dist / stepMeters));

    for (let s = 0; s < steps; s++) {
      const fraction = s / steps;
      densePoints.push({
        lat: Number((start.lat + (end.lat - start.lat) * fraction).toFixed(6)),
        lng: Number((start.lng + (end.lng - start.lng) * fraction).toFixed(6)),
      });
    }
  }

  densePoints.push(waypoints[waypoints.length - 1]);
  return densePoints;
}

export class RouteService {
  private static cachedRouteData: RouteData | null = null;
  private static isFetchingOsrm = false;

  public static getOrigin(): { name: string; coordinates: RoutePoint } {
    return {
      name: 'Jaipur (Sindhi Camp ISBT)',
      coordinates: RAW_HIGHWAY_WAYPOINTS[0],
    };
  }

  public static getDestination(): { name: string; coordinates: RoutePoint } {
    return {
      name: 'Dehradun (ISBT Terminal)',
      coordinates: RAW_HIGHWAY_WAYPOINTS[RAW_HIGHWAY_WAYPOINTS.length - 1],
    };
  }

  public static getStops(): BusStop[] {
    return REAL_BUS_STOPS;
  }

  private static computeStopDistances(points: RoutePoint[], cumDistances: number[]): BusStop[] {
    return REAL_BUS_STOPS.map((stop) => {
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < points.length; i++) {
        const d = haversineDistanceMeters(stop.coordinates, points[i]);
        if (d < minDistance) {
          minDistance = d;
          closestIdx = i;
        }
      }

      return {
        ...stop,
        distanceMeters: Math.round(cumDistances[closestIdx] || 0),
      };
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Fetches the real driving route from the configured OSRM Routing API instance.
   * Converts OSRM GeoJSON geometry into Leaflet-ready coordinates and calculates cumulative distances.
   */
  public static async fetchOsrmRoute(): Promise<RouteData | null> {
    const origin = this.getOrigin();
    const dest = this.getDestination();

    // Via points through actual bus highway corridor (Behror, Gurugram, Delhi Kashmiri Gate, Meerut, Muzaffarnagar, Roorkee)
    const viaWaypoints = [
      origin.coordinates,
      { lat: 27.8920, lng: 76.2840 }, // Behror
      { lat: 28.4720, lng: 77.0725 }, // Gurugram
      { lat: 28.6675, lng: 77.2280 }, // Delhi Kashmiri Gate
      { lat: 28.8950, lng: 77.6720 }, // Meerut Bypass
      { lat: 29.4720, lng: 77.7080 }, // Muzaffarnagar
      { lat: 29.8550, lng: 77.8880 }, // Roorkee
      dest.coordinates,
    ];

    const coordStr = viaWaypoints.map(w => `${w.lng},${w.lat}`).join(';');
    const osrmUrl = `${config.osrmRouterUrl}/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(osrmUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'JaipurDehradunVehicleTracker/1.0' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM HTTP error ${response.status}`);
      }

      const data: any = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const osrmRoute = data.routes[0];
        const rawCoords: [number, number][] = osrmRoute.geometry.coordinates;

        // OSRM returns coordinates in [lng, lat] format -> convert to RoutePoint { lat, lng }
        const points: RoutePoint[] = rawCoords.map(([lng, lat]) => ({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        }));

        // Compute cumulative distances
        const cumulativeDistances: number[] = [0];
        let totalDistance = 0;

        for (let i = 1; i < points.length; i++) {
          const segDist = haversineDistanceMeters(points[i - 1], points[i]);
          totalDistance += segDist;
          cumulativeDistances.push(Number(totalDistance.toFixed(1)));
        }

        const encodedPolyline = encodePolyline(points);
        const stopsWithDistances = this.computeStopDistances(points, cumulativeDistances);

        const routeData: RouteData = {
          origin,
          destination: dest,
          totalDistanceMeters: Number(totalDistance.toFixed(1)),
          polyline: encodedPolyline,
          points,
          cumulativeDistances,
          stops: stopsWithDistances,
        };

        this.cachedRouteData = routeData;
        console.log(`[RouteService] Successfully loaded authentic OSRM bus route: ${points.length} waypoints, ${(totalDistance / 1000).toFixed(1)} km, ${stopsWithDistances.length} bus stops`);
        return routeData;
      }
    } catch (err: any) {
      console.warn(`[RouteService] OSRM fetch failed (${err.message}). Using resilient road geometry fallback.`);
    }

    return null;
  }

  /**
   * Generates fallback route data based on high-density highway waypoints.
   */
  private static generateFallbackRoute(): RouteData {
    const densePoints = densifyRoadRoute(RAW_HIGHWAY_WAYPOINTS, 350);
    const cumulativeDistances: number[] = [0];
    let totalDistance = 0;

    for (let i = 1; i < densePoints.length; i++) {
      const segDist = haversineDistanceMeters(densePoints[i - 1], densePoints[i]);
      totalDistance += segDist;
      cumulativeDistances.push(Number(totalDistance.toFixed(1)));
    }

    const encodedPolyline = encodePolyline(densePoints);
    const stopsWithDistances = this.computeStopDistances(densePoints, cumulativeDistances);

    return {
      origin: this.getOrigin(),
      destination: this.getDestination(),
      totalDistanceMeters: Number(totalDistance.toFixed(1)),
      polyline: encodedPolyline,
      points: densePoints,
      cumulativeDistances,
      stops: stopsWithDistances,
    };
  }

  /**
   * Synchronous accessor returning cached route data (or fallback if not yet loaded).
   * Automatically kicks off background OSRM fetch if cache is empty.
   */
  public static getRoute(): RouteData {
    if (this.cachedRouteData) {
      return this.cachedRouteData;
    }

    this.cachedRouteData = this.generateFallbackRoute();

    // Trigger async OSRM update in background if not already in progress
    if (!this.isFetchingOsrm) {
      this.isFetchingOsrm = true;
      this.fetchOsrmRoute().finally(() => {
        this.isFetchingOsrm = false;
      });
    }

    return this.cachedRouteData;
  }

  /**
   * Asynchronous accessor ensuring OSRM route is fetched if available.
   */
  public static async getRouteAsync(): Promise<RouteData> {
    if (this.cachedRouteData && this.cachedRouteData.points.length > 500) {
      return this.cachedRouteData;
    }

    const osrmData = await this.fetchOsrmRoute();
    if (osrmData) {
      return osrmData;
    }

    return this.getRoute();
  }

  /**
   * Finds the exact position and heading along the route given a travelled distance in meters.
   */
  public static getPositionAtDistance(targetDistanceMeters: number): {
    position: RoutePoint;
    heading: number;
    segmentIndex: number;
  } {
    const route = this.getRoute();
    const points = route.points;
    const cum = route.cumulativeDistances;
    const totalDist = route.totalDistanceMeters;

    // Boundary conditions
    if (targetDistanceMeters <= 0 || points.length <= 1) {
      const heading = calculateBearing(points[0], points[1] || points[0]);
      return { position: points[0], heading, segmentIndex: 0 };
    }

    if (targetDistanceMeters >= totalDist) {
      const lastIdx = points.length - 1;
      const heading = calculateBearing(points[lastIdx - 1], points[lastIdx]);
      return { position: points[lastIdx], heading, segmentIndex: lastIdx - 1 };
    }

    // Binary search for the route segment where cum[i] <= targetDistance < cum[i+1]
    let low = 0;
    let high = cum.length - 2;
    let segmentIndex = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (cum[mid] <= targetDistanceMeters) {
        segmentIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const p1 = points[segmentIndex];
    const p2 = points[segmentIndex + 1];
    const segStartDist = cum[segmentIndex];
    const segEndDist = cum[segmentIndex + 1];
    const segLength = segEndDist - segStartDist;

    const fraction = segLength > 0 ? (targetDistanceMeters - segStartDist) / segLength : 0;
    const clampedFraction = Math.max(0, Math.min(1, fraction));

    const lat = p1.lat + (p2.lat - p1.lat) * clampedFraction;
    const lng = p1.lng + (p2.lng - p1.lng) * clampedFraction;
    const heading = calculateBearing(p1, p2);

    return {
      position: {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      },
      heading: Number(heading.toFixed(1)),
      segmentIndex,
    };
  }
}
