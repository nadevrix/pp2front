'use client';

// Botón hamburguesa + drawer para menú mobile. Se usa en Nav (dashboard).
// Acepta una lista de links y opcionalmente acciones extra (logout, etc).
//
// IMPORTANTE — el drawer se renderiza vía createPortal a document.body.
// Razón: el <nav> contenedor usa backdrop-blur-xl, y eso crea un
// containing block para hijos position:fixed. Sin portal, el drawer
// quedaba encerrado en los 64px de altura del nav (bug visual: el
// menú aparecía cortado arriba, links inalcanzables).
// Renderizando a body, el fixed inset-0 cubre el viewport completo
// como corresponde.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface MobileMenuItem {
  href: string;
  label: string;
  /** Si está seteado, el item se marca como activo cuando el predicado matchea. */
  match?: (pathname: string) => boolean;
}

interface Props {
  items: MobileMenuItem[];
  /** Bloque opcional al pie del drawer (ej. botón salir, email del user). */
  footer?: React.ReactNode;
}

export default function MobileMenu({ items, footer }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Necesario para createPortal: en el primer render server-side no hay
  // document, así que sólo activamos el portal después del mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // Cerrar al cambiar de ruta (al hacer click en un link)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const drawer = (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Drawer derecho */}
      <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl flex flex-col">
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#e5e7eb]">
          <span className="font-semibold tracking-tight">Menú</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 -mr-2 rounded-lg hover:bg-[#f0f7ff] text-[#1a1a1a]"
            aria-label="Cerrar menú"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {items.map(i => {
            const active = i.match ? i.match(pathname) : pathname === i.href;
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`block px-5 py-3 text-base font-medium border-l-4 ${
                  active
                    ? 'border-[#005DB4] text-[#005DB4] bg-[#f0f7ff]'
                    : 'border-transparent text-[#1a1a1a] hover:bg-[#f0f7ff]'
                }`}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>

        {footer && (
          <div className="border-t border-[#e5e7eb] p-5">{footer}</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -mr-2 rounded-lg hover:bg-[#f0f7ff] text-[#1a1a1a]"
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Portal al body para escapar el backdrop-filter del <nav> padre,
          que sino confina al drawer dentro de los 64px del header. */}
      {open && mounted && createPortal(drawer, document.body)}
    </>
  );
}
