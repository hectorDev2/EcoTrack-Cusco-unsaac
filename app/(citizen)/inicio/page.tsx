'use client';

import { useRouter } from 'next/navigation';

export default function InicioPage() {
  const router = useRouter();

  return (
    <>
      <header className="bg-surface shadow-sm shadow-primary/10 flex justify-between items-center w-full px-5 py-2 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-[20px] leading-[28px] font-black text-primary">
            Eco Track Cusco
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant hidden md:block">
            Cusco, PE
          </span>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed ring-2 ring-primary-container/10 bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6 space-y-6 max-w-2xl mx-auto">
        <section className="space-y-1">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary">
            ¡Hola, Ciudadano!
          </h2>
          <p className="text-[16px] leading-[24px] text-on-surface-variant">
            Mantengamos juntos la pureza de nuestra ciudad imperial.
          </p>
        </section>

        <div className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary-container shadow-xl shadow-primary/20 flex flex-col gap-4 border border-white/10 active:scale-95 transition-transform duration-200 cursor-pointer">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold uppercase opacity-80">
                Siguiente Recolección
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-[48px] leading-none font-extrabold tracking-tight">
                  2:30
                </span>
                <span className="text-[24px] leading-[32px] font-bold opacity-90">
                  PM
                </span>
              </div>
            </div>
            <div className="bg-primary/20 backdrop-blur-md rounded-lg p-2 border border-white/20">
              <span
                className="material-symbols-outlined text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 bg-waste-organic text-white px-3 py-1.5 rounded-full shadow-lg">
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

        <section className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-waste-organic/10 rounded-lg text-waste-organic">
              <span className="material-symbols-outlined">recycling</span>
            </div>
            <div className="space-y-1">
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

        <section className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/recoleccion')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Horarios
            </span>
          </button>
          <button
            onClick={() => router.push('/puntos-recojo')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Puntos de Recojo
            </span>
          </button>
          <button
            onClick={() => router.push('/reportar')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">report_problem</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Reportar
            </span>
          </button>
          <button
            onClick={() => router.push('/perfil')}
            className="flex flex-col items-center justify-center gap-2 p-6 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary-fixed active:scale-95 duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              Mi Perfil
            </span>
          </button>
        </section>

        <section className="bg-surface-card rounded-xl p-4 border border-outline-variant shadow-sm">
          <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary mb-3 uppercase">
            Avisos importantes
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-status-alert/5 rounded-lg border border-status-alert/10">
              <span className="material-symbols-outlined text-status-alert text-sm mt-0.5">info</span>
              <p className="text-[13px] leading-[18px] text-on-surface-variant">
                Cambio en el horario de recolección para la zona Centro debido a feriado municipal.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
