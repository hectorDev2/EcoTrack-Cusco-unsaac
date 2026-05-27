'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClientError } from '@/lib/api';

const roleHome: Record<string, string> = {
  ADMIN: '/dashboard',
  CITIZEN: '/inicio',
  DRIVER: '/conductor/dashboard',
};

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      const defaultHome = roleHome[user.role] ?? '/dashboard';
      const redirect = redirectParam && Object.values(roleHome).includes(redirectParam)
        ? redirectParam : defaultHome;
      router.replace(redirect);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface-card rounded-2xl shadow-sm border border-outline-variant p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined">recycling</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary">Eco Track Cusco</h1>
            <p className="text-[11px] tracking-[0.08em] font-bold text-on-surface-variant/70 uppercase">
              Iniciar sesión
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-status-alert/10 border border-status-alert/30 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-status-alert text-sm">error</span>
            <p className="text-status-alert text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold tracking-[0.05em] text-on-surface-variant uppercase block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={isSubmitting}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs font-bold tracking-[0.05em] text-on-surface-variant uppercase block mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm tracking-[0.05em] flex items-center justify-center gap-2 hover:shadow-md transition-shadow disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="mt-6 text-center">
          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-bold text-on-surface-variant">
            ¿No tienes cuenta?{' '}
          </span>
          <a
            className="text-primary hover:underline text-[12px] leading-[16px] tracking-[0.05em] font-bold cursor-pointer"
            onClick={() => router.push('/auth/register')}
          >
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm">
        <div className="bg-surface-card rounded-2xl shadow-sm border border-outline-variant p-8 flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
