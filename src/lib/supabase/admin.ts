// ─── Supabase admin client ──────────────────────────────────────────────────
// Cliente que usa la SERVICE ROLE KEY. Vive SOLO en el server (Next.js API
// routes / Server Actions). Esta clave bypasea RLS y permite operaciones
// privilegiadas como crear usuarios con email_confirm:true (sin disparar
// el mail de confirmación que se topa con el rate limit gratuito).
//
// CRÍTICO: nunca importar este módulo desde un Client Component. La key se
// filtraría al bundle del browser. La factory devuelve null si la env var
// no está, así que el route handler puede responder 503 con mensaje claro.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
