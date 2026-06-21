import { headers } from 'next/headers';

/**
 * Multi-tenancy — contexto de organización del request actual.
 *
 * El middleware verifica el JWT y reenvía `x-org-id` (la org del usuario) como
 * header de la request. El data layer (`luma-docs.ts`) lo lee desde aquí para
 * scopear TODAS las lecturas/escrituras por organización, sin tener que pasar
 * `orgId` por parámetro en cada ruta.
 *
 * Devuelve `null` cuando no hay request en contexto (scripts, seed por
 * `/api/init`) o cuando la sesión no trae org. El data layer trata ese caso
 * como fail-closed en las lecturas de colección (no devuelve datos de nadie).
 */
export async function currentOrgId(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get('x-org-id') || null;
  } catch {
    // Fuera de un scope de request (p.ej. ejecutado desde un script).
    return null;
  }
}

/**
 * Id del usuario autenticado del request (header `x-user-id` que inyecta el
 * middleware desde el JWT verificado). `null` fuera de un request. Úsalo en vez
 * de confiar en un `userId` que venga del body/query del cliente.
 */
export async function currentUserId(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get('x-user-id') || null;
  } catch {
    return null;
  }
}
