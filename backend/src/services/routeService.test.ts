import { describe, it, expect } from 'vitest';
import { RouteService, haversineDistanceMeters, calculateBearing, encodePolyline, decodePolyline } from './routeService.js';

describe('RouteService', () => {
  it('generates a valid route between Jaipur and Dehradun', () => {
    const route = RouteService.getRoute();

    expect(route.origin.name).toContain('Jaipur');
    expect(route.destination.name).toContain('Dehradun');
    expect(route.totalDistanceMeters).toBeGreaterThan(450000); // Realistic highway distance (> 450 km)
    expect(route.totalDistanceMeters).toBeLessThan(600000);    // < 600 km
    expect(route.points.length).toBeGreaterThan(100);          // Dense road coordinates
    expect(route.cumulativeDistances.length).toBe(route.points.length);
    expect(route.polyline).toBeDefined();
    expect(route.polyline.length).toBeGreaterThan(50);
  });

  it('has monotonically increasing cumulative distances', () => {
    const route = RouteService.getRoute();
    const cum = route.cumulativeDistances;

    expect(cum[0]).toBe(0);
    for (let i = 1; i < cum.length; i++) {
      expect(cum[i]).toBeGreaterThanOrEqual(cum[i - 1]);
    }
    expect(cum[cum.length - 1]).toBe(route.totalDistanceMeters);
  });

  it('interpolates vehicle position accurately at 0%, 50%, and 100%', () => {
    const route = RouteService.getRoute();
    const totalDist = route.totalDistanceMeters;

    // At distance 0 -> Origin (Jaipur)
    const posStart = RouteService.getPositionAtDistance(0);
    expect(posStart.position.lat).toBeCloseTo(route.origin.coordinates.lat, 3);
    expect(posStart.position.lng).toBeCloseTo(route.origin.coordinates.lng, 3);
    expect(posStart.segmentIndex).toBe(0);

    // At 50% distance -> Middle of route
    const posMid = RouteService.getPositionAtDistance(totalDist * 0.5);
    expect(posMid.position.lat).toBeGreaterThan(27.5);
    expect(posMid.position.lat).toBeLessThan(29.5);
    expect(posMid.heading).toBeGreaterThanOrEqual(0);
    expect(posMid.heading).toBeLessThanOrEqual(360);

    // At 100% distance -> Destination (Dehradun)
    const posEnd = RouteService.getPositionAtDistance(totalDist);
    expect(posEnd.position.lat).toBeCloseTo(route.destination.coordinates.lat, 3);
    expect(posEnd.position.lng).toBeCloseTo(route.destination.coordinates.lng, 3);
  });

  it('encodes and decodes polylines with high precision', () => {
    const originalPoints = [
      { lat: 26.9124, lng: 75.7873 },
      { lat: 28.6139, lng: 77.2090 },
      { lat: 30.3165, lng: 78.0322 },
    ];

    const encoded = encodePolyline(originalPoints);
    const decoded = decodePolyline(encoded);

    expect(decoded.length).toBe(originalPoints.length);
    for (let i = 0; i < originalPoints.length; i++) {
      expect(decoded[i].lat).toBeCloseTo(originalPoints[i].lat, 5);
      expect(decoded[i].lng).toBeCloseTo(originalPoints[i].lng, 5);
    }
  });

  it('calculates geographic bearing correctly', () => {
    // North: 0 deg
    const p1 = { lat: 20.0, lng: 75.0 };
    const pNorth = { lat: 21.0, lng: 75.0 };
    expect(calculateBearing(p1, pNorth)).toBeCloseTo(0, 0);

    // East: 90 deg
    const pEast = { lat: 20.0, lng: 76.0 };
    expect(calculateBearing(p1, pEast)).toBeCloseTo(90, 0);
  });

  it('handles OSRM route fetch and fallback gracefully', async () => {
    const route = await RouteService.getRouteAsync();
    expect(route.origin.name).toContain('Jaipur');
    expect(route.destination.name).toContain('Dehradun');
    expect(route.points.length).toBeGreaterThan(100);
    expect(route.totalDistanceMeters).toBeGreaterThan(450000);
  });
});
