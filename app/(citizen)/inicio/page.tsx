export default function InicioPage() {
  return (
    <>
      <header className="bg-surface shadow-sm shadow-primary/10 flex justify-between items-center w-full px-container-margin py-sm sticky top-0 z-50">
        <div className="flex items-center gap-md">
          <button className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-[20px] leading-[28px] font-black text-primary">
            Eco Track Cusco
          </h1>
        </div>
        <div className="flex items-center gap-md">
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant hidden md:block">
            Cusco, PE
          </span>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed ring-2 ring-primary-container/10 bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </header>

      <main className="px-container-margin pt-lg space-y-lg max-w-2xl mx-auto">
        <section className="space-y-xs">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
            ¡Hola, Ciudadano!
          </h2>
          <p className="text-[16px] leading-[24px] text-on-surface-variant">
            Mantengamos juntos la pureza de nuestra ciudad imperial.
          </p>
        </section>

        <div className="relative overflow-hidden rounded-xl bg-primary-container p-lg text-on-primary-container shadow-xl shadow-primary/20 flex flex-col gap-md border border-white/10 active:scale-95 transition-transform duration-200 cursor-pointer">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-xs">
              <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold uppercase opacity-80">
                Siguiente Recolección
              </span>
              <div className="flex items-baseline gap-xs">
                <span className="text-[48px] leading-none font-extrabold tracking-tight">
                  2:30
                </span>
                <span className="text-[24px] leading-[32px] font-bold opacity-90">
                  PM
                </span>
              </div>
            </div>
            <div className="bg-primary/20 backdrop-blur-md rounded-lg p-sm border border-white/20">
              <span
                className="material-symbols-outlined text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </div>
          </div>
          <div className="flex items-center gap-sm mt-sm">
            <div className="flex items-center gap-xs bg-waste-organic text-white px-3 py-1.5 rounded-full shadow-lg">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                eco
              </span>
              <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
                Orgánico
              </span>
            </div>
            <div className="flex-1 h-[2px] bg-white/20 rounded-full">
              <div className="h-full w-2/3 bg-white/60 rounded-full" />
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold whitespace-nowrap">
              A 1.2 km
            </span>
          </div>
        </div>

        <section className="bg-surface-container-low rounded-xl p-md border border-outline-variant/30">
          <div className="flex gap-md items-start">
            <div className="p-sm bg-waste-organic/10 rounded-lg text-waste-organic">
              <span className="material-symbols-outlined">recycling</span>
            </div>
            <div className="space-y-xs">
              <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary">
                Hoy: Residuos Orgánicos
              </h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">
                Incluye restos de frutas, verduras y cáscaras. Por favor,
                asegúrese de usar bolsas biodegradables o compostables.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-md">
          <button className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">distance</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Ver Mapa
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">category</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Categorías
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">history</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Mis Reportes
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">help</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Ayuda
            </span>
          </button>
        </section>

        <section className="space-y-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant uppercase tracking-wider">
              Últimos Avisos
            </h3>
            <span className="text-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold cursor-pointer">
              Ver todos
            </span>
          </div>
          <div className="space-y-sm">
            <div className="flex items-center gap-md p-md bg-surface-container rounded-lg border-l-4 border-status-alert">
              <span className="material-symbols-outlined text-status-alert">
                warning
              </span>
              <div className="flex-1">
                <p className="text-[14px] leading-[20px] font-bold">
                  Retraso en Sector San Blas
                </p>
                <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant opacity-70">
                  Hace 15 min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-md p-md bg-surface-container rounded-lg border-l-4 border-primary">
              <span className="material-symbols-outlined text-primary">
                check_circle
              </span>
              <div className="flex-1">
                <p className="text-[14px] leading-[20px] font-bold">
                  Reporte Solucionado
                </p>
                <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant opacity-70">
                  Ayer, 4:20 PM
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <button className="fixed right-container-margin bottom-32 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all duration-150 z-40">
        <span
          className="material-symbols-outlined text-[32px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          add_a_photo
        </span>
      </button>
    </>
  );
}
