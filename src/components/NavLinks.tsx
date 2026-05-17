'use client';

// Links de la nav resaltados según la ruta activa. Cliente porque usa usePathname.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const DASHBOARD_LINKS = [
  { href: '/dashboard', label: 'Inicio', match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/cobrar', label: 'Cobrar', match: (p: string) => p.startsWith('/dashboard/cobrar') },
  { href: '/dashboard/movimientos', label: 'Movimientos', match: (p: string) => p.startsWith('/dashboard/movimientos') },
  { href: '/dashboard/sucursales', label: 'Sucursales', match: (p: string) => p.startsWith('/dashboard/sucursales') },
  { href: '/dashboard/plan', label: 'Plan', match: (p: string) => p.startsWith('/dashboard/plan') },
  { href: '/dashboard/avanzado', label: 'Avanzado', match: (p: string) => p.startsWith('/dashboard/avanzado') },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-1 flex-1">
      {DASHBOARD_LINKS.map(l => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              active
                ? 'bg-[#f0f7ff] text-[#005DB4] font-medium'
                : 'text-[#6b7280] hover:text-[#005DB4] hover:bg-[#f0f7ff]'
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
