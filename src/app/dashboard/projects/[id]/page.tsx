'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { backendFetch, type Project, type Transaction, type PayIntent } from '@/lib/backend-api';

const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC_ISSUER_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

function buildStellarPayUri(opts: {
  destination: string;
  amount: string;
  network: string;
  memo?: string;
}): string {
  const issuer = opts.network.toUpperCase() === 'MAINNET' ? USDC_ISSUER_MAINNET : USDC_ISSUER_TESTNET;
  const params = new URLSearchParams({
    destination: opts.destination,
    amount: opts.amount,
    asset_code: 'USDC',
    asset_issuer: issuer,
  });
  if (opts.memo) params.set('memo', opts.memo);
  return `web+stellar:pay?${params.toString()}`;
}

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

  // Estado del generador de QR
  const [qrAmount, setQrAmount] = useState('25');
  const [qrReason, setQrReason] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [intent, setIntent] = useState<PayIntent | null>(null);

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
    // Refresh transacciones cada 5s para ver pagos en tiempo real
    const t = setInterval(() => {
      backendFetch<{ transactions: Transaction[] }>(`/api/projects/${id}/transactions?limit=50`)
        .then(r => setTxs(r.transactions))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const generateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setQrLoading(true);
    setQrError(null);
    setIntent(null);

    try {
      const data = await backendFetch<{ data: PayIntent }>('/api/sdk/pay', {
        method: 'POST',
        headers: { 'x-pollar-api-key': project.api_key },
        body: JSON.stringify({
          amount_expected: qrAmount,
          reason: qrReason || project.reason,
        }),
      });
      setIntent(data.data);
      // Refresca tx list para que aparezca la nueva
      backendFetch<{ transactions: Transaction[] }>(`/api/projects/${id}/transactions?limit=50`)
        .then(r => setTxs(r.transactions))
        .catch(() => {});
    } catch (e: any) {
      setQrError(e.message);
    }
    setQrLoading(false);
  };

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

  const stellarUri = intent
    ? buildStellarPayUri({
        destination: intent.wallet_address,
        amount: intent.amount,
        network: intent.network,
      })
    : null;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Información del proyecto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Información</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-slate-500 mb-1">API key</dt>
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
              <p className="text-xs text-slate-500 mt-1.5">
                Usá esta key en <code className="text-slate-400">PollarPayClient</code> de tu app.
              </p>
            </div>

            <div>
              <dt className="text-slate-500 mb-1">Project ID</dt>
              <dd className="font-mono text-xs text-slate-300">{project.id}</dd>
            </div>

            <div>
              <dt className="text-slate-500 mb-1">Payout wallet</dt>
              <dd className="font-mono text-xs text-slate-300 break-all">{project.payout_wallet}</dd>
            </div>

            <div>
              <dt className="text-slate-500 mb-1">Creado</dt>
              <dd className="text-slate-300">{new Date(project.created_at).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        {/* Generador de QR de prueba */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Generar pago de prueba</h2>

          {!intent && (
            <form onSubmit={generateQr} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Monto (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  value={qrAmount}
                  onChange={e => setQrAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Razón <span className="text-slate-500 text-xs">— opcional, usa la del proyecto si está vacío</span>
                </label>
                <input
                  type="text"
                  value={qrReason}
                  onChange={e => setQrReason(e.target.value)}
                  placeholder={project.reason}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              {qrError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  {qrError}
                </div>
              )}
              <button
                type="submit"
                disabled={qrLoading || !qrAmount}
                className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-50"
              >
                {qrLoading ? 'Generando…' : 'Generar QR'}
              </button>
            </form>
          )}

          {intent && stellarUri && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                <QRCodeSVG value={stellarUri} size={200} level="M" />
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Esperando {intent.amount} USDC en</p>
                <p className="font-mono text-xs text-slate-300 break-all mt-1">{intent.wallet_address}</p>
              </div>
              <button
                onClick={() => copy(intent.wallet_address)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium"
              >
                Copiar dirección
              </button>
              <button
                onClick={() => { setIntent(null); setQrError(null); }}
                className="w-full py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium"
              >
                Generar otro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de transacciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold">Transacciones recientes</h2>
          <span className="text-xs text-slate-500">Auto-refresh cada 5s</span>
        </div>

        {txs.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            Aún no hay transacciones. Generá un pago de prueba arriba.
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
