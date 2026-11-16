import { useCallback, useState } from 'react';

export type FamiliesView = 'table' | 'cards';

const STORAGE_KEY = 'pango.families.view';

/** The last view the person chose on this device; a convenience, so failures are ignored. */
function readStoredView(): FamiliesView {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'cards' ? 'cards' : 'table';
  } catch {
    return 'table';
  }
}

/** Families as a table (the whole tree) or as cards (one per top-level family). */
export function useFamiliesView() {
  const [view, setStateView] = useState<FamiliesView>(readStoredView);
  const setView = useCallback((next: FamiliesView) => {
    setStateView(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the view simply is not remembered.
    }
  }, []);
  return { view, setView };
}
