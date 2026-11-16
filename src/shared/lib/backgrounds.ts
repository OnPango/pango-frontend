import { asset } from '@/shared/lib/asset';

export interface Background {
  light: string;
  dark?: string;
}

export const BACKGROUNDS: Background[] = [
  { light: 'hojas' },
  { light: 'olas' },
  { light: 'escamas_claro', dark: 'escamas_oscuro' },
  { light: 'terrazo' },
  { light: 'ramas' },
  { light: 'corteza_clara', dark: 'corteza_oscura' },
  { light: 'surcos' },
  { light: 'madera_arena', dark: 'madera_tinta' },
  { light: 'musgo_claro', dark: 'musgo_oscuro' },
  { light: 'madera_espiga' },
  { light: 'plano_claro', dark: 'plano_oscuro' },
  { light: 'topografia' },
  { light: 'arena' },
  { light: 'madera_musgo' },
  { light: 'madera_anillos' },
  { light: 'piedra' },
];

export const getBackgroundUrl = (name: string) => asset(`backgrounds/pango_${name}.svg`);

export function getBackgroundByIndex(
  index: number,
  theme: 'light' | 'dark',
): { src: string; dimmed: boolean } {
  const background = BACKGROUNDS[Math.abs(index) % BACKGROUNDS.length];
  if (theme === 'dark' && background.dark) {
    return { src: getBackgroundUrl(background.dark), dimmed: false };
  }
  return { src: getBackgroundUrl(background.light), dimmed: theme === 'dark' };
}

export function getRandomBackground(theme: 'light' | 'dark'): { src: string; dimmed: boolean } {
  const index = Math.floor(Math.random() * BACKGROUNDS.length);
  return getBackgroundByIndex(index, theme);
}

/**
 * Resolves a background pattern based on a seed string (e.g. title or id) and the current theme.
 * If seed matches a known pattern name directly, it uses that; otherwise, it derives an index
 * deterministically so the same seed always gets the same pattern.
 */
export function resolveBackground(
  seed: string,
  theme: 'light' | 'dark',
): { src: string; dimmed: boolean } {
  if (seed.startsWith('/') || seed.startsWith('http')) {
    return { src: seed, dimmed: false };
  }

  const match = BACKGROUNDS.find((b) => b.light === seed || b.dark === seed);
  const background =
    match ??
    BACKGROUNDS[
      (/^\d+$/.test(seed)
        ? Number(seed)
        : [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % BACKGROUNDS.length
    ];

  if (theme === 'dark' && background.dark) {
    return { src: getBackgroundUrl(background.dark), dimmed: false };
  }
  return { src: getBackgroundUrl(background.light), dimmed: theme === 'dark' };
}
