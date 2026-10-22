import { Request, Response } from 'express';
import { journeyRepository } from '../repositories/journeyRepository.js';
import { TimingService } from '../services/timingService.js';
import { RouteService } from '../services/routeService.js';
import { UpdateConfigSchema, JourneyTelemetry, AdminActionSchema, UpdatePnrSchema } from '../types/journey.js';
import { PnrService } from '../services/pnrService.js';

function buildTelemetryResponse(journey: any, serverTime: Date = new Date()): JourneyTelemetry {
  const timing = TimingService.calculateTiming(journey, serverTime);
  const vehicleState = RouteService.getPositionAtDistance(timing.distanceTravelledMeters);
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
    bus: {
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
    },
  };
}

export class AdminController {
  /**
   * POST /api/admin/journey/start
   */
  public static async startJourney(req: Request, res: Response): Promise<void> {
    try {
      const currentJourney = await journeyRepository.getJourney();

      if (currentJourney.status === 'running') {
        res.status(409).json({
          error: 'Conflict',
          message: 'Bus journey is already active.',
        });
        return;
      }

      if (currentJourney.status === 'completed') {
        res.status(400).json({
          error: 'BadRequest',
          message: 'Journey has already completed. Reset journey before starting anew.',
        });
        return;
      }

      if (currentJourney.status === 'paused') {
        res.status(400).json({
          error: 'BadRequest',
          message: 'Journey is currently paused. Use resume instead of start.',
        });
        return;
      }

      const updatedJourney = TimingService.startJourney(currentJourney);
      const saved = await journeyRepository.updateJourney(updatedJourney);

      res.status(200).json({
        message: 'Journey started successfully.',
        data: buildTelemetryResponse(saved),
      });
    } catch (err: any) {
      console.error('[AdminController.startJourney] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Failed to start journey.',
      });
    }
  }

  /**
   * POST /api/admin/journey/pause
   */
  public static async pauseJourney(req: Request, res: Response): Promise<void> {
    try {
      const currentJourney = await journeyRepository.getJourney();

      if (currentJourney.status !== 'running') {
        res.status(400).json({
          error: 'BadRequest',
          message: `Cannot pause journey in '${currentJourney.status}' status. Journey must be running.`,
        });
        return;
      }

      const updatedJourney = TimingService.pauseJourney(currentJourney);
      const saved = await journeyRepository.updateJourney(updatedJourney);

      res.status(200).json({
        message: 'Journey paused successfully.',
        data: buildTelemetryResponse(saved),
      });
    } catch (err: any) {
      console.error('[AdminController.pauseJourney] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Failed to pause journey.',
      });
    }
  }

  /**
   * POST /api/admin/journey/resume
   */
  public static async resumeJourney(req: Request, res: Response): Promise<void> {
    try {
      const currentJourney = await journeyRepository.getJourney();

      if (currentJourney.status !== 'paused') {
        res.status(400).json({
          error: 'BadRequest',
          message: `Cannot resume journey in '${currentJourney.status}' status. Journey must be paused.`,
        });
        return;
      }

      const updatedJourney = TimingService.resumeJourney(currentJourney);
      const saved = await journeyRepository.updateJourney(updatedJourney);

      res.status(200).json({
        message: 'Journey resumed successfully.',
        data: buildTelemetryResponse(saved),
      });
    } catch (err: any) {
      console.error('[AdminController.resumeJourney] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Failed to resume journey.',
      });
    }
  }

  /**
   * POST /api/admin/journey/reset
   */
  public static async resetJourney(req: Request, res: Response): Promise<void> {
    try {
      const parsed = AdminActionSchema.safeParse(req.body);
      const currentJourney = await journeyRepository.getJourney();

      // Require confirmation if resetting an active or paused journey
      if ((currentJourney.status === 'running' || currentJourney.status === 'paused') && !parsed.data?.confirm) {
        res.status(400).json({
          error: 'ConfirmationRequired',
          message: 'Resetting an active or paused journey requires explicit confirmation: { confirm: true }',
        });
        return;
      }

      const updatedJourney = TimingService.resetJourney(currentJourney);
      const saved = await journeyRepository.updateJourney(updatedJourney);

      res.status(200).json({
        message: 'Journey reset to idle state.',
        data: buildTelemetryResponse(saved),
      });
    } catch (err: any) {
      console.error('[AdminController.resetJourney] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Failed to reset journey.',
      });
    }
  }

  /**
   * PATCH /api/admin/journey/config
   */
  public static async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = UpdateConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'ValidationError',
          message: parseResult.error.errors.map(e => e.message).join(', '),
        });
        return;
      }

      const { duration_seconds } = parseResult.data;
      const currentJourney = await journeyRepository.getJourney();

      const updatedJourney = TimingService.updateConfig(currentJourney, duration_seconds);
      const saved = await journeyRepository.updateJourney(updatedJourney);

      res.status(200).json({
        message: 'Journey configuration updated.',
        data: buildTelemetryResponse(saved),
      });
    } catch (err: any) {
      console.error('[AdminController.updateConfig] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message || 'Failed to update configuration.',
      });
    }
  }

  /**
   * POST /api/admin/auth/verify
   * Lightweight endpoint for the frontend admin panel to verify credentials
   */
  public static async verifyAuth(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      authenticated: true,
      role: 'admin',
      message: 'Admin credentials valid.',
    });
  }

  /**
   * GET /api/admin/journey/pnr
   */
  public static async getPnr(req: Request, res: Response): Promise<void> {
    try {
      const journey = await journeyRepository.getJourney();
      res.status(200).json({
        pnr_code: journey.pnr_code || 'JD-7842',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  }

  /**
   * PATCH /api/admin/journey/pnr
   */
  public static async updatePnr(req: Request, res: Response): Promise<void> {
    try {
      const parsed = UpdatePnrSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'ValidationError', message: parsed.error.errors[0].message });
        return;
      }

      const journey = await journeyRepository.getJourney();
      const normalizedPnr = PnrService.normalizePnr(parsed.data.pnr);
      const updated = {
        ...journey,
        pnr_code: normalizedPnr,
        pnr_hash: PnrService.hashPnr(normalizedPnr),
        updated_at: new Date().toISOString(),
      };

      await journeyRepository.updateJourney(updated);
      res.status(200).json({
        message: 'Journey PNR updated successfully.',
        pnr_code: updated.pnr_code,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  }
}
