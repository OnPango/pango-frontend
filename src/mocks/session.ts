/**
 * Simulates the session cookie the real backend sets with `Set-Cookie`.
 *
 * The real cookie is `HttpOnly; Secure; SameSite=Lax`, so JS can never read it. The browser does not
 * let JS create an HttpOnly cookie, so this one is readable — it only exists so that the session
 * survives a page reload while mocking, just like the real one.
 */

const COOKIE_NAME = 'pango_session';
const MAX_AGE_SECONDS = 8 * 60 * 60;

interface SessionPayload {
  /** User id. */
  sub: string;
  /** Expiration, epoch ms. */
  exp: number;
}

const encode = (payload: SessionPayload) => btoa(JSON.stringify(payload));

function decode(token: string): SessionPayload | null {
  try {
    const payload = JSON.parse(atob(token)) as Partial<SessionPayload>;
    return typeof payload.sub === 'string' && typeof payload.exp === 'number'
      ? { sub: payload.sub, exp: payload.exp }
      : null;
  } catch {
    return null;
  }
}

function readCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const raw of cookies) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(`${COOKIE_NAME}=`)) {
      return decodeURIComponent(trimmed.slice(COOKIE_NAME.length + 1));
    }
  }
  return null;
}

/** Equivalent of the backend's `Set-Cookie: pango_session=<jwt>; Max-Age=28800; ...`. */
export function issueSession(userId: string): void {
  const token = encode({ sub: userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** Equivalent of the backend validating the cookie of the incoming request. */
export function readSession(): SessionPayload | null {
  const token = readCookie();
  if (!token) return null;
  const payload = decode(token);
  return payload && payload.exp > Date.now() ? payload : null;
}

/** Equivalent of `Set-Cookie: pango_session=; Max-Age=0`. */
export function destroySession(): void {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
