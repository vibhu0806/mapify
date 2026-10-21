import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { PnrService } from '../services/pnrService.js';

let supabaseAuthClient: any = null;
if (config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
  supabaseAuthClient = createClient(config.supabase.url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Authentication middleware for administrator routes.
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const adminKeyHeader = req.headers['x-admin-key'];

  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof adminKeyHeader === 'string' && adminKeyHeader.trim().length > 0) {
    token = adminKeyHeader.trim();
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authorization token required.',
    });
    return;
  }

  // Check 1: Direct match with server-configured ADMIN_SECRET
  if (token === config.adminSecret) {
    return next();
  }

  // Check 2: Verify Supabase Auth JWT token if Supabase is configured
  if (supabaseAuthClient) {
    try {
      const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
      if (user && !error) {
        return next();
      }
    } catch (err) {
      // Token verification failed
    }
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'Invalid administrative credentials.',
  });
}

/**
 * Access guard for journey telemetry.
 * Requires either:
 * 1. A valid PNR signed session token (for visitors)
 * 2. An admin authorization token (for administrators)
 */
export async function requirePnrOrAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const pnrHeader = req.headers['x-pnr-token'];
  const adminKeyHeader = req.headers['x-admin-key'];

  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof pnrHeader === 'string' && pnrHeader.trim().length > 0) {
    token = pnrHeader.trim();
  } else if (typeof adminKeyHeader === 'string' && adminKeyHeader.trim().length > 0) {
    token = adminKeyHeader.trim();
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid PNR session required to access journey tracking.',
    });
    return;
  }

  // Check 1: Admin secret
  if (token === config.adminSecret) {
    (req as any).isAdmin = true;
    return next();
  }

  // Check 2: PNR signed session token
  const pnrVerification = PnrService.verifySessionToken(token);
  if (pnrVerification.valid && pnrVerification.journeyId) {
    (req as any).authorizedJourneyId = pnrVerification.journeyId;
    return next();
  }

  // Check 3: Supabase Auth
  if (supabaseAuthClient) {
    try {
      const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
      if (user && !error) {
        (req as any).isAdmin = true;
        return next();
      }
    } catch {
      // Fall through to unauthorized
    }
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid or expired PNR tracking session. Please re-enter your PNR.',
  });
}
