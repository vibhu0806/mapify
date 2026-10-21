# Minimalist Jaipur → Dehradun Vehicle Tracking System

A full-stack, minimalist geospatial telemetry application providing a synchronized simulation of a vehicle travelling from **Jaipur, Rajasthan** to **Dehradun, Uttarakhand** along an actual highway corridor (~485–534 km via NH 48, Delhi-NCR Bypass, Delhi-Meerut Expressway, and NH 334).

Built with a clean minimalist visual aesthetic, an authoritative backend state machine, sub-frame interpolation, Leaflet with OpenStreetMap tiles, OSRM road route calculation, and a protected administrative mission control.

---

## 1. Visual & Design Philosophy

The interface is engineered around automotive telemetry principles rather than commercial bus booking or generic dashboards:
- **Palette**: Deep near-black background (`#0A0A0A` / `#0A0A0C`), muted dark surfaces (`#121212`, `#16161B`), restrained neutral text (`#F5F5F5`, `#858585`), and a single focused green accent (`#10B981`) for active transit telemetry.
- **Conventional Road Map**: Standard, familiar OpenStreetMap-based tiles for roads, cities, topography, and labels without distracting 3D gimmicks.
- **Minimalist PNR Access**: Public visitors land on a minimal, distraction-free PNR verification page before accessing the telemetry dashboard.
- **Top Navigation**: Product wordmark, real-time journey status indicator (`AWAITING DEPARTURE`, `IN TRANSIT`, `SIMULATION PAUSED`, `JOURNEY COMPLETED`), session exit control, and understated administrative portal access.
- **Floating Telemetry Strip**: Compact bottom dock displaying corridor (`JAIPUR → DEHRADUN`), elapsed running time, distance remaining, estimated arrival time (ETA), and progress percentage.
- **Geospatial Vehicle Marker**: Automotive vehicle marker rotated to match travel heading with smooth `requestAnimationFrame` interpolation.

---

## 2. PNR Visitor Access Model

1. **Initial Entry**: Navigating to `http://localhost:3000/` presents the clean, centered **"Track your journey"** form.
2. **Access Identifier**: Enter the valid journey PNR (Default Seed: `JD-7842`).
3. **Cryptographic Validation**: The backend validates the PNR using a constant-time SHA-256 hash comparison and sliding-window rate limiter (5 failed attempts per IP per 10 minutes).
4. **Session Token**: On successful validation, the backend issues an HMAC-SHA256 signed session token granting scoped telemetry access for the authorized journey without leaking database secrets or valid PNR lists.
5. **Session Persistence**: The PNR session persists across page refreshes and navigation. An "EXIT" button in the top navigation allows terminating the session at any time.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with custom minimalist dark tokens
- **Map & Visualization**: 
  - **Leaflet** (`leaflet@1.9.4`) with **React-Leaflet** (`react-leaflet@4.2.1`)
  - **OpenStreetMap** standard road tiles with full attribution
  - Dynamic vehicle marker orientation with smooth interpolation
- **Icons & Routing**: Lucide React, React Router v6

### Backend
- **Runtime**: Node.js v20+ with Express and TypeScript
- **Routing Engine**: OSRM (Open Source Routing Machine) API integration with resilient highway fallback
- **State Machine**: Deterministic timestamp-based journey arithmetic
- **Persistence**: Supabase PostgreSQL with local JSON persistence fallback
- **Validation & Security**: Zod runtime schema validation, Bearer token auth, CORS
- **Testing**: Vitest with Supertest

---

## 4. Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
From the repository root:
```bash
# 1. Install root dependencies
npm install

# 2. Install backend & frontend packages
npm install --prefix backend
npm install --prefix frontend
```

### Environment Configuration
Copy `.env.example` into both `backend/.env` and `frontend/.env`:

```bash
# Backend (.env)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
ADMIN_SECRET=admin_jaipur_dehradun_secure_key_2026
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OSRM_ROUTER_URL=https://router.project-osrm.org

# Frontend (.env)
VITE_API_BASE_URL=/api
VITE_TILE_LAYER_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

> **Note**: Both Supabase and OSRM router keys are optional for local development. The backend includes a persistent local JSON store and precomputed highway fallback, while the frontend renders standard OpenStreetMap road tiles directly.

### Launching Development Servers
Run backend and frontend concurrently:
```bash
# Run both servers
npm run dev

# Or run separately:
npm run dev:backend   # Express API on http://localhost:3001
npm run dev:frontend  # Vite React App on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Administrative Mission Control (`/admin`)

