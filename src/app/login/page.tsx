'use client';

// Login con OTP de 6 dígitos. El flujo está en OtpAuth — esta página solo
// pasa el copy y captura el ?next= si vino de un redirect del middleware.

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OtpAuth from '@/components/auth/OtpAuth';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  return (
    <OtpAuth
      title="Iniciar sesión"
      subtitle="Te mandamos un código de 6 dígitos al email."
      submitLabel="Enviar código"
      altLink={{ href: '/signup', label: 'Registrate', cta: '¿Aún no tenés cuenta?' }}
      next={next}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
