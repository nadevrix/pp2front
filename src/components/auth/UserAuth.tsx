'use client';

// Auth con usuario + contraseña, sin email real.
//
// Por dentro hablamos con Supabase usando un email sintético `user@pollar.local`
// — Supabase pide email obligatorio en auth.users, pero el dominio fake nunca
// se resuelve ni se envía nada. El comercio solo ve y recuerda usuario+pass.
//
// El mismo componente cubre login y signup; difiere solo en si llamamos
// signUp() o signInWithPassword(). En Supabase hay que desactivar
// "Confirm email" para que signUp() devuelva sesión sin paso de email.

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  USERNAME_RE,
  isValidUsername,
  usernameToSyntheticEmail,
} from '@/lib/auth-username';

interface Props {
  mode: 'login' | 'signup';
  title: string;
  subtitle: string;
  submitLabel: string;
  altLink: { href: string; label: string; cta: string };
  next?: string;
}

const MIN_PASS = 8;

export default function UserAuth({
  mode,
  title,
  subtitle,
  submitLabel,
  altLink,
  next = '/dashboard',
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameValid = isValidUsername(username);
  const passwordValid = password.length >= MIN_PASS;
  const formValid = usernameValid && passwordValid;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    setLoading(true);
    setError(null);

    const email = usernameToSyntheticEmail(username);

    const { error: err } =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      // Traducimos al usuario los errores típicos de Supabase
      const msg = err.message.toLowerCase();
      if (msg.includes('invalid login credentials')) {
        setError('Usuario o contraseña incorrectos.');
      } else if (msg.includes('already registered') || msg.includes('user already')) {
        setError('Ese usuario ya existe. Probá iniciar sesión.');
      } else if (msg.includes('email not confirmed')) {
        setError('La cuenta existe pero requiere confirmación. Pedile al admin que desactive "Confirm email" en Supabase.');
      } else {
        setError(err.message);
      }
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo.jpg" alt="Pollar Pay" width={40} height={40} priority className="rounded-lg" />
          <span className="font-semibold text-xl tracking-tight">Pollar Pay</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          <p className="text-slate-400 text-sm mb-6">{subtitle}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().slice(0, 32))}
                required
                autoComplete="username"
                placeholder="mi-comercio"
                pattern={USERNAME_RE.source}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
              {mode === 'signup' && (
                <p className="mt-1.5 text-xs text-slate-500">
                  3 a 32 caracteres. Letras, números, punto, guion y guion bajo.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Contraseña
                {mode === 'signup' && (
                  <span className="text-slate-500 font-normal text-xs"> — mínimo {MIN_PASS} caracteres</span>
                )}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={MIN_PASS}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formValid}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (mode === 'signup' ? 'Creando…' : 'Entrando…') : submitLabel}
            </button>

            {mode === 'signup' && (
              <p className="text-xs text-slate-500 text-center">
                Anotá tu usuario y contraseña — no usamos email, no hay recupero
                automático.
              </p>
            )}
          </form>

          <p className="text-sm text-slate-400 mt-6 text-center">
            {altLink.cta}{' '}
            <Link href={altLink.href} className="text-sky-400 hover:text-sky-300">
              {altLink.label}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
