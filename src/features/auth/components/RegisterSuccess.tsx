import { FiArrowRight } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import { WORKSPACE_DOMAIN } from '../lib/register.rules';

interface RegisterSuccessProps {
  email: string;
  slug: string;
  onContinue: () => void;
}

/** Final state: the check draws itself and a ring pulses once. */
export function RegisterSuccess({ email, slug, onContinue }: RegisterSuccessProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-5">
      <span className="relative grid size-16 place-items-center rounded-full bg-success/15 text-success">
        <span aria-hidden className="absolute inset-0 animate-ring rounded-full bg-success/30" />
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="relative size-9 animate-pop-in fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path
            d="m8 12.5 2.8 2.8L16 10"
            pathLength="1"
            strokeDasharray="1"
            className="animate-draw"
          />
        </svg>
      </span>
      <div className="animate-fade-up space-y-3 [animation-delay:150ms]">
        <h1 className="text-3xl leading-tight font-bold">Cuenta registrada</h1>
        <p className="leading-relaxed text-muted">
          Enviamos un correo a <b className="text-fg">{email}</b>. Confírmalo y creamos tu espacio{' '}
          <b className="text-fg">
            {slug}.{WORKSPACE_DOMAIN}
          </b>
          .
        </p>
      </div>
      <Button
        size="lg"
        className="group w-full animate-fade-up gap-2.5 [animation-delay:300ms]"
        onClick={onContinue}
      >
        Ir a iniciar sesión
        <FiArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
}
