import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '@/core/api';
import type { LoginRedirectState } from '@/core/auth/guards';
import { Logo } from '@/shared/ui/Logo';
import { Button } from '@/shared/ui/components/Button';
import { TextField } from '@/shared/ui/components/form/TextField';
import { useRegisterOrganization } from '../api/useRegisterOrganization';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { registerOrganizationSchema, type RegisterOrganizationValues } from '../types/auth.schema';

/** CU-13 / US-001: register an organization together with its first administrator. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const registration = useRegisterOrganization();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterOrganizationValues>({
    resolver: zodResolver(registerOrganizationSchema),
    mode: 'onTouched',
    defaultValues: {
      organizationName: '',
      taxId: '',
      contactPhone: '',
      adminName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    registration.mutate(
      {
        organizationName: values.organizationName,
        taxId: values.taxId,
        contactPhone: values.contactPhone,
        adminName: values.adminName,
        adminEmail: values.adminEmail,
        password: values.password,
      },
      {
        onSuccess: () => {
          const state: LoginRedirectState = { registeredEmail: values.adminEmail };
          navigate('/login', { replace: true, state });
        },
      },
    );
  });

  const error = registration.isError
    ? getApiErrorMessage(registration.error, 'No se pudo registrar la organización.')
    : null;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <AuthBackdrop />

      {/* Only this layer scrolls, so the full-width decoration behind it never causes a horizontal scrollbar. */}
      <div className="absolute inset-0 z-50 overflow-y-auto">
        <main className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center gap-6 p-5">
          <section className="flex items-center gap-4 xl:hidden">
            <Logo width="50" height="50" />
            <div className="flex flex-col gap-1">
              <h2 className="text-5xl font-bold tracking-wider">PANGO</h2>
              <p className="text-muted">Más control, mejores decisiones</p>
            </div>
          </section>

          <form
            noValidate
            onSubmit={onSubmit}
            className="w-full space-y-6 rounded-4xl border border-line2 bg-surface px-6 py-8 shadow-lg sm:px-12"
          >
            <div className="space-y-5">
              <h4 className="text-md m-0 font-light tracking-wide">REGISTRA TU ORGANIZACIÓN</h4>
              <div className="w-9 border-3 border-b border-primary" />
              <section className="-space-y-1 text-xl">
                <h2>Crea tu entorno en Pango</h2>
                <h2>y tu primer administrador</h2>
              </section>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger"
              >
                {error}
              </p>
            )}

            <fieldset className="space-y-4">
              <legend className="mb-3 text-xs font-bold tracking-wider text-primary uppercase">
                Datos de la organización
              </legend>
              <TextField
                label="Nombre de la organización"
                required
                autoComplete="organization"
                placeholder="Ej. Distribuidora Andina S.A.S."
                error={errors.organizationName?.message}
                {...register('organizationName')}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Identificador tributario"
                  required
                  autoComplete="off"
                  placeholder="Ej. 900123456-7"
                  hint="NIT o su equivalente. Debe ser único."
                  error={errors.taxId?.message}
                  {...register('taxId')}
                />
                <TextField
                  label="Teléfono de contacto"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="Ej. +57 300 123 4567"
                  error={errors.contactPhone?.message}
                  {...register('contactPhone')}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-3 text-xs font-bold tracking-wider text-primary uppercase">
                Primer administrador
              </legend>
              <TextField
                label="Nombre completo"
                required
                autoComplete="name"
                placeholder="Ej. Andrés Morales"
                error={errors.adminName?.message}
                {...register('adminName')}
              />
              <TextField
                label="Correo electrónico"
                required
                type="email"
                autoComplete="email"
                placeholder="correo@empresa.com"
                hint="Con este correo iniciarás sesión."
                error={errors.adminEmail?.message}
                {...register('adminEmail')}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Contraseña"
                  required
                  type="password"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <TextField
                  label="Confirmar contraseña"
                  required
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </fieldset>

            <div className="space-y-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full p-2.5"
                isLoading={registration.isPending}
              >
                Registrar organización
              </Button>
              <p className="text-center text-sm text-muted">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-primary">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
