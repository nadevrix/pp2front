// Signup con OTP — mismo flujo que login. signInWithOtp con shouldCreateUser:true
// crea el usuario si no existe, así que el comercio queda registrado al verificar
// el primer código. Sin password que recordar.

import OtpAuth from '@/components/auth/OtpAuth';

export default function SignupPage() {
  return (
    <OtpAuth
      title="Crear cuenta"
      subtitle="Te enviamos un código de 6 dígitos para empezar a cobrar en USDC."
      submitLabel="Crear cuenta"
      altLink={{ href: '/login', label: 'Iniciá sesión', cta: '¿Ya tenés cuenta?' }}
    />
  );
}
