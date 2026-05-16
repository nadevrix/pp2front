// FAQ — preguntas exactas de la página 12 del PDF.
// Mantiene el tono y las respuestas tal cual la propuesta comercial.

import Link from 'next/link';
import PublicShell from '@/components/public/PublicShell';

const FAQS = [
  {
    q: '¿El USDC puede perder valor como el Bitcoin?',
    a: 'No. El USDC es un stablecoin respaldado 1:1 con dólares reales en cuentas reguladas en Estados Unidos. Su precio no fluctúa. Un USDC siempre equivale a un dólar.',
  },
  {
    q: '¿Cómo convierto los USDC a bolivianos?',
    a: 'Pollar Pay te entrega USDC. La conversión a BOB es decisión del comercio — puede hacerse a través de Binance P2P o redes de intercambio locales. Pollar Pay no interviene en este paso.',
  },
  {
    q: '¿Mis clientes necesitan instalar algo especial?',
    a: 'Solo necesitan Binance, Meru, Lobstr o cualquier wallet Stellar — apps gratuitas en iOS y Android. Si el cliente ya tiene alguna de estas, paga directamente sin instalar nada más.',
  },
  {
    q: '¿Qué sucede si hay un error en un pago?',
    a: 'Toda transacción queda registrada de forma permanente en la blockchain de Stellar con un hash verificable públicamente en Stellar Expert. El dashboard muestra el historial completo con todos los detalles.',
  },
  {
    q: '¿Puedo usar Pollar Pay junto con mis métodos de pago actuales?',
    a: 'Sí. Pollar Pay es complementario — no reemplaza las transferencias bancarias, el efectivo ni los QR bancarios. Se agrega como una opción adicional para clientes que paguen en USDC o desde el exterior.',
  },
  {
    q: '¿Qué pasa si Pollar deja de operar?',
    a: 'Las wallets son cuentas reales en la blockchain de Stellar. Los fondos del comercio son suyos y están en su wallet — Pollar no los custodia. En el peor escenario, el comercio conserva acceso total a sus fondos independientemente de Pollar.',
  },
];

export default function FAQPage() {
  return (
    <PublicShell>
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Preguntas frecuentes</h1>
        <p className="text-[#6b7280]">
          Si quedó alguna duda sin responder, escribinos desde el dashboard una vez creada tu cuenta.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="space-y-3">
          {FAQS.map(f => (
            <details
              key={f.q}
              className="group bg-white border border-[#e5e7eb] rounded-2xl px-6 py-5 open:border-[#005DB4]"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-semibold text-base pr-4">{f.q}</span>
                <span className="text-[#9ca3af] group-open:rotate-45 transition-transform shrink-0">+</span>
              </summary>
              <p className="text-sm text-[#6b7280] mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e5e7eb]">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">Empezá hoy</h2>
          <p className="text-[#6b7280] mb-6">
            Registro gratuito, sin aprobación previa, sin cuota de entrada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-semibold"
            >
              Iniciar con Google
            </Link>
            <Link
              href="/precios"
              className="px-6 py-3 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] font-medium"
            >
              Ver precios
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
