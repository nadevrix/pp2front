// Nav público para landing, /precios y /faq.
// Si hay sesión activa, muestra "Ir al dashboard" en vez de login/signup.

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import MobileMenu from '@/components/MobileMenu';

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

        <div className="hidden md:flex items-center gap-6 text-sm text-[#6b7280] flex-1 justify-center">
          {PUBLIC_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-[#005DB4]">
              {l.label}
            </Link>
          ))}
        </div>

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
                className="hidden sm:inline-block text-sm px-3 py-1.5 rounded-lg text-[#6b7280] hover:text-[#005DB4]"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="text-sm px-3 py-1.5 sm:px-3.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
              >
                <span className="sm:hidden">Empezar</span>
                <span className="hidden sm:inline">Empezar gratis</span>
              </Link>
            </>
          )}

          <MobileMenu
            items={PUBLIC_LINKS}
            footer={
              user ? (
                <Link
                  href="/dashboard"
                  className="block w-full text-center text-sm px-3 py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
                >
                  Ir al dashboard
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block w-full text-center text-sm px-3 py-2.5 rounded-lg bg-[#f0f7ff] text-[#005DB4] font-medium"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full text-center text-sm px-3 py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
                  >
                    Empezar gratis
                  </Link>
                </div>
              )
            }
          />
        </div>
      </div>
    </nav>
  );
}
