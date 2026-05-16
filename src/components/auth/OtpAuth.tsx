'use client';

// Flujo de autenticación con OTP de 6 dígitos por email.
//
// 1. Usuario escribe email → signInWithOtp() (Supabase envía código por email)
// 2. UI cambia a input de 6 dígitos → verifyOtp() valida y crea sesión
// 3. router.push(next)
//
// El mismo flujo cubre signup y login. `shouldCreateUser` controla si Supabase
// crea el user cuando no existe — true en signup, true en login también para
// que un email nuevo no se quede afuera (Pollar Pay quiere registro de bajo
// roce, igual que Stripe/MP).

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Step = 'email' | 'code';

interface Props {
  /** "Iniciar sesión" o "Crear cuenta" — el título principal */
  title: string;
  /** Frase corta que va debajo del título en el paso 1 */
  subtitle: string;
  /** Texto del botón principal en el paso 1 (mandar código) */
  submitLabel: string;
  /** Link al modo opuesto: si estamos en login, link a signup y viceversa */
  altLink: { href: string; label: string; cta: string };
  /** A dónde redirigimos al verificar OK. Default: /dashboard */
  next?: string;
}

const COOLDOWN_S = 45;

export default function OtpAuth({ title, subtitle, submitLabel, altLink, next = '/dashboard' }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Countdown del reenvío de código
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const sendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setStep('code');
    setInfo(`Te enviamos un código de 6 dígitos a ${email.trim()}.`);
    setCooldown(COOLDOWN_S);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });

    if (err) {
      setError(err.message);
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
          <p className="text-slate-400 text-sm mb-6">
            {step === 'email' ? subtitle : `Revisá ${email} y pegá el código abajo.`}
          </p>

          {step === 'email' ? (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="vos@email.com"
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
                disabled={loading || !email.trim()}
                className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando código…' : submitLabel}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Te enviamos un código de 6 dígitos por email. Sin password, sin link.
              </p>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Código de 6 dígitos
                </label>
                <input
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {info && !error && (
                <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
                  {info}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando…' : 'Verificar y entrar'}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(null); setInfo(null); }}
                  className="text-slate-400 hover:text-white"
                >
                  ← Cambiar email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => sendCode()}
                  className="text-sky-400 hover:text-sky-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}

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
