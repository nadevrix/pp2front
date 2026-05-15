import { redirect } from 'next/navigation';

export default function NewProjectRedirect() {
  redirect('/dashboard/sucursales/nueva');
}
