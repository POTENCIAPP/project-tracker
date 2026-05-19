/**
 * lib/auth.ts
 * ----------------------------------------------------------------------------
 * Auth de CLIENTES (los que ven un dashboard). Sin dependencias: solo el
 * módulo `crypto` de Node.
 *
 *  - Password: hash scrypt con salt por usuario (nunca se guarda en claro).
 *  - Sesión: token firmado con HMAC-SHA256 -> `<payloadB64>.<sigB64>`.
 *            El payload lleva { u: usuario, s: slug, exp }. No se puede
 *            falsificar sin el secreto del servidor.
 *
 * El secreto sale de SESSION_SECRET, y si no está, se deriva de ADMIN_TOKEN
 * (ya es un secreto fuerte en el entorno). Si no hay ninguno -> falla cerrado.
 * ----------------------------------------------------------------------------
 */

import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_TOKEN;
  if (!s) throw new Error('Auth sin configurar: falta SESSION_SECRET/ADMIN_TOKEN.');
  // Clave dedicada a sesiones (deriva del secreto, no lo usa tal cual).
  return createHmac('sha256', s).update('pt:session:v1').digest('hex');
}

/* ===== Password ========================================================== */

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    const [scheme, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(plain, Buffer.from(saltHex, 'hex'), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* ===== Sesión firmada ===================================================== */

export interface Session {
  u: string; // username
  s: string; // slug del proyecto al que tiene acceso
  exp: number; // epoch ms
}

const b64 = (b: Buffer) => b.toString('base64url');

export function signSession(username: string, slug: string): string {
  const payload: Session = { u: username, s: slug, exp: Date.now() + SESSION_TTL_MS };
  const p = b64(Buffer.from(JSON.stringify(payload)));
  const sig = b64(createHmac('sha256', secret()).update(p).digest());
  return `${p}.${sig}`;
}

export function verifySession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [p, sig] = token.split('.');
  if (!p || !sig) return null;
  const expected = createHmac('sha256', secret()).update(p).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }
  try {
    const s = JSON.parse(Buffer.from(p, 'base64url').toString()) as Session;
    if (!s.u || !s.s || typeof s.exp !== 'number' || s.exp < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

/** Extrae el token del header Authorization: Bearer <token>. */
export function bearer(req: { headers: Record<string, unknown> }): string | null {
  const h = req.headers['authorization'] || req.headers['Authorization'];
  if (typeof h !== 'string') return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
