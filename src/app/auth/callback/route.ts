// ─── /auth/callback ─────────────────────────────────────────────────────────
// Endpoint al que Google (vía Supabase) redirige después del OAuth. Recibe
// `?code=...&next=...`, lo intercambia por una sesión Supabase y guarda las
// cookies httpOnly. Después redirige al destino que pidió el cliente
// (?next=) o a /dashboard por defecto.
//
// Si algo falla, redirige a /login?error=... así el UI puede mostrar el
// mensaje sin quedarse en una página en blanco.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/dashboard';

  // Solo aceptamos `next` que sea path interno — evita open redirect.
  const next = nextParam.startsWith('/') ? nextParam : '/dashboard';

  if (!code) {
    const back = new URL('/login', url.origin);
    back.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(back);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const back = new URL('/login', url.origin);
    back.searchParams.set('error', 'oauth_failed');
    return NextResponse.redirect(back);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
