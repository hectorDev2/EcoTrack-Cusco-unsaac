'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';

export default function ReportarPage() {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/incidents', { type, description });
      setSuccess(true);
      setType('');
      setDescription('');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Error al enviar el reporte');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="bg-surface shadow-sm shadow-primary/10 flex justify-between items-center w-full px-5 py-2 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="active:scale-95 transition-transform duration-200 text-primary p-1"
          >
            <span className="material-symbols-outlined">arrow_back</span>
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

        {success && (
          <div className="mb-6 p-4 bg-primary-container text-on-primary-container rounded-lg border border-primary/20 flex items-center gap-4">
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
                Tu incidencia ha sido registrada.
              </p>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="text-on-primary-container/60 hover:text-on-primary-container"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert text-sm">error</span>
            <p className="text-status-alert text-sm font-bold">{error}</p>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-primary px-1">
              TIPO DE INCIDENCIA
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full bg-surface-container-low border-2 border-outline-variant/30 rounded-lg p-4 text-[16px] leading-[24px] focus:border-primary focus:ring-0 appearance-none transition-colors disabled:opacity-50"
              >
                <option value="">Seleccione una opción</option>
                <option value="CONTAINER_DAMAGED">Contenedor dañado</option>
                <option value="MISSED_COLLECTION">Recolección no realizada</option>
                <option value="ILLEGAL_DUMPING">Vertido ilegal</option>
                <option value="OTHER">Otro</option>
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              disabled={isSubmitting}
              className="w-full bg-surface-container-low border-2 border-outline-variant/30 rounded-lg p-4 text-[16px] leading-[24px] focus:border-primary focus:ring-0 transition-colors disabled:opacity-50"
              placeholder="Describa brevemente lo que observa..."
              rows={4}
            />
          </div>

          <button
            className="w-full bg-primary text-on-primary text-[24px] leading-[32px] font-bold py-md rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[16px] leading-[24px]">Enviando...</span>
              </>
            ) : (
              <>
                <span className="text-[16px] leading-[24px]">Enviar Reporte</span>
                <span className="material-symbols-outlined">send</span>
              </>
            )}
          </button>
        </form>
      </main>
    </>
  );
}
