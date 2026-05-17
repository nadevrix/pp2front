'use client';

// Alta de sucursal — copy alineado al paso 02 del PDF ("Configura tu wallet de
// destino. Si no tienes una, te guiamos para crearla en Lobstr o Meru").

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { backendFetch, type Project } from '@/lib/backend-api';
import type { TierState } from '@/lib/tiers';
import WalletOnboardingModal from '@/components/WalletOnboardingModal';

function isValidStellarKey(key: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(key.trim());
}

export default function NuevaSucursalPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [payoutWallet, setPayoutWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avisamos en UI si el plan Free ya tiene una sucursal (el backend de todos
  // modos lo rechaza con 403 + code='TIER_BRANCH_LIMIT' — esto solo es para
  // que el merchant no se confunda).
  const [limitReached, setLimitReached] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  useEffect(() => {
    Promise.all([
      backendFetch<{ data: TierState }>('/api/merchant/tier').catch(() => null),
      backendFetch<{ projects: Project[] }>('/api/projects/list').catch(() => null),
    ]).then(([tr, pr]) => {
      if (!tr || !pr) return;
      if (tr.data.tier === 'free' && pr.projects.length >= 1) {
        setLimitReached(true);
      }
    });
  }, []);

  const walletValid = isValidStellarKey(payoutWallet);
  const walletTouched = payoutWallet.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletValid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await backendFetch<{ project: Project }>('/api/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          name,
          reason,
          payout_wallet: payoutWallet.trim(),
        }),
      });
      router.push(`/dashboard/sucursales/${res.project.id}?created=1`);
    } catch (e: any) {
      setError(e.message || 'Error registrando la sucursal');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Link href="/dashboard/sucursales" className="text-sm text-[#6b7280] hover:text-[#005DB4]">
          ← Volver a sucursales
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Nueva sucursal</h1>
      <p className="text-[#6b7280] mb-8">
        Pollar Pay envía los pagos cobrados directo a tu wallet — Pollar no custodia tus fondos.
      </p>

      {limitReached && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm">
          Tu plan <strong>Free</strong> permite 1 sucursal. Para registrar más{' '}
          <Link href="/dashboard/plan" className="text-amber-700 underline hover:text-[#005DB4]">
            pasá a Starter
          </Link>{' '}
          (sin cuota mensual, 0.9 % por cobro).
        </div>
      )}

      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-1.5">
              Nombre de la sucursal
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Café La Paz centro"
              required
              className="w-full px-4 py-2.5 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-1.5">
              Rubro o descripción
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Cafetería · ventas mostrador"
              required
              className="w-full px-4 py-2.5 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4]"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="block text-sm font-medium text-[#6b7280]">
                Wallet Stellar de destino
              </label>
              <button
                type="button"
                onClick={() => setOnboardOpen(true)}
                className="text-xs text-[#005DB4] hover:text-[#0047a0] underline"
              >
                ¿No tenés una? Crearla en 3 minutos
              </button>
            </div>
            <input
              type="text"
              value={payoutWallet}
              onChange={e => setPayoutWallet(e.target.value)}
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              required
              className={`w-full px-4 py-2.5 bg-[#f0f7ff] border rounded-lg text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none transition-colors font-mono text-sm ${
                walletTouched
                  ? walletValid
                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    : 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-[#e5e7eb] focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4]'
              }`}
            />
            {walletTouched && !walletValid && (
              <p className="mt-1.5 text-xs text-rose-700">
                Stellar public key inválida (debe empezar con G y tener 56 caracteres)
              </p>
            )}
            {walletTouched && walletValid && (
              <p className="mt-1.5 text-xs text-emerald-700">Public key válida ✓</p>
            )}
            <p className="mt-2 text-xs text-[#9ca3af]">
              Si todavía no tenés wallet, abrí el tutorial de Lobstr o Meru — 3 minutos desde tu teléfono.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || limitReached || !name.trim() || !reason.trim() || !walletValid}
            className="w-full py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando…' : limitReached ? 'Límite del plan Free alcanzado' : 'Registrar sucursal'}
          </button>
        </form>
      </div>

      <WalletOnboardingModal open={onboardOpen} onClose={() => setOnboardOpen(false)} />
    </div>
  );
}
