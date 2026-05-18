const trucks = [
  {
    id: "Camión 104",
    route: "Ruta San Blas",
    progress: 75,
    distance: "4.2 km left",
    color: "text-primary",
    status: "Rastrear →",
    alert: false,
  },
  {
    id: "Camión 212",
    route: "Plaza de Armas",
    progress: 30,
    distance: "12.8 km left",
    color: "text-waste-recyclable",
    status: "Rastrear →",
    alert: false,
  },
  {
    id: "Camión 089",
    route: "Av. El Sol",
    progress: 15,
    distance: "Engine Alert",
    color: "text-error",
    status: "Resolver →",
    alert: true,
  },
  {
    id: "Camión 155",
    route: "Sacsayhuamán",
    progress: 0,
    distance: "Shift Starting",
    color: "text-on-surface-variant",
    status: "Ver →",
    alert: false,
  },
];

export default function FlotaPage() {
  return (
    <div className="bg-background text-on-surface font-body-md overflow-hidden h-screen">
      <header className="flex justify-between items-center w-full px-6 py-2 bg-surface border-b border-outline-variant/30 sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-[16px] leading-[24px] focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              placeholder="Buscar camiones o rutas..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant relative transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-status-alert rounded-full" />
            </button>
            <button className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant/50 mx-2" />
          <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-variant/30 p-1 pr-3 rounded-full transition-all">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface leading-tight">
                Panel de Administración
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-wider">
                Superusuario Municipal
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-64px)] relative">
        <div className="absolute inset-0 z-0 bg-surface-dim">
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <div className="text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl">map</span>
              <p className="text-[14px] leading-[20px] mt-2">
                Mapa de flota - Cusco
              </p>
            </div>
          </div>

          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
            <div className="flex flex-col items-center">
              <div className="bg-primary text-white p-2 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center scale-110 border-2 border-white">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_shipping
                </span>
              </div>
              <div className="mt-2 glass-panel px-3 py-1.5 rounded-lg shadow-xl border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary">
                  Camión 104
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  Ruta San Blas • 75%
                </p>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/3 group cursor-pointer">
            <div className="flex flex-col items-center">
              <div className="bg-waste-recyclable text-white p-2 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center border-2 border-white">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_shipping
                </span>
              </div>
              <div className="mt-2 glass-panel px-3 py-1.5 rounded-lg shadow-xl border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-waste-recyclable">
                  Camión 212
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  Plaza de Armas • 30%
                </p>
              </div>
            </div>
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
            <path
              d="M 640 320 Q 700 400 800 350"
              fill="transparent"
              stroke="#2D5A27"
              strokeDasharray="1 12"
              strokeLinecap="round"
              strokeWidth="6"
            />
            <path
              d="M 530 480 Q 400 500 450 600"
              fill="transparent"
              stroke="#2196F3"
              strokeDasharray="1 12"
              strokeLinecap="round"
              strokeWidth="6"
            />
          </svg>
        </div>

        <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-30">
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <button className="w-12 h-12 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              my_location
            </span>
          </button>
        </div>

        <aside className="absolute left-6 top-6 bottom-6 w-80 glass-panel rounded-2xl shadow-2xl border border-white/40 flex flex-col z-30 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[24px] leading-[32px] font-bold text-on-surface">
                Flota Activa
              </h2>
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-extrabold uppercase tracking-widest">
                Live
              </span>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-primary text-white rounded-full text-[12px] font-bold cursor-pointer">
                Todos los Camiones
              </span>
              <span className="px-3 py-1.5 bg-white border border-outline-variant text-on-surface-variant rounded-full text-[12px] font-bold hover:bg-surface-variant cursor-pointer transition-colors">
                Problemas (2)
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {trucks.map((truck) => (
              <div
                key={truck.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm group ${
                  truck.alert
                    ? "bg-error-container/20 border-error/20 hover:border-error/40"
                    : "bg-white border-outline-variant/40 hover:border-primary/40"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        truck.alert
                          ? "bg-error-container/40 text-error"
                          : "bg-surface-container-high"
                      } ${truck.color}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {truck.alert ? "warning" : "local_shipping"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface">
                        {truck.id}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant">
                        {truck.route}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[12px] font-extrabold ${
                      truck.alert ? "text-error" : truck.color
                    }`}
                  >
                    {truck.alert
                      ? "Stopped"
                      : `${truck.progress}%`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${
                      truck.alert ? "bg-error" : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.max(truck.progress, 2)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`flex items-center gap-1 ${
                      truck.alert ? "text-error font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {truck.alert && (
                      <span className="material-symbols-outlined text-[14px]">
                        bolt
                      </span>
                    )}
                    {!truck.alert && (
                      <span className="material-symbols-outlined text-[14px]">
                        schedule
                      </span>
                    )}
                    {truck.distance}
                  </span>
                  <span
                    className={`${truck.color} font-bold group-hover:underline`}
                  >
                    {truck.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-surface-container-high border-t border-outline-variant/30">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
                  En Tránsito
                </p>
                <p className="text-[20px] leading-[28px] font-bold text-primary">
                  12
                </p>
              </div>
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
                  Mantenimiento
                </p>
                <p className="text-[20px] leading-[28px] font-bold text-secondary">
                  3
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="absolute top-6 right-6 glass-panel rounded-xl shadow-lg border border-white/40 p-3 z-30 flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Orgánico
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-waste-recyclable" />
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Reciclable
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-error" />
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              High Alert
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
