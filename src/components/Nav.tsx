import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { displayName } from '@/lib/auth-username';
import NavLinks from './NavLinks';

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userLabel = displayName(user?.email);

  return (
    <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.jpg" alt="Pollar Pay" width={36} height={36} priority className="rounded-lg" />
          <span className="font-semibold text-lg tracking-tight">Pollar Pay</span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-3 shrink-0">
          {userLabel && (
            <span className="text-sm text-slate-400 hidden md:inline truncate max-w-[200px] font-mono">{userLabel}</span>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
