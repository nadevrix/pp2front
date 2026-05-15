'use client';

// Listado global de movimientos del comercio con filtros básicos.
// Auto-refresh moderado (15 s) para que el merchant vea pagos llegar sin recargar
// — alineado con el PDF: "el dashboard muestra confirmación en tiempo real".

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { backendFetch } from '@/lib/backend-api';
import { stellarExpertTxUrl, normalizeNetwork } from '@/lib/stellar';
import ExportMovementsDialog from '@/components/ExportMovementsDialog';

interface Row {
  id: string;
  status: string;
  reason: string;
  amount_expected: string;
  amount_paid: string;
  fee_amount?: string;
  payout_amount?: string;
  tier_at_time?: string | null;
  is_free_tx?: boolean;
  asset_code: string;
  wallet_pubkey: string | null;
  expires_at: string;
  created_at: string;
  forward_status: string;
  forward_tx_hash?: string | null;
  crypto_tx_hash?: string | null;
  project_id: string;
  branch_name: string;
}

interface Branch {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'completed', label: 'Cobrados' },
  { value: 'pending', label: 'Esperando' },
  { value: 'overpaid', label: 'Con excedente' },
  { value: 'underpaid', label: 'Parciales' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'anomaly', label: 'En revisión' },
];

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

const NETWORK = normalizeNetwork(process.env.NEXT_PUBLIC_STELLAR_NETWORK);
const PAGE_SIZE = 50;

export default function MovimientosPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (status) params.set('status', status);
    if (branchId) params.set('branch_id', branchId);

    try {
      const r = await backendFetch<{
        transactions: Row[];
        total: number;
        branches: Branch[];
      }>(`/api/merchant/transactions?${params.toString()}`);
      setRows(r.transactions);
      setTotal(r.total);
      setBranches(r.branches);
    } catch (e: any) {
      setError(e.message);
    }
  }, [status, branchId, page]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Si cambian filtros, volver a página 0
  useEffect(() => { setPage(0); }, [status, branchId]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-slate-400 mt-1">Todos los cobros de tu comercio.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
          >
            Exportar
          </button>
          <Link
            href="/dashboard/cobrar"
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm"
          >
            + Nuevo cobro
          </Link>
        </div>
      </header>

      <ExportMovementsDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        branches={branches}
        initialBranchId={branchId || undefined}
      />

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {branches.length > 1 && (
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        <span className="text-xs text-slate-500 self-center ml-auto">Auto-refresh cada 15 s</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {rows === null ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">
            Sin movimientos para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Motivo</th>
                  <th className="px-6 py-3 font-medium">Sucursal</th>
                  <th className="px-6 py-3 font-medium text-right">Recibido</th>
                  <th className="px-6 py-3 font-medium text-right">Fee</th>
                  <th className="px-6 py-3 font-medium text-right">Neto</th>
                  <th className="px-6 py-3 font-medium">Comprobante</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => {
                  const hash = t.forward_tx_hash || t.crypto_tx_hash || null;
                  const fee = parseFloat(t.fee_amount || '0');
                  const paid = parseFloat(t.amount_paid || '0');
                  const net = parseFloat(t.payout_amount || (paid - fee).toString());
                  const settled = t.status === 'completed' || t.status === 'overpaid';
                  return (
                    <tr key={t.id} className="border-b border-slate-800 last:border-0">
                      <td className="px-6 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[t.status] || STATUS_COLOR.pending}`}>
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-300 max-w-[200px] truncate">{t.reason}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs">{t.branch_name}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-200">{paid.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-400">
                        {!settled ? (
                          <span className="text-slate-600">—</span>
                        ) : t.is_free_tx ? (
                          <span className="text-emerald-400 text-xs">GRATIS</span>
                        ) : (
                          <>{fee.toFixed(2)}</>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-200">
                        {settled ? net.toFixed(2) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {hash ? (
                          <a
                            href={stellarExpertTxUrl(hash, NETWORK)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-mono"
                          >
                            {hash.slice(0, 8)}…↗
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString([], {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <div>
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
