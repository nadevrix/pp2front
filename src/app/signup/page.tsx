// Con Google OAuth no hay paso de signup separado — el primer login con
// Google crea el usuario en Supabase automáticamente. Mantengo esta ruta
// solo para no romper links viejos y redirigir al login.

import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/login');
}
