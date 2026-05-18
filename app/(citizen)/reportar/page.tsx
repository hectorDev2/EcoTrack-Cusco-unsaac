export default function ReportarPage() {
  return (
    <>
      <header className="bg-surface shadow-sm shadow-primary/10 flex justify-between items-center w-full px-5 py-2 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button className="active:scale-95 transition-transform duration-200 text-primary p-1">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-[20px] leading-[28px] font-black text-primary">
            Eco Track Cusco
          </h1>
        </div>
        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-container bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
          <span className="material-symbols-outlined">person</span>
        </div>
      </header>

      <main className="flex-grow px-5 pt-6 max-w-2xl mx-auto w-full pb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">
            report_problem
          </span>
          <h2 className="text-[24px] leading-[32px] font-bold text-primary">
            Reportar Incidencia
          </h2>
        </div>

        <div className="bg-surface-container rounded-xl p-4 mb-6 flex gap-4 items-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
            1
          </div>
          <div>
            <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary">
              NUEVO REPORTE
            </p>
            <p className="text-[14px] leading-[20px] text-on-surface-variant">
              Complete los detalles de la incidencia detectada.
            </p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="space-y-1">
            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary px-1">
              TIPO DE INCIDENCIA
            </label>
            <div className="relative">
              <select className="w-full bg-surface-container-low border-2 border-outline-variant/30 rounded-lg p-4 text-[16px] leading-[24px] focus:border-primary focus:ring-0 appearance-none transition-colors">
                <option disabled selected value="">
                  Seleccione una opción
                </option>
                <option value="acumulacion">Acumulación</option>
                <option value="camion">Camión no pasó</option>
                <option value="punto_critico">Punto crítico</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary px-1">
              DESCRIPCIÓN
            </label>
            <textarea
              className="w-full bg-surface-container-low border-2 border-outline-variant/30 rounded-lg p-4 text-[16px] leading-[24px] focus:border-primary focus:ring-0 transition-colors"
              placeholder="Describa brevemente lo que observa..."
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary px-1">
              FOTOGRAFÍA
            </label>
            <button
              className="w-full border-2 border-dashed border-outline-variant/50 rounded-lg py-8 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-high transition-all active:scale-[0.98]"
              type="button"
            >
              <span className="material-symbols-outlined text-primary text-[40px]">
                add_a_photo
              </span>
              <span className="text-[14px] leading-[20px] text-on-surface-variant">
                Subir foto del lugar
              </span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary px-1">
              UBICACIÓN DETECTADA
            </label>
            <div className="bg-surface-container-low border-2 border-outline-variant/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-status-alert">
                  location_on
                </span>
                <p className="text-[16px] leading-[24px] text-on-surface">
                  Av. Sol, Cusco, Perú
                </p>
              </div>
              <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary bg-primary-container/10 px-2 py-1 rounded">
                AUTOMÁTICO
              </span>
            </div>
            <div className="w-full h-32 rounded-lg overflow-hidden mt-2 border border-outline-variant/30 bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">
                map
              </span>
            </div>
          </div>

          <button
            className="w-full bg-primary text-on-primary text-[24px] leading-[32px] font-bold py-md rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            type="submit"
          >
            <span className="text-[16px] leading-[24px]">Enviar Reporte</span>
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>

        <div className="mt-xl p-4 bg-primary-container text-on-primary-container rounded-lg border border-primary/20 flex items-center gap-4">
          <span
            className="material-symbols-outlined text-primary-fixed-dim"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <div className="flex-grow">
            <p className="text-[12px] leading-[16px] tracking-[0.05em] font-bold">
              ¡Reporte enviado con éxito!
            </p>
            <p className="text-[14px] leading-[20px] opacity-90">
              Su incidencia ha sido registrada y está siendo procesada.
            </p>
          </div>
          <button className="text-on-primary-container/60 hover:text-on-primary-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </main>
    </>
  );
}
