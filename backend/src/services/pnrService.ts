import crypto from 'crypto';
import { config } from '../config/index.js';

const PNR_SECRET = config.adminSecret || 'pnr_signing_secret_jaipur_dehradun_2026';

export interface PnrSession {
  journeyId: string;
  exp: number;
  iat: number;
}

export class PnrService {
  // In-memory sliding window rate limiter: IP -> { failures: number, resetAt: number }
  private static rateLimitMap = new Map<string, { failures: number; resetAt: number }>();

  /**
   * Normalizes a PNR string by trimming, removing excessive internal spacing, and converting to uppercase.
   */
  public static normalizePnr(pnr: string): string {
    return pnr.trim().toUpperCase().replace(/\s+/g, '-');
  }

  /**
   * Cryptographic SHA-256 hash of a normalized PNR.
   */
  public static hashPnr(pnr: string): string {
    const normalized = this.normalizePnr(pnr);
    return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  }

  /**
   * Constant-time comparison between input PNR and stored hash to prevent timing attacks.
   */
  public static verifyPnr(inputPnr: string, storedHash: string): boolean {
    if (!inputPnr || !storedHash) return false;
    const computedHash = this.hashPnr(inputPnr);

    try {
      const bufA = Buffer.from(computedHash, 'hex');
      const bufB = Buffer.from(storedHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Generates a signed HMAC-SHA256 session token for an authorized visitor.
   * Valid for 24 hours.
   */
  public static createSessionToken(journeyId: string): string {
    const payload: PnrSession = {
      journeyId,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', PNR_SECRET)
      .update(payloadB64)
      .digest('base64url');

    return `${payloadB64}.${signature}`;
  }

  /**
   * Validates a signed PNR session token and returns the authorized journeyId.
   */
  public static verifySessionToken(token: string): { valid: boolean; journeyId?: string } {
    if (!token || typeof token !== 'string') return { valid: false };

    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, providedSig] = parts;

    try {
      const expectedSig = crypto
        .createHmac('sha256', PNR_SECRET)
        .update(payloadB64)
        .digest('base64url');

      const bufA = Buffer.from(providedSig);
      const bufB = Buffer.from(expectedSig);
      if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
        return { valid: false };
      }

      const payload: PnrSession = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

      if (Date.now() > payload.exp) {
        return { valid: false }; // Expired
      }

      return { valid: true, journeyId: payload.journeyId };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Rate limiting check for PNR validation attempts per client IP.
   * Max 5 failed attempts per 10 minutes.
   */
  public static checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
    const now = Date.now();
    const entry = this.rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      // Window expired or new IP
      this.rateLimitMap.set(ip, { failures: 0, resetAt: now + 10 * 60 * 1000 });
      return { allowed: true, remainingAttempts: 5 };
    }

    if (entry.failures >= 5) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    return { allowed: true, remainingAttempts: 5 - entry.failures };
  }

  /**
   * Record a failed attempt for rate limiting.
   */
  public static recordFailure(ip: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
      this.rateLimitMap.set(ip, { failures: 1, resetAt: now + 10 * 60 * 1000 });
    } else {
      entry.failures += 1;
    }
  }

  /**
   * Reset failures on successful validation.
   */
  public static recordSuccess(ip: string): void {
    this.rateLimitMap.delete(ip);
  }
}
