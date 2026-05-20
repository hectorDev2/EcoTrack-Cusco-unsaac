'use client';

import { useEffect, useRef } from 'react';
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

function createMarkerEl(marker: MapMarker): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'flex flex-col items-center cursor-pointer';
  el.innerHTML = `
    <div style="background:${marker.color ?? '#154212'}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid white;">
      <span class="material-symbols-outlined" style="font-size:20px;">${marker.icon ?? 'location_on'}</span>
    </div>
    ${marker.label ? `<span style="background:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; margin-top:4px; box-shadow:0 1px 4px rgba(0,0,0,0.15); white-space:nowrap;">${marker.label}</span>` : ''}
  `;
  return el;
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
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center/zoom when props change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center, zoom, duration: 800 });
  }, [center[0], center[1], zoom]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((marker) => {
      const el = createMarkerEl(marker);
      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(marker));
      }
      const m = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      markersRef.current.push(m);
    });
  }, [markers, onMarkerClick]);

  // Update routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existingLayers = map.getStyle()?.layers ?? [];
    const routeLayerIds = existingLayers
      .filter((l) => l.id.startsWith('route-'))
      .map((l) => l.id);

    routeLayerIds.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
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
  }, [routes]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, minHeight: '200px' }}
    />
  );
}
