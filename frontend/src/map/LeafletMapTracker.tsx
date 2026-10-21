import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteData, RoutePoint } from '../types/index.js';
import { Locate, Maximize2 } from 'lucide-react';

interface LeafletMapTrackerProps {
  routeData: RouteData | null;
  vehiclePosition: RoutePoint;
  vehicleHeading: number;
  followMode: boolean;
  onToggleFollow: () => void;
}

// Tile provider configuration (configurable via environment variables)
const TILE_URL =
  import.meta.env.VITE_TILE_LAYER_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const TILE_ATTRIBUTION =
  import.meta.env.VITE_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

// Vector DivIcon generators to guarantee reliable, crisp rendering without broken image URLs
const createOriginIcon = () =>
  L.divIcon({
    className: 'custom-origin-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); border: 2px solid #10B981;"></div>
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createDestIcon = () =>
  L.divIcon({
    className: 'custom-dest-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); border: 2px solid #EF4444;"></div>
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #EF4444;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createStopIcon = (type: string) => {
  const isFood = type === 'food_halt';
  const color = isFood ? '#F59E0B' : '#3B82F6';
  const label = isFood ? '🍽' : '🚏';

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; background: #0A0A0A; border: 1.5px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

const createVehicleIcon = (heading: number) =>
  L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar ring -->
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 1.5px solid rgba(16, 185, 129, 0.4);"></div>
        <!-- Rotated Bus Coach Icon -->
        <div class="vehicle-marker-icon" style="transform: rotate(${heading}deg); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="#10B981" stroke="#0A0A0A" stroke-width="1.5">
            <path d="M12 2L4 20L12 16L20 20L12 2Z" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

// Internal component to manage Map Camera (FitBounds and Follow mode)
const MapController: React.FC<{
  routePositions: [number, number][];
  vehiclePosition: RoutePoint;
  followMode: boolean;
  fitBoundsTrigger: number;
}> = ({ routePositions, vehiclePosition, followMode, fitBoundsTrigger }) => {
  const map = useMap();
  const initialFitDoneRef = useRef(false);

  // Automatically fit bounds to route when route first loads
  useEffect(() => {
    if (routePositions.length > 0 && !initialFitDoneRef.current) {
      const bounds = L.latLngBounds(routePositions);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 13,
      });
      initialFitDoneRef.current = true;
    }
  }, [map, routePositions]);

  // Manual fit route button trigger
  useEffect(() => {
    if (fitBoundsTrigger > 0 && routePositions.length > 0) {
      const bounds = L.latLngBounds(routePositions);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 13,
      });
    }
  }, [map, routePositions, fitBoundsTrigger]);

  // Camera follow mode: smoothly pans to vehicle position
  useEffect(() => {
    if (followMode && vehiclePosition) {
      map.panTo([vehiclePosition.lat, vehiclePosition.lng], {
        animate: true,
        duration: 0.35,
      });
    }
  }, [map, followMode, vehiclePosition]);

  return null;
};

