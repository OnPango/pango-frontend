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
    <>
      <div
        role="group"
        aria-label="Tema de la interfaz"
        className={`hidden lg:flex p-0.5 items-center justify-between rounded-full border border-line2 bg-surface ${className}`}
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
      <div
        role="group"
        aria-label="Tema de la interfaz"
        className={`flex lg:hidden p-0.5 items-center justify-between rounded-full border border-line2 bg-surface ${className}`}
      >
        {
          (() => {
            switch(mode) {
              case 'light':
                return (
                  <button
                    type="button"
                    title={options[1].label}
                    aria-label={options[1].label}
                    aria-pressed={mode === options[1].mode}
                    onClick={() => setMode(options[1].mode)}
                    className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-700 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden`}
                  >
                    {icons[options[1].mode]}
                  </button>
                );
              case 'system':
                return (
                  <button
                    type="button"
                    title={options[2].label}
                    aria-label={options[2].label}
                    aria-pressed={mode === options[2].mode}
                    onClick={() => setMode(options[2].mode)}
                    className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-700 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden`}
                  >
                    {icons[options[2].mode]}
                  </button>
                );
              case 'dark':
                return (
                  <button
                    type="button"
                    title={options[0].label}
                    aria-label={options[0].label}
                    aria-pressed={mode === options[0].mode}
                    onClick={() => setMode(options[0].mode)}
                    className={`rounded-full w-9 h-9 flex items-center justify-center transition-all duration-700 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden`}
                  >
                    {icons[options[0].mode]}
                  </button>
                );
            }
          })()
        }
      </div>
    </>
  );
}
