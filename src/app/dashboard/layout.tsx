import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Onboarding gate: si el merchant no eligió plan todavía, mandalo a
  // /onboarding/plan. Hacemos un select directo a profiles para evitar el
  // roundtrip al backend desde el server component.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();
    // maybeSingle puede devolver null si el trigger handle_new_user no corrió todavía.
    // En ese caso asumimos onboarding pendiente y redirigimos.
    if (!profile || profile.onboarding_completed === false) {
      redirect('/onboarding/plan');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
