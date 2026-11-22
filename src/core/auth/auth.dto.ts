/**
 * Bodies of the backend's auth contract (`docs/auth.md` in pango-core), next to the functions that
 * send them (`auth.api.ts`). Only `auth.api.ts` and `auth.mappers.ts` know these shapes: the rest of
 * the app works with the domain types (`User`, `Session`…). If the contract changes, adjust it here.
 */

export interface RoleGrantDto {
  id: number;
  name: string;
  isSystem: boolean;
  warehouse: { id: number; name: string } | null;
  permissions: string[];
}

/** Body of `GET /auth/me`. */
export interface SessionProfileDto {
  account: { id: number; email: string; name: string };
  organization: { id: number; subdomain: string; legalName: string };
  user: { id: number; jobTitle: string | null; roles: RoleGrantDto[] };
}

/**
 * Body of login, refresh, invitation acceptance and the sign-up of a verified account. No token is
 * here: the access and refresh tokens only travel in HttpOnly cookies.
 */
export interface SessionResponseDto extends SessionProfileDto {
  /** Access token lifetime in seconds. */
  expiresIn: number;
  /** When the refresh cookie (the session) ends. */
  refreshTokenExpiresAt: string;
}

/** `POST /auth/login` */
export type LoginDto = { email: string; password: string };

/**
 * `202` of `POST /auth/login` and `POST /auth/login/resend`: the password was right and a code was
 * emailed. The pending login travels in the HttpOnly cookie `pango_login_<subdomain>`.
 */
export type LoginCodeRequiredDto = {
  codeRequired: true;
  /** Masked address the code went to: `a**@miempresa.co`. */
  email: string;
  codeLength: number;
  /** When the current code stops working. */
  expiresAt: string;
  /** From when `POST /auth/login/resend` sends another code. */
  resendAvailableAt: string;
  /** False if the email could not be sent; resending retries. */
  emailSent: boolean;
  /** After the code, this browser is not asked again for this many hours (0: every time)… */
  trustedDeviceHours: number;
  /** …or for this many days with `rememberDevice`. */
  rememberDeviceDays: number;
};

/** The second step is asked for, unless the backend has it turned off: then the session. */
export type LoginResponseDto = LoginCodeRequiredDto | SessionResponseDto;

/** `POST /auth/login/verify` */
export type VerifyLoginCodeDto = {
  code: string;
  /** Do not ask for the code on this browser for `rememberDeviceDays`. */
  rememberDevice?: boolean;
};

/** `POST /auth/signup`: the owner and the organization created with the account. */
export type SignupDto = {
  name: string;
  email: string;
  password: string;
  organization: {
    legalName: string;
    /** Organization subdomain: `<subdomain>.onpango.com`. */
    subdomain: string;
    /** ISO 3166-1 alpha-2 code. */
    country: string;
    city: string;
    businessSector: string;
    teamSize: string;
    productCount: string;
    taxId?: string;
    contactPhone?: string;
  };
};

/** `POST /auth/signup` for a new account: no session until the email is confirmed. */
export type VerificationRequiredDto = {
  verificationRequired: true;
  email: string;
  organization: { subdomain: string };
  /** False if the email could not be sent; resending retries. */
  verificationEmailSent: boolean;
};

/** A new account must confirm its email first; a verified one gets a session right away. */
export type SignupResponseDto = VerificationRequiredDto | SessionResponseDto;

/** `GET /invitations/preview` */
export type InvitationPreviewDto = {
  email: string;
  organization: { subdomain: string; legalName: string };
  invitedBy: string;
  expiresAt: string;
  /** False: the form asks for a name and a new password. True: the current password. */
  hasAccount: boolean;
};

/** `POST /invitations/accept` */
export type AcceptInvitationDto = {
  token: string;
  /** Required when the invited email has no account yet. */
  name?: string;
  password: string;
};
