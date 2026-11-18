import { useCallback, useState } from 'react';

export type ListView = 'table' | 'cards';

/** The last view the person chose on this device; a convenience, so failures are ignored. */
function readStoredView(storageKey: string, defaultView: ListView = 'table'): ListView {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'table' || stored === 'cards') return stored;
    return defaultView;
  } catch {
    return defaultView;
  }
}

/** Persists a per-page switch between table view and card grid view in localStorage. */
export function useListView(storageKey: string, defaultView: ListView = 'table') {
  const [view, setStateView] = useState<ListView>(() => readStoredView(storageKey, defaultView));

  const setView = useCallback(
    (next: ListView) => {
      setStateView(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Private mode or blocked storage: the view simply is not remembered.
      }
    },
    [storageKey],
  );

  return { view, setView };
}
