'use client';

// Detalle de sucursal — vista merchant-first: foco en wallet de destino,
// últimos movimientos y acción "cobrar en esta sucursal". La API key vive
// en /dashboard/avanzado (es un detalle técnico, no operativo).

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { backendFetch, type Project, type Transaction } from '@/lib/backend-api';
import { stellarExpertAccountUrl, stellarExpertTxUrl, networkFromApiKey } from '@/lib/stellar';
import WalletOnboardingModal from '@/components/WalletOnboardingModal';
import MembersSection from '@/components/MembersSection';

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
  completed: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
  overpaid: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  pending: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  underpaid: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  expired: 'text-[#6b7280] bg-[#f0f7ff] border-[#e5e7eb]',
  anomaly: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  late_anomaly: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  refunded: 'text-violet-700 bg-violet-500/10 border-violet-500/20',
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
  const [onboardOpen, setOnboardOpen] = useState(false);

  // Edición inline del perfil: nombre, rubro y monto por defecto en el QR
  // (PDF pág. 11 paso 03).
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<{ name: string; reason: string; default_amount: string }>({
    name: '', reason: '', default_amount: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const startEditProfile = () => {
    if (!branch) return;
    setProfileDraft({
      name: branch.name,
      reason: branch.reason,
      default_amount: branch.default_amount != null ? String(branch.default_amount) : '',
    });
    setProfileError(null);
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    if (!branch) return;
    const name = profileDraft.name.trim();
    const reason = profileDraft.reason.trim();
    if (!name || !reason) {
      setProfileError('Nombre y rubro no pueden quedar vacíos');
      return;
    }
    let defaultAmount: number | null = null;
    const raw = profileDraft.default_amount.trim();
    if (raw) {
      const n = parseFloat(raw);
      if (isNaN(n) || n < 0.01 || n > 1_000_000) {
        setProfileError('Monto por defecto inválido (0.01 – 1,000,000 USDC)');
        return;
      }
      defaultAmount = n;
    }
    setProfileSaving(true);
    setProfileError(null);
    try {
      const res = await backendFetch<{ project: Project }>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, reason, default_amount: defaultAmount }),
      });
      setBranch(res.project);
      setEditingProfile(false);
    } catch (e: any) {
      setProfileError(e.message || 'Error guardando');
    }
    setProfileSaving(false);
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700">{error}</div>
        <Link href="/dashboard/sucursales" className="text-sm text-[#6b7280] hover:text-[#005DB4] mt-4 inline-block">
          ← Volver
        </Link>
      </div>
    );
  }

  if (!branch) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-[#9ca3af]">Cargando…</div>;
  }

  const network = networkFromApiKey(branch.api_key);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Link href="/dashboard/sucursales" className="text-sm text-[#6b7280] hover:text-[#005DB4]">
          ← Volver a sucursales
        </Link>
      </div>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 break-words">{branch.name}</h1>
          <p className="text-[#6b7280]">{branch.reason}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/cobrar?branch=${branch.id}`}
            className="px-4 py-2 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium text-sm"
          >
            Cobrar en esta sucursal
          </Link>
          {/* PDF pág. 11 paso 04: "Prueba en modo testnet — Un pago de prueba
              sin dinero real para ver el flujo completo antes de activar." */}
          {network === 'TESTNET' && (
            <Link
              href={`/dashboard/cobrar?branch=${branch.id}&amount=1&reason=Cobro+de+prueba+(testnet)`}
              className="px-4 py-2 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] font-medium text-sm border border-[#005DB4]/30"
            >
              Hacer cobro de prueba
            </Link>
          )}
        </div>
      </header>

      {/* Perfil editable de la sucursal — PDF pág. 11 paso 03:
          "Nombre del negocio, sucursales si aplica, y monto por defecto en el QR". */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Perfil del comercio</h2>
          {!editingProfile && branch.role !== 'cashier' && (
            <button onClick={startEditProfile} className="text-xs text-[#6b7280] hover:text-[#005DB4]">
              Editar
            </button>
          )}
        </div>

        {!editingProfile ? (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-[#9ca3af]">Nombre</dt>
              <dd className="text-[#1a1a1a] mt-0.5 truncate">{branch.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#9ca3af]">Rubro / descripción</dt>
              <dd className="text-[#1a1a1a] mt-0.5 truncate">{branch.reason}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#9ca3af]">Monto por defecto del QR</dt>
              <dd className="text-[#1a1a1a] mt-0.5 font-mono">
                {branch.default_amount != null
                  ? `$${parseFloat(String(branch.default_amount)).toFixed(2)} USDC`
                  : <span className="text-[#9ca3af]">— sin preset</span>}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#9ca3af] mb-1">Nombre</label>
              <input
                type="text"
                value={profileDraft.name}
                onChange={e => setProfileDraft(d => ({ ...d, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#005DB4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9ca3af] mb-1">Rubro / descripción</label>
              <input
                type="text"
                value={profileDraft.reason}
                onChange={e => setProfileDraft(d => ({ ...d, reason: e.target.value }))}
                className="w-full px-3 py-2 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#005DB4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9ca3af] mb-1">
                Monto por defecto del QR <span className="text-[#9ca3af]">(opcional, USDC)</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={profileDraft.default_amount}
                onChange={e => setProfileDraft(d => ({ ...d, default_amount: e.target.value }))}
                placeholder="Ej: 25.00 (dejá vacío para no prellenar)"
                className="w-full px-3 py-2 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#005DB4] text-sm"
              />
              <p className="mt-1 text-xs text-[#9ca3af]">
                Si lo configurás, /cobrar va a venir con el monto ya tipeado al elegir esta sucursal.
              </p>
            </div>
            {profileError && <p className="text-xs text-rose-700">{profileError}</p>}
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={profileSaving}
                className="px-3 py-1.5 bg-[#005DB4] hover:bg-[#0047a0] text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {profileSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                disabled={profileSaving}
                className="px-3 py-1.5 bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
        <h2 className="font-semibold mb-4">Wallet de destino</h2>
        <p className="text-sm text-[#6b7280] mb-5">
          Los pagos cobrados en esta sucursal se reenvían automáticamente a esta wallet en segundos. Pollar no custodia los fondos.
        </p>

        {!editingWallet ? (
          <div className="space-y-3">
            <div className="font-mono text-xs text-[#1a1a1a] break-all bg-[#f0f7ff] px-3 py-2.5 rounded-lg border border-[#e5e7eb]">
              {branch.payout_wallet}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <a
                href={stellarExpertAccountUrl(branch.payout_wallet, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#005DB4] hover:text-[#0047a0]"
              >
                Ver en Stellar Expert ↗
              </a>
              {branch.role !== 'cashier' && (
                <button
                  onClick={startEditWallet}
                  className="text-[#6b7280] hover:text-[#005DB4]"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#9ca3af]">Nueva dirección Stellar</label>
              <button
                type="button"
                onClick={() => setOnboardOpen(true)}
                className="text-xs text-[#005DB4] hover:text-[#0047a0] underline"
              >
                ¿Cómo creo una wallet?
              </button>
            </div>
            <input
              type="text"
              value={walletDraft}
              onChange={e => setWalletDraft(e.target.value)}
              className="w-full px-3 py-2 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#005DB4] font-mono text-xs"
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            />
            {walletError && <p className="text-xs text-rose-700">{walletError}</p>}
            <div className="flex gap-2">
              <button
                onClick={saveWallet}
                disabled={walletSaving}
                className="px-3 py-1.5 bg-[#005DB4] hover:bg-[#0047a0] rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {walletSaving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingWallet(false)}
                disabled={walletSaving}
                className="px-3 py-1.5 bg-[#f0f7ff] hover:bg-[#e0f0ff] rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
            <p className="text-xs text-[#9ca3af]">
              Cambiar esta wallet afecta solo los pagos futuros. Las transacciones ya completadas no se modifican.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <h2 className="font-semibold">Movimientos de la sucursal</h2>
          <span className="text-xs text-[#9ca3af]">Auto-refresh 10 s</span>
        </div>

        {txs.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#9ca3af] text-sm">
            Sin movimientos todavía. Generá tu primer cobro desde el botón &laquo;Cobrar en esta sucursal&raquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#9ca3af] border-b border-[#e5e7eb]">
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
                    <tr key={tx.id} className="border-b border-[#e5e7eb] last:border-0">
                      <td className="px-6 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[tx.status] || STATUS_COLOR.pending}`}>
                          {STATUS_LABEL[tx.status] ?? tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[#6b7280] max-w-[260px] truncate">{tx.reason}</td>
                      <td className="px-6 py-3 text-right font-mono text-[#6b7280]">{parseFloat(tx.amount_expected).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono text-[#1a1a1a]">{parseFloat(tx.amount_paid || '0').toFixed(2)}</td>
                      <td className="px-6 py-3 text-xs">
                        {hash ? (
                          <a
                            href={stellarExpertTxUrl(hash, network)}
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
                      <td className="px-6 py-3 text-xs text-[#9ca3af]">
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

      <MembersSection
        projectId={branch.id}
        viewerRole={branch.role === 'cashier' ? 'cashier' : 'owner'}
        acceptBaseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
      />

      <WalletOnboardingModal open={onboardOpen} onClose={() => setOnboardOpen(false)} />
    </div>
  );
}
