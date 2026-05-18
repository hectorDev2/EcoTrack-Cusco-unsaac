export default function OnboardingPage() {
  return (
    <>
      <div className="fixed inset-0 andean-pattern pointer-events-none" />
      <main className="relative min-h-screen flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg text-center mb-8">
          <div className="mb-4 inline-flex items-center justify-center p-2 bg-primary-container rounded-xl shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container text-4xl md:text-5xl">
              recycling
            </span>
          </div>
          <h1 className="text-[28px] leading-[36px] md:text-[40px] md:leading-[48px] tracking-[-0.02em] font-extrabold text-primary mb-2">
            Eco Track Cusco: Juntos por un Cusco más verde
          </h1>
          <p className="text-[16px] leading-[24px] md:text-[18px] md:leading-[28px] text-on-surface-variant max-w-md mx-auto">
            Únete a la red ciudadana para transformar nuestra ciudad imperial en
            un modelo de sostenibilidad.
          </p>
        </div>

        <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-outline-variant/30 flex items-start gap-4 shadow-sm" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>
            <div className="bg-waste-organic/10 p-2 rounded-lg shrink-0">
              <span className="material-symbols-outlined text-waste-organic">
                eco
              </span>
            </div>
            <div>
              <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary">
                Segregación Orgánica
              </h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">
                Aprende a separar restos de comida para compostaje municipal.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-outline-variant/30 flex items-start gap-4 shadow-sm" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>
            <div className="bg-waste-recyclable/10 p-2 rounded-lg shrink-0">
              <span className="material-symbols-outlined text-waste-recyclable">
                inventory_2
              </span>
            </div>
            <div>
              <h3 className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary">
                Reciclaje Activo
              </h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">
                Plásticos, vidrios y cartones tienen un nuevo destino aquí.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-lg bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-primary/5 border border-outline-variant/20">
          <div className="mb-6">
            <h2 className="text-[20px] leading-[28px] md:text-[24px] md:leading-[32px] font-bold text-on-surface">
              Regístrate
            </h2>
            <p className="text-[14px] leading-[20px] text-on-surface-variant">
              Completa tus datos para empezar a colaborar.
            </p>
          </div>
          <form>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-1">
                  Nombre Completo
                </label>
                <input
                  className="w-full bg-surface p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[16px] leading-[24px]"
                  placeholder="Ej. Juan Quispe"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-1">
                  Teléfono
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined">
                    call
                  </span>
                  <input
                    className="w-full bg-surface pl-8 p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[16px] leading-[24px]"
                    placeholder="987 654 321"
                    type="tel"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-1">
                  Zona de Residencia
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined">
                    location_on
                  </span>
                  <select className="w-full bg-surface pl-8 p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none transition-all text-[16px] leading-[24px]">
                    <option value="">Selecciona tu zona</option>
                    <option value="centro">Centro Histórico</option>
                    <option value="san_blas">San Blas</option>
                    <option value="wanchaq">Wanchaq</option>
                    <option value="san_sebastian">San Sebastián</option>
                    <option value="santiago">Santiago</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button
                  className="w-full bg-primary text-on-primary p-4 rounded-lg shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center justify-center gap-2 text-[16px] leading-[24px] font-bold"
                  type="submit"
                >
                  Empezar
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </form>
          <p className="mt-6 text-center">
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
              ¿Ya tienes una cuenta?{" "}
            </span>
            <a
              className="text-primary hover:underline text-[12px] leading-[16px] tracking-[0.05em] font-bold"
              href="#"
            >
              Inicia sesión
            </a>
          </p>
        </div>

        <footer className="w-full py-6 text-center mt-8">
          <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-outline uppercase">
            Municipalidad del Cusco • 2024
          </span>
        </footer>
      </main>
    </>
  );
}
