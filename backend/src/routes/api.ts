import { Router } from 'express';
import { JourneyController } from '../controllers/journeyController.js';
import { AdminController } from '../controllers/adminController.js';
import { PnrController } from '../controllers/pnrController.js';
import { requireAdminAuth, requirePnrOrAdminAuth } from '../middleware/auth.js';

export const apiRouter = Router();

// Public PNR Access Endpoints
apiRouter.post('/pnr/validate', PnrController.validatePnr);
apiRouter.get('/pnr/verify-session', PnrController.verifySession);

// Route Geometry (Public)
apiRouter.get('/route', JourneyController.getRoute);

// Authoritative Journey Telemetry (Protected by valid PNR session or Admin credentials)
apiRouter.get('/journey', requirePnrOrAdminAuth, JourneyController.getJourney);

// Admin Endpoints (Protected by requireAdminAuth)
apiRouter.post('/admin/auth/verify', requireAdminAuth, AdminController.verifyAuth);
apiRouter.get('/admin/journey/pnr', requireAdminAuth, AdminController.getPnr);
apiRouter.patch('/admin/journey/pnr', requireAdminAuth, AdminController.updatePnr);
apiRouter.post('/admin/journey/start', requireAdminAuth, AdminController.startJourney);
apiRouter.post('/admin/journey/pause', requireAdminAuth, AdminController.pauseJourney);
apiRouter.post('/admin/journey/resume', requireAdminAuth, AdminController.resumeJourney);
apiRouter.post('/admin/journey/reset', requireAdminAuth, AdminController.resetJourney);
apiRouter.patch('/admin/journey/config', requireAdminAuth, AdminController.updateConfig);
