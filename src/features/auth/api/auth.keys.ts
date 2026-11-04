export const authKeys = {
  all: ['auth'] as const,
  emailVerification: (token: string) => [...authKeys.all, 'email-verification', token] as const,
  invitationPreview: (token: string) => [...authKeys.all, 'invitation-preview', token] as const,
};
