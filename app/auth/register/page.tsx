'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';


export default function RegisterPage() {
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Error al registrarse. Intenta de nuevo.');
        return;
      }

      if (data.user.role === 'CITIZEN') {
        router.push('/inicio');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Error al registrarse. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-gradient-to-b from-surface to-surface-container-low">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex items-center justify-center p-2 bg-primary-container rounded-xl shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">
              recycling
            </span>
          </div>
          <h1 className="text-[28px] leading-[36px] font-extrabold text-primary mb-2">
            Crear cuenta
          </h1>
          <p className="text-[14px] leading-[20px] text-on-surface-variant">
            Únete a la red ciudadana de Cusco
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert text-sm">error</span>
            <p className="text-status-alert text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl shadow-primary/5 border border-outline-variant/20">
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
              <p className="text-[11px] leading-[16px] text-on-surface-variant text-center">
                Al crear una cuenta aceptas nuestra{' '}
                <a
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold"
                >
                  Política de Privacidad
                </a>
                .
              </p>
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
                      Crear cuenta
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
      </div>
    </main>
  );
}
