// Footer público — copy de la última página del PDF (contacto + framing).

import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">P</div>
            <span className="font-semibold text-lg tracking-tight">Pollar Pay</span>
          </div>
          <p className="text-sm text-slate-400 max-w-xs">
            Pasarela de pagos en USDC sobre Stellar. Compatible con Binance, Meru, Lobstr y más.
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Producto</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#como-funciona" className="text-slate-300 hover:text-white">Cómo funciona</Link></li>
            <li><Link href="/precios" className="text-slate-300 hover:text-white">Precios</Link></li>
            <li><Link href="/faq" className="text-slate-300 hover:text-white">Preguntas frecuentes</Link></li>
            <li><Link href="/signup" className="text-slate-300 hover:text-white">Crear cuenta</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Contacto</div>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="mailto:hola@pollar.xyz" className="text-slate-300 hover:text-white">
                hola@pollar.xyz
              </a>
            </li>
            <li>
              <a href="https://pollar.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white">
                pollar.xyz ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} Pollar Pay — Servicio de cobros USDC sobre Stellar.</div>
          <div>Registro gratuito · sin cuota de entrada · sin aprobación previa.</div>
        </div>
      </div>
    </footer>
  );
}
