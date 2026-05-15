'use client';

// Links de la nav resaltados según la ruta activa. Cliente porque usa usePathname.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Inicio', match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/cobrar', label: 'Cobrar', match: (p: string) => p.startsWith('/dashboard/cobrar') },
  { href: '/dashboard/movimientos', label: 'Movimientos', match: (p: string) => p.startsWith('/dashboard/movimientos') },
  { href: '/dashboard/sucursales', label: 'Sucursales', match: (p: string) => p.startsWith('/dashboard/sucursales') },
  { href: '/dashboard/avanzado', label: 'Avanzado', match: (p: string) => p.startsWith('/dashboard/avanzado') },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-1 flex-1">
      {LINKS.map(l => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              active
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
