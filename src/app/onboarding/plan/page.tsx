'use client';

// ─── Onboarding · elegir plan ───────────────────────────────────────────────
// Pantalla obligatoria post-signup. Mismo layout que /dashboard/plan:
//   - 3 tiers automáticos en 1 rectángulo
//   - Scale aparte como card premium celeste diamante
// Default: el merchant arranca en Free con cero fricción (botón principal
// "Continuar con Free"). Para Scale: QR de pago + polling, igual que
// /dashboard/plan. Una vez completado, redirige a /dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function OnboardingPlanPage() {
  const router = useRouter();
  const [state, setState] = useState<TierState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [upgradeIntent, setUpgradeIntent] = useState<UpgradeIntent | null>(null);

  useEffect(() => {
    backendFetch<{ data: TierState }>('/api/merchant/tier')
      .then(d => {
        // Si ya completó onboarding, no debería ver esta página — manda al dashboard
        if (d.data.onboarding_completed) {
          router.replace('/dashboard');
          return;
        }
        setState(d.data);
      })
      .catch(e => setError(e.message));
  }, [router]);

  const continueWithFree = async () => {
    setConfirming(true);
    setError(null);
    try {
      // Marca onboarding done sin tocar el tier (ya arranca en free por default).
      await backendFetch('/api/merchant/onboarding', { method: 'POST' });
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Error continuando');
      setConfirming(false);
    }
  };

  const chooseScale = async () => {
    setConfirming(true);
    setError(null);
    try {
      const res = await backendFetch<{ activated: boolean; intent?: UpgradeIntent }>(
        '/api/merchant/billing/upgrade',
        {
          method: 'POST',
          body: JSON.stringify({ tier: 'scale' }),
        },
      );
      if (res.intent) setUpgradeIntent(res.intent);
    } catch (e: any) {
      setError(e.message || 'Error generando el pago');
    } finally {
      setConfirming(false);
    }
  };

  const onScaleActivated = () => {
    setUpgradeIntent(null);
    router.push('/dashboard');
  };

  if (error && !state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700">{error}</div>
      </div>
    );
  }
  if (!state) {
    return <div className="min-h-screen flex items-center justify-center text-[#9ca3af] text-sm">Cargando…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#9ca3af] font-mono mb-2">
            <span>Pollar Pay</span>
            <span className="text-[#e5e7eb]">·</span>
            <span>Configurar cuenta</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Elegí cómo arrancar</h1>
          <p className="text-[#6b7280] text-sm sm:text-base max-w-xl mx-auto">
            Empezás en Free sin cuota y vas subiendo automáticamente según tu volumen. O activá Scale ya mismo si querés fee mínimo y soporte prioritario.
          </p>
        </header>

        {/* Auto tiers — 3 en un container, free destacado como "el default" */}
        <section className="mb-6">
          <div className="flex items-end justify-between mb-3 px-1">
            <h2 className="text-xs uppercase tracking-widest text-[#9ca3af] font-mono">
              Camino automático · sin pago
            </h2>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e7eb]">
              {AUTO_TIERS.map((tier, idx) => {
                const ui = TIERS_UI[tier];
                const isDefault = idx === 0; // Free
                return (
                  <div
                    key={tier}
                    className={`relative p-5 sm:p-6 flex flex-col ${isDefault ? 'bg-[#f0f7ff]' : ''}`}
                  >
                    {isDefault && (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-[#005DB4] text-white rounded-full px-2 py-0.5 font-medium">
                        Empezá acá
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
                      {ui.features.slice(0, 4).map(f => (
                        <li key={f} className="flex gap-1.5">
                          <span className="text-emerald-700 shrink-0">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider py-1">
                      {isDefault ? 'Tu punto de partida' : 'Asignado automáticamente al crecer'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Scale premium */}
        <section className="mb-6">
          <div className="flex items-end justify-between mb-3 px-1">
            <h2 className="text-xs uppercase tracking-widest text-[#9ca3af] font-mono">
              Premium · opcional
            </h2>
          </div>
          <ScaleOnboardingCard
            ui={TIERS_UI.scale}
            confirming={confirming}
            onChoose={chooseScale}
          />
        </section>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* CTA principal: continuar con free */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#e5e7eb] rounded-2xl p-4 sm:p-5">
          <div>
            <div className="font-semibold text-sm sm:text-base">Continuar con Free</div>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Cero cuota. Si tus cobros crecen, te promovemos solos.
            </p>
          </div>
          <button
            onClick={continueWithFree}
            disabled={confirming}
            className="px-5 py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white text-sm font-semibold disabled:opacity-50"
          >
            {confirming ? 'Continuando…' : 'Continuar al dashboard →'}
          </button>
        </div>

        <p className="text-xs text-[#9ca3af] text-center mt-6">
          Podés cambiar de plan después desde el dashboard.
        </p>

        <PlanUpgradeDialog
          open={upgradeIntent !== null}
          intent={upgradeIntent}
          onClose={() => setUpgradeIntent(null)}
          onActivated={onScaleActivated}
        />
      </div>
    </div>
  );
}

function ScaleOnboardingCard({
  ui,
  confirming,
  onChoose,
}: {
  ui: typeof TIERS_UI.scale;
  confirming: boolean;
  onChoose: () => void;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, #003a73 0%, #005DB4 45%, #0ea5e9 100%)',
        }}
      />
      <div
        className="absolute -top-20 -right-20 w-72 h-72 -z-10 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #67e8f9 0%, transparent 70%)' }}
      />
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
          </div>

          <h3 className="text-3xl font-bold tracking-tight mb-1">{ui.label}</h3>
          <p className="text-sm text-cyan-100/90 mb-5">Para comercios que ya facturan +1.000 cobros/mes y quieren fee mínimo desde el día 1.</p>

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

          <button
            onClick={onChoose}
            disabled={confirming}
            className="w-full px-4 py-3 rounded-lg bg-white text-[#005DB4] font-semibold text-sm hover:bg-cyan-50 transition-colors disabled:opacity-60"
          >
            {confirming ? 'Generando QR…' : 'Pagar $25 y activar Scale'}
          </button>

          <div className="text-[10px] text-cyan-100/70 text-center md:text-right leading-relaxed">
            Si no renovás al mes, volvés al tier que justifique tu volumen.
          </div>
        </div>
      </div>
    </div>
  );
}
