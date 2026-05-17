'use client';

// Página pública para aceptar una invitación a sucursal.
// URL: /invitacion/<token>
//
// Flujo:
//   1. Pide al backend la metadata de la invitación.
//   2. Si no hay sesión, redirige a /login?next=/invitacion/<token>.
//   3. Si hay sesión, muestra un CTA "Aceptar invitación".
//   4. POST al backend → redirige al detalle de la sucursal.

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { backendFetch } from '@/lib/backend-api';
import { createClient } from '@/lib/supabase/client';

interface InviteInfo {
  role: 'owner' | 'cashier';
  invited_email: string | null;
  expires_at: string;
  project_name: string;
  project_reason: string;
  valid: boolean;
  reason: string | null;
}

const INVALID_REASON_LABEL: Record<string, string> = {
  revoked: 'La invitación fue revocada por el dueño.',
  expired: 'La invitación expiró.',
  used_up: 'La invitación ya se usó el máximo de veces.',
};

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // No usamos backendFetch porque este endpoint es público — sin auth.
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    fetch(`${BACKEND_URL}/api/invites/${token}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Invitación inválida');
        return data;
      })
      .then((d: { invite: InviteInfo }) => setInvite(d.invite))
      .catch(e => setError(e.message));

    // Chequeo de sesión en paralelo
    createClient().auth.getSession().then(({ data }) => {
      setAuthed(!!data.session?.access_token);
    });
  }, [token]);

  const accept = async () => {
    setError(null);
    setAccepting(true);
    try {
      const res = await backendFetch<{ project_id: string }>(
        `/api/invites/${token}/accept`,
        { method: 'POST' },
      );
      router.push(`/dashboard/sucursales/${res.project_id}?joined=1`);
    } catch (e: any) {
      setError(e.message);
      setAccepting(false);
    }
  };

  if (error && !invite) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold mb-2">Invitación inválida</h1>
        <p className="text-sm text-[#6b7280] mb-6">{error}</p>
        <Link href="/" className="text-sm text-[#005DB4] hover:text-[#0047a0]">
          Volver al inicio
        </Link>
      </Centered>
    );
  }

  if (!invite) {
    return <Centered><p className="text-sm text-[#9ca3af]">Cargando invitación…</p></Centered>;
  }

  if (!invite.valid) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold mb-2">Invitación no disponible</h1>
        <p className="text-sm text-[#6b7280] mb-6">
          {INVALID_REASON_LABEL[invite.reason || ''] || 'Esta invitación ya no es válida.'}
        </p>
        <Link href="/" className="text-sm text-[#005DB4] hover:text-[#0047a0]">
          Volver al inicio
        </Link>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="text-xs uppercase tracking-wider text-[#9ca3af] mb-3">Te invitaron a</div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-1 break-words">{invite.project_name}</h1>
      <p className="text-sm text-[#6b7280] mb-6">{invite.project_reason}</p>

      <div className="bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg p-4 mb-6 text-sm space-y-1">
        <div>
          <span className="text-[#9ca3af]">Rol asignado: </span>
          <span className="font-medium">{invite.role === 'owner' ? 'Dueño' : 'Cajero'}</span>
        </div>
        <div>
          <span className="text-[#9ca3af]">Permisos: </span>
          generar cobros y ver movimientos de esta sucursal.
        </div>
        {invite.invited_email && (
          <div>
            <span className="text-[#9ca3af]">Para: </span>
            <span className="font-mono text-xs">{invite.invited_email}</span>
          </div>
        )}
        <div>
          <span className="text-[#9ca3af]">Vence: </span>
          {new Date(invite.expires_at).toLocaleString()}
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {authed === null ? (
        <p className="text-xs text-[#9ca3af]">Verificando sesión…</p>
      ) : authed ? (
        <button
          onClick={accept}
          disabled={accepting}
          className="w-full py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium disabled:opacity-50"
        >
          {accepting ? 'Aceptando…' : 'Aceptar invitación'}
        </button>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/invitacion/${token}`)}`}
          className="block w-full text-center py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
        >
          Iniciar sesión para aceptar
        </Link>
      )}

      <p className="text-xs text-[#9ca3af] mt-4 text-center">
        Pollar Pay no custodia fondos — los pagos van directo a la wallet del dueño.
      </p>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}
