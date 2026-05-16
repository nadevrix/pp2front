// Página pública de precios — espejo de la página 8 del PDF.
// Las constantes vienen de @/lib/tiers para mantener una sola fuente de verdad.

import Link from 'next/link';
import PublicShell from '@/components/public/PublicShell';
import { TIERS_UI, TIER_ORDER } from '@/lib/tiers';

const EXAMPLES = [
  { tier: 'Free (1.2 %)',    monto: '$5.00',   calculado: '$0.06', cobrado: '$0.20', nota: 'Se aplica mínimo' },
  { tier: 'Free (1.2 %)',    monto: '$30.00',  calculado: '$0.36', cobrado: '$0.36', nota: 'Se aplica porcentaje' },
  { tier: 'Starter (0.9 %)', monto: '$20.00',  calculado: '$0.18', cobrado: '$0.20', nota: 'Se aplica mínimo' },
  { tier: 'Starter (0.9 %)', monto: '$50.00',  calculado: '$0.45', cobrado: '$0.45', nota: 'Se aplica porcentaje' },
  { tier: 'Growth (0.7 %)',  monto: '$50.00',  calculado: '$0.35', cobrado: '$0.35', nota: 'Se aplica porcentaje' },
  { tier: 'Scale (0.5 %)',   monto: '$100.00', calculado: '$0.50', cobrado: '$0.50', nota: 'Se aplica porcentaje' },
];

export default function PreciosPage() {
  return (
    <PublicShell>
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Precios simples</h1>
        <p className="text-[#6b7280] max-w-2xl mx-auto">
          Sin cuota mensual en los tres primeros tiers — pagás únicamente cuando cobrás. Los
          tiers se asignan por volumen real: el sistema monitorea cada comercio y sugiere el
          correcto automáticamente.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIER_ORDER.map(t => {
            const ui = TIERS_UI[t];
            return (
              <div
                key={t}
                className={`relative bg-white border ${ui.accent} rounded-2xl p-6 flex flex-col`}
              >
                {ui.recommended && (
                  <span className="absolute -top-2.5 left-4 text-[10px] uppercase tracking-wider bg-[#f0f7ff] text-[#005DB4] border border-[#005DB4] rounded px-2 py-0.5">
                    Recomendado
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
                <Link
                  href="/login"
                  className="mt-5 py-2 rounded-lg text-sm font-medium text-center bg-[#005DB4] hover:bg-[#0047a0] text-white"
                >
                  Empezar gratis
                </Link>
              </div>
            );
          })}
        </div>

        {/* Por qué Scale tiene cuota */}
        <div className="mt-10 bg-white border border-[#005DB4] rounded-2xl p-6">
          <h3 className="font-semibold mb-2">¿Por qué Scale tiene cuota mensual?</h3>
          <p className="text-sm text-[#6b7280]">
            A 1.000 transacciones mensuales con ticket promedio de $30, un comercio en Growth
            paga $210/mes en fees. Con Scale ($25 cuota + 0.5 %) paga $175/mes — un ahorro de $35
            que crece con el volumen. La cuota solo tiene sentido cuando ya hay flujo predecible;
            por eso no aparece en los tiers anteriores.
          </p>
        </div>

        {/* Cálculo del fee */}
        <div className="mt-8">
          <h3 className="font-semibold mb-2">¿Cómo se calcula el fee?</h3>
          <p className="text-sm text-[#6b7280] mb-5">
            El fee aplicado es el <strong>mayor</strong> entre el porcentaje del tier y el mínimo
            fijo. Esto protege al comercio en tickets grandes y garantiza un costo mínimo
            previsible en tickets chicos. El gas de la red Stellar está incluido — no hay cargo
            adicional.
          </p>

          <div className="overflow-x-auto bg-white border border-[#e5e7eb] rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#9ca3af] border-b border-[#e5e7eb]">
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium text-right">Monto cobrado</th>
                  <th className="px-5 py-3 font-medium text-right">Fee calculado</th>
                  <th className="px-5 py-3 font-medium text-right">Fee cobrado</th>
                  <th className="px-5 py-3 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLES.map((e, i) => (
                  <tr key={i} className="border-b border-[#e5e7eb] last:border-0">
                    <td className="px-5 py-3 font-medium text-[#1a1a1a]">{e.tier}</td>
                    <td className="px-5 py-3 text-right font-mono text-[#6b7280]">{e.monto}</td>
                    <td className="px-5 py-3 text-right font-mono text-[#6b7280]">{e.calculado}</td>
                    <td className="px-5 py-3 text-right font-mono text-[#1a1a1a]">{e.cobrado}</td>
                    <td className="px-5 py-3 text-[#6b7280] text-xs">{e.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5e7eb]">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Sin cuota de entrada · sin aprobación previa
          </h2>
          <p className="text-[#6b7280] mb-6">
            Creá tu cuenta y cobrá tu primer USDC el mismo día.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-semibold"
          >
            Empezar gratis
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
