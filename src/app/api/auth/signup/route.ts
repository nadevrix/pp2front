// ─── POST /api/auth/signup ───────────────────────────────────────────────────
// Crea un usuario con admin.createUser({ email_confirm: true }) usando la
// service role key del server. Esto evita que Supabase encole un mail de
// confirmación a la dirección sintética `usuario@pollar.local` (que choca
// con el rate limit del SMTP gratuito y siempre falla porque el dominio no
// existe).
//
// El cliente llama a este endpoint y, si responde 200, inmediatamente hace
// signInWithPassword() para tomar la sesión. No devolvemos tokens directamente
// porque el flow estándar de Supabase espera que el browser maneje los
// cookies vía signInWithPassword.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isValidUsername,
  usernameToSyntheticEmail,
} from '@/lib/auth-username';

const MIN_PASS = 8;

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido (JSON esperado)' }, { status: 400 });
  }

  const username = (body.username ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: 'Usuario inválido. Usá 3-32 caracteres: a-z, 0-9, punto, guion, guion bajo.' },
      { status: 400 },
    );
  }
  if (password.length < MIN_PASS) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASS} caracteres.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Servicio de auth mal configurado. Falta SUPABASE_SERVICE_ROLE_KEY en el server.' },
      { status: 503 },
    );
  }

  const email = usernameToSyntheticEmail(username);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    // Marca el email como ya verificado → Supabase NO encola el mail de
    // confirmación → no se gasta cupo del rate limit ni se bloquea el signup.
    email_confirm: true,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Ese usuario ya existe. Probá iniciar sesión.' },
        { status: 409 },
      );
    }
    if (msg.includes('weak') || msg.includes('password')) {
      return NextResponse.json({ error: 'Contraseña demasiado débil.' }, { status: 400 });
    }
    console.error('[AUTH SIGNUP] admin.createUser error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, user_id: data.user?.id, email: data.user?.email },
    { status: 201 },
  );
}
