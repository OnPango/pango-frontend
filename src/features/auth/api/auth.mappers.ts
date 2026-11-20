import type { SignupDto } from '@/core/auth/auth.dto';
import type { RegisterOrganizationValues } from '../types/auth.schema';

const orUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

/** Form values → request: optional fields left empty are omitted. */
export function toSignupRequest(values: RegisterOrganizationValues): SignupDto {
  return {
    name: values.name,
    email: values.email,
    password: values.password,
    organization: {
      legalName: values.legalName,
      subdomain: values.subdomain,
      country: values.country,
      city: values.city,
      businessSector: values.businessSector,
      teamSize: values.teamSize,
      productCount: values.productCount,
      taxId: orUndefined(values.taxId),
      contactPhone: orUndefined(values.contactPhone),
    },
  };
}
