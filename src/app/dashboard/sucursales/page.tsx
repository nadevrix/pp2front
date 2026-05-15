'use client';

// Sucursales — la "sucursal" es la unidad que el PDF describe (Starter+):
// cada una tiene su propia wallet de destino y aparece separada en reportes.
// Bajo el capó es un `project` en la DB; la API key sigue siendo per-branch,
// pero en esta vista la dejamos como detalle, no como protagonista.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { backendFetch, type Project } from '@/lib/backend-api';
import type { TierState } from '@/lib/tiers';

export default function SucursalesPage() {
  const [branches, setBranches] = useState<Project[] | null>(null);
  const [tier, setTier] = useState<TierState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      backendFetch<{ projects: Project[] }>('/api/projects/list')
        .then(d => setBranches(d.projects)),
      backendFetch<{ data: TierState }>('/api/merchant/tier')
        .then(d => setTier(d.data))
        .catch(() => { /* tier es opcional para esta vista */ }),
    ]).catch(e => setError(e.message));
  }, []);

  // Free = 1 sucursal (PDF pág. 8). El backend lo enforce; acá deshabilitamos el
  // botón "Nueva sucursal" si ya hay una y el plan es Free, y mostramos el porqué.
  const freeBranchLimitReached = tier?.tier === 'free' && (branches?.length ?? 0) >= 1;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-slate-400 mt-1">
            Cada sucursal tiene su propia wallet de destino y reportes separados.
          </p>
        </div>
        {freeBranchLimitReached ? (
          <div className="text-right">
            <span
              aria-disabled
              className="inline-block px-4 py-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed text-sm font-medium"
              title="Tu plan Free permite 1 sucursal"
            >
              + Nueva sucursal
            </span>
            <div className="text-[11px] text-slate-500 mt-1">
              Tu plan Free permite 1 sucursal.{' '}
              <Link href="/dashboard/plan" className="text-indigo-400 hover:text-indigo-300">
                Cambiar a Starter →
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/dashboard/sucursales/nueva"
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm"
          >
            + Nueva sucursal
          </Link>
        )}
      </header>

      {branches === null ? (
        <div className="text-slate-500 text-sm">Cargando…</div>
      ) : branches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-300 mb-4">
            Todavía no tenés ninguna sucursal registrada.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Necesitás al menos una para empezar a cobrar. Solo te pediremos una wallet Stellar de destino — si no tenés, podés crearla gratis en Lobstr o Meru desde tu teléfono en 3 minutos.
          </p>
          <Link
            href="/dashboard/sucursales/nueva"
            className="inline-block px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium"
          >
            Registrar la primera
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map(b => (
            <Link
              key={b.id}
              href={`/dashboard/sucursales/${b.id}`}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors block"
            >
              <h3 className="font-semibold text-lg mb-1 truncate">{b.name}</h3>
              <p className="text-sm text-slate-400 mb-4 truncate">{b.reason}</p>
              <div className="text-xs text-slate-500">
                Wallet destino
              </div>
              <div className="text-xs font-mono text-slate-300 truncate">
                {b.payout_wallet.slice(0, 12)}…{b.payout_wallet.slice(-6)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
