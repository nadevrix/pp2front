'use client';

// Sección Webhooks dentro de /dashboard/avanzado.
//   - Lista endpoints con su URL, sucursal, activo
//   - Crear (tier-gate: solo Growth+, backend devuelve 403 si no)
//   - Eliminar / pausar
//   - Ver últimas entregas y reintentar manual
//   - Botón "Enviar evento de prueba" para validar integración

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { backendFetch, type Project } from '@/lib/backend-api';
import type { TierState } from '@/lib/tiers';

interface Endpoint {
  id: string;
  project_id: string;
  url: string;
  active: boolean;
  events: string[] | null;
  created_at: string;
  branch_name: string;
  secret?: string; // solo presente al crear
}

interface Delivery {
  id: string;
  event_type: string;
  status: 'pending' | 'delivered' | 'failed' | 'abandoned';
  attempts: number;
  next_attempt_at: string;
  last_attempt_at: string | null;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string | null;
  created_at: string;
  transaction_id: string | null;
}

export default function WebhooksSection({ branches }: { branches: Project[] }) {
  const [tier, setTier] = useState<TierState | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createUrl, setCreateUrl] = useState('');
  const [createBranch, setCreateBranch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<{ url: string; secret: string } | null>(null);

  const [openDeliveries, setOpenDeliveries] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const load = async () => {
    try {
      const [t, e] = await Promise.all([
        backendFetch<{ data: TierState }>('/api/merchant/tier').catch(() => null),
        backendFetch<{ endpoints: Endpoint[] }>('/api/merchant/webhooks'),
      ]);
      if (t) setTier(t.data);
      setEndpoints(e.endpoints);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const canCreate = tier ? tier.tier === 'growth' || tier.tier === 'scale' : false;

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUrl || !createBranch) return;
    setCreating(true);
    setError(null);
    try {
      const res = await backendFetch<{ endpoint: Endpoint }>('/api/merchant/webhooks', {
        method: 'POST',
        body: JSON.stringify({ project_id: createBranch, url: createUrl }),
      });
      setCreatedSecret({ url: res.endpoint.url, secret: res.endpoint.secret! });
      setShowCreate(false);
      setCreateUrl('');
      setCreateBranch('');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar este webhook? Las entregas pendientes se cancelan.')) return;
    try {
      await backendFetch(`/api/merchant/webhooks/${id}`, { method: 'DELETE' });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const onTogglePause = async (ep: Endpoint) => {
    try {
      await backendFetch(`/api/merchant/webhooks/${ep.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !ep.active }),
      });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const onTest = async (id: string) => {
    setError(null);
    try {
      const res = await backendFetch<{ outcome: { status: string; responseStatus: number | null; error?: string } }>(
        `/api/merchant/webhooks/${id}/test`,
        { method: 'POST' },
      );
      const o = res.outcome;
      if (o.status === 'delivered') {
        alert(`Test OK — tu endpoint respondió ${o.responseStatus}`);
      } else {
        alert(`Test falló (${o.status}) — status ${o.responseStatus ?? 's/d'}\n${o.error ?? ''}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openDeliveriesFor = async (id: string) => {
    if (openDeliveries === id) {
      setOpenDeliveries(null);
      return;
    }
    setOpenDeliveries(id);
    setLoadingDeliveries(true);
    try {
      const res = await backendFetch<{ deliveries: Delivery[] }>(
        `/api/merchant/webhooks/${id}/deliveries?limit=30`,
      );
      setDeliveries(res.deliveries);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const retryDelivery = async (deliveryId: string) => {
    try {
      await backendFetch(`/api/merchant/webhooks/deliveries/${deliveryId}/retry`, { method: 'POST' });
      if (openDeliveries) {
        const res = await backendFetch<{ deliveries: Delivery[] }>(
          `/api/merchant/webhooks/${openDeliveries}/deliveries?limit=30`,
        );
        setDeliveries(res.deliveries);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h2 className="font-semibold text-lg">Webhooks</h2>
          <p className="text-sm text-slate-400 mt-1">
            Recibí notificaciones HTTP en tu servidor cada vez que cambia el estado de un cobro. Firmamos cada payload con HMAC-SHA256 en el header <code className="text-xs bg-black/40 px-1.5 py-0.5 rounded">x-pollar-signature</code>.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(s => !s)}
          disabled={!canCreate}
          className="shrink-0 px-3.5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          title={canCreate ? '' : 'Disponible a partir del tier Growth'}
        >
          + Nuevo webhook
        </button>
      </div>

      {!canCreate && tier && (
        <div className="mt-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-4 py-3 text-sm">
          Los webhooks son una feature del tier <strong>Growth</strong>.{' '}
          <Link href="/dashboard/plan" className="text-indigo-300 hover:text-indigo-200 underline">
            Cambiar de plan →
          </Link>
        </div>
      )}

      {showCreate && canCreate && (
        <form onSubmit={onCreate} className="mt-5 p-5 bg-black/30 border border-slate-800 rounded-xl space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sucursal</label>
            <select
              value={createBranch}
              onChange={e => setCreateBranch(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Elegir sucursal —</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">URL del endpoint</label>
            <input
              type="url"
              value={createUrl}
              onChange={e => setCreateUrl(e.target.value)}
              required
              placeholder="https://tu-servidor.com/webhooks/pollar"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Tu servidor debe responder 2xx en menos de 3 s. Si falla, reintentamos con backoff (1m → 5m → 15m → 1h → 6h → 1d → 2d → 4d).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Creando…' : 'Crear webhook'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {createdSecret && (
        <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-5">
          <div className="font-medium text-emerald-300 mb-2">Webhook creado — guardá el secret ahora</div>
          <p className="text-sm text-slate-300 mb-3">
            Este es tu <strong>secret de firma</strong>. <strong>Solo se muestra una vez.</strong> Guardalo en tu servidor para verificar el HMAC de cada payload.
          </p>
          <div className="flex items-center gap-2 mb-2">
            <code className="flex-1 font-mono text-xs bg-black/50 px-3 py-2 rounded-lg text-emerald-400 border border-emerald-500/30 break-all">
              {createdSecret.secret}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(createdSecret.secret)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
            >
              Copiar
            </button>
          </div>
          <button
            onClick={() => setCreatedSecret(null)}
            className="text-xs text-slate-400 hover:text-white mt-2"
          >
            Ya lo guardé, ocultar
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6">
        {endpoints === null ? (
          <div className="text-slate-500 text-sm">Cargando…</div>
        ) : endpoints.length === 0 ? (
          <div className="text-slate-500 text-sm">No tenés webhooks configurados.</div>
        ) : (
          <div className="space-y-3">
            {endpoints.map(ep => (
              <div key={ep.id} className="border border-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                        ep.active
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {ep.active ? 'Activo' : 'Pausado'}
                      </span>
                      <span className="text-xs text-slate-500">{ep.branch_name}</span>
                    </div>
                    <code className="block font-mono text-sm text-slate-200 break-all">{ep.url}</code>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => onTest(ep.id)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                      title="Enviar evento de prueba"
                    >
                      Probar
                    </button>
                    <button
                      onClick={() => onTogglePause(ep)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                    >
                      {ep.active ? 'Pausar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => onDelete(ep.id)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-500/30 rounded-lg text-xs text-rose-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => openDeliveriesFor(ep.id)}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {openDeliveries === ep.id ? 'Ocultar entregas' : 'Ver entregas recientes'}
                </button>

                {openDeliveries === ep.id && (
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    {loadingDeliveries ? (
                      <div className="text-xs text-slate-500">Cargando…</div>
                    ) : deliveries.length === 0 ? (
                      <div className="text-xs text-slate-500">Sin entregas todavía.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                              <th className="px-2 py-2">Evento</th>
                              <th className="px-2 py-2">Estado</th>
                              <th className="px-2 py-2">Intentos</th>
                              <th className="px-2 py-2">HTTP</th>
                              <th className="px-2 py-2">Fecha</th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {deliveries.map(d => (
                              <tr key={d.id} className="border-b border-slate-800 last:border-0">
                                <td className="px-2 py-2 font-mono">{d.event_type}</td>
                                <td className="px-2 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                    d.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                                    d.status === 'pending'   ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                                    d.status === 'failed'    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                                                               'bg-slate-700/40 text-slate-300 border-slate-700'
                                  }`}>
                                    {d.status}
                                  </span>
                                </td>
                                <td className="px-2 py-2 tabular-nums">{d.attempts}</td>
                                <td className="px-2 py-2 tabular-nums">{d.response_status ?? '—'}</td>
                                <td className="px-2 py-2 text-slate-500 whitespace-nowrap">
                                  {new Date(d.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-2 py-2 text-right">
                                  {d.status !== 'delivered' && (
                                    <button
                                      onClick={() => retryDelivery(d.id)}
                                      className="text-indigo-400 hover:text-indigo-300"
                                    >
                                      Reintentar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
