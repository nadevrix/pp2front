// Auth por usuario + contraseña — sin email real.
//
// Supabase Auth pide email obligatorio en auth.users. Como no queremos
// involucrar email real (rate limits del SMTP gratis, links que se rompen,
// templates que configurar), usamos un email SINTÉTICO con dominio
// `@pollar.local` que jamás se envía a ningún lado.
//
// El user escribe su username; nosotros lo combinamos con el dominio fake
// para hablar con Supabase. Al render lo desenvolvemos para no mostrar el
// dominio en la UI.

/** Dominio sintético — no resuelve, no se manda mail nunca. */
export const SYNTHETIC_DOMAIN = '@pollar.local';

/** Regla del username — lo que el comercio puede tipear. */
export const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;

export function isValidUsername(u: string): boolean {
    return USERNAME_RE.test(u.trim().toLowerCase());
}

/** Convierte `alice` → `alice@pollar.local` para entregárselo a Supabase. */
export function usernameToSyntheticEmail(username: string): string {
    return `${username.trim().toLowerCase()}${SYNTHETIC_DOMAIN}`;
}

/**
 * Si el email almacenado en Supabase termina con `@pollar.local`, devolvemos
 * solo el username. Cualquier otro email se devuelve tal cual.
 */
export function displayName(emailOrNull: string | null | undefined): string {
    if (!emailOrNull) return '';
    if (emailOrNull.endsWith(SYNTHETIC_DOMAIN)) {
        return emailOrNull.slice(0, -SYNTHETIC_DOMAIN.length);
    }
    return emailOrNull;
}
