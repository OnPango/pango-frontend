import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchEverything } from './search.api';

/** The API rejects shorter texts. */
export const SEARCH_MIN_LENGTH = 2;

export const searchKeys = {
  all: ['search'] as const,
  results: (text: string) => [...searchKeys.all, text] as const,
};

/**
 * The results for `text`, already debounced by the caller. While a new text loads, the previous
 * results stay on screen; a request left behind by a newer one is cancelled.
 */
export function useSearchResults(text: string) {
  return useQuery({
    queryKey: searchKeys.results(text),
    queryFn: ({ signal }) => searchEverything(text, signal),
    enabled: text.length >= SEARCH_MIN_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
