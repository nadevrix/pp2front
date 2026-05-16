// Signup con usuario + contraseña — sin email real.

import UserAuth from '@/components/auth/UserAuth';

export default function SignupPage() {
  return (
    <UserAuth
      mode="signup"
      title="Crear cuenta"
      subtitle="Elegí un usuario y una contraseña para empezar a cobrar en USDC."
      submitLabel="Crear cuenta"
      altLink={{ href: '/login', label: 'Iniciá sesión', cta: '¿Ya tenés cuenta?' }}
    />
  );
}
