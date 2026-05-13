// ─── Supabase browser client ────────────────────────────────────────────────
// Para usar en componentes "use client". Maneja la sesión vía cookies
// (httpOnly seguras) coordinadas con el middleware.
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
