// Nav público para landing, /precios y /faq.
// Si hay sesión activa, muestra "Ir al dashboard" en vez de login/signup.
//
// Mobile: sin hamburguesa. El menú hamburguesa es chrome de dashboard
// (post-login) — meterlo en la landing confunde porque parece app interna.
// Los links públicos (Cómo funciona, Precios, FAQ) viven solo en el footer
// para mobile; en desktop aparecen también en la nav central.

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

const PUBLIC_LINKS = [
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/precios', label: 'Precios' },
  { href: '/faq', label: 'Preguntas frecuentes' },
];

export default async function PublicNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-[#e5e7eb] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.jpg" alt="Pollar Pay" width={32} height={32} priority className="rounded-lg sm:w-9 sm:h-9" />
          <span className="font-semibold text-base sm:text-lg tracking-tight">Pollar Pay</span>
        </Link>

        {/* Links públicos — solo en desktop. En mobile están en el footer. */}
        <div className="hidden md:flex items-center gap-6 text-sm text-[#6b7280] flex-1 justify-center">
          {PUBLIC_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-[#005DB4]">
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTAs — visibles siempre, condensados en mobile */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm px-3 py-1.5 sm:px-3.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
            >
              <span className="sm:hidden">Dashboard</span>
              <span className="hidden sm:inline">Ir al dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm px-2.5 py-1.5 sm:px-3 rounded-lg text-[#6b7280] hover:text-[#005DB4]"
              >
                <span className="sm:hidden">Entrar</span>
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Link>
              <Link
                href="/login"
                className="text-sm px-3 py-1.5 sm:px-3.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
              >
                <span className="sm:hidden">Empezar</span>
                <span className="hidden sm:inline">Empezar gratis</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
