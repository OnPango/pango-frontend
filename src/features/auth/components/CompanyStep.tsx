import type { ChangeEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FiArrowLeft, FiHome } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Reveal } from '@/shared/ui/components/Reveal';
import {
  COUNTRY_OPTIONS,
  PRODUCT_COUNT_OPTIONS,
  BUSINESS_SECTOR_OPTIONS,
  TEAM_SIZE_OPTIONS,
} from '../content/registration.options';
import type { RegisterOrganizationValues } from '../types/auth.schema';
import { WorkspaceAddressField } from './WorkspaceAddressField';

interface CompanyStepProps {
  form: UseFormReturn<RegisterOrganizationValues>;
  isSubmitting: boolean;
  onBack: () => void;
  onLegalNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubdomainChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const STAGGER_MS = 50;

/** Step 2: the organization, its workspace address and where it operates. */
export function CompanyStep({
  form,
  isSubmitting,
  onBack,
  onLegalNameChange,
  onSubdomainChange,
}: CompanyStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <Reveal>
        <h1 className="text-3xl leading-tight font-bold">Cuéntanos de tu empresa</h1>
        <p className="mt-1.5 text-muted">
          Con esto preparamos tu espacio propio. Lo creamos en cuanto confirmes tu correo.
        </p>
      </Reveal>

      <Reveal delay={STAGGER_MS}>
        <TextBox
          label="Nombre de tu empresa"
          required
          autoComplete="organization"
          placeholder="Ej.: Distribuidora del Caribe"
          error={errors.legalName?.message}
          {...register('legalName', { onChange: onLegalNameChange })}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 2}>
        <WorkspaceAddressField
          error={errors.subdomain?.message}
          {...register('subdomain', { onChange: onSubdomainChange })}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 3}>
        <TextBox
          label="NIT o ID tributario"
          optional
          autoComplete="off"
          placeholder="Ej.: 901.234.567-8"
          error={errors.taxId?.message}
          {...register('taxId')}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 4} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          control={control}
          name="businessSector"
          label="Sector"
          required
          placeholder="Selecciona…"
          options={BUSINESS_SECTOR_OPTIONS}
        />
        <FormSelect
          control={control}
          name="teamSize"
          label="Tamaño del equipo"
          required
          placeholder="Selecciona…"
          options={TEAM_SIZE_OPTIONS}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 5}>
        <FormSelect
          control={control}
          name="productCount"
          label="¿Cuántos productos manejas, más o menos?"
          required
          placeholder="Selecciona…"
          hint="Nos ayuda a preparar tu importación de historial."
          options={PRODUCT_COUNT_OPTIONS}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 6} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          control={control}
          name="country"
          label="País"
          required
          options={COUNTRY_OPTIONS}
        />
        <TextBox
          label="Ciudad"
          required
          autoComplete="address-level2"
          placeholder="Ej.: Barranquilla"
          error={errors.city?.message}
          {...register('city')}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 7}>
        <TextBox
          label="Teléfono de contacto"
          optional
          type="tel"
          autoComplete="tel"
          placeholder="+57 300 000 0000"
          error={errors.contactPhone?.message}
          {...register('contactPhone')}
        />
      </Reveal>

      <Reveal
        delay={STAGGER_MS * 8}
        className="flex items-start gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm leading-relaxed"
      >
        <FiHome aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <span>
          Tu espacio se crea al <b>confirmar tu correo</b>. Hasta entonces tus datos quedan
          guardados y nadie más puede usar esa dirección.
        </span>
      </Reveal>

      <Reveal delay={STAGGER_MS * 9} className="flex gap-3">
        <Button type="button" variant="outline" size="lg" className="gap-2" onClick={onBack}>
          <FiArrowLeft aria-hidden />
          Atrás
        </Button>
        <Button type="submit" size="lg" className="flex-1" isLoading={isSubmitting}>
          Crear mi cuenta
        </Button>
      </Reveal>
    </div>
  );
}
