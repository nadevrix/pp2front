// Login con Google OAuth. El botón está en GoogleSignIn; esta página
// solo arma el layout (2 columnas con un preview decorativo a la derecha)
// y lee ?next= / ?error= de la URL.

import { Suspense } from 'react';
import Image from 'next/image';
import GoogleSignIn from '@/components/auth/GoogleSignIn';

const ERROR_COPY: Record<string, string> = {
  missing_code: 'Google no devolvió un código de autorización. Intentá de nuevo.',
  oauth_failed: 'No pudimos completar el inicio de sesión. Intentá de nuevo.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: nextParam, error: errorParam } = await searchParams;
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';
  const initialError = errorParam ? ERROR_COPY[errorParam] ?? 'Error de autenticación.' : null;

  return (
    <div className="min-h-screen bg-white flex">
      {/* IZQ: form */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 lg:px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <Image
              src="/logo.jpg"
              alt="Pollar Pay"
              width={40}
              height={40}
              priority
              className="rounded-lg"
            />
            <span className="font-semibold text-xl tracking-tight text-[#1a1a1a]">
              Pollar Pay
            </span>
          </div>

          <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight leading-tight mb-2">
            Empezá a cobrar con <span className="text-[#005DB4]">Pollar</span>
          </h1>
          <p className="text-sm text-[#6b7280] mb-8">
            Iniciá sesión para gestionar tu comercio, pagos y billeteras.
          </p>

          <Suspense fallback={null}>
            <GoogleSignIn next={next} initialError={initialError} />
          </Suspense>

          <p className="text-xs text-[#9ca3af] mt-8 leading-relaxed">
            Al continuar aceptás nuestros términos de servicio. Nunca publicamos en tu
            nombre ni accedemos a tu correo.
          </p>
        </div>
      </section>

      {/* DER: preview decorativo (solo lg+) */}
      <section
        className="hidden lg:flex flex-1 min-h-screen items-center justify-center p-8"
        style={{
          background:
            'linear-gradient(135deg, #001a3a 0%, #003a7a 50%, #005DB4 100%)',
        }}
      >
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white">
          <div className="flex">
            <aside className="w-14 bg-[#f0f7ff] border-r border-[#e5e7eb] flex flex-col items-center py-4 gap-4">
              <div className="w-8 h-8 rounded-full bg-[#005DB4]" />
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-lg bg-[#e5e7eb]" />
                ))}
              </div>
            </aside>
            <div className="flex-1 p-5 min-w-0">
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">Pagos</h2>
              <div className="flex gap-0 mb-4">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-medium text-[#005DB4] border-b-2 border-[#005DB4]"
                >
                  Resumen
                </button>
                <button type="button" className="px-3 py-1.5 text-sm font-medium text-[#6b7280]">
                  Transacciones
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-[#e5e7eb] p-3 bg-white">
                  <p className="text-xs text-[#6b7280] mb-1">Balance USDC</p>
                  <p className="text-2xl font-bold text-[#1a1a1a]">12,480</p>
                  <p className="text-xs text-emerald-600 mt-1">▲ +8.2%</p>
                </div>
                <div className="rounded-lg border border-[#e5e7eb] p-3 bg-white">
                  <p className="text-xs text-[#6b7280] mb-1">Pagos hoy</p>
                  <p className="text-2xl font-bold text-[#1a1a1a]">37</p>
                  <p className="text-xs text-emerald-600 mt-1">▲ +12%</p>
                </div>
              </div>
              <div className="rounded-lg border border-[#e5e7eb] p-3 bg-white">
                <p className="text-sm font-semibold text-[#1a1a1a] mb-2">
                  Volumen de pagos
                </p>
                <div className="h-24 flex items-end gap-0.5">
                  {[40, 65, 45, 70, 55, 80, 60, 85, 75, 90, 70, 95, 82, 88].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 min-w-0 rounded-t bg-[#005DB4]/30"
                        style={{ height: `${h}%` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
