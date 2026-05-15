'use client';

// Plan — alineado con la página 8 del PDF ("Estructura de precios").
// Muestra los 4 tiers en cards, marca el actual y permite cambiar.
// Sin billing real todavía: el cambio se persiste y a partir de la próxima
// transacción aplica el nuevo fee. Scale advierte que la cuota se factura aparte.

import { useEffect, useState } from 'react';
import { backendFetch } from '@/lib/backend-api';
import { TIERS_UI, TIER_ORDER, type Tier, type TierState } from '@/lib/tiers';

export default function PlanPage() {
  const [state, setState] = useState<TierState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<Tier | null>(null);

  const load = () =>
    backendFetch<{ data: TierState }>('/api/merchant/tier')
      .then(d => setState(d.data))
      .catch(e => setError(e.message));

  useEffect(() => { load(); }, []);

  const changeTier = async (next: Tier) => {
    if (!state || state.tier === next) return;
    setChanging(next);
    setError(null);
    try {
      await backendFetch('/api/merchant/tier', {
        method: 'POST',
        body: JSON.stringify({ tier: next }),
      });
      await load();
    } catch (e: any) {
      setError(e.message || 'Error cambiando de plan');
    } finally {
      setChanging(null);
    }
  };

  if (error && !state) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">{error}</div>
      </div>
    );
  }

  if (!state) {
    return <div className="max-w-6xl mx-auto px-6 py-10 text-slate-500">Cargando…</div>;
  }

  const current = state.tier;
  const suggested = state.suggested_tier;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tu plan</h1>
        <p className="text-slate-400 mt-1">
          Sin cuota mensual en los tres primeros tiers — solo pagás cuando cobrás. Los tiers se asignan por volumen real.
        </p>
      </header>

      {/* Resumen del tier actual */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-slate-500 mb-1">Plan vigente</div>
            <div className="text-2xl font-bold">{state.tier_label}</div>
            <div className="text-sm text-slate-400 mt-1">
              {TIERS_UI[current].percentLabel} por cobro · {TIERS_UI[current].minimumLabel} · {TIERS_UI[current].monthlyLabel}
            </div>
          </div>
          {suggested && (
            <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 px-4 py-3 max-w-md">
              <div className="text-xs text-sky-300 uppercase tracking-wider mb-1">Sugerencia</div>
              <div className="text-sm text-slate-200">
                Con tu volumen mensual, podrías cambiar a <strong>{state.suggested_label}</strong> para reducir el fee.
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Mini label="Cobros este mes" value={state.usage.transactions_this_month.toLocaleString()} sub={renderRange(state.usage)} />
          <Mini label="Volumen del mes" value={`$${state.usage.volume_this_month}`} sub="USDC cobrado" />
          <Mini label="Fees pagados" value={`$${state.usage.fee_paid_this_month}`} sub="este mes" />
          {current === 'free' ? (
            <Mini
              label="Free restantes"
              value={state.usage.free_tx_remaining.toLocaleString()}
              sub={`${state.usage.free_tx_used} de 50 usadas`}
            />
          ) : (
            <Mini label="Cuota fija" value={state.monthly_fee > 0 ? `$${state.monthly_fee}/mes` : '$0'} />
          )}
        </div>
      </section>

      {/* Grid de tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {TIER_ORDER.map(tier => {
          const ui = TIERS_UI[tier];
          const isCurrent = tier === current;
          const isSuggested = tier === suggested;
          return (
            <div
              key={tier}
              className={`relative rounded-2xl border ${ui.accent} bg-slate-900 p-6 flex flex-col`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded px-2 py-0.5">
                  Tu plan
                </span>
              )}
              {!isCurrent && isSuggested && (
                <span className="absolute -top-2.5 left-4 text-[10px] uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded px-2 py-0.5">
                  Sugerido
                </span>
              )}

              <div className="mb-1">
                <h3 className="font-semibold text-lg">{ui.label}</h3>
                <p className="text-xs text-slate-500">{ui.volumeLabel}</p>
              </div>

              <div className="mt-3 mb-1">
                <div className="text-3xl font-bold tabular-nums">{ui.percentLabel}</div>
                <div className="text-xs text-slate-500">{ui.minimumLabel}</div>
                <div className="text-xs text-slate-500 mt-0.5">{ui.monthlyLabel}</div>
              </div>

              <ul className="mt-4 text-xs text-slate-400 space-y-1.5 flex-1">
                {ui.features.map(f => (
                  <li key={f} className="flex gap-1.5">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => changeTier(tier)}
                disabled={isCurrent || changing !== null}
                className={`mt-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-slate-800 text-slate-500 cursor-default'
                    : 'bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50'
                }`}
              >
                {isCurrent ? 'Plan actual' : changing === tier ? 'Cambiando…' : tier === 'scale' ? 'Cambiar (cuota se factura aparte)' : 'Cambiar a este plan'}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-8">
        El fee aplicado a cada cobro es el mayor valor entre el porcentaje del tier y el mínimo fijo. El gas de la red Stellar está incluido — no hay cargo adicional.
      </p>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums mt-0.5">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function renderRange(usage: TierState['usage']): string {
  const max = usage.monthly_volume_max;
  if (max === null) return `desde ${usage.monthly_volume_min}`;
  return `de ${usage.monthly_volume_min} – ${max}`;
}
