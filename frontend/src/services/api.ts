import { JourneyTelemetry, RouteData } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const PNR_STORAGE_KEY = 'jaipur_dehradun_pnr_token';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || data.error || `HTTP ${res.status}`;
    throw new ApiError(errorMsg, res.status, data);
  }
  return data as T;
}

export const api = {
  // PNR Storage Helpers
  getPnrToken(): string | null {
    return sessionStorage.getItem(PNR_STORAGE_KEY) || localStorage.getItem(PNR_STORAGE_KEY);
  },

  setPnrToken(token: string): void {
    sessionStorage.setItem(PNR_STORAGE_KEY, token);
    localStorage.setItem(PNR_STORAGE_KEY, token);
  },

  clearPnrToken(): void {
    sessionStorage.removeItem(PNR_STORAGE_KEY);
    localStorage.removeItem(PNR_STORAGE_KEY);
  },

  // Public PNR Validation
  async validatePnr(pnr: string, lastName: string): Promise<{ valid: boolean; journeyId: string; pnrToken: string }> {
    const res = await fetch(`${API_BASE}/pnr/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pnr, lastName }),
    });
    const result = await handleResponse<{ valid: boolean; journeyId: string; pnrToken: string }>(res);
    if (result.pnrToken) {
      this.setPnrToken(result.pnrToken);
    }
    return result;
  },

  async verifyPnrSession(token?: string): Promise<boolean> {
    const authToken = token || this.getPnrToken();
    if (!authToken) return false;

    try {
      const res = await fetch(`${API_BASE}/pnr/verify-session`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Public Route Geometry
  async getRoute(): Promise<RouteData> {
    const res = await fetch(`${API_BASE}/route`);
    return handleResponse<RouteData>(res);
  },

  // Authoritative Journey Telemetry (Requires PNR Token or Admin Token)
  async getJourney(): Promise<JourneyTelemetry> {
    const headers: Record<string, string> = {};
    const pnrToken = this.getPnrToken();
    const adminToken = sessionStorage.getItem('jaipur_dehradun_admin_token');

    if (pnrToken) {
      headers['Authorization'] = `Bearer ${pnrToken}`;
    } else if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const res = await fetch(`${API_BASE}/journey`, { headers });
    return handleResponse<JourneyTelemetry>(res);
  },

  // Admin Verification
  async verifyAdminAuth(token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/auth/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return res.ok;
  },

  // Admin PNR Management
  async adminGetPnr(token: string): Promise<string> {
    const res = await fetch(`${API_BASE}/admin/journey/pnr`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await handleResponse<{ pnr_code: string }>(res);
    return data.pnr_code;
  },

  async adminUpdatePnr(token: string, pnr: string): Promise<string> {
    const res = await fetch(`${API_BASE}/admin/journey/pnr`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pnr }),
    });
    const data = await handleResponse<{ pnr_code: string }>(res);
    return data.pnr_code;
  },

  // Admin Simulation Controls
  async startJourney(token: string): Promise<JourneyTelemetry> {
    const res = await fetch(`${API_BASE}/admin/journey/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await handleResponse<{ message: string; data: JourneyTelemetry }>(res);
    return result.data;
  },

  async pauseJourney(token: string): Promise<JourneyTelemetry> {
    const res = await fetch(`${API_BASE}/admin/journey/pause`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await handleResponse<{ message: string; data: JourneyTelemetry }>(res);
    return result.data;
  },

  async resumeJourney(token: string): Promise<JourneyTelemetry> {
    const res = await fetch(`${API_BASE}/admin/journey/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await handleResponse<{ message: string; data: JourneyTelemetry }>(res);
    return result.data;
  },

  async resetJourney(token: string, confirm = true): Promise<JourneyTelemetry> {
    const res = await fetch(`${API_BASE}/admin/journey/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirm }),
    });
    const result = await handleResponse<{ message: string; data: JourneyTelemetry }>(res);
    return result.data;
  },

  async updateConfig(token: string, durationSeconds: number): Promise<JourneyTelemetry> {
    const res = await fetch(`${API_BASE}/admin/journey/config`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration_seconds: durationSeconds }),
    });
    const result = await handleResponse<{ message: string; data: JourneyTelemetry }>(res);
    return result.data;
  },
};
