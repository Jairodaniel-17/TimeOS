// Lightweight in-memory rate limiter (sliding fixed-window) for auth endpoints.
// Per-instance — fine for self-hosted single-instance deployments. For
// horizontal scale, back this with a shared store (Redis) keyed the same way.

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds until the window resets (when blocked)
  remaining: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  // Escape hatch para entornos de prueba/carga (e2e hace muchos logins desde la
  // misma IP). APAGADO por defecto: producción mantiene el rate-limit intacto.
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    return { ok: true, retryAfter: 0, remaining: limit };
  }

  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
  if (store.size > 5000) {
    for (const [k, b] of store) if (now > b.resetAt) store.delete(k);
  }

  const b = store.get(key);
  if (!b || now > b.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000), remaining: 0 };
  }
  b.count++;
  return { ok: true, retryAfter: 0, remaining: limit - b.count };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
