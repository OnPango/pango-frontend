import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { InvitationPreview } from '@/core/auth/auth.types';
import { buildTenantUrl, getCurrentTenant } from '@/core/tenant/tenant';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useAcceptInvitation, useInvitationPreview } from '../api/useInvitation';
import { AuthCard, AuthPageShell } from '../components/AuthPageShell';
import { PasswordStrength } from '../components/PasswordStrength';
import { getAuthErrorMessage } from '../lib/auth.errors';
import { WORKSPACE_DOMAIN } from '../lib/register.rules';
import { acceptInvitationSchema, type AcceptInvitationValues } from '../types/invitation.schema';

/** Form for a loaded invitation. Mounted only once the preview is known (it decides the fields). */
function AcceptInvitationForm({ token, preview }: { token: string; preview: InvitationPreview }) {
  const navigate = useNavigate();
  const accept = useAcceptInvitation();
  const { hasAccount } = preview;
  const schema = useMemo(() => acceptInvitationSchema(hasAccount), [hasAccount]);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit((values) => {
    accept.mutate(
      { token, name: hasAccount ? undefined : values.name, password: values.password },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <p className="text-muted">
        <b className="text-fg">{preview.invitedBy}</b> te invitó a unirte a{' '}
        <b className="text-fg">{preview.organization.legalName}</b> con el correo{' '}
        <b className="text-fg">{preview.email}</b>.
      </p>

      {accept.isError && (
        <Alert tone="danger">
          {getAuthErrorMessage(accept.error, 'No se pudo aceptar la invitación.')}
        </Alert>
      )}

      {!hasAccount && (
        <TextBox
          label="Tu nombre"
          required
          autoComplete="name"
          placeholder="Nombre y apellido"
          error={errors.name?.message}
          {...register('name')}
        />
      )}
      <TextBox
        label={hasAccount ? 'Tu contraseña actual' : 'Crea una contraseña'}
        required
        type="password"
        autoComplete={hasAccount ? 'current-password' : 'new-password'}
        hint={hasAccount ? 'Ya tienes una cuenta con este correo.' : undefined}
        error={errors.password?.message}
        {...register('password')}
      />
      {!hasAccount && <PasswordStrength id="invitation-password-rules" password={password} />}

      <Button type="submit" size="lg" className="w-full" isLoading={accept.isPending}>
        Unirme y entrar
      </Button>
    </form>
  );
}

/** Landing page of the invitation email link: `/invitations/accept?token=…`. */
export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const preview = useInvitationPreview(token);
  const tenant = getCurrentTenant();
  const invitedSubdomain = preview.data?.organization.subdomain;
  const wrongSpace = !!invitedSubdomain && !!tenant && invitedSubdomain !== tenant;

  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="INVITACIÓN"
        title={<h2>Únete a tu equipo en Pango</h2>}
        className="sm:w-120"
      >
        {preview.isLoading && (
          <p role="status" className="flex items-center gap-3 text-muted">
            <Spinner /> Cargando tu invitación…
          </p>
        )}

        {(preview.isError || token === '') && (
          <Alert tone="danger">
            {token === ''
              ? 'Este enlace no es válido. Pide una invitación nueva a tu administrador.'
              : getAuthErrorMessage(preview.error, 'No se pudo cargar la invitación.')}
          </Alert>
        )}

        {preview.isSuccess && wrongSpace && (
          <div className="space-y-4">
            <Alert tone="warning">
              Esta invitación es para <b>{invitedSubdomain}</b>.{WORKSPACE_DOMAIN}, no para este
              espacio.
            </Alert>
            <Button
              size="lg"
              className="w-full"
              onClick={() =>
                window.location.assign(
                  buildTenantUrl(
                    invitedSubdomain,
                    `/invitations/accept?token=${encodeURIComponent(token)}`,
                  ),
                )
              }
            >
              Continuar en {invitedSubdomain}.{WORKSPACE_DOMAIN}
            </Button>
          </div>
        )}

        {preview.isSuccess && !wrongSpace && (
          <AcceptInvitationForm token={token} preview={preview.data} />
        )}
      </AuthCard>
    </AuthPageShell>
  );
}
