'use client';

// Plan — alineado con la página 8 del PDF ("Estructura de precios").
// Muestra los 4 tiers en cards, marca el actual y permite cambiar.
// Sin billing real todavía: el cambio se persiste y a partir de la próxima
// transacción aplica el nuevo fee. Scale advierte que la cuota se factura aparte.

import { useEffect, useState } from 'react';
import { backendFetch } from '@/lib/backend-api';
import { TIERS_UI, TIER_ORDER, type Tier, type TierState } from '@/lib/tiers';
import PlanUpgradeDialog from '@/components/PlanUpgradeDialog';

interface UpgradeIntent {
  id: string;
  target_tier: Tier;
  amount: string;
  transaction_id: string;
  wallet_address: string;
  expires_at: string;
  network: string;
}

export default function PlanPage() {
  const [state, setState] = useState<TierState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<Tier | null>(null);
  const [upgradeIntent, setUpgradeIntent] = useState<UpgradeIntent | null>(null);

  const load = () =>
    backendFetch<{ data: TierState }>('/api/merchant/tier')
      .then(d => setState(d.data))
      .catch(e => setError(e.message));

  useEffect(() => { load(); }, []);

  // Cambio de plan: el backend decide si requiere pago o no.
  //   - free / starter / growth → activación inmediata (sin cobro)
  //   - scale → devuelve un intent con QR; abrimos el modal de pago
  const changeTier = async (next: Tier) => {
    if (!state || state.tier === next) return;
    setChanging(next);
    setError(null);
    try {
      const res = await backendFetch<{
        activated: boolean;
        tier?: Tier;
        intent?: UpgradeIntent;
      }>('/api/merchant/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ tier: next }),
      });
      if (res.activated) {
        await load();
      } else if (res.intent) {
        setUpgradeIntent(res.intent);
      }
    } catch (e: any) {
      setError(e.message || 'Error cambiando de plan');
    } finally {
      setChanging(null);
    }
  };

  const onActivated = async () => {
    setUpgradeIntent(null);
    await load();
  };

  if (error && !state) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700">{error}</div>
      </div>
    );
  }

  if (!state) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-[#9ca3af]">Cargando…</div>;
  }

  const current = state.tier;
  const suggested = state.suggested_tier;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tu plan</h1>
        <p className="text-[#6b7280] mt-1">
          Sin cuota mensual en los tres primeros tiers — solo pagás cuando cobrás. Los tiers se asignan por volumen real.
        </p>
      </header>

      {/* Resumen del tier actual */}
      <section className="bg-white border border-[#e5e7eb] rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-[#9ca3af] mb-1">Plan vigente</div>
            <div className="text-2xl font-bold">{state.tier_label}</div>
            <div className="text-sm text-[#6b7280] mt-1">
              {TIERS_UI[current].percentLabel} por cobro · {TIERS_UI[current].minimumLabel} · {TIERS_UI[current].monthlyLabel}
            </div>
          </div>
          {suggested && (
            <div className="rounded-xl bg-[#f0f7ff] border border-[#005DB4] px-4 py-3 max-w-md">
              <div className="text-xs text-[#005DB4] uppercase tracking-wider mb-1">Sugerencia</div>
              <div className="text-sm text-[#1a1a1a]">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIER_ORDER.map(tier => {
          const ui = TIERS_UI[tier];
          const isCurrent = tier === current;
          const isSuggested = tier === suggested;
          return (
            <div
              key={tier}
              className={`relative rounded-2xl border ${ui.accent} bg-white p-6 flex flex-col`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 rounded px-2 py-0.5">
                  Tu plan
                </span>
              )}
              {!isCurrent && isSuggested && (
                <span className="absolute -top-2.5 left-4 text-[10px] uppercase tracking-wider bg-[#f0f7ff] text-[#005DB4] border border-[#005DB4] rounded px-2 py-0.5">
                  Sugerido
                </span>
              )}

              <div className="mb-1">
                <h3 className="font-semibold text-lg">{ui.label}</h3>
                <p className="text-xs text-[#9ca3af]">{ui.volumeLabel}</p>
              </div>

              <div className="mt-3 mb-1">
                <div className="text-3xl font-bold tabular-nums">{ui.percentLabel}</div>
                <div className="text-xs text-[#9ca3af]">{ui.minimumLabel}</div>
                <div className="text-xs text-[#9ca3af] mt-0.5">{ui.monthlyLabel}</div>
              </div>

              <ul className="mt-4 text-xs text-[#6b7280] space-y-1.5 flex-1">
                {ui.features.map(f => (
                  <li key={f} className="flex gap-1.5">
                    <span className="text-emerald-700 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => changeTier(tier)}
                disabled={isCurrent || changing !== null}
                className={`mt-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-[#f0f7ff] text-[#9ca3af] cursor-default'
                    : 'bg-[#005DB4] hover:bg-[#0047a0] text-white disabled:opacity-50'
                }`}
              >
                {isCurrent
                  ? 'Plan actual'
                  : changing === tier
                    ? 'Generando…'
                    : tier === 'scale'
                      ? 'Pagar $25 USDC y activar'
                      : 'Cambiar a este plan'}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <p className="text-xs text-[#9ca3af] mt-8">
        El fee aplicado a cada cobro es el mayor valor entre el porcentaje del tier y el mínimo fijo. El gas de la red Stellar está incluido — no hay cargo adicional.
      </p>

      <PlanUpgradeDialog
        open={upgradeIntent !== null}
        intent={upgradeIntent}
        onClose={() => setUpgradeIntent(null)}
        onActivated={onActivated}
      />
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/60 border border-[#e5e7eb] rounded-lg p-3">
      <div className="text-xs text-[#9ca3af]">{label}</div>
      <div className="text-lg font-semibold tabular-nums mt-0.5">{value}</div>
      {sub && <div className="text-xs text-[#9ca3af] mt-0.5">{sub}</div>}
    </div>
  );
}

function renderRange(usage: TierState['usage']): string {
  const max = usage.monthly_volume_max;
  if (max === null) return `desde ${usage.monthly_volume_min}`;
  return `de ${usage.monthly_volume_min} – ${max}`;
}
