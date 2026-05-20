'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError, setToken } from '@/lib/api';
import type { User } from '@/lib/types';

interface RegisterResponse {
  user: User;
  accessToken: string;
}

export default function OnboardingPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<RegisterResponse>('/auth/register', {
        fullName,
        email,
        password,
      });

      setToken(res.accessToken);

      if (res.user.role === 'CITIZEN') {
        router.push('/inicio');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Error al registrarse. Intentalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {error && (
          <div className="w-full max-w-lg mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert text-sm">error</span>
            <p className="text-status-alert text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="w-full max-w-lg bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-primary/5 border border-outline-variant/20">
          <div className="mb-6">
            <h2 className="text-[20px] leading-[28px] md:text-[24px] md:leading-[32px] font-bold text-on-surface">
              Regístrate
            </h2>
            <p className="text-[14px] leading-[20px] text-on-surface-variant">
              Completa tus datos para empezar a colaborar.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-1">
                  Nombre Completo
                </label>
                <input
                  className="w-full bg-surface p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[16px] leading-[24px] disabled:opacity-50"
                  placeholder="Ej. Juan Quispe"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-1">
                  Email
                </label>
                <input
                  className="w-full bg-surface p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[16px] leading-[24px] disabled:opacity-50"
                  placeholder="ej. juan@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant px-1">
                  Contraseña
                </label>
                <input
                  className="w-full bg-surface p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[16px] leading-[24px] disabled:opacity-50"
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
              </div>
              <div className="pt-2">
                <button
                  className="w-full bg-primary text-on-primary p-4 rounded-lg shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center justify-center gap-2 text-[16px] leading-[24px] font-bold disabled:opacity-50"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Empezar
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="mt-6 text-center">
            <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
              ¿Ya tienes una cuenta?{' '}
            </span>
            <a
              className="text-primary hover:underline text-[12px] leading-[16px] tracking-[0.05em] font-bold cursor-pointer"
              onClick={() => router.push('/auth/login')}
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
