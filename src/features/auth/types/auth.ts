import type { SessionResponseDto } from '@/core/auth/user.mappers';

export type LoginRequest = {
  email: string;
  password: string;
};

/** `POST /auth/login` body. No token: the backend sends it as an httpOnly cookie (`Set-Cookie`). */
export type LoginResponseDto = SessionResponseDto;

/** What the backend needs to create an organization together with its first administrator. */
export type RegisterOrganizationRequest = {
  organizationName: string;
  taxId: string;
  contactPhone: string;
  adminName: string;
  adminEmail: string;
  password: string;
};

/** `POST /auth/register` body. The whole thing is created in one operation or not at all. */
export type RegisterOrganizationDto = {
  organization: { name: string; tax_id: string; contact_phone: string };
  admin: { full_name: string; email: string; password: string };
};
