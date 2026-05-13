import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">P</div>
          <span className="font-semibold text-lg tracking-tight">
            Pollar Pay <span className="text-slate-400 font-normal text-sm">for Merchants</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="text-sm text-slate-400 hidden sm:inline">{user.email}</span>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
