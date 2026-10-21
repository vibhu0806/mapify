import { describe, it, expect } from 'vitest';
import { TimingService } from './timingService.js';
import { Journey } from '../types/journey.js';

describe('TimingService', () => {
  const mockBaseJourney: Journey = {
    id: 'test-journey-1',
    origin: 'Jaipur, Rajasthan',
    destination: 'Dehradun, Uttarakhand',
    status: 'idle',
    started_at: null,
    paused_at: null,
    elapsed_before_pause_seconds: 0,
    duration_seconds: 1000, // 1000 seconds for easy arithmetic
    total_distance_meters: 500000, // 500 km
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  };

  it('calculates 0 progress and elapsed time when status is idle', () => {
    const timing = TimingService.calculateTiming(mockBaseJourney);
    expect(timing.currentElapsedSeconds).toBe(0);
    expect(timing.progress).toBe(0);
    expect(timing.distanceTravelledMeters).toBe(0);
    expect(timing.distanceRemainingMeters).toBe(500000);
    expect(timing.isCompleted).toBe(false);
  });

  it('starts journey from idle into running state', () => {
    const startRef = new Date('2026-01-01T10:00:00Z');
    const running = TimingService.startJourney(mockBaseJourney, startRef);

    expect(running.status).toBe('running');
    expect(running.started_at).toBe(startRef.toISOString());
    expect(running.elapsed_before_pause_seconds).toBe(0);
  });

  it('rejects starting journey if not in idle state', () => {
    const runningJourney: Journey = { ...mockBaseJourney, status: 'running' };
    expect(() => TimingService.startJourney(runningJourney)).toThrowError();
  });

  it('advances elapsed time accurately based on server timestamp delta', () => {
    const startRef = new Date('2026-01-01T10:00:00Z');
    const running = TimingService.startJourney(mockBaseJourney, startRef);

    // 250 seconds later (25% progress)
    const checkRef = new Date('2026-01-01T10:04:10Z');
    const timing = TimingService.calculateTiming(running, checkRef);

    expect(timing.currentElapsedSeconds).toBe(250);
    expect(timing.progress).toBe(0.25);
    expect(timing.distanceTravelledMeters).toBe(125000);
    expect(timing.distanceRemainingMeters).toBe(375000);
    expect(timing.remainingSeconds).toBe(750);
    expect(timing.isCompleted).toBe(false);
  });

  it('pauses running journey and freezes elapsed time', () => {
    const startRef = new Date('2026-01-01T10:00:00Z');
    const running = TimingService.startJourney(mockBaseJourney, startRef);

    // Pause 300 seconds into the simulation
    const pauseRef = new Date('2026-01-01T10:05:00Z');
    const paused = TimingService.pauseJourney(running, pauseRef);

    expect(paused.status).toBe('paused');
    expect(paused.started_at).toBeNull();
    expect(paused.paused_at).toBe(pauseRef.toISOString());
    expect(paused.elapsed_before_pause_seconds).toBe(300);

    // Check timing 1 hour later while still paused - progress must remain frozen at 300s
    const laterRef = new Date('2026-01-01T11:05:00Z');
    const timing = TimingService.calculateTiming(paused, laterRef);

    expect(timing.currentElapsedSeconds).toBe(300);
    expect(timing.progress).toBe(0.3);
    expect(timing.distanceTravelledMeters).toBe(150000);
  });

  it('resumes journey from exact previous position and accumulated time', () => {
    const pausedJourney: Journey = {
      ...mockBaseJourney,
      status: 'paused',
      paused_at: '2026-01-01T10:05:00Z',
      elapsed_before_pause_seconds: 300,
    };

    // Resume at 10:20:00
    const resumeRef = new Date('2026-01-01T10:20:00Z');
    const resumed = TimingService.resumeJourney(pausedJourney, resumeRef);

    expect(resumed.status).toBe('running');
    expect(resumed.started_at).toBe(resumeRef.toISOString());
    expect(resumed.elapsed_before_pause_seconds).toBe(300);

    // Check timing 100 seconds after resume (total 400s)
    const checkRef = new Date('2026-01-01T10:21:40Z');
    const timing = TimingService.calculateTiming(resumed, checkRef);

    expect(timing.currentElapsedSeconds).toBe(400);
    expect(timing.progress).toBe(0.4);
    expect(timing.distanceTravelledMeters).toBe(200000);
  });

  it('clamps progress to 100% and completes when total duration reached', () => {
    const startRef = new Date('2026-01-01T10:00:00Z');
    const running = TimingService.startJourney(mockBaseJourney, startRef);

    // Check at 1000s and 1500s (exceeded duration)
    const exceededRef = new Date('2026-01-01T10:25:00Z'); // 1500s
    const timing = TimingService.calculateTiming(running, exceededRef);

    expect(timing.currentElapsedSeconds).toBe(1000);
    expect(timing.progress).toBe(1.0);
    expect(timing.distanceTravelledMeters).toBe(500000);
    expect(timing.distanceRemainingMeters).toBe(0);
    expect(timing.remainingSeconds).toBe(0);
    expect(timing.isCompleted).toBe(true);
  });

  it('resets journey back to idle', () => {
    const activeJourney: Journey = {
      ...mockBaseJourney,
      status: 'running',
      started_at: '2026-01-01T10:00:00Z',
      elapsed_before_pause_seconds: 450,
    };

    const reset = TimingService.resetJourney(activeJourney);
    expect(reset.status).toBe('idle');
    expect(reset.started_at).toBeNull();
    expect(reset.paused_at).toBeNull();
    expect(reset.elapsed_before_pause_seconds).toBe(0);
  });
});
