import { MdDarkMode } from "react-icons/md";
import { IoIosSunny } from "react-icons/io";
import { PiMonitorFill } from "react-icons/pi";

import { useThemeStore, type ThemeMode } from '@/core/theme/theme.store';
import type { ReactNode } from 'react';

const icons: Record<ThemeMode, ReactNode> = {
  light: (<IoIosSunny className="size-5" />),
  system: (<PiMonitorFill />),
  dark: (<MdDarkMode className="size-5" />),
};

const options: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Claro' },
  { mode: 'system', label: 'Sistema' },
  { mode: 'dark', label: 'Oscuro' },
];

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useThemeStore();

  return (
    <div
      role="group"
      aria-label="Tema de la interfaz"
      className={`flex p-0.5 items-center justify-between rounded-full border border-line2 bg-surface ${className}`}
    >
      {options.map(({ mode: m, label }) => (
        <button
          key={m}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
          className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-700 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden ${
            mode === m ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg'
          }`}
        >
          {icons[m]}
        </button>
      ))}
    </div>
  );
}
