import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { displayName } from '@/lib/auth-username';
import NavLinks, { DASHBOARD_LINKS } from './NavLinks';
import MobileMenu from './MobileMenu';

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userLabel = displayName(user?.email);

  return (
    <nav className="border-b border-[#e5e7eb] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.jpg" alt="Pollar Pay" width={32} height={32} priority className="rounded-lg sm:w-9 sm:h-9" />
          <span className="font-semibold text-base sm:text-lg tracking-tight">Pollar Pay</span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-3 shrink-0">
          {userLabel && (
            <span className="text-sm text-[#6b7280] hidden lg:inline truncate max-w-[200px] font-mono">{userLabel}</span>
          )}
          <form action="/auth/signout" method="post" className="hidden md:block">
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] transition-colors"
            >
              Salir
            </button>
          </form>

          <MobileMenu
            items={DASHBOARD_LINKS}
            footer={
              <div className="space-y-3">
                {userLabel && (
                  <div className="text-xs text-[#9ca3af] font-mono truncate">{userLabel}</div>
                )}
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full text-sm px-3 py-2 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            }
          />
        </div>
      </div>
    </nav>
  );
}
