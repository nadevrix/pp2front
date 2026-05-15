'use client';

// Detalle de sucursal — vista merchant-first: foco en wallet de destino,
// últimos movimientos y acción "cobrar en esta sucursal". La API key vive
// en /dashboard/avanzado (es un detalle técnico, no operativo).

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { backendFetch, type Project, type Transaction } from '@/lib/backend-api';
import { stellarExpertAccountUrl, stellarExpertTxUrl, networkFromApiKey } from '@/lib/stellar';

function isValidStellarKey(key: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(key.trim());
}

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

export default function SucursalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [branch, setBranch] = useState<Project | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editingWallet, setEditingWallet] = useState(false);
  const [walletDraft, setWalletDraft] = useState('');
  const [walletSaving, setWalletSaving] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [pRes, txRes] = await Promise.all([
        backendFetch<{ project: Project }>(`/api/projects/${id}`),
        backendFetch<{ transactions: Transaction[] }>(`/api/projects/${id}/transactions?limit=30`),
      ]);
      setBranch(pRes.project);
      setTxs(txRes.transactions);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(() => {
      backendFetch<{ transactions: Transaction[] }>(`/api/projects/${id}/transactions?limit=30`)
        .then(r => setTxs(r.transactions))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEditWallet = () => {
    if (!branch) return;
    setWalletDraft(branch.payout_wallet);
    setWalletError(null);
    setEditingWallet(true);
  };

  const saveWallet = async () => {
    if (!branch) return;
    const w = walletDraft.trim();
    if (!isValidStellarKey(w)) {
      setWalletError('Stellar public key inválida (debe empezar con G y tener 56 caracteres)');
      return;
    }
    if (w === branch.payout_wallet) {
      setEditingWallet(false);
      return;
    }
    setWalletSaving(true);
    setWalletError(null);
    try {
      const res = await backendFetch<{ project: Project }>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ payout_wallet: w }),
      });
      setBranch(res.project);
      setEditingWallet(false);
    } catch (e: any) {
      setWalletError(e.message || 'Error guardando');
    }
    setWalletSaving(false);
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">{error}</div>
        <Link href="/dashboard/sucursales" className="text-sm text-slate-400 hover:text-white mt-4 inline-block">
          ← Volver
        </Link>
      </div>
    );
  }

  if (!branch) {
    return <div className="max-w-4xl mx-auto px-6 py-10 text-slate-500">Cargando…</div>;
  }

  const network = networkFromApiKey(branch.api_key);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/dashboard/sucursales" className="text-sm text-slate-400 hover:text-white">
          ← Volver a sucursales
        </Link>
      </div>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{branch.name}</h1>
          <p className="text-slate-400">{branch.reason}</p>
        </div>
        <Link
          href="/dashboard/cobrar"
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm"
        >
          Cobrar en esta sucursal
        </Link>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold mb-4">Wallet de destino</h2>
        <p className="text-sm text-slate-400 mb-5">
          Los pagos cobrados en esta sucursal se reenvían automáticamente a esta wallet en segundos. Pollar no custodia los fondos.
        </p>

        {!editingWallet ? (
          <div className="space-y-3">
            <div className="font-mono text-xs text-slate-200 break-all bg-black/40 px-3 py-2.5 rounded-lg border border-slate-800">
              {branch.payout_wallet}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <a
                href={stellarExpertAccountUrl(branch.payout_wallet, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Ver en Stellar Expert ↗
              </a>
              <button
                onClick={startEditWallet}
                className="text-slate-400 hover:text-white"
              >
                Editar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={walletDraft}
              onChange={e => setWalletDraft(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            />
            {walletError && <p className="text-xs text-rose-400">{walletError}</p>}
            <div className="flex gap-2">
              <button
                onClick={saveWallet}
                disabled={walletSaving}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {walletSaving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingWallet(false)}
                disabled={walletSaving}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Cambiar esta wallet afecta solo los pagos futuros. Las transacciones ya completadas no se modifican.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold">Movimientos de la sucursal</h2>
          <span className="text-xs text-slate-500">Auto-refresh 10 s</span>
        </div>

        {txs.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">
            Sin movimientos todavía. Generá tu primer cobro desde el botón &laquo;Cobrar en esta sucursal&raquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Motivo</th>
                  <th className="px-6 py-3 font-medium text-right">Esperado</th>
                  <th className="px-6 py-3 font-medium text-right">Recibido</th>
                  <th className="px-6 py-3 font-medium">Comprobante</th>
                  <th className="px-6 py-3 font-medium">Hora</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => {
                  const hash = tx.forward_tx_hash || tx.crypto_tx_hash || null;
                  return (
                    <tr key={tx.id} className="border-b border-slate-800 last:border-0">
                      <td className="px-6 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[tx.status] || STATUS_COLOR.pending}`}>
                          {STATUS_LABEL[tx.status] ?? tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-300 max-w-[260px] truncate">{tx.reason}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-300">{parseFloat(tx.amount_expected).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono text-slate-200">{parseFloat(tx.amount_paid || '0').toFixed(2)}</td>
                      <td className="px-6 py-3 text-xs">
                        {hash ? (
                          <a
                            href={stellarExpertTxUrl(hash, network)}
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
