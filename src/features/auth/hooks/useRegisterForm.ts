import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api';
import type { SignupResult } from '@/core/auth/auth.types';
import { toSignupRequest } from '../api/auth.mappers';
import { useRegisterOrganization } from '../api/useRegisterOrganization';
import { getAuthErrorMessage } from '../lib/auth.errors';
import { slugify } from '../lib/register.rules';
import {
  ACCOUNT_STEP_FIELDS,
  registerOrganizationSchema,
  type RegisterOrganizationValues,
} from '../types/auth.schema';

export type RegisterStep = 'account' | 'company' | 'done';

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
 * State and rules of the two-step owner sign-up (CU-13 / US-001): one form, validated step by step,
 * with the subdomain derived from the company name. The page only renders what this returns.
 */
export function useRegisterForm() {
  const registration = useRegisterOrganization();
  const form = useForm<RegisterOrganizationValues>({
    resolver: zodResolver(registerOrganizationSchema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  });

  const [step, setStep] = useState<RegisterStep>('account');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [result, setResult] = useState<SignupResult | null>(null);
  /** Bumped on every rejected attempt so the form can play its "shake" again. */
  const [rejections, setRejections] = useState(0);
  /** Once the person edits the address by hand, stop overwriting it from the company name. */
  const subdomainEditedByHand = useRef(false);

  const { control, setValue, setError, trigger, handleSubmit } = form;
  const password = useWatch({ control, name: 'password' });
  const subdomain = useWatch({ control, name: 'subdomain' });

  const reject = () => setRejections((count) => count + 1);

  const onLegalNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (subdomainEditedByHand.current) return;
    setValue('subdomain', slugify(event.target.value), { shouldDirty: true });
  };

  const onSubdomainChange = (event: ChangeEvent<HTMLInputElement>) => {
    subdomainEditedByHand.current = event.target.value !== '';
    setValue('subdomain', slugify(event.target.value), { shouldDirty: true, shouldValidate: true });
  };

  const continueToCompany = async () => {
    const valid = await trigger(ACCOUNT_STEP_FIELDS, { shouldFocus: true });
    if (!valid) return reject();
    setDirection('forward');
    setStep('company');
  };

  const goBack = () => {
    registration.reset();
    setDirection('back');
    setStep('account');
  };

  const finish = handleSubmit((values) => {
    registration.mutate(toSignupRequest(values), {
      onSuccess: (outcome) => {
        setResult(outcome);
        setDirection('forward');
        setStep('done');
      },
      onError: (error) => {
        reject();
        const mapped = FIELD_ERRORS[getApiErrorCode(error) ?? ''];
        if (!mapped) return;
        setError(mapped.field, { message: getAuthErrorMessage(error, '') }, { shouldFocus: true });
        setDirection(mapped.step === 'account' ? 'back' : 'forward');
        setStep(mapped.step);
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
    direction,
    rejections,
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
