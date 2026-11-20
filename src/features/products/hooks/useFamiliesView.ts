import { useListView, type ListView } from '@/shared/hooks/useListView';

export type FamiliesView = ListView;

const STORAGE_KEY = 'pango.families.view';

/** Families as a table (the whole tree) or as cards (one per top-level family). */
export function useFamiliesView() {
  return useListView(STORAGE_KEY);
}
