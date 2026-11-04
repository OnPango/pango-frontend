/** Outcome of an owner sign-up, as the UI needs it. */
export type SignupResult =
  /** New account: the organization exists but the owner must confirm the email first. */
  | { kind: 'verification'; email: string; subdomain: string; emailSent: boolean }
  /** Existing verified account: the organization is ready, log in on its subdomain. */
  | { kind: 'ready'; email: string; subdomain: string };
