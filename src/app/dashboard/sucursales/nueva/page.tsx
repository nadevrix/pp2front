'use client';

// Alta de sucursal — copy alineado al paso 02 del PDF ("Configura tu wallet de
// destino. Si no tienes una, te guiamos para crearla en Lobstr o Meru").

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { backendFetch, type Project } from '@/lib/backend-api';

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
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/dashboard/sucursales" className="text-sm text-slate-400 hover:text-white">
          ← Volver a sucursales
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Nueva sucursal</h1>
      <p className="text-slate-400 mb-8">
        Pollar Pay envía los pagos cobrados directo a tu wallet — Pollar no custodia tus fondos.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre de la sucursal
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Café La Paz centro"
              required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Rubro o descripción
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Cafetería · ventas mostrador"
              required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Wallet Stellar de destino
            </label>
            <input
              type="text"
              value={payoutWallet}
              onChange={e => setPayoutWallet(e.target.value)}
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              required
              className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition-colors font-mono text-sm ${
                walletTouched
                  ? walletValid
                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    : 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {walletTouched && !walletValid && (
              <p className="mt-1.5 text-xs text-rose-400">
                Stellar public key inválida (debe empezar con G y tener 56 caracteres)
              </p>
            )}
            {walletTouched && walletValid && (
              <p className="mt-1.5 text-xs text-emerald-400">Public key válida ✓</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              ¿No tenés una? Podés crearla gratis en{' '}
              <a href="https://lobstr.co" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Lobstr</a>{' '}
              o{' '}
              <a href="https://meru.io" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Meru</a>{' '}
              en 3 minutos desde tu teléfono.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !reason.trim() || !walletValid}
            className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando…' : 'Registrar sucursal'}
          </button>
        </form>
      </div>
    </div>
  );
}
