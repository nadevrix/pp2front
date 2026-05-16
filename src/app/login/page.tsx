'use client';

// Login con usuario + contraseña. El flujo está en UserAuth — esta página
// solo pasa el copy y captura ?next= si vino de un redirect del middleware.

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import UserAuth from '@/components/auth/UserAuth';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  return (
    <UserAuth
      mode="login"
      title="Iniciar sesión"
      subtitle="Entrá con tu usuario y contraseña."
      submitLabel="Entrar"
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
