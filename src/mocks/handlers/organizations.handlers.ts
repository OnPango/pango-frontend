import { findOrganizationBySlug } from '../db';
import { error, tenantOf } from '../guard';
import type { MockRoutes } from '../server';

/**
 * `GET /organizations/current` of pango-core: public, resolves the request's subdomain
 * (`X-Tenant`) so the login can tell apart an organization that does not exist.
 */
export const organizationsRoutes: MockRoutes = {
  'GET /organizations/current': () => {
    const subdomain = tenantOf();
    if (!subdomain) return error(400, 'TENANT_REQUIRED', 'The organization subdomain is required');
    const organization = findOrganizationBySlug(subdomain);
    if (!organization) return error(404, 'ORGANIZATION_NOT_FOUND', 'Organization not found');
    return { status: 200, data: { subdomain: organization.slug, legalName: organization.name } };
  },
};
