import type { SessionResponseDto } from '@/core/auth/user.mappers';

export type LoginRequest = {
  email: string;
  password: string;
};

/** `POST /auth/login` body. No token: the backend sends it as an httpOnly cookie (`Set-Cookie`). */
export type LoginResponseDto = SessionResponseDto;

/** What the backend needs to create an organization together with its first administrator. */
export type RegisterOrganizationRequest = {
  adminName: string;
  adminEmail: string;
  password: string;
  organizationName: string;
  /** Subdomain of the organization's workspace: `<slug>.onpango.com`. */
  workspaceSlug: string;
  taxId?: string;
  sector: string;
  teamSize: string;
  itemsRange?: string;
  country: string;
  city?: string;
  contactPhone?: string;
};

/** `POST /auth/register` body. The whole thing is created in one operation or not at all. */
export type RegisterOrganizationDto = {
  organization: {
    name: string;
    slug: string;
    tax_id: string | null;
    sector: string;
    team_size: string;
    items_range: string | null;
    country: string;
    city: string | null;
    contact_phone: string | null;
  };
  admin: { full_name: string; email: string; password: string };
  terms_accepted: true;
};

/** `GET /auth/workspaces/:slug/availability` */
export type WorkspaceAvailabilityDto = {
  available: boolean;
};
