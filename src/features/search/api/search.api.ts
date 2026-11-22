import { http } from '@/core/api/http';
import type { SearchResults } from '../types/search.types';
import type { SearchResultDto } from './search.dto';
import { toSearchResults } from './search.mappers';

/**
 * `GET /search?q=`: a few products, families, warehouses, open alerts and users matching `text`,
 * each group only if the user can read it. `signal` cancels it when a newer search replaces it.
 */
export async function searchEverything(text: string, signal?: AbortSignal): Promise<SearchResults> {
  const { data } = await http.get<SearchResultDto>('/search', { params: { q: text }, signal });
  return toSearchResults(data);
}
