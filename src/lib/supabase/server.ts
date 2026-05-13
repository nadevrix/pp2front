// ─── Supabase server client ─────────────────────────────────────────────────
// Para usar en Server Components, Server Actions y route handlers.
// Lee la sesión desde cookies httpOnly y permite refrescar el access_token.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamadas desde Server Components no pueden setear cookies — el
            // middleware se encarga del refresh, así que ignoramos el error.
          }
        },
      },
    },
  );
}
