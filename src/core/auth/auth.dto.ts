import type { SessionResponseDto } from './user.mappers';

/**
 * Bodies of the backend's auth endpoints (`docs/auth.md` in pango-core), next to the functions that
 * send them (`auth.api.ts`). The session shapes live in `user.mappers.ts`.
 */

/** `POST /auth/login` */
export type LoginDto = { email: string; password: string };

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
