/**
 * Simulates the backend's second login step (`public.login_challenges` and the HttpOnly cookie
 * `pango_login_<subdomain>`): the same limits and the same reuse of a code sent within the
 * cooldown. The "email" goes to the browser console. Kept in `localStorage`, so a reload in the
 * middle of a login keeps it pending.
 */

const STORAGE_KEY = 'pango_mock_login_challenges_v1';
const COOKIE_JAR_KEY = 'pango_mock_login_cookie_jar_v1';
const DEVICE_JAR_KEY = 'pango_mock_trusted_devices_v1';

export const LOGIN_CODE_LENGTH = 6;
const TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_SENDS = 5;
/** `LOGIN_TRUSTED_DEVICE_HOURS` / `LOGIN_REMEMBER_DEVICE_DAYS` (pango-core's defaults). */
const TRUSTED_DEVICE_HOURS = 12;
const REMEMBER_DEVICE_DAYS = 30;

interface ChallengeRecord {
  userId: string;
  subdomain: string;
  code: string;
  attempts: number;
  sendCount: number;
  expiresAt: number;
  lastSentAt: number;
  consumed: boolean;
}

export interface ChallengeState {
  codeRequired: true;
  email: string;
  codeLength: number;
  expiresAt: string;
  resendAvailableAt: string;
  emailSent: boolean;
  trustedDeviceHours: number;
  rememberDeviceDays: number;
}

/** A failed step, with the backend's code and extra fields. */
export type ChallengeFailure = {
  status: number;
  code: string;
  message: string;
  extra?: Record<string, number>;
};

function load<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, T>;
  } catch {
    return {};
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the login stays pending until the page closes.
  }
}

const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');

const randomCode = () =>
  String(crypto.getRandomValues(new Uint32Array(1))[0] % 10 ** LOGIN_CODE_LENGTH).padStart(
    LOGIN_CODE_LENGTH,
    '0',
  );

export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  return `${local[0]}${'*'.repeat(Math.min(Math.max(local.length - 1, 1), 3))}${email.slice(at)}`;
}

function toState(record: ChallengeRecord, email: string, emailSent = true): ChallengeState {
  return {
    codeRequired: true,
    email: maskEmail(email),
    codeLength: LOGIN_CODE_LENGTH,
    expiresAt: new Date(record.expiresAt).toISOString(),
    resendAvailableAt: new Date(record.lastSentAt + RESEND_COOLDOWN_MS).toISOString(),
    emailSent,
    trustedDeviceHours: TRUSTED_DEVICE_HOURS,
    rememberDeviceDays: REMEMBER_DEVICE_DAYS,
  };
}

/**
 * The `pango_device_<subdomain>` cookie: after a code, this browser logs in to that organization
 * with that account without another code, until the trust expires. Logging out keeps it.
 */
export function trustDevice(subdomain: string, userId: string, remember: boolean) {
  const devices = load<{ userId: string; expiresAt: number }>(DEVICE_JAR_KEY);
  const ms = remember ? REMEMBER_DEVICE_DAYS * 86_400_000 : TRUSTED_DEVICE_HOURS * 3_600_000;
  devices[subdomain] = { userId, expiresAt: Date.now() + ms };
  save(DEVICE_JAR_KEY, devices);
}

export function isTrustedDevice(subdomain: string, userId: string): boolean {
  const trust = load<{ userId: string; expiresAt: number }>(DEVICE_JAR_KEY)[subdomain];
  return trust?.userId === userId && trust.expiresAt > Date.now();
}

const sendCode = (email: string, subdomain: string, code: string) =>
  console.info(`[mock] Código de inicio de sesión para ${email} (${subdomain}): ${code}`);

const setCookie = (subdomain: string, token: string | null) => {
  const jar = load<string>(COOKIE_JAR_KEY);
  if (token) jar[subdomain] = token;
  else delete jar[subdomain];
  save(COOKIE_JAR_KEY, jar);
};

/** Equivalent of `Set-Cookie: pango_login_<subdomain>=; Max-Age=0`. */
export const clearLoginCookie = (subdomain: string) => setCookie(subdomain, null);

