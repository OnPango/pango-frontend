import { useRef, type ChangeEvent } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import { slugify } from '@/core/tenant/tenant';
import type { RegisterOrganizationValues } from '../types/auth.schema';

/**
 * Keeps the workspace address in step with the company name until the person types their own.
 * Once they edit the address by hand, the company name stops overwriting it (clearing the address
 * hands control back).
 */
export function useSubdomainSuggestion(setValue: UseFormSetValue<RegisterOrganizationValues>) {
  const editedByHand = useRef(false);

  const onLegalNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (editedByHand.current) return;
    setValue('subdomain', slugify(event.target.value), { shouldDirty: true });
  };

  const onSubdomainChange = (event: ChangeEvent<HTMLInputElement>) => {
    editedByHand.current = event.target.value !== '';
    setValue('subdomain', slugify(event.target.value), { shouldDirty: true, shouldValidate: true });
  };

  return { onLegalNameChange, onSubdomainChange };
}
