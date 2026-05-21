'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import MapView, { type MapMarker } from '@/components/map-view';
import type { PickupPoint, Incident } from '@/lib/types';

const CUSCO_CENTER: [number, number] = [-71.9675, -13.5320];

const TYPE_LABELS: Record<string, string> = {
  CONTAINER_DAMAGED: 'Contenedor dañado',
  MISSED_COLLECTION: 'Recolección no realizada',
  ILLEGAL_DUMPING: 'Vertido ilegal',
  OTHER: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

export default function MapaPage() {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    api.get<PickupPoint[]>('/pickup-points')
      .then(setPickupPoints)
      .catch(() => {});
    api.get<Incident[]>('/incidents/my')
      .then(setIncidents)
      .catch(() => {});
  }, []);

  const incidentMarkers: MapMarker[] = incidents
    .filter((inc) => inc.latitude != null && inc.longitude != null)
    .map((inc) => ({
      id: `inc-${inc.id}`,
      lng: inc.longitude!,
      lat: inc.latitude!,
      color: '#C62828',
      icon: 'report_problem' as const,
      label: TYPE_LABELS[inc.type] ?? inc.type,
      description: inc.address ?? '',
    }));

  const markers: MapMarker[] = [
    {
      id: 'home',
      lng: CUSCO_CENTER[0],
      lat: CUSCO_CENTER[1],
      color: '#154212',
      icon: 'home',
      label: 'Mi Hogar',
    },
    {
      id: 'truck',
      lng: -71.9744,
      lat: -13.5210,
      color: '#C62828',
      icon: 'local_shipping',
      label: 'Camión en ruta',
    },
    ...pickupPoints.map((pp) => ({
      id: pp.id,
      lng: pp.longitude,
      lat: pp.latitude,
      color: '#2d5a27',
      icon: 'delete' as const,
      label: pp.name,
      description: pp.address,
    })),
    ...incidentMarkers,
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center w-full px-5 py-2 bg-surface shadow-sm shadow-primary/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="text-primary active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-[20px] leading-[28px] font-black text-primary">
            Eco Track Cusco
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-surface-container-high overflow-hidden shadow-sm text-on-primary-container font-bold">
          <span className="material-symbols-outlined">person</span>
        </div>
      </header>

      <main className="flex-grow relative w-full min-h-[400px]">
        <MapView
          markers={markers}
          height="calc(100vh - 140px)"
          onMarkerClick={(m) => {
            const pp = pickupPoints.find((p) => p.id === m.id);
            if (pp) { setSelectedPoint(pp); setSelectedIncident(null); return; }
            const inc = incidents.find((i) => `inc-${i.id}` === m.id);
            if (inc) { setSelectedIncident(inc); setSelectedPoint(null); return; }
          }}
        />
      </main>

      {selectedPoint && (
        <div className="absolute bottom-24 left-5 right-5 z-20">
          <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-outline-variant/20">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[16px] leading-[24px] font-bold text-on-surface">
                  {selectedPoint.name}
                </h3>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">
                  {selectedPoint.address}
                </p>
                {selectedPoint.zone && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-bold">
                    {selectedPoint.zone.name}
                  </span>
                )}
              </div>
              <button
                className="text-on-surface-variant hover:text-primary"
                onClick={() => setSelectedPoint(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedIncident && (
        <div className="absolute bottom-24 left-5 right-5 z-20">
          <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-status-alert/20">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-status-alert" />
                  <h3 className="text-[16px] leading-[24px] font-bold text-on-surface">
                    {TYPE_LABELS[selectedIncident.type] ?? selectedIncident.type}
                  </h3>
                </div>
                <p className="text-[13px] leading-[18px] text-on-surface-variant mt-1 line-clamp-2">
                  {selectedIncident.description}
                </p>
                {selectedIncident.address && (
                  <p className="text-[12px] text-on-surface-variant mt-1 truncate">
                    {selectedIncident.address}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-status-alert/10 text-status-alert">
                    {STATUS_LABELS[selectedIncident.status] ?? selectedIncident.status}
                  </span>
                  {selectedIncident.latitude != null && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                      {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="text-on-surface-variant hover:text-primary ml-2"
                onClick={() => setSelectedIncident(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-5 right-5 z-20">
        <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-outline-variant/20 space-y-3">
          <div className="flex items-center gap-4 text-[11px] font-bold text-on-surface-variant">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#2d5a27]" />
              <span>Punto de recojo</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#C62828]" />
              <span>Incidencia</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#154212]" />
              <span>Mi ubicación</span>
            </div>
          </div>

          {incidentMarkers.length > 0 && (
            <div className="flex items-center gap-2 text-[12px] text-on-surface-variant border-t border-outline-variant/20 pt-3">
              <span className="material-symbols-outlined text-status-alert text-sm">warning</span>
              <span className="font-bold">{incidentMarkers.length}</span>
              <span>incidencia{incidentMarkers.length !== 1 ? 's' : ''} reportada{incidentMarkers.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