To access administrative simulation controls:
1. Navigate to [http://localhost:3000/admin](http://localhost:3000/admin).
2. Enter the administrator secret key:
   ```text
   admin_jaipur_dehradun_secure_key_2026
   ```
3. Actions available:
   - **Start Journey**: Transitions status to `running`. Records server start timestamp.
   - **Pause Journey**: Freezes elapsed time and vehicle marker.
   - **Resume Journey**: Re-anchors server time reference and resumes smoothly from the exact pause point.
   - **Reset Journey**: Returns journey to `idle` (requires explicit modal confirmation).
   - **Simulation Duration Presets**: Rapidly test the simulation with preset durations:
     - `5 Mins (Fast Test)`
     - `30 Mins (Demo)`
     - `2 Hours`
     - `6 Hours (Realistic)`
   - **Journey PNR Key**: View and rotate the active journey's PNR code.

---

## 6. Authoritative Simulation & Geospatial Mathematics

### 1. Timing Model
The backend is the authoritative source of truth. Progress is calculated using deterministic timestamps:
$$p = \min\left(1.0, \max\left(0.0, \frac{t}{T}\right)\right)$$
Where:
- $T$ = configured simulation duration in seconds (`duration_seconds`).
- $t$ = accumulated running time in seconds (`elapsed_before_pause_seconds + (now - started_at)`).

### 2. Distance & Position Projection
Given total route road distance $D$:
$$d = p \times D$$
The routing engine performs a binary search over precomputed cumulative waypoint distances to locate the active highway segment $[P_i, P_{i+1}]$ and interpolates the precise spherical coordinates $(lat, lng)$.

### 3. Forward Azimuth (Vehicle Heading)
The marker orientation is dynamically aligned with the direction of travel using the forward azimuth formula:
$$\theta = \operatorname{atan2}\left(\sin(\Delta \lambda)\cos(\phi_2), \cos(\phi_1)\sin(\phi_2) - \sin(\phi_1)\cos(\phi_2)\cos(\Delta \lambda)\right)$$

### 4. Client-Side Smooth Interpolation
Clients poll `GET /api/journey` every 3–4 seconds to synchronize server time offset. Between poll cycles, `requestAnimationFrame` performs continuous sub-frame interpolation so vehicle movement is 60+ FPS without jumping.

---

## 7. REST API Specification

### Public PNR & Telemetry Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pnr/validate` | Validates visitor PNR with rate limiting and returns signed session token. |
| `GET` | `/api/pnr/verify-session` | Verifies whether an existing PNR session token remains valid. |
| `GET` | `/api/journey` | Returns authoritative journey state, progress, remaining distance, ETA, and vehicle position (*requires valid PNR session or Admin token*). |
| `GET` | `/api/route` | Returns road route geometry, encoded polyline, and precomputed cumulative distance tables. |
| `GET` | `/health` | Health check probe. |

### Administrator Endpoints (Protected)
*Requires `Authorization: Bearer <ADMIN_SECRET>` header.*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/verify` | Validates admin credential token. |
| `GET` | `/api/admin/journey/pnr` | Retrieves the current active journey PNR. |
| `PATCH` | `/api/admin/journey/pnr` | Updates the active journey PNR (`{ pnr: string }`). |
| `POST` | `/api/admin/journey/start` | Starts the journey simulation from `idle`. |
| `POST` | `/api/admin/journey/pause` | Pauses an active simulation and accumulates elapsed time. |
| `POST` | `/api/admin/journey/resume` | Resumes a paused simulation. |
| `POST` | `/api/admin/journey/reset` | Resets journey back to `idle` (requires `{ confirm: true }`). |
| `PATCH` | `/api/admin/journey/config` | Updates simulation duration (`{ duration_seconds: number }`). |

---

## 8. Database Migrations (Supabase)

To link with a Supabase PostgreSQL instance:
1. Create a project in [Supabase](https://supabase.com).
2. Execute `database/migrations/001_create_journeys.sql` and `database/migrations/002_add_pnr_to_journeys.sql` in the Supabase SQL Editor.
3. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

The migration configures:
- `journeys` table with enum validation and non-negative constraints.
- Row Level Security (RLS) policies granting public read access and restricting mutations to authenticated service roles.
- Automatic `updated_at` triggers.

---

## 9. Automated Testing

Run the automated Vitest test suite:
```bash
npm run test --prefix backend
```

Includes unit and integration tests verifying:
- PNR cryptographic hashing, constant-time verification, and rate limiting.
- State transitions (`idle` → `running` → `paused` → `running` → `completed` → `idle`).
- Prevention of duplicate starts (`409 Conflict`).
- Pausing freezing elapsed time and resuming preserving distance.
- Idempotent journey completion clamping.
- Polyline encoding/decoding and geodesic bearing calculations.
- Supertest REST API route verification.

---

## 10. License
MIT License.
