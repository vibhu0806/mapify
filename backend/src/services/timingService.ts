import { Journey, JourneyStatus } from '../types/journey.js';

export interface CalculatedTiming {
  currentElapsedSeconds: number;
  progress: number;
  remainingSeconds: number;
  distanceTravelledMeters: number;
  distanceRemainingMeters: number;
  etaTimestamp: string | null;
  isCompleted: boolean;
}

export class TimingService {
  /**
   * Calculates the authoritative running elapsed time and progress for a journey.
   * Clamps progress strictly between 0.0 and 1.0.
   */
  public static calculateTiming(journey: Journey, referenceTime: Date = new Date()): CalculatedTiming {
    const totalDuration = Math.max(1, journey.duration_seconds);
    const totalDistance = Math.max(0, journey.total_distance_meters);
    const nowMs = referenceTime.getTime();

    let currentElapsed = 0;

    switch (journey.status) {
      case 'idle':
        currentElapsed = 0;
        break;

      case 'paused':
        currentElapsed = journey.elapsed_before_pause_seconds;
        break;

      case 'completed':
        currentElapsed = totalDuration;
        break;

      case 'running':
        if (journey.started_at) {
          const startedAtMs = new Date(journey.started_at).getTime();
          const deltaSeconds = Math.max(0, (nowMs - startedAtMs) / 1000);
          currentElapsed = journey.elapsed_before_pause_seconds + deltaSeconds;
        } else {
          currentElapsed = journey.elapsed_before_pause_seconds;
        }
        break;
    }

    // Clamp currentElapsed to totalDuration
    const isCompleted = currentElapsed >= totalDuration || journey.status === 'completed';
    const clampedElapsed = isCompleted ? totalDuration : Math.min(totalDuration, Math.max(0, currentElapsed));
    const progress = Math.min(1.0, Math.max(0.0, clampedElapsed / totalDuration));

    const remainingSeconds = Math.max(0, totalDuration - clampedElapsed);
    const distanceTravelledMeters = progress * totalDistance;
    const distanceRemainingMeters = Math.max(0, totalDistance - distanceTravelledMeters);

    let etaTimestamp: string | null = null;
    if (journey.status === 'running' && remainingSeconds > 0) {
      etaTimestamp = new Date(nowMs + remainingSeconds * 1000).toISOString();
    } else if (journey.status === 'completed') {
      etaTimestamp = journey.updated_at;
    }

    return {
      currentElapsedSeconds: Number(clampedElapsed.toFixed(2)),
      progress: Number(progress.toFixed(6)),
      remainingSeconds: Number(remainingSeconds.toFixed(2)),
      distanceTravelledMeters: Number(distanceTravelledMeters.toFixed(1)),
      distanceRemainingMeters: Number(distanceRemainingMeters.toFixed(1)),
      etaTimestamp,
      isCompleted,
    };
  }

  /**
   * Transition journey to 'running' from 'idle'
   */
  public static startJourney(journey: Journey, serverTime: Date = new Date()): Journey {
    if (journey.status !== 'idle') {
      throw new Error(`Cannot start journey from state '${journey.status}'. Must be 'idle'.`);
    }

    const nowIso = serverTime.toISOString();
    return {
      ...journey,
      status: 'running',
      started_at: nowIso,
      paused_at: null,
      elapsed_before_pause_seconds: 0,
      updated_at: nowIso,
    };
  }

  /**
   * Transition journey to 'paused' from 'running'
   */
  public static pauseJourney(journey: Journey, serverTime: Date = new Date()): Journey {
    if (journey.status !== 'running') {
      throw new Error(`Cannot pause journey from state '${journey.status}'. Must be 'running'.`);
    }

    const timing = this.calculateTiming(journey, serverTime);
    const nowIso = serverTime.toISOString();

    // If journey duration was reached, transition directly to completed
    if (timing.isCompleted) {
      return {
        ...journey,
        status: 'completed',
        started_at: journey.started_at,
        paused_at: null,
        elapsed_before_pause_seconds: journey.duration_seconds,
        updated_at: nowIso,
      };
    }

    return {
      ...journey,
      status: 'paused',
      started_at: null,
      paused_at: nowIso,
      elapsed_before_pause_seconds: timing.currentElapsedSeconds,
      updated_at: nowIso,
    };
  }

  /**
   * Transition journey to 'running' from 'paused'
   */
  public static resumeJourney(journey: Journey, serverTime: Date = new Date()): Journey {
    if (journey.status !== 'paused') {
      throw new Error(`Cannot resume journey from state '${journey.status}'. Must be 'paused'.`);
    }

    const nowIso = serverTime.toISOString();
    return {
      ...journey,
      status: 'running',
      started_at: nowIso,
      paused_at: null,
      updated_at: nowIso,
    };
  }

  /**
   * Reset journey back to 'idle'
   */
  public static resetJourney(journey: Journey, serverTime: Date = new Date()): Journey {
    const nowIso = serverTime.toISOString();
    return {
      ...journey,
      status: 'idle',
      started_at: null,
      paused_at: null,
      elapsed_before_pause_seconds: 0,
      updated_at: nowIso,
    };
  }

  /**
   * Update journey simulation configuration (duration)
   */
  public static updateConfig(journey: Journey, durationSeconds: number, serverTime: Date = new Date()): Journey {
    if (durationSeconds <= 0) {
      throw new Error('Simulation duration must be strictly positive');
    }

    const nowIso = serverTime.toISOString();

    // If running, recalculate elapsed so progress scales to new duration correctly
    if (journey.status === 'running') {
      const timing = this.calculateTiming(journey, serverTime);
      const isCompleted = timing.currentElapsedSeconds >= durationSeconds;

      return {
        ...journey,
        duration_seconds: durationSeconds,
        status: isCompleted ? 'completed' : 'running',
        elapsed_before_pause_seconds: timing.currentElapsedSeconds,
        started_at: isCompleted ? null : nowIso,
        updated_at: nowIso,
      };
    }

    return {
      ...journey,
      duration_seconds: durationSeconds,
      updated_at: nowIso,
    };
  }
}
