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

    // En signup llamamos a /api/auth/signup (server-side, usa admin.createUser
    // con email_confirm:true → no se manda ningún mail, no hay rate limit).
    // Después, ya creado el user, hacemos signInWithPassword en el browser
    // para que las cookies de sesión se guarden por @supabase/ssr.
    if (mode === 'signup') {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || `Error al crear cuenta (HTTP ${res.status})`);
          setLoading(false);
          return;
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error de red al crear cuenta');
        setLoading(false);
        return;
      }
    }

    // Tanto en signup (recién creado) como en login: tomamos la sesión con
    // signInWithPassword para que @supabase/ssr setee las cookies httpOnly.
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('invalid login credentials')) {
        setError('Usuario o contraseña incorrectos.');
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
    <div className="min-h-screen bg-white text-[#1a1a1a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo.jpg" alt="Pollar Pay" width={40} height={40} priority className="rounded-lg" />
          <span className="font-semibold text-xl tracking-tight">Pollar Pay</span>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          <p className="text-[#6b7280] text-sm mb-6">{subtitle}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().slice(0, 32))}
                required
                autoComplete="username"
                placeholder="mi-comercio"
                pattern={USERNAME_RE.source}
                className="w-full px-4 py-2.5 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4] font-mono"
              />
              {mode === 'signup' && (
                <p className="mt-1.5 text-xs text-[#9ca3af]">
                  3 a 32 caracteres. Letras, números, punto, guion y guion bajo.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1.5">
                Contraseña
                {mode === 'signup' && (
                  <span className="text-[#9ca3af] font-normal text-xs"> — mínimo {MIN_PASS} caracteres</span>
                )}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={MIN_PASS}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full px-4 py-2.5 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formValid}
              className="w-full py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (mode === 'signup' ? 'Creando…' : 'Entrando…') : submitLabel}
            </button>

            {mode === 'signup' && (
              <p className="text-xs text-[#9ca3af] text-center">
                Anotá tu usuario y contraseña — no usamos email, no hay recupero
                automático.
              </p>
            )}
          </form>

          <p className="text-sm text-[#6b7280] mt-6 text-center">
            {altLink.cta}{' '}
            <Link href={altLink.href} className="text-[#005DB4] hover:text-[#0047a0]">
              {altLink.label}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
