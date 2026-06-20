import { SignJWT, jwtVerify } from 'jose';

// Dev-only fallback so local development works without config. In production
// a strong JWT_SECRET is REQUIRED — otherwise anyone could forge sessions.
const DEV_FALLBACK = 'timeos-dev-only-insecure-secret-change-me-000000';
let warnedWeakSecret = false;

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET no está configurado o es demasiado corto. Define un JWT_SECRET ' +
        'fuerte (≥32 caracteres) en el entorno antes de desplegar en producción.'
      );
    }
    if (!warnedWeakSecret) {
      warnedWeakSecret = true;
      console.warn('[auth] JWT_SECRET ausente o débil — usando un fallback INSEGURO solo para desarrollo. Define JWT_SECRET.');
    }
    return new TextEncoder().encode(DEV_FALLBACK);
  }
  return new TextEncoder().encode(secret);
};

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
