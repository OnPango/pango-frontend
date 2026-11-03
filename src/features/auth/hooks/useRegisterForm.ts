import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getApiErrorMessage } from '@/core/api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { toRegisterOrganizationRequest } from '../api/auth.mappers';
import { useRegisterOrganization } from '../api/useRegisterOrganization';
import { useWorkspaceAvailability } from '../api/useWorkspaceAvailability';
import { getWorkspaceStatus, slugify } from '../lib/register.rules';
import {
  ACCOUNT_STEP_FIELDS,
  registerOrganizationSchema,
  type RegisterOrganizationValues,
} from '../types/auth.schema';

export type RegisterStep = 'account' | 'company' | 'done';

const DEFAULT_VALUES: RegisterOrganizationValues = {
  adminName: '',
  adminEmail: '',
  password: '',
  acceptTerms: false,
  organizationName: '',
  workspaceSlug: '',
  taxId: '',
  sector: '',
  teamSize: '',
  itemsRange: '',
  country: 'CO',
  city: '',
  contactPhone: '',
};

/**
 * State and rules of the two-step registration (CU-13 / US-001): one form, validated step by step,
 * with the workspace address derived from the company name and checked for availability as you type.
 * The page only renders what this returns.
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
  /** Bumped on every rejected attempt so the form can play its "shake" again. */
  const [rejections, setRejections] = useState(0);
  /** Once the person edits the address by hand, stop overwriting it from the company name. */
  const slugEditedByHand = useRef(false);

  const { control, setValue, setError, trigger, handleSubmit } = form;
  const password = useWatch({ control, name: 'password' });
  const adminEmail = useWatch({ control, name: 'adminEmail' });
  const slug = useWatch({ control, name: 'workspaceSlug' });

  const checkedSlug = useDebouncedValue(slug, 400);
  const availability = useWorkspaceAvailability(checkedSlug);
  const workspaceStatus = getWorkspaceStatus({
    slug,
    checkedSlug,
    isFetching: availability.isFetching,
    isError: availability.isError,
    available: availability.data,
  });

  const reject = () => setRejections((count) => count + 1);

  const onOrganizationNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (slugEditedByHand.current) return;
    setValue('workspaceSlug', slugify(event.target.value), { shouldDirty: true });
  };

  const onWorkspaceSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    slugEditedByHand.current = event.target.value !== '';
    setValue('workspaceSlug', slugify(event.target.value), {
      shouldDirty: true,
      shouldValidate: true,
    });
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
    if (workspaceStatus === 'taken') {
      setError('workspaceSlug', { message: 'Esa dirección ya está en uso. Prueba con otra.' });
      return reject();
    }
    registration.mutate(toRegisterOrganizationRequest(values), {
      onSuccess: () => {
        setDirection('forward');
        setStep('done');
      },
      onError: reject,
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
    adminEmail,
    slug,
    workspaceStatus,
    isSubmitting: registration.isPending,
    serverError: registration.isError
      ? getApiErrorMessage(registration.error, 'No se pudo registrar la organización.')
      : null,
    submit,
    goBack,
    onOrganizationNameChange,
    onWorkspaceSlugChange,
  };
}
