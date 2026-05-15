// Landing pública — sigue la propuesta comercial del PDF.
// Secciones (en orden):
//   1. Hero
//   2. Qué es Pollar (framing + métricas en producción)
//   3. Problema / Solución
//   4. Cómo funciona (5 pasos + casos especiales)
//   5. Propuesta de valor (tabla diferenciadores)
//   6. Comparación con alternativas
//   7. Proceso de activación
//   8. CTA final

import Link from 'next/link';
import PublicShell from '@/components/public/PublicShell';

export default function LandingPage() {
  return (
    <PublicShell>
      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background:
              'radial-gradient(800px 400px at 50% 0%, rgba(99,102,241,0.25), transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Disponible ahora
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5">
            Cobrá en <span className="text-indigo-400">dólares digitales</span>.<br />
            Recibí en segundos.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Pasarela de pagos en USDC sobre Stellar. Compatible con Binance, Meru, Lobstr y
            cualquier wallet Stellar. Sin bancos, sin esperas, sin horarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              Empezar gratis
            </Link>
            <Link
              href="/#como-funciona"
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
            >
              Ver cómo funciona
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            Sin cuota de entrada · sin aprobación previa · 50 primeras transacciones gratuitas.
          </p>
        </div>
      </section>

      {/* ── 2. UN SERVICIO, NO UN DESARROLLO ─────────────────────────────── */}
      <section className="border-y border-white/5 bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Un servicio, no un desarrollo a medida
          </h2>
          <p className="text-slate-300 mb-3">
            Te registrás en el dashboard como con Stripe o Mercado Pago. No comprás software ni
            infraestructura propia: accedés al servicio.
          </p>
          <p className="text-slate-400 text-sm">
            Pollar Pay construye, opera y actualiza la plataforma. Lo que el comercio obtiene
            es acceso — listo para cobrar el mismo día.
          </p>
        </div>
      </section>

      {/* ── 3. PROBLEMA / SOLUCIÓN ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-5">El problema</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                'Los pagos bancarios demoran 24 – 48 h en acreditarse — o más en fin de semana.',
                'Los bancos operan en horario restringido. Tu negocio, no.',
                'Las comisiones fijas afectan el margen en ventas de monto bajo.',
                'Cobrar de clientes fuera de Bolivia requiere infraestructura internacional que la mayoría no tiene.',
                'Los QR locales como Vendis cobran hasta 1 % y requieren un dispositivo físico. Solo funcionan con bancos locales — no aceptan crypto ni clientes del exterior.',
              ].map(t => (
                <li key={t} className="flex gap-2">
                  <span className="text-rose-400 shrink-0">✗</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-7">
            <h2 className="text-2xl font-bold tracking-tight mb-4 text-white">La solución</h2>
            <p className="text-slate-300 mb-4">
              Pollar Pay funciona con las apps que tus clientes ya tienen — Binance, Meru, Lobstr
              y cualquier wallet Stellar — sin intermediarios ni conversiones.
            </p>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2"><span className="text-emerald-400">1.</span> Mostrás un QR con el monto.</li>
              <li className="flex gap-2"><span className="text-emerald-400">2.</span> El cliente paga desde su wallet.</li>
              <li className="flex gap-2"><span className="text-emerald-400">3.</span> Confirmación on-screen en 3 – 5 s.</li>
              <li className="flex gap-2"><span className="text-emerald-400">4.</span> Fondos en tu wallet, automático.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* ── 4. CÓMO FUNCIONA ────────────────────────────────────────────── */}
      <section id="como-funciona" className="border-y border-white/5 bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight mb-3 text-center">Cómo funciona un cobro</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            El flujo completo — desde que el cliente decide pagar hasta que el dinero llega a tu
            wallet — ocurre en menos de 10 segundos.
          </p>

          <ol className="grid md:grid-cols-5 gap-4">
            {[
              { n: '01', t: 'Generás el QR', d: 'Desde el dashboard con el monto incluido. Mostrás en pantalla, imprimís o compartís por WhatsApp.' },
              { n: '02', t: 'El cliente escanea', d: 'Desde Binance, Meru, Lobstr o cualquier wallet Stellar. Sin Memo, sin registros adicionales.' },
              { n: '03', t: 'Stellar liquida', d: 'La blockchain confirma en 3 – 5 segundos. No interviene ningún banco. La liquidación es final.' },
              { n: '04', t: 'Confirmación en vivo', d: 'En el dashboard, sin necesidad de refrescar. Ves monto, hora y hash de la transacción.' },
              { n: '05', t: 'Fondos en tu wallet', d: 'El monto cobrado — menos el fee de Pollar Pay — llega automáticamente a tu wallet Stellar.' },
            ].map(s => (
              <li key={s.n} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="text-indigo-400 font-mono font-bold text-lg mb-2">{s.n}</div>
                <div className="font-semibold mb-1">{s.t}</div>
                <div className="text-xs text-slate-400">{s.d}</div>
              </li>
            ))}
          </ol>

          <div className="mt-12">
            <h3 className="font-semibold mb-4">Casos especiales que el sistema resuelve solo</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { t: 'Pago exacto', d: 'Transacción cerrada, wallet liberada para el siguiente cobro.' },
                { t: 'Pago parcial', d: 'El QR queda activo mostrando el saldo pendiente. Cualquiera lo completa.' },
                { t: 'Múltiples pagadores', d: 'Cada contribución se acumula hasta alcanzar el total.' },
                { t: 'Overpago', d: 'Cerrado como completado. El comercio recibe el 100 % del solicitado.' },
              ].map(c => (
                <div key={c.t} className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
                  <div className="font-medium text-sm mb-1">{c.t}</div>
                  <div className="text-xs text-slate-400">{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PROPUESTA DE VALOR ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight mb-3 text-center">Por qué Pollar Pay</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          No es otra pasarela que te pide confiar en una plataforma nueva. Es acceso directo a
          infraestructura blockchain probada, con compatibilidad concreta para el mercado boliviano.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { t: 'Compatible con wallets populares', d: 'El cliente paga desde Binance, Meru, Lobstr o cualquier wallet Stellar — la app que ya tiene, sin instalar nada nuevo.' },
            { t: 'Liquidación en segundos', d: 'Los fondos llegan en 3 – 5 segundos, 24/7. Sin esperar al día siguiente ni al horario bancario.' },
            { t: 'Sin cuenta bancaria', d: 'Solo necesitás una wallet Stellar. Sin formularios, sin aprobaciones, sin burocracia.' },
            { t: 'Fee competitivo', d: 'Desde 0.5 % en Scale, debajo del 1 % que cobran los QR locales. El gas de Stellar está incluido.' },
            { t: 'Pagos parciales y grupales', d: 'Un mismo cobro puede completarse entre varios pagadores. El sistema acumula hasta cerrar el monto.' },
            { t: 'Trazabilidad pública', d: 'Cada transacción tiene un hash verificable en Stellar Expert. Ningún servicio centralizado boliviano lo ofrece.' },
            { t: 'Registro en menos de 10 min', d: 'Alta inmediata, sin períodos de espera. Empezás a cobrar el mismo día.' },
            { t: 'On-chain de punta a punta', d: 'Construido directamente sobre Stellar. Tu wallet es real, los hashes son verificables, los fondos no pasan por intermediarios.' },
          ].map(v => (
            <div key={v.t} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 mt-0.5">✓</span>
                <div>
                  <div className="font-semibold mb-1">{v.t}</div>
                  <div className="text-sm text-slate-400">{v.d}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. COMPARATIVA ──────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight mb-3 text-center">Frente a otras opciones</h2>
          <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
            No reemplaza tu transferencia bancaria ni tu QR — los complementa para clientes que
            paguen en USDC o desde el exterior.
          </p>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="px-5 py-3 font-medium">Criterio</th>
                  <th className="px-5 py-3 font-medium">Transferencia bancaria</th>
                  <th className="px-5 py-3 font-medium">QR bancario</th>
                  <th className="px-5 py-3 font-medium text-indigo-300">Pollar Pay</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ['Tiempo de confirmación', '24 – 48 horas', '5 s – 5 min', '3 – 5 segundos'],
                  ['Disponibilidad', 'Horario bancario', '24/7 salvo mantenimiento', '24/7 sin excepciones'],
                  ['Wallets populares', 'No', 'No', 'Binance, Meru, Lobstr y más'],
                  ['Pagos desde el exterior', 'Complejo y costoso', 'No disponible', 'Cualquier país'],
                  ['Pagos parciales / grupales', 'No', 'No', 'Sí'],
                  ['Comisión al comercio', '0.5 – 1 % + fijo', '0 %', '0.5 – 0.9 %'],
                  ['Requiere cuenta bancaria', 'Sí', 'Sí', 'No'],
                  ['Fondos disponibles en', '24 – 48 horas', 'Variable', 'Inmediato en wallet propia'],
                ].map(row => (
                  <tr key={row[0]} className="border-b border-slate-800 last:border-0">
                    <td className="px-5 py-3 text-slate-200 font-medium">{row[0]}</td>
                    <td className="px-5 py-3 text-slate-400">{row[1]}</td>
                    <td className="px-5 py-3 text-slate-400">{row[2]}</td>
                    <td className="px-5 py-3 text-slate-100">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 7. ACTIVACIÓN ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight mb-3 text-center">Empezás en menos de 10 minutos</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Sin aprobación previa, sin cuenta bancaria, sin hardware. Solo necesitás email y una
          wallet Stellar (te enseñamos a crearla si no tenés).
        </p>

        <ol className="grid md:grid-cols-5 gap-4 mb-10">
          {[
            { n: '01', t: 'Registro', d: 'Email o Google. Sin aprobación previa.' },
            { n: '02', t: 'Configurás tu wallet', d: 'Si no tenés, te guiamos para crearla en Lobstr o Meru en 3 minutos.' },
            { n: '03', t: 'Personalizás tu perfil', d: 'Nombre del negocio, sucursales y monto por defecto.' },
            { n: '04', t: 'Prueba en testnet', d: 'Un pago de prueba sin dinero real para ver el flujo completo.' },
            { n: '05', t: 'Activación', d: 'Un click. A partir de ahí cualquier cliente te paga en USDC.' },
          ].map(s => (
            <li key={s.n} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-indigo-400 font-mono font-bold text-lg mb-2">{s.n}</div>
              <div className="font-semibold mb-1">{s.t}</div>
              <div className="text-xs text-slate-400">{s.d}</div>
            </li>
          ))}
        </ol>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5">
            <div className="text-sm font-semibold text-emerald-300 mb-3">Lo que necesitás</div>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Email para registrarte</li>
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Una wallet Stellar (gratuita, 3 minutos)</li>
              <li className="flex gap-2"><span className="text-emerald-400">✓</span> Teléfono o computadora con internet</li>
            </ul>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-slate-300 mb-3">Lo que NO necesitás</div>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li className="flex gap-2"><span className="text-rose-400">✗</span> Cuenta bancaria</li>
              <li className="flex gap-2"><span className="text-rose-400">✗</span> Aprobación de ninguna entidad</li>
              <li className="flex gap-2"><span className="text-rose-400">✗</span> Hardware o terminal POS</li>
              <li className="flex gap-2"><span className="text-rose-400">✗</span> Conocimiento técnico de blockchain</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 8. CTA FINAL ────────────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Listo para cobrar en USDC.
          </h2>
          <p className="text-slate-400 mb-8">
            Registro gratuito, sin cuota de entrada, sin aprobación previa. Tu primer cobro
            puede llegar en segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              Crear cuenta
            </Link>
            <Link
              href="/precios"
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
            >
              Ver precios
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

