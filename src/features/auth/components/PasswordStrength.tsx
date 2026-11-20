import { FiCheck, FiMinus } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { getPasswordStrength, PASSWORD_RULES } from '../lib/register.rules';

interface PasswordStrengthProps {
  password: string;
  /** Id for `aria-describedby` on the password input. */
  id: string;
}

const SEGMENTS = [1, 2, 3, 4] as const;

/** Strength meter plus a live checklist of the password rules. */
export function PasswordStrength({ password, id }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  const meterColor = strength <= 1 ? 'bg-danger' : strength === 2 ? 'bg-warning' : 'bg-success';

  return (
    <div className="space-y-2.5">
      <div aria-hidden className="flex gap-1.5">
        {SEGMENTS.map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              segment <= strength ? meterColor : 'bg-line2',
            )}
          />
        ))}
      </div>

      <ul id={id} className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.id}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors duration-300',
                met ? 'text-success' : 'text-muted',
              )}
            >
              <span
                key={met ? 'met' : 'pending'}
                aria-hidden
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-full',
                  met && 'animate-pop-in bg-success text-canvas',
                )}
              >
                {met ? (
                  <FiCheck className="size-3" strokeWidth={3} />
                ) : (
                  <FiMinus className="size-3.5" />
                )}
              </span>
              {rule.label}
              <span className="sr-only">{met ? ': cumplido' : ': pendiente'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
