'use client';

// ─── Plan ───────────────────────────────────────────────────────────────────
// Layout: los tres tiers "graduados por volumen" (Free/Starter/Growth) viven en
// un mismo container — son el camino automático sin pago. Scale vive aparte
// como card premium (gradiente azul/cyan) porque es opt-in y se paga $25/mes.
//
// Auto-graduación (manejada en el backend):
//   - Subir: inline al cerrar cada cobro, cuando se cruza el umbral
//   - Bajar: cron mensual día 1, según volumen del mes anterior
//   - Scale: requiere pago manual, se baja si no se renueva
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { backendFetch } from '@/lib/backend-api';
import { TIERS_UI, type Tier, type TierState } from '@/lib/tiers';
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

const AUTO_TIERS: Tier[] = ['free', 'starter', 'growth'];

export default function PlanPage() {
  const [state, setState] = useState<TierState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<Tier | null>(null);
  const [upgradeIntent, setUpgradeIntent] = useState<UpgradeIntent | null>(null);

  const load = () =>
    backendFetch<{ data: TierState }>('/api/merchant/tier')
      .then(d => setState(d.data))
      .catch(e => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const onActivated = async () => {
    setUpgradeIntent(null);
    await load();
  };

  const startScaleUpgrade = async () => {
    setChanging('scale');
    setError(null);
    try {
      const res = await backendFetch<{
        activated: boolean;
        tier?: Tier;
        intent?: UpgradeIntent;
      }>('/api/merchant/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ tier: 'scale' }),
      });
      if (res.intent) {
        setUpgradeIntent(res.intent);
      } else if (res.activated) {
        await load();
      }
    } catch (e: any) {
      setError(e.message || 'Error generando el pago');
    } finally {
      setChanging(null);
    }
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
  const isScale = current === 'scale';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tu plan</h1>
        <p className="text-[#6b7280] mt-1 text-sm sm:text-base">
          Free, Starter y Growth se asignan automáticamente según tu volumen mensual. Scale es opt-in: $25/mes para fee mínimo y soporte prioritario.
        </p>
      </header>

      {/* ── Resumen del tier actual ─────────────────────────────────────── */}
      <section className="bg-white border border-[#e5e7eb] rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#9ca3af] font-mono mb-1">Plan vigente</div>
            <div className="text-2xl font-bold">{state.tier_label}</div>
            <div className="text-sm text-[#6b7280] mt-1">
              {(state.percent * 100).toFixed(1).replace(/\.0$/, '')} % por cobro
              {state.minimum > 0 && ` · mín $${state.minimum.toFixed(2)}`}
              {state.monthly_fee > 0 ? ` · $${state.monthly_fee}/mes` : ' · sin cuota mensual'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Mini label="Cobros este mes" value={state.usage.transactions_this_month.toLocaleString()} sub={tierRangeHint(state)} />
          <Mini label="Volumen del mes" value={`$${state.usage.volume_this_month}`} sub="USDC cobrado" />
          <Mini label="Fees pagados" value={`$${state.usage.fee_paid_this_month}`} sub="este mes" />
          {current === 'free' ? (
            <Mini
              label="Free restantes"
              value={state.usage.free_tx_remaining.toLocaleString()}
              sub={`${state.usage.free_tx_used} de 50 usadas`}
            />
          ) : isScale ? (
            <Mini label="Cuota Scale" value="$25" sub="cada 30 días" highlight />
          ) : (
            <Mini label="Cuota mensual" value="Sin cuota" sub="auto-graduado por volumen" />
          )}
        </div>
      </section>

      {/* ── Tiers automáticos (Free / Starter / Growth) ──────────────────── */}
      <section className="mb-6 sm:mb-8">
        <div className="flex items-end justify-between mb-3 px-1">
          <h2 className="text-xs uppercase tracking-widest text-[#9ca3af] font-mono">
            Camino automático
          </h2>
          <span className="text-xs text-[#9ca3af] hidden sm:inline">
            Subís solo al crecer · bajás solo si tu volumen cae
          </span>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e7eb]">
            {AUTO_TIERS.map(tier => {
              const ui = TIERS_UI[tier];
              const isCurrent = tier === current;
              return (
                <div
                  key={tier}
                  className={`relative p-5 sm:p-6 flex flex-col ${isCurrent ? 'bg-[#f0f7ff]' : ''}`}
                >
                  {isCurrent && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-[#005DB4] text-white rounded-full px-2 py-0.5 font-medium">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                      Tu plan
                    </div>
                  )}

                  <div className="mb-1">
                    <h3 className="font-semibold text-lg">{ui.label}</h3>
                    <p className="text-xs text-[#9ca3af]">{ui.volumeLabel}</p>
                  </div>

                  <div className="mt-3 mb-1">
                    <div className="text-3xl font-bold tabular-nums">{ui.percentLabel}</div>
                    <div className="text-xs text-[#9ca3af]">{ui.minimumLabel}</div>
                  </div>

                  <ul className="mt-4 text-xs text-[#6b7280] space-y-1.5 flex-1">
                    {ui.features.map(f => (
                      <li key={f} className="flex gap-1.5">
                        <span className="text-emerald-700 shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="mt-5 text-center text-xs text-[#005DB4] font-medium bg-white border border-[#005DB4]/30 py-2 rounded-lg">
                      Plan actual
                    </div>
                  ) : (
                    <div className="mt-5 text-center text-xs text-[#9ca3af] py-2">
                      Se asigna automáticamente
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Scale (premium, opt-in) ─────────────────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-end justify-between mb-3 px-1">
          <h2 className="text-xs uppercase tracking-widest text-[#9ca3af] font-mono">
            Premium · opcional
          </h2>
        </div>

        <ScaleCard
          current={isScale}
          ui={TIERS_UI.scale}
          changing={changing === 'scale'}
          onActivate={startScaleUpgrade}
        />
      </section>

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

function Mini({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${highlight ? 'bg-[#005DB4]/5 border-[#005DB4]/20' : 'bg-white/60 border-[#e5e7eb]'}`}>
      <div className="text-xs text-[#9ca3af]">{label}</div>
      <div className={`text-lg font-semibold tabular-nums mt-0.5 ${highlight ? 'text-[#005DB4]' : ''}`}>{value}</div>
      {sub && <div className="text-xs text-[#9ca3af] mt-0.5">{sub}</div>}
    </div>
  );
}

function tierRangeHint(state: TierState): string {
  const count = state.usage.transactions_this_month;
  const min = state.usage.monthly_volume_min;
  const max = state.usage.monthly_volume_max;
  // Si sobrepasaste el max del tier actual, te promovieron o están por promoverte
  if (max !== null && count > max) return 'Próximo upgrade…';
  if (max === null) return `desde ${min}`;
  return `${count} de ${max} permitidos`;
}

// ─── Scale card — premium look (gradiente celeste diamante) ───────────────────
function ScaleCard({
  current,
  ui,
  changing,
  onActivate,
}: {
  current: boolean;
  ui: typeof TIERS_UI.scale;
  changing: boolean;
  onActivate: () => void;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Gradiente de fondo: azul Pollar profundo con highlight cyan */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, #003a73 0%, #005DB4 45%, #0ea5e9 100%)',
        }}
      />
      {/* Halo de glow cyan en la esquina */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 -z-10 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #67e8f9 0%, transparent 70%)' }}
      />
      {/* Patrón de "diamante" sutil */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 14px)',
        }}
      />

      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 p-6 sm:p-8 text-white">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest bg-white/15 border border-white/30 backdrop-blur rounded-full px-2.5 py-0.5 font-medium">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Premium
            </span>
            {current && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest bg-emerald-400 text-emerald-950 rounded-full px-2 py-0.5 font-bold">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="4" />
                </svg>
                Tu plan
              </span>
            )}
          </div>

          <h3 className="text-3xl font-bold tracking-tight mb-1">{ui.label}</h3>
          <p className="text-sm text-cyan-100/90 mb-5">{ui.volumeLabel}</p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold tabular-nums">{ui.percentLabel}</span>
            <span className="text-sm text-cyan-100/80">por cobro</span>
          </div>
          <div className="text-xs text-cyan-100/70 mb-6">{ui.minimumLabel}</div>

          <ul className="text-sm space-y-1.5 max-w-md">
            {ui.features.map(f => (
              <li key={f} className="flex gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:w-56 flex flex-col justify-between gap-4">
          <div className="text-center md:text-right">
            <div className="text-xs uppercase tracking-widest text-cyan-100/70 font-mono mb-1">Suscripción</div>
            <div className="text-3xl font-bold tabular-nums">$25</div>
            <div className="text-xs text-cyan-100/80">USDC / mes</div>
          </div>

          {current ? (
            <div className="bg-white/10 border border-white/30 backdrop-blur rounded-lg px-4 py-2 text-center text-xs">
              Renovación automática al pagar de nuevo
            </div>
          ) : (
            <button
              onClick={onActivate}
              disabled={changing}
              className="w-full px-4 py-3 rounded-lg bg-white text-[#005DB4] font-semibold text-sm hover:bg-cyan-50 transition-colors disabled:opacity-60"
            >
              {changing ? 'Generando QR…' : 'Pagar $25 y activar'}
            </button>
          )}

          <div className="text-[10px] text-cyan-100/70 text-center md:text-right leading-relaxed">
            Si no renovás, volvés al tier que corresponda según tu volumen.
          </div>
        </div>
      </div>
    </div>
  );
}
