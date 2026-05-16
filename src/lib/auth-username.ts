// Helpers para mostrar el "nombre" del usuario logueado en la UI.
//
// Con Google OAuth el email es real (`alguien@gmail.com`). Si en algún momento
// volvemos a un dominio sintético, este helper deja de tocarlo y devuelve el
// email tal cual — el componente que llame decide cómo mostrarlo.

export function displayName(emailOrNull: string | null | undefined): string {
  if (!emailOrNull) return '';
  return emailOrNull;
}
