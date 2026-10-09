import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'pango-theme';
const THEME_COLORS: Record<ResolvedTheme, string> = { light: '#F6F1E7', dark: '#1A1A1A' };

const isMode = (v: unknown): v is ThemeMode => v === 'light' || v === 'dark' || v === 'system';

function readStoredMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return isMode(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemQuery().matches ? 'dark' : 'light';
  return mode;
}

export function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
}

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const mode = readStoredMode();
  return {
    mode,
    resolved: resolveTheme(mode),
    setMode: (next) => {
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* almacenamiento no disponible */ }
      const resolved = resolveTheme(next);
      applyTheme(resolved);
      set({ mode: next, resolved });
    },
  };
});

export function initTheme() {
  const { mode } = useThemeStore.getState();
  applyTheme(resolveTheme(mode));

  systemQuery().addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.mode !== 'system') return;
    const resolved = resolveTheme('system');
    applyTheme(resolved);
    useThemeStore.setState({ resolved });
  });
}
