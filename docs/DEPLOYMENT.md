# Deployment Guide: Jaipur → Dehradun Vehicle Tracking

This guide outlines deployment procedures for the frontend, backend, database, and routing services.

---

## 1. Frontend Deployment (Vercel)

The frontend is a standard Vite React single-page application utilizing Leaflet and OpenStreetMap.

### Steps
1. Connect your GitHub/Git repository to **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Configure **Build Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Set Environment Variables:
   - `VITE_API_BASE_URL`: The production URL of your backend Express API (e.g., `https://api.yourdomain.com/api`).
   - `VITE_TILE_LAYER_URL`: (Optional) Custom tile server URL (defaults to standard OpenStreetMap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
5. In `frontend/vercel.json`, ensure SPA rewrites are enabled for client-side routing:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 2. Backend Deployment (Render / Railway / Fly.io / VPS)

The backend is an Express Node.js application built with TypeScript, featuring OSRM route calculation.

### Deployment on Render / Railway
1. Set the **Root Directory** to `backend`.
2. Configure **Build & Start Commands**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` (executes `node dist/index.js`)
3. Set Environment Variables:
   - `PORT`: `3001` (or provided dynamically by the platform)
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your deployed frontend URL (e.g., `https://your-app.vercel.app`)
   - `ADMIN_SECRET`: A strong, randomly generated secret string
   - `OSRM_ROUTER_URL`: Base URL of your OSRM routing engine (defaults to `https://router.project-osrm.org`)
   - `SUPABASE_URL`: Your Supabase project URL (`https://xyz.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service_role key (server-only!)

---

## 3. Database Deployment (Supabase PostgreSQL)

1. Navigate to the **SQL Editor** in your Supabase project dashboard.
2. Open and run `database/migrations/001_create_journeys.sql` and `database/migrations/002_add_pnr_to_journeys.sql`.
3. Verify that the table `public.journeys` is created with Row Level Security enabled.
4. Verify that the default journey for `Jaipur, Rajasthan` → `Dehradun, Uttarakhand` exists in the table.

---

## 4. OSRM & OpenStreetMap Tile Provider Setup

- **OSRM Routing Engine**: By default, the application queries public OSRM (`https://router.project-osrm.org`). For production deployments with heavy traffic, configure `OSRM_ROUTER_URL` to point to a self-hosted OSRM container or dedicated routing API provider.
- **OpenStreetMap Tiles**: Standard OSM tiles are served directly from OpenStreetMap. For customized enterprise styling, point `VITE_TILE_LAYER_URL` to CartoDB, MapTiler, or a self-hosted tile server.
