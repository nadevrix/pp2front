'use client';

// Dashboard home merchant-first — alineado con la página 5 del PDF
//   ("el dashboard muestra confirmación en tiempo real, sin necesidad de refrescar")
// y la propuesta de valor: cobrar es la acción principal, no crear proyectos.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { backendFetch } from '@/lib/backend-api';
import { stellarExpertTxUrl, normalizeNetwork } from '@/lib/stellar';
import type { TierState } from '@/lib/tiers';

interface Overview {
  branches: number;
  totals: {
    received_usdc: string;
    payout_usdc: string;
    fees_usdc: string;
    transactions: number;
    pending: number;
    last_24h: number;
  };
  recent: Array<{
    id: string;
    status: string;
    reason: string;
    amount_expected: string;
    amount_paid: string;
    payout_amount?: string;
    fee_amount?: string;
    asset_code: string;
    created_at: string;
    project_id: string;
    branch_name: string;
    forward_tx_hash?: string | null;
    crypto_tx_hash?: string | null;
  }>;
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
  overpaid: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  pending: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  underpaid: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  expired: 'text-[#6b7280] bg-[#f0f7ff] border-[#e5e7eb]',
  anomaly: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  late_anomaly: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  refunded: 'text-violet-700 bg-violet-500/10 border-violet-500/20',
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Cobrado',
  overpaid: 'Cobrado +',
  pending: 'Esperando',
  underpaid: 'Parcial',
  expired: 'Vencido',
  anomaly: 'Revisión',
  late_anomaly: 'Revisión',
  refunded: 'Reembolso',
};

