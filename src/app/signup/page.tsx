'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const passwordValid = password.length >= 8;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) return;

    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({ email, password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Si Confirm Email está desactivado en Supabase, signUp ya devuelve session.
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
      return;
    }

    // Si está activado, hay que confirmar por email primero.
    setInfo('Cuenta creada. Revisá tu email para confirmar antes de iniciar sesión.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo.jpg" alt="Pollar Pay" width={40} height={40} priority className="rounded-lg" />
          <span className="font-semibold text-xl tracking-tight">Pollar Pay</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">Crear cuenta</h1>
          <p className="text-slate-400 text-sm mb-6">Empezá a aceptar pagos en USDC.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password <span className="text-slate-500 font-normal text-xs">— mínimo 8 caracteres</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {error}
              </div>
            )}

            {info && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !passwordValid}
              className="w-full py-2.5 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-6 text-center">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-sky-400 hover:text-sky-300">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
