import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Journey } from '../types/journey.js';
import { config } from '../config/index.js';

import { RouteService } from '../services/routeService.js';
import { PnrService } from '../services/pnrService.js';

export interface IJourneyRepository {
  getJourney(): Promise<Journey>;
  updateJourney(journey: Journey): Promise<Journey>;
}

const DEFAULT_JOURNEY: Journey = {
  id: '00000000-0000-0000-0000-000000000001',
  origin: 'Jaipur, Rajasthan',
  destination: 'Dehradun, Uttarakhand',
  status: 'idle',
  started_at: null,
  paused_at: null,
  elapsed_before_pause_seconds: 0.0,
  duration_seconds: 39600.0, // 11 hours default (Jaipur to Dehradun)
  total_distance_meters: RouteService.getRoute().totalDistanceMeters,
  pnr_code: 'JD-7842',
  pnr_hash: PnrService.hashPnr('JD-7842'),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Local file-backed repository.
 * Persists journey state across server restarts to a local JSON file.
 */
export class LocalJourneyRepository implements IJourneyRepository {
  private filePath: string;
  private inMemoryCache: Journey | null = null;

  constructor(filePath?: string) {
    if (filePath) {
      this.filePath = filePath;
    } else {
      const candidates = [
        path.resolve(process.cwd(), 'data', 'journey.json'),
        path.resolve(process.cwd(), 'backend', 'data', 'journey.json'),
      ];
      const found = candidates.find((p) => fs.existsSync(p));
      this.filePath = found || (fs.existsSync(path.resolve(process.cwd(), 'backend'))
        ? path.resolve(process.cwd(), 'backend', 'data', 'journey.json')
        : path.resolve(process.cwd(), 'data', 'journey.json'));
    }
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify(DEFAULT_JOURNEY, null, 2), 'utf8');
        this.inMemoryCache = { ...DEFAULT_JOURNEY };
      } else {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.pnr_hash) {
          parsed.pnr_code = parsed.pnr_code || 'JD-7842';
          parsed.pnr_hash = PnrService.hashPnr(parsed.pnr_code);
          fs.writeFileSync(this.filePath, JSON.stringify(parsed, null, 2), 'utf8');
        }
        this.inMemoryCache = parsed;
      }
    } catch (err) {
      console.warn('[LocalJourneyRepository] File init warning, using memory cache:', err);
      this.inMemoryCache = { ...DEFAULT_JOURNEY };
    }
  }

  public async getJourney(): Promise<Journey> {
    if (!this.inMemoryCache) {
      this.ensureInitialized();
    }
    return { ...this.inMemoryCache! };
  }

  public async updateJourney(journey: Journey): Promise<Journey> {
    const updated: Journey = {
      ...journey,
      updated_at: new Date().toISOString(),
    };
    this.inMemoryCache = updated;

    try {
      fs.writeFileSync(this.filePath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (err) {
      console.error('[LocalJourneyRepository] Failed to write journey to disk:', err);
    }

    return { ...updated };
  }
}

/**
 * Supabase PostgreSQL repository.
 * Uses authoritative Supabase client with service_role key to manage journey records.
 */
export class SupabaseJourneyRepository implements IJourneyRepository {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  public async getJourney(): Promise<Journey> {
    const { data, error } = await this.client
      .from('journeys')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    if (!data) {
      console.log('[SupabaseJourneyRepository] Table empty, seeding default 11-hour journey...');
      return await this.updateJourney(DEFAULT_JOURNEY);
    }

    return {
      id: data.id,
      origin: data.origin,
      destination: data.destination,
      status: data.status,
      started_at: data.started_at,
      paused_at: data.paused_at,
      elapsed_before_pause_seconds: Number(data.elapsed_before_pause_seconds),
      duration_seconds: Number(data.duration_seconds),
      total_distance_meters: Number(data.total_distance_meters),
      pnr_code: data.pnr_code || 'JD-7842',
      pnr_hash: data.pnr_hash || PnrService.hashPnr(data.pnr_code || 'JD-7842'),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  public async updateJourney(journey: Journey): Promise<Journey> {
    const { data, error } = await this.client
      .from('journeys')
      .upsert({
        id: journey.id,
        origin: journey.origin,
        destination: journey.destination,
        status: journey.status,
        started_at: journey.started_at,
        paused_at: journey.paused_at,
        elapsed_before_pause_seconds: journey.elapsed_before_pause_seconds,
        duration_seconds: journey.duration_seconds,
        total_distance_meters: journey.total_distance_meters,
        pnr_code: journey.pnr_code || 'JD-7842',
        pnr_hash: journey.pnr_hash || PnrService.hashPnr(journey.pnr_code || 'JD-7842'),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Supabase update failed: ${error?.message || 'Update returned empty'}`);
    }

    return {
      id: data.id,
      origin: data.origin,
      destination: data.destination,
      status: data.status,
      started_at: data.started_at,
      paused_at: data.paused_at,
      elapsed_before_pause_seconds: Number(data.elapsed_before_pause_seconds),
      duration_seconds: Number(data.duration_seconds),
      total_distance_meters: Number(data.total_distance_meters),
      pnr_code: data.pnr_code,
      pnr_hash: data.pnr_hash,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

/**
 * Composite repository that prefers Supabase if configured and reachable,
 * falling back gracefully to persistent local file storage.
 */
export class JourneyRepository implements IJourneyRepository {
  private localRepo: LocalJourneyRepository;
  private supabaseRepo: SupabaseJourneyRepository | null = null;
  private isUsingSupabase = false;
  private lastSupabaseFailure = 0;
  private readonly cooldownMs = 30000; // 30s cooldown after connection failure

  constructor() {
    this.localRepo = new LocalJourneyRepository();

    if (config.supabase.url && config.supabase.serviceRoleKey) {
      try {
        this.supabaseRepo = new SupabaseJourneyRepository(
          config.supabase.url,
          config.supabase.serviceRoleKey
        );
        this.isUsingSupabase = true;
        console.log('[JourneyRepository] Configured with Supabase PostgreSQL:', config.supabase.url);
      } catch (err) {
        console.warn('[JourneyRepository] Failed to initialize Supabase client:', err);
      }
    } else {
      console.log('[JourneyRepository] Supabase credentials not set, using persistent local storage');
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Supabase operation timed out after ${ms}ms`)), ms)
      ),
    ]);
  }

  private canTrySupabase(): boolean {
    if (!this.isUsingSupabase || !this.supabaseRepo) return false;
    if (this.lastSupabaseFailure > 0 && Date.now() - this.lastSupabaseFailure < this.cooldownMs) {
      return false; // In cooldown, use local storage
    }
    return true;
  }

  public async getJourney(): Promise<Journey> {
    if (this.canTrySupabase()) {
      try {
        return await this.withTimeout(this.supabaseRepo!.getJourney(), 3000);
      } catch (err: any) {
        this.lastSupabaseFailure = Date.now();
        console.warn('[JourneyRepository] Supabase get failed, falling back to local storage:', err?.message || err);
      }
    }
    return this.localRepo.getJourney();
  }

  public async updateJourney(journey: Journey): Promise<Journey> {
    if (this.canTrySupabase()) {
      try {
        return await this.withTimeout(this.supabaseRepo!.updateJourney(journey), 3000);
      } catch (err: any) {
        this.lastSupabaseFailure = Date.now();
        console.warn('[JourneyRepository] Supabase update failed, falling back to local storage:', err?.message || err);
      }
    }
    return this.localRepo.updateJourney(journey);
  }
}

export const journeyRepository = new JourneyRepository();