const BACKEND_NETWORK = normalizeNetwork(process.env.NEXT_PUBLIC_STELLAR_NETWORK);

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [tier, setTier] = useState<TierState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, tr] = await Promise.all([
          backendFetch<{ data: Overview }>('/api/merchant/overview?recent=8'),
          backendFetch<{ data: TierState }>('/api/merchant/tier').catch(() => null),
        ]);
        setData(ov.data);
        if (tr) setTier(tr.data);
      } catch (e: any) {
        setError(e.message);
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700">{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-[#9ca3af]">Cargando…</div>;
  }

  // Estado inicial: el comercio aún no creó sucursal
  if (data.branches === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Bienvenido a Pollar Pay</h1>
        <p className="text-[#6b7280] mb-8">
          Para empezar a cobrar en USDC necesitás registrar una sucursal con la wallet Stellar donde querés recibir los fondos. El proceso toma menos de 3 minutos.
        </p>
        <Link
          href="/dashboard/sucursales/nueva"
          className="inline-block px-5 py-3 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-semibold"
        >
          Registrar sucursal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Resumen</h1>
          <p className="text-[#6b7280] mt-1 text-sm sm:text-base">Tus cobros en USDC, en tiempo real.</p>
        </div>
        <Link
          href="/dashboard/cobrar"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-semibold"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Cobrar
        </Link>
      </header>

      {tier && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-[#e5e7eb] rounded-2xl px-4 sm:px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 w-full sm:w-auto">
            <div>
              <div className="text-xs text-[#9ca3af]">Plan</div>
              <div className="font-semibold text-sm sm:text-base">{tier.tier_label}</div>
            </div>
            <div>
              <div className="text-xs text-[#9ca3af]">Fee por cobro</div>
              <div className="font-semibold tabular-nums text-sm sm:text-base">
                {(tier.percent * 100).toFixed(1).replace(/\.0$/, '')} %
                {tier.minimum > 0 && <span className="text-xs text-[#9ca3af]"> · mín ${tier.minimum.toFixed(2)}</span>}
              </div>
            </div>
            {tier.tier === 'free' && (
              <div>
                <div className="text-xs text-[#9ca3af]">Free restantes</div>
                <div className="font-semibold tabular-nums text-sm sm:text-base">
                  {tier.usage.free_tx_remaining} <span className="text-xs text-[#9ca3af]">de 50</span>
                </div>
              </div>
            )}
          </div>
          {tier.suggested_tier ? (
            <Link
              href="/dashboard/plan"
              className="block sm:inline-block text-center text-xs px-3 py-1.5 rounded-lg bg-[#f0f7ff] border border-[#005DB4] text-[#005DB4] hover:bg-[#e0f0ff] shrink-0"
            >
              Cambiar a {tier.suggested_label} →
            </Link>
          ) : (
            <Link href="/dashboard/plan" className="text-xs text-[#6b7280] hover:text-[#005DB4] shrink-0">
              Ver plan →
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi label="Total cobrado" value={`$${data.totals.received_usdc}`} sub="USDC bruto recibido" />
        <Kpi label="Recibido neto" value={`$${data.totals.payout_usdc}`} sub={`fees pagados $${data.totals.fees_usdc}`} />
        <Kpi label="Últimas 24 h" value={data.totals.last_24h.toLocaleString()} sub="transacciones" />
        <Kpi label="En curso" value={data.totals.pending.toLocaleString()} sub="esperando pago" />
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Movimientos recientes</h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              Actualizado cada 10 s · {data.branches} {data.branches === 1 ? 'sucursal' : 'sucursales'}
            </p>
          </div>
          <Link href="/dashboard/movimientos" className="text-sm text-[#005DB4] hover:text-[#0047a0]">
            Ver todos →
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#9ca3af] text-sm">
            Todavía no hay movimientos. Generá tu primer cobro desde el botón &laquo;Cobrar&raquo;.
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-[#e5e7eb]">
              {data.recent.map(tx => {
                const hash = tx.forward_tx_hash || tx.crypto_tx_hash || null;
                return (
                  <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLOR[tx.status] || STATUS_COLOR.pending}`}>
                          {STATUS_LABEL[tx.status] ?? tx.status}
                        </span>
                        <span className="text-xs text-[#9ca3af]">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm text-[#1a1a1a] truncate">{tx.reason || '—'}</div>
                      <div className="text-xs text-[#9ca3af] truncate">
                        {tx.branch_name}
                        {hash && (
                          <>
                            {' · '}
                            <a
                              href={stellarExpertTxUrl(hash, BACKEND_NETWORK)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#005DB4] font-mono"
                            >
                              {hash.slice(0, 6)}…↗
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-semibold text-[#1a1a1a]">
                        {parseFloat(tx.amount_paid || tx.amount_expected).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider">{tx.asset_code}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#9ca3af] border-b border-[#e5e7eb]">
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 font-medium">Motivo</th>
                    <th className="px-6 py-3 font-medium">Sucursal</th>
                    <th className="px-6 py-3 font-medium text-right">Monto</th>
                    <th className="px-6 py-3 font-medium">Comprobante</th>
                    <th className="px-6 py-3 font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map(tx => {
                    const hash = tx.forward_tx_hash || tx.crypto_tx_hash || null;
                    return (
                      <tr key={tx.id} className="border-b border-[#e5e7eb] last:border-0">
                        <td className="px-6 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[tx.status] || STATUS_COLOR.pending}`}>
                            {STATUS_LABEL[tx.status] ?? tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[#6b7280] max-w-[240px] truncate">{tx.reason}</td>
                        <td className="px-6 py-3 text-[#6b7280] text-xs">{tx.branch_name}</td>
                        <td className="px-6 py-3 text-right font-mono text-[#1a1a1a]">
                          {parseFloat(tx.amount_paid || tx.amount_expected).toFixed(2)} <span className="text-[#9ca3af]">{tx.asset_code}</span>
                        </td>
                        <td className="px-6 py-3 text-xs">
                          {hash ? (
                            <a
                              href={stellarExpertTxUrl(hash, BACKEND_NETWORK)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#005DB4] hover:text-[#0047a0] font-mono"
                            >
                              {hash.slice(0, 6)}…↗
                            </a>
                          ) : (
                            <span className="text-[#9ca3af]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-xs text-[#9ca3af]">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
      <div className="text-xs text-[#9ca3af] mb-1.5">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-[#9ca3af] mt-1">{sub}</div>}
    </div>
  );
}
