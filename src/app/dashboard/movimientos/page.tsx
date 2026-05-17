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

const NETWORK = normalizeNetwork(process.env.NEXT_PUBLIC_STELLAR_NETWORK);
const PAGE_SIZE = 50;

export default function MovimientosPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (status) params.set('status', status);
    if (branchId) params.set('branch_id', branchId);
    // El backend espera ISO 8601. Los inputs date dan YYYY-MM-DD — los
    // expandimos a 00:00:00 / 23:59:59 locales para cubrir el día completo.
    if (from) params.set('from', new Date(from + 'T00:00:00').toISOString());
    if (to)   params.set('to',   new Date(to   + 'T23:59:59').toISOString());

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
  }, [status, branchId, from, to, page]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Si cambian filtros, volver a página 0
  useEffect(() => { setPage(0); }, [status, branchId, from, to]);

  const clearFilters = () => {
    setStatus('');
    setBranchId('');
    setFrom('');
    setTo('');
  };
  const hasFilters = Boolean(status || branchId || from || to);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-[#6b7280] mt-1 text-sm sm:text-base">Todos los cobros de tu comercio.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] text-sm font-medium"
          >
            Exportar
          </button>
          <Link
            href="/dashboard/cobrar"
            className="flex-1 sm:flex-none text-center px-4 py-2 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium text-sm"
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
        <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 items-center">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="flex-1 sm:flex-none min-w-[140px] px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:border-[#005DB4]"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {branches.length > 1 && (
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className="flex-1 sm:flex-none min-w-[140px] px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:border-[#005DB4]"
          >
            <option value="">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}

        {/* Filtro por rango de fechas — el endpoint /merchant/transactions
            ya acepta from/to ISO, solo le damos UI. */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            max={to || undefined}
            aria-label="Desde"
            className="flex-1 sm:flex-none px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:border-[#005DB4]"
          />
          <span className="text-xs text-[#9ca3af]">→</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            min={from || undefined}
            aria-label="Hasta"
            className="flex-1 sm:flex-none px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:border-[#005DB4]"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-xs text-[#005DB4] hover:bg-[#f0f7ff]"
          >
            Limpiar filtros
          </button>
        )}

        <span className="hidden sm:inline text-xs text-[#9ca3af] self-center ml-auto">Auto-refresh cada 15 s</span>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
        {rows === null ? (
          <div className="px-6 py-12 text-center text-[#9ca3af] text-sm">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#9ca3af] text-sm">
            Sin movimientos para los filtros seleccionados.
          </div>
        ) : (
          <>
            {/* Mobile: card view */}
            <div className="md:hidden divide-y divide-[#e5e7eb]">
              {rows.map(t => {
                const hash = t.forward_tx_hash || t.crypto_tx_hash || null;
                const fee = parseFloat(t.fee_amount || '0');
                const paid = parseFloat(t.amount_paid || '0');
                const net = parseFloat(t.payout_amount || (paid - fee).toString());
                const settled = t.status === 'completed' || t.status === 'overpaid';
                return (
                  <div key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#1a1a1a] truncate">{t.reason || '—'}</div>
                        <div className="text-xs text-[#9ca3af] mt-0.5">
                          {t.branch_name} · {new Date(t.created_at).toLocaleString([], {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[t.status] || STATUS_COLOR.pending}`}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div className="text-xs text-[#6b7280]">
                        Recibido <span className="font-mono text-[#1a1a1a]">{paid.toFixed(2)}</span> ·{' '}
                        Fee {!settled ? '—' : t.is_free_tx ? <span className="text-emerald-700">GRATIS</span> : <span className="font-mono">{fee.toFixed(2)}</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-base font-mono font-semibold text-[#1a1a1a]">
                          {settled ? net.toFixed(2) : paid.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider">{settled ? 'Neto' : t.asset_code}</div>
                      </div>
                    </div>
                    {hash && (
                      <a
                        href={stellarExpertTxUrl(hash, NETWORK)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-[#005DB4] font-mono"
                      >
                        {hash.slice(0, 12)}… ↗
                      </a>
                    )}
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
                      <tr key={t.id} className="border-b border-[#e5e7eb] last:border-0">
                        <td className="px-6 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[t.status] || STATUS_COLOR.pending}`}>
                            {STATUS_LABEL[t.status] ?? t.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[#6b7280] max-w-[200px] truncate">{t.reason}</td>
                        <td className="px-6 py-3 text-[#6b7280] text-xs">{t.branch_name}</td>
                        <td className="px-6 py-3 text-right font-mono text-[#1a1a1a]">{paid.toFixed(2)}</td>
                        <td className="px-6 py-3 text-right font-mono text-[#6b7280]">
                          {!settled ? (
                            <span className="text-[#9ca3af]">—</span>
                          ) : t.is_free_tx ? (
                            <span className="text-emerald-700 text-xs">GRATIS</span>
                          ) : (
                            <>{fee.toFixed(2)}</>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-[#1a1a1a]">
                          {settled ? net.toFixed(2) : <span className="text-[#9ca3af]">—</span>}
                        </td>
                        <td className="px-6 py-3 text-xs">
                          {hash ? (
                            <a
                              href={stellarExpertTxUrl(hash, NETWORK)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#005DB4] hover:text-[#0047a0] font-mono"
                            >
                              {hash.slice(0, 8)}…↗
                            </a>
                          ) : (
                            <span className="text-[#9ca3af]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-xs text-[#9ca3af] whitespace-nowrap">
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
          </>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#6b7280]">
          <div>
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
