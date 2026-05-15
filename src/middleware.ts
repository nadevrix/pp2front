// ─── Auth middleware ────────────────────────────────────────────────────────
// Refresca el access_token en cada request y protege rutas privadas.
//
// Rutas públicas (no requieren sesión): landing, precios, FAQ, login/signup, auth callbacks.
// Cualquier otra ruta requiere sesión válida — sino redirige a /login.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const EXACT_PUBLIC = new Set(['/', '/precios', '/faq', '/login', '/signup']);
const PREFIX_PUBLIC = ['/auth'];

function isPublic(pathname: string): boolean {
  if (EXACT_PUBLIC.has(pathname)) return true;
  return PREFIX_PUBLIC.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Importante: no poner código entre createServerClient y getUser —
  // hace que el refresh de cookies se rompa. Ver docs de Supabase SSR.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Todo excepto assets estáticos y _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
