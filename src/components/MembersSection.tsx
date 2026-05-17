'use client';

// Gestión de miembros de una sucursal (PDF pág. 8: "usuarios distintos en
// el dashboard"). El owner puede crear links de invitación y revocarlos;
// los cashiers ven el equipo y pueden renunciar al acceso.

import { useEffect, useState } from 'react';
import { backendFetch, type BranchInvite, type BranchMember } from '@/lib/backend-api';

interface Props {
  projectId: string;
  /** Rol del user actual — owner ve todo, cashier solo el listado de miembros. */
  viewerRole: 'owner' | 'cashier';
  /** Para mostrar el link absoluto al copiar. */
  acceptBaseUrl: string;
}

export default function MembersSection({ projectId, viewerRole, acceptBaseUrl }: Props) {
  const [members, setMembers] = useState<BranchMember[] | null>(null);
  const [invites, setInvites] = useState<BranchInvite[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [invitedEmail, setInvitedEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const m = await backendFetch<{ members: BranchMember[] }>(
        `/api/projects/${projectId}/members`,
      );
      setMembers(m.members);
    } catch (e: any) {
      setError(e.message);
    }
    if (viewerRole === 'owner') {
      try {
        const i = await backendFetch<{ invites: BranchInvite[] }>(
          `/api/projects/${projectId}/invites`,
        );
        setInvites(i.invites);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, viewerRole]);

  const createInvite = async () => {
    setError(null);
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        role: 'cashier',
        max_uses: maxUses,
        expires_in_days: expiresInDays,
      };
      if (invitedEmail.trim()) body.invited_email = invitedEmail.trim();
      await backendFetch(`/api/projects/${projectId}/invites`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setInvitedEmail('');
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const revokeInvite = async (token: string) => {
    setError(null);
    try {
      await backendFetch(`/api/projects/${projectId}/invites/${token}`, { method: 'DELETE' });
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const removeMember = async (userId: string) => {
    setError(null);
    try {
      await backendFetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      await loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const copyLink = async (token: string) => {
    const link = `${acceptBaseUrl}/invitacion/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      // fallback: prompt
      window.prompt('Copiá este link:', link);
    }
  };

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-semibold">Miembros de la sucursal</h2>
        {viewerRole === 'owner' && (
          <span className="text-xs text-[#9ca3af]">Los miembros pueden cobrar y ver movimientos</span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Lista de miembros */}
      <div className="space-y-2 mb-6">
        {members === null ? (
          <div className="text-xs text-[#9ca3af]">Cargando…</div>
        ) : members.length === 0 ? (
          <div className="text-xs text-[#9ca3af]">Sin miembros todavía.</div>
        ) : (
          members.map(m => (
            <div
              key={m.user_id}
              className="flex items-center justify-between gap-3 p-3 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{m.email || m.user_id.slice(0, 8) + '…'}</div>
                <div className="text-xs text-[#9ca3af]">
                  {m.role === 'owner' ? 'Dueño' : 'Cajero'}
                  {m.created_at && m.role !== 'owner' && (
                    <> · agregado el {new Date(m.created_at).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              {m.role !== 'owner' && (viewerRole === 'owner' || (viewerRole === 'cashier' && /* self */ true)) && (
                <button
                  onClick={() => removeMember(m.user_id)}
                  className="text-xs text-rose-700 hover:text-rose-900"
                >
                  {viewerRole === 'owner' ? 'Remover' : 'Salir'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Owner-only: invitaciones */}
      {viewerRole === 'owner' && (
        <>
          <div className="border-t border-[#e5e7eb] pt-5">
            <h3 className="font-medium text-sm mb-3">Invitar a un cajero</h3>
            <p className="text-xs text-[#6b7280] mb-4">
              Generá un link de invitación y compartilo por WhatsApp o el medio que prefieras.
              Quien lo abra y inicie sesión queda como cajero de esta sucursal.
            </p>

            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-xs text-[#9ca3af] mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={invitedEmail}
                  onChange={e => setInvitedEmail(e.target.value)}
                  placeholder="cajero@correo.com"
                  className="w-full px-3 py-2 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#005DB4]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1">Usos</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxUses}
                    onChange={e => setMaxUses(parseInt(e.target.value || '1', 10))}
                    className="w-full px-3 py-2 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#005DB4]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1">Vence en (días)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={expiresInDays}
                    onChange={e => setExpiresInDays(parseInt(e.target.value || '7', 10))}
                    className="w-full px-3 py-2 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#005DB4]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={createInvite}
              disabled={creating}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Generando…' : 'Generar link de invitación'}
            </button>
          </div>

          {/* Invitaciones activas */}
          {invites && invites.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs uppercase tracking-wider text-[#9ca3af] mb-2">
                Invitaciones activas
              </h4>
              <div className="space-y-2">
                {invites.map(i => {
                  const link = `${acceptBaseUrl}/invitacion/${i.token}`;
                  return (
                    <div
                      key={i.id}
                      className="p-3 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-xs">
                          {i.invited_email ? (
                            <span className="font-medium">{i.invited_email}</span>
                          ) : (
                            <span className="text-[#6b7280]">Cualquier email</span>
                          )}
                          <span className="text-[#9ca3af]">
                            {' · '}{i.use_count}/{i.max_uses} usos · vence {new Date(i.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => revokeInvite(i.token)}
                          className="text-xs text-rose-700 hover:text-rose-900"
                        >
                          Revocar
                        </button>
                      </div>
                      <div className="flex items-stretch gap-2">
                        <code className="flex-1 text-xs bg-white border border-[#e5e7eb] rounded px-2 py-1.5 truncate">
                          {link}
                        </code>
                        <button
                          onClick={() => copyLink(i.token)}
                          className="px-3 py-1.5 text-xs bg-[#005DB4] hover:bg-[#0047a0] text-white rounded"
                        >
                          {copiedToken === i.token ? '✓ Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