/** After the password: emails a code, or keeps the one sent within the cooldown. */
export function startLoginChallenge(
  user: { id: string; email: string },
  subdomain: string,
): ChallengeState {
  const now = Date.now();
  const challenges = load<ChallengeRecord>(STORAGE_KEY);
  const token = randomToken();
  const pending = Object.entries(challenges).filter(
    ([, c]) => c.userId === user.id && c.subdomain === subdomain && !c.consumed,
  );
  const recent = pending.find(
    ([, c]) => c.expiresAt > now && c.lastSentAt > now - RESEND_COOLDOWN_MS,
  );
  if (recent) {
    const [oldToken, record] = recent;
    delete challenges[oldToken];
    challenges[token] = record;
    save(STORAGE_KEY, challenges);
    setCookie(subdomain, token);
    return toState(record, user.email);
  }

  for (const [, c] of pending) c.consumed = true;
  const record: ChallengeRecord = {
    userId: user.id,
    subdomain,
    code: randomCode(),
    attempts: 0,
    sendCount: 1,
    expiresAt: now + TTL_MS,
    lastSentAt: now,
    consumed: false,
  };
  challenges[token] = record;
  save(STORAGE_KEY, challenges);
  setCookie(subdomain, token);
  sendCode(user.email, subdomain, record.code);
  return toState(record, user.email);
}

const invalid = (): ChallengeFailure => ({
  status: 401,
  code: 'LOGIN_CHALLENGE_INVALID',
  message: 'This login is no longer pending; log in again',
});

function pendingOf(subdomain: string) {
  const challenges = load<ChallengeRecord>(STORAGE_KEY);
  const token = load<string>(COOKIE_JAR_KEY)[subdomain];
  const record = token ? challenges[token] : undefined;
  if (!record || record.consumed || record.subdomain !== subdomain) return null;
  return { challenges, record };
}

/** `POST /auth/login/verify`: the user id when the code is right. */
export function verifyLoginChallenge(
  subdomain: string,
  code: string,
): { userId: string } | ChallengeFailure {
  const pending = pendingOf(subdomain);
  if (!pending) {
    clearLoginCookie(subdomain);
    return invalid();
  }
  const { challenges, record } = pending;
  if (record.expiresAt <= Date.now()) {
    return { status: 401, code: 'LOGIN_CODE_EXPIRED', message: 'The code has expired' };
  }
  if (code !== record.code) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      record.consumed = true;
      save(STORAGE_KEY, challenges);
      clearLoginCookie(subdomain);
      return {
        status: 401,
        code: 'LOGIN_CODE_ATTEMPTS_EXCEEDED',
        message: 'Too many wrong codes; log in again',
      };
    }
    save(STORAGE_KEY, challenges);
    return {
      status: 401,
      code: 'LOGIN_CODE_INVALID',
      message: 'The code is not correct',
      extra: { attemptsLeft: MAX_ATTEMPTS - record.attempts },
    };
  }
  record.consumed = true;
  save(STORAGE_KEY, challenges);
  clearLoginCookie(subdomain);
  return { userId: record.userId };
}

/** `POST /auth/login/resend`: a new code after the cooldown, up to the limit. */
export function resendLoginChallenge(
  subdomain: string,
  email: (userId: string) => string | undefined,
): ChallengeState | ChallengeFailure {
  const pending = pendingOf(subdomain);
  const address = pending && email(pending.record.userId);
  if (!pending || !address) {
    clearLoginCookie(subdomain);
    return invalid();
  }
  const { challenges, record } = pending;
  const now = Date.now();
  const wait = record.lastSentAt + RESEND_COOLDOWN_MS - now;
  if (wait > 0) {
    return {
      status: 429,
      code: 'LOGIN_CODE_RESEND_TOO_SOON',
      message: 'Wait before requesting another code',
      extra: { retryAfterSeconds: Math.ceil(wait / 1000) },
    };
  }
  if (record.sendCount >= MAX_SENDS) {
    clearLoginCookie(subdomain);
    return {
      status: 429,
      code: 'LOGIN_CODE_RESEND_LIMIT',
      message: 'No more codes can be sent for this login; log in again',
    };
  }
  record.code = randomCode();
  record.attempts = 0;
  record.sendCount += 1;
  record.expiresAt = now + TTL_MS;
  record.lastSentAt = now;
  save(STORAGE_KEY, challenges);
  sendCode(address, subdomain, record.code);
  return toState(record, address);
}
