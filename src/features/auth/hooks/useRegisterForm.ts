import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api';
import type { SignupResult } from '@/core/auth/auth.types';
import { toSignupRequest } from '../api/auth.mappers';
import { useRegisterOrganization } from '../api/useRegisterOrganization';
import { getAuthErrorMessage } from '../lib/auth.errors';
import {
  ACCOUNT_STEP_FIELDS,
  registerOrganizationSchema,
  type RegisterOrganizationValues,
} from '../types/auth.schema';
import { useRegisterWizard, type RegisterStep } from './useRegisterWizard';
import { useSubdomainSuggestion } from './useSubdomainSuggestion';

const DEFAULT_VALUES: RegisterOrganizationValues = {
  name: '',
  email: '',
  password: '',
  acceptTerms: false,
  legalName: '',
  subdomain: '',
  taxId: '',
  businessSector: '',
  teamSize: '',
  productCount: '',
  country: 'CO',
  city: '',
  contactPhone: '',
};

/** Server rejections that belong to one field: show them there and go back to the step that has it. */
const FIELD_ERRORS: Record<
  string,
  { field: keyof RegisterOrganizationValues; step: Exclude<RegisterStep, 'done'> }
> = {
  EMAIL_TAKEN: { field: 'password', step: 'account' },
  SUBDOMAIN_TAKEN: { field: 'subdomain', step: 'company' },
  SUBDOMAIN_INVALID: { field: 'subdomain', step: 'company' },
  TAX_ID_TAKEN: { field: 'taxId', step: 'company' },
};

/**
 * Two-step owner sign-up (CU-13 / US-001): one form, validated step by step. It joins the form, the
 * wizard (`useRegisterWizard`), the address suggestion (`useSubdomainSuggestion`) and the request,
 * and decides what a server rejection means. The page only renders what this returns.
 */
export function useRegisterForm() {
  const registration = useRegisterOrganization();
  const wizard = useRegisterWizard();
  const form = useForm<RegisterOrganizationValues>({
    resolver: zodResolver(registerOrganizationSchema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  });
  const { control, setValue, setError, trigger, handleSubmit } = form;
  const { onLegalNameChange, onSubdomainChange } = useSubdomainSuggestion(setValue);
  const [result, setResult] = useState<SignupResult | null>(null);

  const password = useWatch({ control, name: 'password' });
  const subdomain = useWatch({ control, name: 'subdomain' });
  const { step, goTo, reject } = wizard;

  const continueToCompany = async () => {
    const valid = await trigger(ACCOUNT_STEP_FIELDS, { shouldFocus: true });
    if (!valid) return reject();
    goTo('company');
  };

  const goBack = () => {
    registration.reset();
    goTo('account');
  };

  const finish = handleSubmit((values) => {
    registration.mutate(toSignupRequest(values), {
      onSuccess: (outcome) => {
        setResult(outcome);
        goTo('done');
      },
      onError: (error) => {
        reject();
        const mapped = FIELD_ERRORS[getApiErrorCode(error) ?? ''];
        if (!mapped) return;
        setError(mapped.field, { message: getAuthErrorMessage(error, '') }, { shouldFocus: true });
        goTo(mapped.step);
        // The field now explains the problem; a banner on top would say it twice.
        registration.reset();
      },
    });
  }, reject);

  /** Enter on step 1 moves forward; on step 2 it creates the account. */
  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (step === 'account') {
      event.preventDefault();
      return continueToCompany();
    }
    return finish(event);
  };

  return {
    form,
    step,
    direction: wizard.direction,
    rejections: wizard.rejections,
    password,
    subdomain,
    result,
    isSubmitting: registration.isPending,
    serverError: registration.isError
      ? getAuthErrorMessage(registration.error, 'No se pudo registrar la organización.')
      : null,
    submit,
    goBack,
    onLegalNameChange,
    onSubdomainChange,
  };
}
