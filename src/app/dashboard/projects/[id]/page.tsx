'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { backendFetch, type Project, type Transaction } from '@/lib/backend-api';

function statusColor(status: string): string {
  if (status === 'completed') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (status === 'pending') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (status === 'overpaid' || status === 'underpaid' || status === 'anomaly' || status === 'late_anomaly') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  if (status === 'expired') return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  if (status === 'refunded') return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
  return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
}

function trunc(s: string | null | undefined, head = 8, tail = 6): string {
  if (!s) return '—';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const loadAll = async () => {
    try {
      const [pRes, txRes] = await Promise.all([
        backendFetch<{ project: Project }>(`/api/projects/${id}`),
        backendFetch<{ transactions: Transaction[] }>(`/api/projects/${id}/transactions?limit=50`),
      ]);
      setProject(pRes.project);
      setTxs(txRes.transactions);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(() => {
      backendFetch<{ transactions: Transaction[] }>(`/api/projects/${id}/transactions?limit=50`)
        .then(r => setTxs(r.transactions))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copy = (text: string) => navigator.clipboard.writeText(text);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          {error}
        </div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white mt-4 inline-block">
          ← Volver
        </Link>
      </div>
    );
  }

  if (!project) {
    return <div className="max-w-4xl mx-auto px-6 py-10 text-slate-500">Cargando…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Volver al dashboard
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">{project.name}</h1>
        <p className="text-slate-400">{project.reason}</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold mb-4">Credenciales y configuración</h2>
        <p className="text-sm text-slate-400 mb-6">
          Usá la <span className="text-slate-200">API key</span> en tu aplicación (con <code className="text-slate-200 text-xs bg-black/40 px-1.5 py-0.5 rounded">PollarPayClient</code> del SDK).
          Los pagos cobrados se reenvían automáticamente a tu <span className="text-slate-200">payout wallet</span>.
        </p>

        <dl className="space-y-5 text-sm">
          <div>
            <dt className="text-slate-500 mb-1.5">API key</dt>
            <dd className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-black/50 px-3 py-2 rounded-lg text-emerald-400 border border-slate-800 break-all">
                {showSecret ? project.api_key : project.api_key.replace(/^(pub_\w+_).{8}.+(.{4})$/, '$1••••••••$2')}
              </code>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
              >
                {showSecret ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                onClick={() => copy(project.api_key)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
              >
                Copiar
              </button>
            </dd>
          </div>

          <div>
            <dt className="text-slate-500 mb-1.5">Project ID</dt>
            <dd className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-black/50 px-3 py-2 rounded-lg text-slate-300 border border-slate-800 break-all">
                {project.id}
              </code>
              <button
                onClick={() => copy(project.id)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
              >
                Copiar
              </button>
            </dd>
          </div>

          <div>
            <dt className="text-slate-500 mb-1.5">Payout wallet</dt>
            <dd className="font-mono text-xs text-slate-300 break-all bg-black/50 px-3 py-2 rounded-lg border border-slate-800">
              {project.payout_wallet}
            </dd>
          </div>

          <div>
            <dt className="text-slate-500 mb-1">Creado</dt>
            <dd className="text-slate-300">{new Date(project.created_at).toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Transacciones</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pagos que tu aplicación generó usando el SDK con esta API key.
            </p>
          </div>
          <span className="text-xs text-slate-500">Auto-refresh cada 5s</span>
        </div>

        {txs.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            Todavía no hay transacciones. Generá pagos desde tu app con el SDK usando la API key de arriba.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Razón</th>
                  <th className="px-6 py-3 font-medium text-right">Esperado</th>
                  <th className="px-6 py-3 font-medium text-right">Pagado</th>
                  <th className="px-6 py-3 font-medium">Wallet</th>
                  <th className="px-6 py-3 font-medium">Forward</th>
                  <th className="px-6 py-3 font-medium">Creado</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-6 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-md border ${statusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-300 max-w-[200px] truncate">{tx.reason}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-300">{tx.amount_expected}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-300">{tx.amount_paid}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">{trunc(tx.wallet_pubkey, 6, 4)}</td>
                    <td className="px-6 py-3 text-xs text-slate-400">{tx.forward_status}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
