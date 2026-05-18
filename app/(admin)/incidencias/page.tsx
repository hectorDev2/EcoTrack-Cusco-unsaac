const incidents = [
  { id: "#INC-2401", type: "Orgánico", typeIcon: "eco", typeStyle: "bg-waste-organic/10 text-waste-organic", zone: "San Blas", status: "Pendiente", statusStyle: "bg-error-container text-on-error-container", date: "10 Oct, 08:30" },
  { id: "#INC-2402", type: "Reciclable", typeIcon: "recycling", typeStyle: "bg-waste-recyclable/10 text-waste-recyclable", zone: "Cusco Centro", status: "En Proceso", statusStyle: "bg-secondary-container text-on-secondary-container", date: "10 Oct, 09:15" },
  { id: "#INC-2403", type: "No recolectado", typeIcon: "delete", typeStyle: "bg-waste-non-recyclable/10 text-waste-non-recyclable", zone: "Santa Ana", status: "Resuelto", statusStyle: "bg-primary-fixed-dim/30 text-primary", date: "09 Oct, 17:45" },
  { id: "#INC-2404", type: "Reciclable", typeIcon: "recycling", typeStyle: "bg-waste-recyclable/10 text-waste-recyclable", zone: "San Cristobal", status: "Pendiente", statusStyle: "bg-error-container text-on-error-container", date: "10 Oct, 10:05" },
];

const stats = [
  { label: "PENDIENTE", value: "24", icon: "pending_actions", style: "bg-primary-fixed text-primary" },
  { label: "EN PROCESO", value: "12", icon: "engineering", style: "bg-secondary-fixed text-secondary" },
  { label: "RESUELTO", value: "158", icon: "task_alt", style: "bg-primary-fixed-dim text-on-primary-fixed-variant" },
  { label: "CRÍTICO", value: "03", icon: "warning", style: "bg-error-container text-on-error-container" },
];

export default function IncidenciasPage() {
  return (
    <>
      <header className="flex justify-between items-center w-full px-6 py-2 sticky top-0 z-10 bg-surface border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-[16px] leading-[24px] focus:ring-2 focus:ring-primary"
              placeholder="Buscar incidencias..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors active:opacity-80">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors active:opacity-80">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
            <div className="text-right">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface">Usuario Admin</p>
              <p className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant uppercase">Llaqta Limpia</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-lg">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-on-surface">Gestión de Incidencias</h2>
                <p className="text-[16px] leading-[24px] text-on-surface-variant">Real-time citizen reports across Cusco's districts.</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-primary text-on-primary px-6 py-2 rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-2 active:scale-[0.98] transition-transform">
                  <span className="material-symbols-outlined">add</span>
                  Nuevo Reporte
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-surface-card p-4 rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.style}`}>
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">{stat.label}</p>
                    <p className="text-[24px] leading-[32px] font-bold">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <select className="bg-surface border border-outline-variant rounded-lg px-md py-2 text-[14px] leading-[20px] text-on-surface focus:ring-primary focus:border-primary">
                  <option>Estado: Todos</option>
                  <option>Pendiente</option>
                  <option>En Proceso</option>
                  <option>Resuelto</option>
                </select>
                <select className="bg-surface border border-outline-variant rounded-lg px-md py-2 text-[14px] leading-[20px] text-on-surface focus:ring-primary focus:border-primary">
                  <option>Zona: Cusco Centro</option>
                  <option>San Blas</option>
                  <option>San Cristobal</option>
                  <option>Santa Ana</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high border-b border-outline-variant/30">
                  <tr>
                    <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">ID</th>
                    <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Tipo</th>
                    <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Zona</th>
                    <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Estado</th>
                    <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Fecha</th>
                    <th className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface">{inc.id}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[12px] leading-[16px] tracking-[0.05em] ${inc.typeStyle}`}>
                          <span className="material-symbols-outlined text-sm">{inc.typeIcon}</span>
                          {inc.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[16px] leading-[24px] text-on-surface">{inc.zone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${inc.statusStyle}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] leading-[20px] text-on-surface-variant">{inc.date}</td>
                      <td className="px-6 py-4">
                        <button className="text-primary hover:underline text-[12px] leading-[16px] tracking-[0.05em] font-bold">Ver Detalles</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 flex items-center justify-between border-t border-outline-variant/30">
              <p className="text-[14px] leading-[20px] text-on-surface-variant">Mostrando 1-4 de 24 incidentes</p>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-variant/50 disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-2 rounded-lg border border-outline-variant bg-primary text-on-primary">1</button>
                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-variant/50">2</button>
                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-variant/50">3</button>
                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-variant/50">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative h-[300px] rounded-xl overflow-hidden border border-outline-variant/30 shadow-sm">
            <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
              <div className="text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl">map</span>
                <p className="text-[14px] leading-[20px] mt-2">Mapa de calor de incidencias</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button className="w-10 h-10 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                <span className="material-symbols-outlined">my_location</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-white text-primary shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                <span className="material-symbols-outlined">fullscreen</span>
              </button>
            </div>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/50 shadow-xl max-w-xs">
              <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary mb-1">Mapa de Calor</h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">Alta concentración de residuos reciclables en Cusco Centro hoy.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
