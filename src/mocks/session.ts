/**
 * Simulates the backend's tokens: a short-lived access JWT and a rotating opaque refresh token.
 *
 * The "JWT" here is just base64 JSON (a mock, nothing is signed). Neither token is ever put in a
 * response body: like the real API they go into HttpOnly cookies, which this file imitates with two
 * private "cookie jars" (one cookie per organization, as `pango_access_<subdomain>` and
 * `pango_refresh_<subdomain>`). The app never reads them; the mock handlers read them for the
 * request, the way the browser would attach them. The jars and the token table live in
 * `localStorage` so a reload keeps the session and rotation / reuse detection work.
 */

const ACCESS_TTL_SECONDS = 900;
const REFRESH_TTL_DAYS = 30;
const REFRESH_STORAGE_KEY = 'pango_mock_refresh_tokens_v1';
const COOKIE_JAR_KEY = 'pango_mock_cookie_jar_v1';
const ACCESS_JAR_KEY = 'pango_mock_access_jar_v1';

interface AccessPayload {
  /** User id. */
  sub: string;
  /** Organization id. */
  org: string;
  /** Expiration, epoch ms. */
  exp: number;
}

interface RefreshRecord {
  userId: string;
  orgId: string;
  exp: number;
  revoked: boolean;
}

const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');

function loadRefreshTokens(): Record<string, RefreshRecord> {
  try {
    return JSON.parse(localStorage.getItem(REFRESH_STORAGE_KEY) ?? '{}') as Record<
      string,
      RefreshRecord
    >;
  } catch {
    return {};
  }
}

const saveRefreshTokens = (tokens: Record<string, RefreshRecord>) => {
  try {
    localStorage.setItem(REFRESH_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Storage unavailable: refresh tokens last until the page closes.
  }
};

function loadJar(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_JAR_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

const saveJar = (jar: Record<string, string>) => {
  try {
    localStorage.setItem(COOKIE_JAR_KEY, JSON.stringify(jar));
  } catch {
    // Storage unavailable: the cookie lasts until the page closes.
  }
};

function loadAccessJar(): Record<string, AccessPayload> {
  try {
    return JSON.parse(localStorage.getItem(ACCESS_JAR_KEY) ?? '{}') as Record<
      string,
      AccessPayload
    >;
  } catch {
    return {};
  }
}

const saveAccessJar = (jar: Record<string, AccessPayload>) => {
  try {
    localStorage.setItem(ACCESS_JAR_KEY, JSON.stringify(jar));
  } catch {
    // Storage unavailable: the cookie lasts until the page closes.
  }
};

/** The refresh cookie the browser would attach for `subdomain`, or null. */
export function readRefreshCookie(subdomain: string): string | null {
  return loadJar()[subdomain] ?? null;
}

/** Equivalent of `Set-Cookie: pango_refresh_<subdomain>=; Max-Age=0` (and the access cookie too). */
export function clearSessionCookies(subdomain: string): void {
  const jar = loadJar();
  delete jar[subdomain];
  saveJar(jar);
  const access = loadAccessJar();
  delete access[subdomain];
  saveAccessJar(access);
}

export interface IssuedTokens {
  expiresIn: number;
  /** When the refresh cookie ends. The token itself never leaves the cookie. */
  refreshTokenExpiresAt: string;
}

/**
 * Equivalent of the backend creating a session for `userId` in `orgId`: returns the body fields and
 * "sets" the access and refresh cookies of `subdomain`.
 */
export function issueTokens(userId: string, orgId: string, subdomain: string): IssuedTokens {
  const payload: AccessPayload = {
    sub: userId,
    org: orgId,
    exp: Date.now() + ACCESS_TTL_SECONDS * 1000,
  };
  const refreshToken = randomToken();
  const refreshExp = Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
  const tokens = loadRefreshTokens();
  tokens[refreshToken] = { userId, orgId, exp: refreshExp, revoked: false };
  saveRefreshTokens(tokens);
  saveJar({ ...loadJar(), [subdomain]: refreshToken });
  saveAccessJar({ ...loadAccessJar(), [subdomain]: payload });
  return {
    expiresIn: ACCESS_TTL_SECONDS,
    refreshTokenExpiresAt: new Date(refreshExp).toISOString(),
  };
}

/**
 * Equivalent of the backend verifying the `pango_access_<subdomain>` cookie. An expired cookie is
 * "dropped" by the browser, so it reads as missing.
 */
export function readAccessCookie(subdomain: string | null): AccessPayload | null {
  const payload = subdomain ? loadAccessJar()[subdomain] : undefined;
  return payload && payload.exp > Date.now() ? payload : null;
}

/**
 * Rotates a refresh token: the old one is revoked. Presenting an already revoked one is treated as
 * theft and revokes every token of that user, exactly like the real backend.
 */
export function consumeRefreshToken(token: string): { userId: string; orgId: string } | null {
  const tokens = loadRefreshTokens();
  const record = tokens[token];
  if (!record || record.exp <= Date.now()) return null;
  if (record.revoked) {
    for (const other of Object.values(tokens)) {
      if (other.userId === record.userId) other.revoked = true;
    }
    saveRefreshTokens(tokens);
    return null;
  }
  record.revoked = true;
  saveRefreshTokens(tokens);
  return { userId: record.userId, orgId: record.orgId };
}

/** Equivalent of `POST /auth/logout`: revokes the token (unknown tokens are ignored). */
export function revokeRefreshToken(token: string): void {
  const tokens = loadRefreshTokens();
  if (tokens[token]) {
    tokens[token].revoked = true;
    saveRefreshTokens(tokens);
  }
}
