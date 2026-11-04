import type { SessionResponseDto } from '@/core/auth/user.mappers';

export type LoginRequest = {
  email: string;
  password: string;
};

/** `POST /auth/login` body. */
export type LoginDto = { email: string; password: string };

/** What the owner sign-up form collects. */
export type SignupRequest = {
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

/** `POST /auth/signup` body. Same shape as the request: the API already speaks camelCase. */
export type SignupDto = SignupRequest;

/** `POST /auth/signup` for a new account: no session until the email is confirmed. */
export type VerificationRequiredDto = {
  verificationRequired: true;
  email: string;
  organization: { subdomain: string };
  /** False if the email could not be sent; resending retries. */
  verificationEmailSent: boolean;
};

export type SignupResponseDto = VerificationRequiredDto | SessionResponseDto;

/** Outcome of an owner sign-up, as the UI needs it. */
export type SignupResult =
  /** New account: the organization exists but the owner must confirm the email first. */
  | { kind: 'verification'; email: string; subdomain: string; emailSent: boolean }
  /** Existing verified account: the organization is ready, log in on its subdomain. */
  | { kind: 'ready'; email: string; subdomain: string };

/** `GET /invitations/preview` */
export type InvitationPreviewDto = {
  email: string;
  organization: { subdomain: string; legalName: string };
  invitedBy: string;
  expiresAt: string;
  /** False: the form asks for a name and a new password. True: the current password. */
  hasAccount: boolean;
};

export type AcceptInvitationRequest = {
  token: string;
  /** Required when the invited email has no account yet. */
  name?: string;
  password: string;
};
