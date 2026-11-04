import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FiArrowRight } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import { Checkbox } from '@/shared/ui/components/form/Checkbox';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Reveal } from '@/shared/ui/components/Reveal';
import type { RegisterOrganizationValues } from '../types/auth.schema';
import { PasswordStrength } from './PasswordStrength';

interface AccountStepProps {
  form: UseFormReturn<RegisterOrganizationValues>;
  password: string;
}

const STAGGER_MS = 60;

/** Step 1: who the administrator is, their password and the terms. */
export function AccountStep({ form, password }: AccountStepProps) {
  const {
    register,
    formState: { errors },
  } = form;
  const rulesId = useId();

  return (
    <div className="space-y-5">
      <Reveal>
        <h1 className="text-3xl leading-tight font-bold">Crea tu cuenta</h1>
        <p className="mt-1.5 text-muted">
          Serás el administrador de tu empresa. Después invitas a tu equipo.
        </p>
      </Reveal>

      <Reveal delay={STAGGER_MS}>
        <TextBox
          label="Tu nombre"
          required
          autoComplete="name"
          placeholder="Nombre y apellido"
          error={errors.name?.message}
          {...register('name')}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 2}>
        <TextBox
          label="Correo de trabajo"
          required
          type="email"
          autoComplete="email"
          placeholder="tu@empresa.co"
          error={errors.email?.message}
          {...register('email')}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 3} className="space-y-3">
        <TextBox
          label="Contraseña"
          required
          type="password"
          autoComplete="new-password"
          placeholder="Crea una contraseña"
          aria-describedby={rulesId}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordStrength id={rulesId} password={password} />
      </Reveal>

      <Reveal delay={STAGGER_MS * 4}>
        <Checkbox
          label={
            <>
              Acepto los{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                términos de uso
              </a>{' '}
              y la{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                política de privacidad
              </a>
              .
            </>
          }
          error={errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />
      </Reveal>

      <Reveal delay={STAGGER_MS * 5}>
        <Button type="submit" size="lg" className="group w-full gap-2.5">
          Continuar
          <FiArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
        </Button>
      </Reveal>
    </div>
  );
}
