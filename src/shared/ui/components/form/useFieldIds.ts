import { useId } from 'react';

/** Stable ids that link a control to its label, hint and error message. */
export function useFieldIds(idProp: string | undefined, hint?: string, error?: string) {
  const generated = useId();
  const id = idProp ?? generated;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // The error replaces the hint: showing both would read twice and push the layout around.
  const describedBy = error ? errorId : hint ? hintId : undefined;
  return { id, hintId, errorId, describedBy };
}
