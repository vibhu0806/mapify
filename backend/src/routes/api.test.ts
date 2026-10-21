import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { config } from '../config/index.js';

describe('Authoritative REST API Endpoints with PNR Access', () => {
  const adminSecret = config.adminSecret;
  let validPnrToken = '';

  beforeAll(async () => {
    // Reset journey to idle and ensure default PNR 'JD-7842'
    await request(app)
      .post('/api/admin/journey/reset')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ confirm: true });

    await request(app)
      .patch('/api/admin/journey/pnr')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ pnr: 'JD-7842' });

    // Validate default PNR 'JD-7842' and passenger last name 'bhatnagar'
    const pnrRes = await request(app)
      .post('/api/pnr/validate')
      .send({ pnr: 'JD-7842', lastName: 'bhatnagar' });

    expect(pnrRes.status).toBe(200);
    validPnrToken = pnrRes.body.pnrToken;
  });

  afterAll(async () => {
    await request(app)
      .post('/api/admin/journey/reset')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ confirm: true });
  });

  it('Validates correct PNR with matching last name bhatnagar', async () => {
    const res = await request(app)
      .post('/api/pnr/validate')
      .send({ pnr: 'jd 7842', lastName: 'Bhatnagar' }); // case-insensitive check

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.pnrToken).toBeDefined();
  });

  it('Rejects valid PNR if last name is not bhatnagar', async () => {
    const res = await request(app)
      .post('/api/pnr/validate')
      .send({ pnr: 'JD-7842', lastName: 'Sharma' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('InvalidCredentials');
    expect(res.body.message).toContain('Invalid PNR or Passenger Last Name');
  });

  it('Rejects invalid PNR with discreet error message', async () => {
    const res = await request(app)
      .post('/api/pnr/validate')
      .send({ pnr: 'WRONG-PNR-9999', lastName: 'bhatnagar' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('InvalidCredentials');
    expect(res.body.message).toContain('Invalid PNR or Passenger Last Name');
  });

  it('Verifies valid PNR session token via /api/pnr/verify-session', async () => {
    const res = await request(app)
      .get('/api/pnr/verify-session')
      .set('Authorization', `Bearer ${validPnrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('Rejects unauthorized visitor without PNR token on /api/journey', async () => {
    const res = await request(app).get('/api/journey');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('Allows authorized visitor with valid PNR token to access telemetry', async () => {
    const res = await request(app)
      .get('/api/journey')
      .set('Authorization', `Bearer ${validPnrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.journey).toBeDefined();
    expect(res.body.simulation).toBeDefined();
    expect(res.body.vehicle).toBeDefined();
    expect(res.body.journey.origin).toContain('Jaipur');
    expect(res.body.journey.destination).toContain('Dehradun');
    // Does not leak admin credentials or sensitive internal hash
    expect(res.body.adminSecret).toBeUndefined();
    expect(res.body.pnr_hash).toBeUndefined();
  });

  it('Allows administrator with admin secret to access telemetry', async () => {
    const res = await request(app)
      .get('/api/journey')
      .set('Authorization', `Bearer ${adminSecret}`);

    expect(res.status).toBe(200);
    expect(res.body.journey.id).toBeDefined();
  });

  it('GET /api/route returns full road geometry publicly', async () => {
    const res = await request(app).get('/api/route');
    expect(res.status).toBe(200);
    expect(res.body.polyline).toBeDefined();
    expect(res.body.points.length).toBeGreaterThan(50);
  });

  it('Allows administrator to view and update journey PNR', async () => {
    // 1. Get current PNR
    const getRes = await request(app)
      .get('/api/admin/journey/pnr')
      .set('Authorization', `Bearer ${adminSecret}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.pnr_code).toBe('JD-7842');

    // 2. Update PNR
    const patchRes = await request(app)
      .patch('/api/admin/journey/pnr')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ pnr: 'JD-9999' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.pnr_code).toBe('JD-9999');

    // 3. Verify new PNR validates and old PNR fails
    const oldPnrRes = await request(app)
      .post('/api/pnr/validate')
      .send({ pnr: 'JD-7842', lastName: 'bhatnagar' });
    expect(oldPnrRes.status).toBe(401);

    const newPnrRes = await request(app)
      .post('/api/pnr/validate')
      .send({ pnr: 'JD-9999', lastName: 'bhatnagar' });
    expect(newPnrRes.status).toBe(200);

    // Restore PNR back to JD-7842 for consistency
    await request(app)
      .patch('/api/admin/journey/pnr')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ pnr: 'JD-7842' });
  });

  it('Rejects unauthenticated admin access with 401', async () => {
    const res = await request(app).post('/api/admin/journey/start');
    expect(res.status).toBe(401);
  });

  it('Starts, pauses, resumes and resets journey with admin authorization', async () => {
    // Start
    const startRes = await request(app)
      .post('/api/admin/journey/start')
      .set('Authorization', `Bearer ${adminSecret}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.journey.status).toBe('running');

    // Duplicate start rejected
    const dupRes = await request(app)
      .post('/api/admin/journey/start')
      .set('Authorization', `Bearer ${adminSecret}`);
    expect(dupRes.status).toBe(409);

    // Pause
    const pauseRes = await request(app)
      .post('/api/admin/journey/pause')
      .set('Authorization', `Bearer ${adminSecret}`);
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.data.journey.status).toBe('paused');

    // Resume
    const resumeRes = await request(app)
      .post('/api/admin/journey/resume')
      .set('Authorization', `Bearer ${adminSecret}`);
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.journey.status).toBe('running');

    // Reset with confirmation
    const resetRes = await request(app)
      .post('/api/admin/journey/reset')
      .set('Authorization', `Bearer ${adminSecret}`)
      .send({ confirm: true });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.journey.status).toBe('idle');
  });
});
