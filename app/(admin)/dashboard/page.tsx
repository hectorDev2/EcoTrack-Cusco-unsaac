export default function AdminDashboardPage() {
  return (
    <>
      <header className="flex justify-between items-center w-full px-6 py-2 sticky top-0 z-10 bg-surface border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-8 flex-1">
          <h2 className="text-[24px] leading-[32px] font-bold text-primary">
            Panel de Administración
          </h2>
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/20 text-[16px] leading-[24px]"
              placeholder="Buscar rutas, camiones o incidencias..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6 ml-lg">
          <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-alert rounded-full" />
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="flex items-center gap-3 pl-lg border-l border-outline-variant/30">
            <div className="text-right hidden xl:block">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-none">
                Admin Cusco
              </p>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">
                Gestión Municipal
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary-fixed bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-[1440px] mx-auto space-y-lg">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h3 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-on-surface">
              Bienvenido, Eco Track Cusco
            </h3>
            <p className="text-[16px] leading-[24px] text-on-surface-variant mt-2">
              Resumen operativo para el sector Cusco Metropolitano.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[20px]">
                calendar_today
              </span>
              Hoy, 24 May
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[20px]">
                refresh
              </span>
              Actualizar
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-start justify-between">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  map
                </span>
              </div>
              <span className="text-waste-organic text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  trending_up
                </span>
                +2.4%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[16px] leading-[24px] text-on-surface-variant">
                Cobertura de Recolección
              </p>
              <h4 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary mt-1">
                92%
              </h4>
            </div>
            <div className="mt-4 w-full bg-surface-container rounded-full h-1.5">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: "92%" }}
              />
            </div>
          </div>

          <div className="bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-status-alert/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-start justify-between">
              <div className="bg-status-alert/10 p-2 rounded-lg">
                <span
                  className="material-symbols-outlined text-status-alert"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warning
                </span>
              </div>
              <span className="text-status-alert text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  priority_high
                </span>
                Crítico
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[16px] leading-[24px] text-on-surface-variant">
                Incidencias Pendientes
              </p>
              <h4 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-on-surface mt-1">
                14
              </h4>
            </div>
            <p className="mt-4 text-[14px] leading-[20px] text-on-surface-variant flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-alert animate-pulse" />
              8 reportadas en la última hora
            </p>
          </div>

          <div className="bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-start justify-between">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_shipping
                </span>
              </div>
              <span className="text-on-surface-variant text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                En ruta
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[16px] leading-[24px] text-on-surface-variant">
                Flota Activa
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <h4 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-on-surface">
                  28
                </h4>
                <span className="text-on-surface-variant text-[16px] leading-[24px]">
                  / 30
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= 4 ? "bg-primary" : "bg-surface-container"}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h5 className="text-[24px] leading-[32px] font-bold text-on-surface">
                  Resumen por Zona
                </h5>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">
                  Eficiencia de recolección semanal por distrito
                </p>
              </div>
              <select className="bg-surface-container-low border-none text-[14px] leading-[20px] rounded-lg px-4 py-2">
                <option>Esta semana</option>
                <option>Mes pasado</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between gap-8 pt-6 relative">
              <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                <div className="border-b border-on-surface" />
                <div className="border-b border-on-surface" />
                <div className="border-b border-on-surface" />
                <div className="border-b border-on-surface" />
              </div>
              {[
                { label: "C. Histórico", height: "85%" },
                { label: "San Blas", height: "60%" },
                { label: "San Sebas", height: "95%" },
                { label: "Santiago", height: "40%" },
                { label: "Wanchaq", height: "75%" },
              ].map((bar) => (
                <div
                  key={bar.label}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-full bg-primary-container rounded-t-lg transition-all duration-500 group-hover:bg-primary"
                    style={{ height: bar.height }}
                  />
                  <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface-card p-8 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col">
            <div className="mb-6">
              <h5 className="text-[24px] leading-[32px] font-bold text-on-surface">
                Actividad Reciente
              </h5>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">
                Últimos reportes de incidencias
              </p>
            </div>
            <div className="space-y-md overflow-y-auto max-h-[320px] pr-2">
              {[
                {
                  title: "Acumulación Excesiva",
                  time: "2m ago",
                  location: "Calle Saphy 124",
                  status: "Procesando",
                  statusStyle: "bg-secondary-container text-on-secondary-container",
                  wasteType: "Reciclable",
                  wasteStyle: "bg-waste-recyclable/10 text-waste-recyclable",
                  hasImage: true,
                },
                {
                  title: "Derrame de Orgánicos",
                  time: "15m ago",
                  location: "Av. El Sol (Pariwanas)",
                  status: "Alerta",
                  statusStyle: "bg-error-container text-on-error-container",
                  wasteType: "Orgánico",
                  wasteStyle: "bg-waste-organic/10 text-waste-organic",
                  hasImage: true,
                },
                {
                  title: "Contenedor Dañado",
                  time: "45m ago",
                  location: "Plaza de Armas",
                  status: "Abierto",
                  statusStyle: "bg-surface-container-highest text-on-surface-variant",
                  wasteType: "Infraestructura",
                  wasteStyle: "bg-waste-non-recyclable/10 text-waste-non-recyclable",
                  hasImage: false,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 p-4 hover:bg-surface-container rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.hasImage ? (
                      <span className="material-symbols-outlined text-on-surface-variant">
                        image
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">
                        broken_image
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h6 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface truncate">
                        {item.title}
                      </h6>
                      <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[14px] leading-[20px] text-on-surface-variant line-clamp-1">
                      {item.location}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${item.statusStyle}`}
                      >
                        {item.status}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${item.wasteStyle}`}
                      >
                        {item.wasteType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-auto pt-6 w-full text-center text-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold hover:underline">
              Ver todas las incidencias
            </button>
          </div>
        </section>

        <section className="bg-surface-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b border-outline-variant/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  location_on
                </span>
              </div>
              <div>
                <h5 className="text-[24px] leading-[32px] font-bold text-on-surface">
                  Mapa en Tiempo Real
                </h5>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">
                  Seguimiento de unidades de recolección
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 mr-md">
                <div className="w-8 h-8 rounded-full border-2 border-surface-card bg-primary-fixed flex items-center justify-center text-[10px] font-bold" />
                <div className="w-8 h-8 rounded-full border-2 border-surface-card bg-primary-fixed flex items-center justify-center text-[10px] font-bold" />
                <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] flex items-center justify-center font-bold border-2 border-surface-card">
                  +26
                </div>
              </div>
              <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  fullscreen
                </span>
                Ver Pantalla Completa
              </button>
            </div>
          </div>
          <div className="relative h-[400px] bg-surface-dim">
            <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
              <div className="text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl">map</span>
                <p className="text-[14px] leading-[20px] mt-2">
                  Mapa de seguimiento en tiempo real
                </p>
              </div>
            </div>
            <div className="absolute bottom-md left-md right-md flex flex-wrap gap-4 pointer-events-none">
              <div className="bg-surface/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20 pointer-events-auto min-w-[200px]">
                <p className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant mb-sm">
                  CAMIÓN ACTIVO - RUTA A24
                </p>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary rounded-lg text-white">
                    <span className="material-symbols-outlined">
                      local_shipping
                    </span>
                  </div>
                  <div>
                    <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                      Conductor: Juan P.
                    </p>
                    <p className="text-[14px] leading-[20px] text-primary font-bold">
                      Carga: 78%
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-surface/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20 pointer-events-auto min-w-[200px]">
                <p className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-on-surface-variant mb-sm">
                  ESTADÍSTICA DE RUTA
                </p>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-secondary rounded-lg text-white">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                      Retraso: 4 min
                    </p>
                    <p className="text-[14px] leading-[20px] text-secondary font-bold">
                      ETA: 09:45 AM
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button className="absolute top-4 right-md w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform pointer-events-auto">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
