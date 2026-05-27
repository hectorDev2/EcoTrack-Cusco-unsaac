'use client';

import { useQuery } from '@tanstack/react-query';
import { queries } from '@/lib/queries';
import type { WasteType } from '@/lib/types';

const categoryConfig: Record<string, { icon: string; color: string; label: string; examples: string }> = {
  ORGANIC: { icon: 'eco', color: 'text-waste-organic bg-waste-organic/10 border-waste-organic/20', label: 'Orgánico', examples: 'Restos de comida, cáscaras, residuos de jardín' },
  RECYCLABLE: { icon: 'recycling', color: 'text-waste-recyclable bg-waste-recyclable/10 border-waste-recyclable/20', label: 'Reciclable', examples: 'Papel, cartón, plástico, vidrio, metales' },
  NON_RECYCLABLE: { icon: 'delete', color: 'text-waste-non-recyclable bg-waste-non-recyclable/10 border-waste-non-recyclable/20', label: 'No Reciclable', examples: 'Residuos de baño, barrido, desechos generales' },
  HAZARDOUS: { icon: 'warning', color: 'text-status-alert bg-status-alert/10 border-status-alert/20', label: 'Peligroso', examples: 'Pilas, baterías, aceites, medicamentos vencidos' },
};

export default function ResiduosPage() {
  const { data: items = [], isLoading: loading } = useQuery(queries.wasteTypes.all());

  const grouped = items.reduce((acc, wt) => {
    if (!acc[wt.category]) acc[wt.category] = [];
    acc[wt.category].push(wt);
    return acc;
  }, {} as Record<string, WasteType[]>);

  return (
    <div className="p-5 pb-32">
      <header className="mb-6">
        <h1 className="text-[24px] leading-[32px] font-extrabold text-primary">Tipos de Residuo</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">Conoce cómo clasificar tus residuos correctamente</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm font-bold">Cargando...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categoryConfig).map(([cat, cfg]) => {
            const catItems = grouped[cat] ?? [];
            return (
              <div key={cat}>
                <div className={`rounded-xl border p-4 ${cfg.color}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/80">
                      <span className={`material-symbols-outlined text-[24px] ${cfg.color.split(' ')[0]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {cfg.icon}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold">{cfg.label}</h2>
                      <p className="text-[12px] opacity-70">{cfg.examples}</p>
                    </div>
                  </div>
                  {catItems.length > 0 && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-white/20">
                      {catItems.map((wt) => (
                        <div key={wt.id} className="flex items-center justify-between bg-white/40 rounded-lg px-4 py-2.5">
                          <span className="text-[14px] font-bold">{wt.name}</span>
                          {wt.description && (
                            <span className="text-[11px] opacity-60 text-right max-w-[60%]">{wt.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
