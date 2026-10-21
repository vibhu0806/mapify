import { Request, Response } from 'express';
import { journeyRepository } from '../repositories/journeyRepository.js';
import { PnrService } from '../services/pnrService.js';
import { ValidatePnrSchema } from '../types/journey.js';

export class PnrController {
  /**
   * POST /api/pnr/validate
   * Validates a visitor's PNR against the active journey with rate-limiting and secure hashing.
   */
  public static async validatePnr(req: Request, res: Response): Promise<void> {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    // 1. Rate Limiting Check
    const rateCheck = PnrService.checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: 'RateLimitExceeded',
        message: `Too many invalid attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
      return;
    }

    // 2. Input validation
    const parsed = ValidatePnrSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid PNR or Passenger Last Name. Please verify your booking details.',
      });
      return;
    }

    const { pnr, lastName } = parsed.data;

    // Strict validation: Last name must match 'bhatnagar' (case-insensitive)
    if (lastName.trim().toLowerCase() !== 'bhatnagar') {
      PnrService.recordFailure(clientIp);
      res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid PNR or Passenger Last Name. Please verify your booking details.',
      });
      return;
    }

    try {
      const journey = await journeyRepository.getJourney();
      const storedHash = journey.pnr_hash || PnrService.hashPnr(journey.pnr_code || 'JD-7842');

      // 3. Constant-time cryptographic verification
      const isValid = PnrService.verifyPnr(pnr, storedHash);

      if (!isValid) {
        PnrService.recordFailure(clientIp);
        res.status(401).json({
          error: 'InvalidCredentials',
          message: 'Invalid PNR or Passenger Last Name. Please verify your booking details.',
        });
        return;
      }

      // 4. Success -> Reset rate limit & issue signed scoped session token
      PnrService.recordSuccess(clientIp);
      const pnrToken = PnrService.createSessionToken(journey.id);

      res.status(200).json({
        valid: true,
        journeyId: journey.id,
        pnrToken,
        message: 'PNR validated successfully.',
      });
    } catch (err: any) {
      console.error('[PnrController.validatePnr] Error:', err);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'An error occurred during verification. Please try again.',
      });
    }
  }

  /**
   * GET /api/pnr/verify-session
   * Checks if an existing PNR session token is valid and active.
   */
  public static async verifySession(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    const pnrHeader = req.headers['x-pnr-token'];

    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof pnrHeader === 'string') {
      token = pnrHeader.trim();
    }

    if (!token) {
      res.status(401).json({ valid: false, message: 'No token provided' });
      return;
    }

    const verification = PnrService.verifySessionToken(token);
    if (!verification.valid) {
      res.status(401).json({ valid: false, message: 'Session expired or invalid' });
      return;
    }

    res.status(200).json({ valid: true, journeyId: verification.journeyId });
  }
}
