import { useMemo, useSyncExternalStore } from 'react';

// Charts draw plain SVG attributes, where CSS variables do not resolve: read the theme's tokens,
// again whenever the `dark` class of the page changes.
const watchTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains('dark');

/** The theme's colors as values, for chart libraries; they follow light and dark mode. */
export function useThemeColors() {
  const dark = useSyncExternalStore(watchTheme, isDark);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    return {
      dark,
      primary: token('--primary'),
      secondary: token('--secondary'),
      accent: token('--accent'),
      success: token('--success'),
      warning: token('--warning'),
      danger: token('--danger'),
      fg: token('--fg'),
      muted: token('--muted'),
      line: token('--line2'),
      surface: token('--surface'),
    };
  }, [dark]);
}
