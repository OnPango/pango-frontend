import type { SessionResponseDto } from '@/core/auth/user.mappers';
import type { RegisterOrganizationValues } from '../types/auth.schema';
import type { SignupRequest, SignupResponseDto, SignupResult } from '../types/auth';

const orUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

/** Form values → request: optional fields left empty are omitted. */
export function toSignupRequest(values: RegisterOrganizationValues): SignupRequest {
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

const isSession = (dto: SignupResponseDto): dto is SessionResponseDto =>
  !('verificationRequired' in dto);

/**
 * The API answers with a session when the email already belonged to a verified account. That
 * session is for a subdomain this page is not on, so it is dropped: the owner logs in there.
 */
export function toSignupResult(dto: SignupResponseDto, request: SignupRequest): SignupResult {
  if (isSession(dto)) {
    return { kind: 'ready', email: dto.account.email, subdomain: dto.organization.subdomain };
  }
  return {
    kind: 'verification',
    email: dto.email,
    subdomain: dto.organization.subdomain || request.organization.subdomain,
    emailSent: dto.verificationEmailSent,
  };
}
