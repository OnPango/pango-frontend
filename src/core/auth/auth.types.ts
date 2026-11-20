import type { User } from './user';

/** What logging in, renewing or accepting an invitation gives the app. */
export type Session = {
  user: User;
  /** When the session ends (the refresh cookie's expiry). */
  expiresAt: string;
};

/** A login waiting for the code emailed after the password. */
export type LoginChallenge = {
  /** Masked address the code went to. */
  email: string;
  codeLength: number;
  expiresAt: string;
  resendAvailableAt: string;
  /** False if the email could not be sent: offer to send it again. */
  emailSent: boolean;
};

/** Outcome of the password step. */
export type LoginResult =
  { kind: 'session'; session: Session } | { kind: 'code'; challenge: LoginChallenge };

/** Outcome of an owner sign-up, as the UI needs it. */
export type SignupResult =
  /** New account: the organization exists but the owner must confirm the email first. */
  | { kind: 'verification'; email: string; subdomain: string; emailSent: boolean }
  /** Existing verified account: the organization is ready, log in on its subdomain. */
  | { kind: 'ready'; email: string; subdomain: string };

/** What the accept page shows before the form is submitted. */
export type InvitationPreview = {
  email: string;
  organization: { subdomain: string; legalName: string };
  invitedBy: string;
  expiresAt: string;
  /** False: the form asks for a name and a new password. True: the current password. */
  hasAccount: boolean;
};
