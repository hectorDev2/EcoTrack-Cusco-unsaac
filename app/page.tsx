'use client';

import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-gradient-to-b from-surface to-surface-container-low">
      <div className="fixed inset-0 andean-pattern pointer-events-none opacity-50" />
      <div className="relative w-full max-w-lg text-center mb-10">
        <div className="mb-4 inline-flex items-center justify-center p-3 bg-primary-container rounded-2xl shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-on-primary-container text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            recycling
          </span>
        </div>
        <h1 className="text-[32px] leading-[40px] font-extrabold text-primary mb-3">
          Eco Track Cusco
        </h1>
        <p className="text-[16px] leading-[24px] text-on-surface-variant max-w-sm mx-auto">
          Únete a la red ciudadana para mantener la pureza de nuestra ciudad imperial.
        </p>
      </div>

      <div className="relative w-full max-w-sm space-y-4">
        <button
          onClick={() => router.push('/auth/register')}
          className="w-full bg-primary text-on-primary p-4 rounded-xl shadow-lg shadow-primary/20 text-[16px] leading-[24px] font-bold hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">person_add</span>
          Crear cuenta
        </button>

        <button
          onClick={() => router.push('/auth/login')}
          className="w-full bg-surface-container-high text-on-surface p-4 rounded-xl border border-outline-variant/30 text-[16px] leading-[24px] font-bold hover:bg-surface-container-highest active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">login</span>
          Iniciar sesión
        </button>
      </div>

      <footer className="relative w-full py-6 text-center mt-12">
        <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-outline uppercase">
          Municipalidad del Cusco • 2025
        </span>
      </footer>
    </main>
  );
}
