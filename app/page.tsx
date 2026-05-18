export default function OnboardingPage() {
  return (
    <>
      <div className="fixed inset-0 andean-pattern pointer-events-none" />
      <main className="relative min-h-screen flex flex-col items-center justify-center px-container-margin py-xl">
        <div className="w-full max-w-md text-center mb-xl">
          <div className="mb-md inline-flex items-center justify-center p-sm bg-primary-container rounded-xl shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">
              recycling
            </span>
          </div>
          <h1 className="text-[32px] leading-[40px] tracking-[-0.02em] font-extrabold text-primary mb-sm">
            Eco Track Cusco: Juntos por un Cusco más verde
          </h1>
          <p className="text-[16px] leading-[24px] text-on-surface-variant">
            Únete a la red ciudadana para transformar nuestra ciudad imperial en
            un modelo de sostenibilidad.
          </p>
        </div>

        <div className="w-full max-w-md grid grid-cols-1 gap-md mb-xl">
          <div className="glass-panel p-md rounded-xl border border-outline-variant/30 flex items-start gap-md shadow-sm">
            <div className="bg-waste-organic/10 p-sm rounded-lg">
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
          <div className="glass-panel p-md rounded-xl border border-outline-variant/30 flex items-start gap-md shadow-sm">
            <div className="bg-waste-recyclable/10 p-sm rounded-lg">
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

        <div className="w-full max-w-md bg-surface-container-lowest p-lg rounded-xl shadow-xl shadow-primary/5 border border-outline-variant/20">
          <div className="mb-lg">
            <h2 className="text-[20px] leading-[28px] font-bold text-on-surface">
              Regístrate
            </h2>
            <p className="text-[14px] leading-[20px] text-on-surface-variant">
              Completa tus datos para empezar a colaborar.
            </p>
          </div>
          <form className="space-y-md">
            <div className="space-y-xs">
              <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-xs">
                Nombre Completo
              </label>
              <input
                className="w-full bg-surface p-md rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[16px] leading-[24px]"
                placeholder="Ej. Juan Quispe"
                type="text"
              />
            </div>
            <div className="space-y-xs">
              <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-xs">
                Teléfono
              </label>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined">
                  call
                </span>
                <input
                  className="w-full bg-surface pl-xl p-md rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[16px] leading-[24px]"
                  placeholder="987 654 321"
                  type="tel"
                />
              </div>
            </div>
            <div className="space-y-xs">
              <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-xs">
                Zona de Residencia
              </label>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined">
                  location_on
                </span>
                <select className="w-full bg-surface pl-xl p-md rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none transition-all text-[16px] leading-[24px]">
                  <option value="">Selecciona tu zona</option>
                  <option value="centro">Centro Histórico</option>
                  <option value="san_blas">San Blas</option>
                  <option value="wanchaq">Wanchaq</option>
                  <option value="san_sebastian">San Sebastián</option>
                  <option value="santiago">Santiago</option>
                </select>
              </div>
            </div>
            <div className="pt-sm">
              <button
                className="w-full bg-primary text-on-primary text-[12px] leading-[16px] tracking-[0.05em] font-bold text-[16px] leading-[24px] py-md rounded-lg shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center justify-center gap-sm"
                type="submit"
              >
                Empezar
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </form>
          <p className="mt-lg text-center text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
            ¿Ya tienes una cuenta?{" "}
            <a className="text-primary hover:underline" href="#">
              Inicia sesión
            </a>
          </p>
        </div>

        <footer className="w-full py-lg text-center mt-xl">
          <span className="text-[11px] leading-[14px] tracking-[0.08em] font-extrabold text-outline uppercase tracking-widest">
            Municipalidad del Cusco • 2024
          </span>
        </footer>
      </main>
    </>
  );
}
