import type { User } from './user';

/** What logging in, renewing or accepting an invitation gives the app. */
export type Session = {
  user: User;
  /** Short-lived Bearer token. Memory only: never written to storage. */
  accessToken: string;
  /** When the session ends (the refresh cookie's expiry). */
  expiresAt: string;
};

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
