export default function AnalisisPage() {
  return (
    <>
      <header className="flex justify-between items-center w-full px-lg py-sm sticky top-0 bg-surface border-b border-outline-variant/30 z-10">
        <div className="flex items-center gap-md">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-[16px] leading-[24px] w-64"
              placeholder="Buscar reportes..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-lg">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            help
          </button>
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full border-2 border-primary-fixed bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-tight">
                Administrador Principal
              </p>
              <p className="text-xs text-on-surface-variant">Cusco Municipal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-lg space-y-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          {[
            { label: "Residuos Totales", value: "1,284 T", icon: "delete", style: "bg-primary-fixed text-primary" },
            { label: "Tasa de Reciclaje", value: "38.4%", icon: "recycling", style: "bg-secondary-fixed text-secondary" },
            { label: "Rutas Activas", value: "24/28", icon: "local_shipping", style: "bg-tertiary-fixed text-tertiary" },
            { label: "Alertas Críticas", value: "03", icon: "warning", style: "bg-error-container text-on-error-container" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-card p-md rounded-xl shadow-sm border border-outline-variant/20 flex items-center gap-md"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.style}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <div>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">{stat.label}</p>
                <p className="text-[24px] leading-[32px] font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 bg-surface-card p-lg rounded-xl shadow-sm border border-outline-variant/20">
            <div className="flex justify-between items-center mb-xl">
              <div>
                <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">Volumen de Residuos (Ton)</h3>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">Tendencia de los últimos 30 días</p>
              </div>
              <div className="flex gap-sm">
                <span className="px-3 py-1 bg-primary-fixed text-primary font-bold rounded-full text-xs">DIARIO</span>
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant font-bold rounded-full text-xs">MENSUAL</span>
              </div>
            </div>
            <div className="h-64 chart-grid relative overflow-hidden rounded-lg">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0 200 Q 100 180, 200 150 T 400 100 T 600 120 T 800 80 T 1000 60"
                  fill="none"
                  stroke="#154212"
                  strokeWidth="3"
                />
                <path
                  d="M0 200 Q 100 180, 200 150 T 400 100 T 600 120 T 800 80 T 1000 60 V 256 H 0 Z"
                  fill="url(#grad1)"
                  opacity="0.1"
                />
                <defs>
                  <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#154212" stopOpacity="1" />
                    <stop offset="100%" stopColor="#154212" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-xs font-bold text-on-surface-variant">
                <span>01 OCT</span>
                <span>07 OCT</span>
                <span>14 OCT</span>
                <span>21 OCT</span>
                <span>28 OCT</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-card p-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col items-center justify-between">
            <div className="w-full text-left">
              <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">Composición de Residuos</h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">Distribución por categoría</p>
            </div>
            <div className="relative w-48 h-48 my-md">
              <div
                className="w-full h-full rounded-full border-8 border-waste-organic"
                style={{
                  borderRightColor: "#2196F3",
                  borderBottomColor: "#757575",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
                  100%
                </span>
                <span className="text-xs text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">
                  TOTAL
                </span>
              </div>
            </div>
            <div className="w-full space-y-sm">
              {[
                { label: "Orgánico", value: "60%", color: "bg-waste-organic" },
                { label: "Reciclable", value: "30%", color: "bg-waste-recyclable" },
                { label: "Otros", value: "10%", color: "bg-waste-non-recyclable" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-sm rounded-lg bg-surface-container-low"
                >
                  <div className="flex items-center gap-sm">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
          <div className="p-lg border-b border-outline-variant/20 flex justify-between items-center">
            <div>
              <h3 className="text-[24px] leading-[32px] font-bold text-on-surface">Zonas con Mayor Participación</h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">Ranking de compromiso ciudadano por distrito</p>
            </div>
            <button className="text-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-sm hover:underline">
              Ver Mapa Detallado
              <span className="material-symbols-outlined">open_in_new</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high text-on-surface-variant text-[11px] leading-[14px] tracking-[0.08em] font-extrabold uppercase">
                <tr>
                  <th className="px-lg py-md">Distrito / Zona</th>
                  <th className="px-lg py-md">Tasa Part.</th>
                  <th className="px-lg py-md">Volumen Semanal</th>
                  <th className="px-lg py-md">Puntos Verdes</th>
                  <th className="px-lg py-md">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {[
                  { rank: "01", name: "San Blas", rate: 92, volume: "14.2 Ton", points: 12, status: "EXCELENTE", statusStyle: "bg-primary-fixed text-on-primary-fixed-variant" },
                  { rank: "02", name: "Wanchaq", rate: 85, volume: "28.5 Ton", points: 24, status: "ALTA", statusStyle: "bg-primary-fixed text-on-primary-fixed-variant" },
                  { rank: "03", name: "Cercado Cusco", rate: 78, volume: "42.1 Ton", points: 18, status: "OPTIMO", statusStyle: "bg-secondary-fixed text-on-secondary-fixed-variant" },
                  { rank: "04", name: "San Sebastián", rate: 64, volume: "31.8 Ton", points: 15, status: "REGULAR", statusStyle: "bg-surface-variant text-on-surface-variant" },
                ].map((row) => (
                  <tr key={row.rank} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                          {row.rank}
                        </div>
                        <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <div className="w-32 h-2 bg-surface-variant rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${row.rate}%` }} />
                      </div>
                      <span className="text-xs font-bold mt-1 inline-block">{row.rate}%</span>
                    </td>
                    <td className="px-lg py-md text-[16px] leading-[24px]">{row.volume}</td>
                    <td className="px-lg py-md text-[16px] leading-[24px]">{row.points}</td>
                    <td className="px-lg py-md">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.statusStyle}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button className="fixed bottom-xl right-xl w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
        <span className="material-symbols-outlined">file_download</span>
      </button>
    </>
  );
}
