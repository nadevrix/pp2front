// Nav público para landing, /precios y /faq.
// Si hay sesión activa, muestra "Ir al dashboard" en vez de login/signup.

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export default async function PublicNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-[#e5e7eb] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.jpg" alt="Pollar Pay" width={36} height={36} priority className="rounded-lg" />
          <span className="font-semibold text-lg tracking-tight">Pollar Pay</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-[#6b7280] flex-1 justify-center">
          <Link href="/#como-funciona" className="hover:text-[#005DB4]">Cómo funciona</Link>
          <Link href="/precios" className="hover:text-[#005DB4]">Precios</Link>
          <Link href="/faq" className="hover:text-[#005DB4]">Preguntas</Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm px-3.5 py-1.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
            >
              Ir al dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm px-3 py-1.5 rounded-lg text-[#6b7280] hover:text-[#005DB4]"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="text-sm px-3.5 py-1.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
              >
                Empezar gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
