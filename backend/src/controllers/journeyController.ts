import { Request, Response } from 'express';
import { journeyRepository } from '../repositories/journeyRepository.js';
import { TimingService } from '../services/timingService.js';
import { RouteService } from '../services/routeService.js';
import { JourneyTelemetry } from '../types/journey.js';

export class JourneyController {
  /**
   * Public endpoint: GET /api/journey
   * Returns current journey telemetry, computed simulation metrics, and vehicle position.
   */
  public static async getJourney(req: Request, res: Response): Promise<void> {
    try {
      let journey = await journeyRepository.getJourney();
      const serverTime = new Date();
      const timing = TimingService.calculateTiming(journey, serverTime);

      // Auto-complete journey if duration elapsed while in running status
      if (journey.status === 'running' && timing.isCompleted) {
        journey = {
          ...journey,
          status: 'completed',
          elapsed_before_pause_seconds: journey.duration_seconds,
          started_at: journey.started_at,
          paused_at: null,
          updated_at: serverTime.toISOString(),
        };
        await journeyRepository.updateJourney(journey);
      }

      const vehicleState = RouteService.getPositionAtDistance(timing.distanceTravelledMeters);

      const responsePayload: JourneyTelemetry = {
        journey: {
          id: journey.id,
          origin: journey.origin,
          destination: journey.destination,
          status: journey.status,
          started_at: journey.started_at,
          paused_at: journey.paused_at,
          duration_seconds: journey.duration_seconds,
          updated_at: journey.updated_at,
        },
        simulation: {
          progress: timing.progress,
          progressPercentage: Number((timing.progress * 100).toFixed(2)),
          currentElapsedSeconds: timing.currentElapsedSeconds,
          remainingSeconds: timing.remainingSeconds,
          totalDurationSeconds: journey.duration_seconds,
          distanceTravelledMeters: timing.distanceTravelledMeters,
          distanceRemainingMeters: timing.distanceRemainingMeters,
          totalDistanceMeters: journey.total_distance_meters,
          etaTimestamp: timing.etaTimestamp,
          serverTime: serverTime.toISOString(),
        },
        vehicle: {
          position: vehicleState.position,
          heading: vehicleState.heading,
          segmentIndex: vehicleState.segmentIndex,
        },
        bus: (() => {
          const stops = RouteService.getStops();
          let nextStop: any = null;
          for (const s of stops) {
            if (s.distanceMeters > timing.distanceTravelledMeters) {
              nextStop = s;
              break;
            }
          }

          let currentSpeed = 0;
          if (journey.status === 'running') {
            const baseSpeed = 64;
            const variance = Math.sin(timing.distanceTravelledMeters / 1800) * 8;
            currentSpeed = Math.max(35, Math.min(78, Math.round(baseSpeed + variance)));
          }

          const secondsAgo = journey.status === 'running' ? Math.floor((Date.now() / 1000) % 5) + 1 : 0;

          return {
            vehicleNumber: 'RJ-14-PB-4289',
            operator: 'Maharani Travels',
            busModel: 'Volvo 9600 AC Multi-Axle Sleeper',
            serviceType: 'Superfast Intercity (Jaipur ⇄ Dehradun)',
            currentSpeedKmh: currentSpeed,
            telemetryStatus: journey.status === 'running' ? 'Active - Real-Time Telematics' : journey.status === 'paused' ? 'Vehicle Idle / Scheduled Halt' : 'Terminal Standby',
            gpsLock: '3D High Accuracy (12 Sats)',
            lastPingSecondsAgo: secondsAgo,
            nextStop: nextStop ? nextStop.name : (journey.status === 'completed' ? 'Arrived at Destination' : 'Jaipur Sindhi Camp'),
            nextStopDistanceMeters: nextStop ? Math.max(0, nextStop.distanceMeters - timing.distanceTravelledMeters) : 0,
          };
        })(),
      };

      res.status(200).json(responsePayload);
    } catch (err: any) {
      console.error('[JourneyController.getJourney] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to retrieve journey telemetry.',
      });
    }
  }

  /**
   * Public endpoint: GET /api/route
   * Returns authoritative route geometry, polyline, waypoints and distances.
   */
  public static async getRoute(req: Request, res: Response): Promise<void> {
    try {
      const routeData = await RouteService.getRouteAsync();
      res.status(200).json(routeData);
    } catch (err: any) {
      console.error('[JourneyController.getRoute] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to retrieve route geometry.',
      });
    }
  }
}
