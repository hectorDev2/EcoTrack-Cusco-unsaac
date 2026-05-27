'use client';

import { useQuery } from '@tanstack/react-query';
import { queries } from '@/lib/queries';
import { IncidentCard } from '@/components/incident-card';

export default function IncidenciasPage() {
  const { data: incidents = [], isLoading, error } = useQuery(queries.incidents.my());

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-[24px] leading-[32px] font-extrabold text-primary mb-1">
          Mis Incidencias
        </h1>
        <p className="text-[14px] leading-[20px] text-on-surface-variant mb-6">
          Historial de tus reportes registrados.
        </p>

        {error && (
          <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert text-sm">error</span>
            <p className="text-status-alert text-sm font-bold">{(error as Error).message ?? 'Error al cargar incidencias'}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-3xl text-outline block mb-2">report_problem</span>
            <p className="text-on-surface-variant text-sm font-bold">
              No reportaste incidencias todavía
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
