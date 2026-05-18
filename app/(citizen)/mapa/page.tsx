export default function MapaPage() {
  return (
    <>
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

      <main className="flex-grow relative w-full h-[calc(100vh-140px)] overflow-hidden">
        <div className="absolute inset-0 z-0 bg-surface-dim">
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <div className="text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl">map</span>
              <p className="text-[14px] leading-[20px] mt-2">
                Mapa de Cusco
              </p>
            </div>
          </div>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 800"
          >
            <path
              className="opacity-60"
              d="M 200 600 L 180 500 L 250 420 L 230 350 L 300 280"
              fill="none"
              stroke="#2D5A27"
              strokeDasharray="1 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="6"
            />
          </svg>

          <div className="absolute top-[35%] left-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="bg-primary text-on-primary p-2 rounded-full shadow-lg border-2 border-surface-container-lowest flex items-center justify-center animate-pulse">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                home
              </span>
            </div>
            <div className="mt-1 bg-surface-container-lowest px-2 py-0.5 rounded-lg shadow-sm border border-outline-variant/30">
              <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary">
                Mi Hogar
              </p>
            </div>
          </div>

          <div className="absolute top-[60%] left-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <div className="bg-status-alert text-on-primary p-3 rounded-full shadow-2xl border-4 border-surface-container-lowest flex items-center justify-center">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </div>
            <div className="mt-2 map-glass px-3 py-1 rounded-full shadow-sm border border-outline-variant/30">
              <span className="flex items-center gap-1 text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface">
                <span className="w-2 h-2 rounded-full bg-status-alert" />
                En camino
              </span>
            </div>
          </div>
        </div>

        <button className="absolute right-5 bottom-[240px] z-20 w-14 h-14 bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-transform">
          <span className="material-symbols-outlined">my_location</span>
        </button>

        <div className="absolute bottom-6 left-5 right-5 z-20">
          <div className="bg-surface-card rounded-xl p-4 shadow-2xl shadow-primary/20 border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h2 className="text-[20px] leading-[28px] font-bold text-primary">
                  Camión en camino
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-on-surface-variant text-md">
                    schedule
                  </span>
                  <p className="text-[16px] leading-[24px] text-on-surface-variant">
                    Llegada en{" "}
                    <span className="font-bold text-primary">15 min</span>
                  </p>
                </div>
              </div>
              <div className="bg-waste-recyclable/10 text-waste-recyclable px-3 py-1 rounded-full flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  recycling
                </span>
                <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                  Reciclable
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity">
                <span className="material-symbols-outlined">
                  notifications_active
                </span>
                Notificar llegada
              </button>
              <button className="w-12 h-12 border border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant active:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
