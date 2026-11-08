import { useState } from 'react';

export type RegisterStep = 'account' | 'company' | 'done';

const STEP_ORDER: readonly RegisterStep[] = ['account', 'company', 'done'];

/**
 * Where the person is in the sign-up, and which way they are moving (the page slides the step in
 * from the right going forward and from the left going back). It knows nothing about the form
 * fields or the request.
 */
export function useRegisterWizard() {
  const [step, setStep] = useState<RegisterStep>('account');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  /** Bumped on every rejected attempt so the form can play its "shake" again. */
  const [rejections, setRejections] = useState(0);

  const goTo = (next: RegisterStep) => {
    setDirection(STEP_ORDER.indexOf(next) < STEP_ORDER.indexOf(step) ? 'back' : 'forward');
    setStep(next);
  };

  const reject = () => setRejections((count) => count + 1);

  return { step, direction, rejections, goTo, reject };
}
