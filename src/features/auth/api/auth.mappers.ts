import type { RegisterOrganizationValues } from '../types/auth.schema';
import type { RegisterOrganizationDto, RegisterOrganizationRequest } from '../types/auth';

const orNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** Form values → request: optional fields left empty become `undefined`. */
export function toRegisterOrganizationRequest(
  values: RegisterOrganizationValues,
): RegisterOrganizationRequest {
  return {
    adminName: values.adminName,
    adminEmail: values.adminEmail,
    password: values.password,
    organizationName: values.organizationName,
    workspaceSlug: values.workspaceSlug,
    taxId: orNull(values.taxId) ?? undefined,
    sector: values.sector,
    teamSize: values.teamSize,
    itemsRange: orNull(values.itemsRange) ?? undefined,
    country: values.country,
    city: orNull(values.city) ?? undefined,
    contactPhone: orNull(values.contactPhone) ?? undefined,
  };
}

/** Request → wire format (snake_case). */
export function toRegisterOrganizationDto(
  request: RegisterOrganizationRequest,
): RegisterOrganizationDto {
  return {
    organization: {
      name: request.organizationName.trim(),
      slug: request.workspaceSlug,
      tax_id: orNull(request.taxId),
      sector: request.sector,
      team_size: request.teamSize,
      items_range: orNull(request.itemsRange),
      country: request.country,
      city: orNull(request.city),
      contact_phone: orNull(request.contactPhone),
    },
    admin: {
      full_name: request.adminName.trim(),
      email: request.adminEmail.trim().toLowerCase(),
      password: request.password,
    },
    terms_accepted: true,
  };
}
