'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  color?: string;
  icon?: string;
  label?: string;
  description?: string;
}

export interface MapRoute {
  id: string;
  points: [number, number][];
  color?: string;
  label?: string;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  height?: string;
  interactive?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
}

const CUSCO_CENTER: [number, number] = [-71.9675, -13.5320];

function createMarkerEl(marker: MapMarker, onClick?: () => void): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'flex flex-col items-center cursor-pointer';
  el.innerHTML = `
    <div style="background:${marker.color ?? '#154212'}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid white;">
      <span class="material-symbols-outlined" style="font-size:20px;">${marker.icon ?? 'location_on'}</span>
    </div>
    ${marker.label ? `<span style="background:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; margin-top:4px; box-shadow:0 1px 4px rgba(0,0,0,0.15); white-space:nowrap;">${marker.label}</span>` : ''}
  `;
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

function syncMarkers(map: maplibregl.Map, markers: MapMarker[], markersRef: React.MutableRefObject<maplibregl.Marker[]>, onMarkerClick?: (marker: MapMarker) => void) {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  markers.forEach((marker) => {
    const m = new maplibregl.Marker({ element: createMarkerEl(marker, onMarkerClick ? () => onMarkerClick(marker) : undefined) })
      .setLngLat([marker.lng, marker.lat])
      .addTo(map);
    markersRef.current.push(m);
  });
}

function syncRoutes(map: maplibregl.Map, routes: MapRoute[]) {
  // Remove existing route layers/sources
  const existingSources = map.getStyle()?.sources ?? {};
  Object.keys(existingSources).forEach((id) => {
    if (id.startsWith('route-')) {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    }
  });

  routes.forEach((route) => {
    const id = `route-${route.id}`;
    const coords = route.points.map((p) => [p[0], p[1]] as [number, number]);

    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      },
    });

    map.addLayer({
      id,
      type: 'line',
      source: id,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': route.color ?? '#154212',
        'line-width': 4,
        'line-opacity': 0.7,
        'line-dasharray': [1, 8],
      },
    });
  });
}

export default function MapView({
  center = CUSCO_CENTER,
  zoom = 13,
  markers = [],
  routes = [],
  height = '100%',
  interactive = true,
  onMarkerClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const loadedRef = useRef(false);
  const pendingRoutes = useRef<MapRoute[]>([]);

  const updateAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    syncMarkers(map, markers, markersRef, onMarkerClick);
    if (pendingRoutes.current.length > 0) {
      syncRoutes(map, pendingRoutes.current);
      pendingRoutes.current = [];
    }
  }, [markers, onMarkerClick]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom,
      attributionControl: false,
      interactive,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      loadedRef.current = true;
      updateAll();
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Fly to new center/zoom
  useEffect(() => {
    if (!mapRef.current || !loadedRef.current) return;
    mapRef.current.flyTo({ center, zoom, duration: 800 });
  }, [center[0], center[1], zoom]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) {
      // Remove old markers even if not loaded (they're HTML elements)
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      return;
    }
    syncMarkers(map, markers, markersRef, onMarkerClick);
  }, [markers, onMarkerClick]);

  // Routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) {
      pendingRoutes.current = routes;
      return;
    }
    syncRoutes(map, routes);
  }, [routes]);

  return (
    <div ref={containerRef} style={{ width: '100%', height, minHeight: '200px' }} />
  );
}
