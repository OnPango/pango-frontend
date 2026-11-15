import { asset } from '@/shared/lib/asset';
import { BACKGROUNDS } from '@/shared/lib/backgrounds';

const url = (name: string) => asset(`backgrounds/pango_${name}.svg`);

/**
 * The picture of a family's card. pango-core keeps no image per family, so it is derived from the
 * id: the same family always gets the same one. `dimmed`: a light picture shown on the dark theme.
 */
export function familyBackground(
  id: string,
  theme: 'light' | 'dark',
): { src: string; dimmed: boolean } {
  const numeric = /^\d+$/.test(id)
    ? Number(id)
    : [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const background = BACKGROUNDS[numeric % BACKGROUNDS.length];
  if (theme === 'dark' && background.dark) return { src: url(background.dark), dimmed: false };
  return { src: url(background.light), dimmed: theme === 'dark' };
}