export const LeafletMapTracker: React.FC<LeafletMapTrackerProps> = ({
  routeData,
  vehiclePosition,
  vehicleHeading,
  followMode,
  onToggleFollow,
}) => {
  const [fitBoundsTrigger, setFitBoundsTrigger] = React.useState(0);

  // Convert RoutePoints into Leaflet [lat, lng] array
  const routePositions = useMemo<[number, number][]>(() => {
    if (!routeData || !routeData.points) return [];
    return routeData.points.map(p => [p.lat, p.lng]);
  }, [routeData]);

  const originIcon = useMemo(() => createOriginIcon(), []);
  const destIcon = useMemo(() => createDestIcon(), []);
  const vehicleIcon = useMemo(
    () => createVehicleIcon(vehicleHeading),
    [vehicleHeading]
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={[28.6139, 77.2090]} // Centered along Delhi-NCR corridor between Jaipur & Dehradun
        zoom={7}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
        />

        <MapController
          routePositions={routePositions}
          vehiclePosition={vehiclePosition}
          followMode={followMode}
          fitBoundsTrigger={fitBoundsTrigger}
        />

        {/* Road Route Polyline */}
        {routePositions.length > 0 && (
          <>
            {/* Outer route casing for high contrast */}
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#1E3A8A',
                weight: 6.5,
                opacity: 0.6,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
            {/* Main road polyline */}
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#2563EB',
                weight: 4,
                opacity: 0.95,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </>
        )}

        {/* Start Marker (Jaipur) */}
        {routeData?.origin && (
          <Marker
            position={[routeData.origin.coordinates.lat, routeData.origin.coordinates.lng]}
            icon={originIcon}
          >
            <Popup className="font-sans text-xs">
              <div className="p-1">
                <div className="text-[10px] font-mono text-green-700 uppercase font-semibold">ORIGIN DEPOT</div>
                <div className="font-bold text-sm text-gray-900">{routeData.origin.name}</div>
                <div className="text-gray-500 text-[11px] mt-0.5">Platform Bay 4, Central Bus Station</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Real Bus Stops along Route */}
        {routeData?.stops && routeData.stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.coordinates.lat, stop.coordinates.lng]}
            icon={createStopIcon(stop.type)}
          >
            <Popup className="font-sans text-xs">
              <div className="p-1 min-w-[190px]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
                  {stop.type === 'food_halt' ? '🍽 Refreshment / Dinner Halt' : stop.type === 'boarding' ? '🚏 Passenger Stop' : '📍 Highway Checkpoint'}
                </div>
                <div className="font-bold text-sm text-gray-900 mt-0.5">{stop.name}</div>
                <div className="text-[11px] text-gray-600 mt-0.5">{stop.landmark}</div>
                <div className="mt-1.5 pt-1.5 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-center">
                  <span>{(stop.distanceMeters / 1000).toFixed(1)} km from origin</span>
                  {stop.scheduledHaltMinutes > 0 && (
                    <span className="font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                      Halt: {stop.scheduledHaltMinutes}m
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Destination Marker (Dehradun) */}
        {routeData?.destination && (
          <Marker
            position={[routeData.destination.coordinates.lat, routeData.destination.coordinates.lng]}
            icon={destIcon}
          >
            <Popup className="font-sans text-xs">
              <div className="p-1">
                <div className="text-[10px] font-mono text-red-700 uppercase font-semibold">FINAL DESTINATION</div>
                <div className="font-bold text-sm text-gray-900">{routeData.destination.name}</div>
                <div className="text-gray-500 text-[11px] mt-0.5">Inter-State Bus Terminal, Haridwar Bypass</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Real-time Moving Bus Vehicle Marker */}
        {vehiclePosition && (
          <Marker
            position={[vehiclePosition.lat, vehiclePosition.lng]}
            icon={vehicleIcon}
          >
            <Popup className="font-sans text-xs">
              <div className="p-1 min-w-[170px]">
                <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                  <span>RJ-14-PB-4289</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">BUS</span>
                </div>
                <div className="text-[11px] text-gray-600 font-medium mt-0.5">Goldline AC Express Coach</div>
                <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex flex-col gap-0.5 text-[10px]">
                  <div className="text-green-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                    Live GPS Telematics Active
                  </div>
                  <div className="text-gray-500">
                    Heading: {Math.round(vehicleHeading)}°
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating map action buttons */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-[1000]">
        <button
          type="button"
          onClick={onToggleFollow}
          title={followMode ? "Disable camera follow" : "Enable camera follow"}
          className={`h-9 w-9 rounded-md flex items-center justify-center transition-all duration-200 border shadow-md ${
            followMode
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-surface/90 hover:bg-surface-hover text-primary-muted hover:text-primary border-border-subtle'
          }`}
        >
          <Locate className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setFitBoundsTrigger(prev => prev + 1)}
          title="Fit full route view"
          className="h-9 w-9 rounded-md bg-surface/90 hover:bg-surface-hover text-primary-muted hover:text-primary flex items-center justify-center border border-border-subtle shadow-md transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
