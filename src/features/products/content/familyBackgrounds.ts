import { resolveBackground } from '@/shared/lib/backgrounds';

/**
 * The picture of a family's card. pango-core keeps no image per family, so it is derived from the
 * id: the same family always gets the same one. `dimmed`: a light picture shown on the dark theme.
 */
export function familyBackground(
  id: string,
  theme: 'light' | 'dark',
): { src: string; dimmed: boolean } {
  return resolveBackground(id, theme);
}
