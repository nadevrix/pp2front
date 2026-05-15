'use client';

// Dashboard home merchant-first — alineado con la página 5 del PDF
//   ("el dashboard muestra confirmación en tiempo real, sin necesidad de refrescar")
// y la propuesta de valor: cobrar es la acción principal, no crear proyectos.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { backendFetch } from '@/lib/backend-api';
import { stellarExpertTxUrl, normalizeNetwork } from '@/lib/stellar';

interface Overview {
  branches: number;
  totals: {
    received_usdc: string;
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
    asset_code: string;
    created_at: string;
    project_id: string;
    branch_name: string;
    forward_tx_hash?: string | null;
    crypto_tx_hash?: string | null;
  }>;
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  overpaid: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  underpaid: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  expired: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  anomaly: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  late_anomaly: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  refunded: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      backendFetch<{ data: Overview }>('/api/merchant/overview?recent=8')
        .then(d => setData(d.data))
        .catch(e => setError(e.message));

    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-6xl mx-auto px-6 py-10 text-slate-500">Cargando…</div>;
  }

  // Estado inicial: el comercio aún no creó sucursal
  if (data.branches === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Bienvenido a Pollar Pay</h1>
        <p className="text-slate-400 mb-8">
          Para empezar a cobrar en USDC necesitás registrar una sucursal con la wallet Stellar donde querés recibir los fondos. El proceso toma menos de 3 minutos.
        </p>
        <Link
          href="/dashboard/sucursales/nueva"
          className="inline-block px-5 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
        >
          Registrar sucursal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumen</h1>
          <p className="text-slate-400 mt-1">Tus cobros en USDC, en tiempo real.</p>
        </div>
        <Link
          href="/dashboard/cobrar"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Cobrar
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Total cobrado" value={`$${data.totals.received_usdc}`} sub="USDC liquidados" />
        <Kpi label="Cobros completados" value={data.totals.transactions.toLocaleString()} />
        <Kpi label="Últimas 24 h" value={data.totals.last_24h.toLocaleString()} sub="transacciones" />
        <Kpi label="En curso" value={data.totals.pending.toLocaleString()} sub="esperando pago" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Movimientos recientes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Actualizado cada 10 s · {data.branches} {data.branches === 1 ? 'sucursal' : 'sucursales'}
            </p>
          </div>
          <Link href="/dashboard/movimientos" className="text-sm text-indigo-400 hover:text-indigo-300">
            Ver todos →
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">
            Todavía no hay movimientos. Generá tu primer cobro desde el botón &laquo;Cobrar&raquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
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
                    <tr key={tx.id} className="border-b border-slate-800 last:border-0">
                      <td className="px-6 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[tx.status] || STATUS_COLOR.pending}`}>
                          {STATUS_LABEL[tx.status] ?? tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-300 max-w-[240px] truncate">{tx.reason}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs">{tx.branch_name}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-200">
                        {parseFloat(tx.amount_paid || tx.amount_expected).toFixed(2)} <span className="text-slate-500">{tx.asset_code}</span>
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {hash ? (
                          <a
                            href={stellarExpertTxUrl(hash, BACKEND_NETWORK)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-mono"
                          >
                            {hash.slice(0, 6)}…↗
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
