import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { LoginRedirectState } from '@/core/auth/guards';
import { useShake } from '@/shared/hooks/useShake';
import { Logo } from '@/shared/ui/Logo';
import { Alert } from '@/shared/ui/components/Alert';
import { AccountStep } from '../components/AccountStep';
import { CompanyStep } from '../components/CompanyStep';
import { RegisterHero } from '../components/RegisterHero';
import { RegisterProgress } from '../components/RegisterProgress';
import { RegisterSuccess } from '../components/RegisterSuccess';
import { useRegisterForm } from '../hooks/useRegisterForm';

/** CU-13 / US-001: register an organization together with its first administrator, in two steps. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    form,
    step,
    direction,
    rejections,
    password,
    adminEmail,
    slug,
    workspaceStatus,
    isSubmitting,
    serverError,
    submit,
    goBack,
    onOrganizationNameChange,
    onWorkspaceSlugChange,
  } = useRegisterForm();

  const formRef = useRef<HTMLFormElement>(null);
  useShake(formRef, rejections);

  const goToLogin = () => {
    const state: LoginRedirectState = { registeredEmail: adminEmail };
    navigate('/login', { replace: true, state });
  };

  const slide = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <div className="flex h-dvh w-full">
      <RegisterHero slug={slug} />

      {/* Only this column scrolls: the app shell is `overflow: hidden`. */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-5 px-5 py-10 sm:px-8">
          <Link to="/" aria-label="Pango, ir al inicio" className="w-fit lg:hidden">
            <Logo width="120" height="40" src="logos/pango-logo-horizontal-marron.svg" />
          </Link>

          {step === 'done' ? (
            <RegisterSuccess email={adminEmail} slug={slug} onContinue={goToLogin} />
          ) : (
            <>
              <RegisterProgress step={step} />
              <form ref={formRef} noValidate onSubmit={submit}>
                {serverError && (
                  <Alert tone="danger" className="mb-5 animate-fade-up">
                    {serverError}
                  </Alert>
                )}
                <div key={step} className={slide}>
                  {step === 'account' ? (
                    <AccountStep form={form} password={password} />
                  ) : (
                    <CompanyStep
                      form={form}
                      slug={slug}
                      workspaceStatus={workspaceStatus}
                      isSubmitting={isSubmitting}
                      onBack={goBack}
                      onOrganizationNameChange={onOrganizationNameChange}
                      onWorkspaceSlugChange={onWorkspaceSlugChange}
                    />
                  )}
                </div>
              </form>

              <p className="text-center text-sm text-muted">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
