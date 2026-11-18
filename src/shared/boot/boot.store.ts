import { create } from 'zustand';

/** One wait while the app starts: the session check, a screen's code, the workspace lookup… */
export interface BootStepInfo {
  id: string;
  /** What Pango is doing, as a heading: "Pango está buscando tu espacio". */
  message: string;
  /** A second line: the address being looked up. */
  detail?: string;
}

interface BootState {
  /** `booting` until the first moment nothing is waiting; then `done`, for good. */
  phase: 'booting' | 'done';
  /** The steps waiting now, oldest first. The newest one is the one on screen. */
  active: BootStepInfo[];
  /** Every step that has started, waiting or not: how far the start has gone. */
  started: string[];
  /** The newest step that started: still on screen in the instant between two steps. */
  last: BootStepInfo | null;

  start: (step: BootStepInfo) => void;
  end: (id: string) => void;
  finish: () => void;
}

/**
 * The app's start as one progress. Each wait on the way in (session, code, workspace) registers a
 * step while it lasts, wherever it is in the tree; one boot screen shows them in turn. Once nothing
 * is waiting the start is over, and later waits show their own inline loaders.
 */
export const useBootStore = create<BootState>()((set) => ({
  phase: 'booting',
  active: [],
  started: [],
  last: null,
  start: (step) =>
    set((state) => ({
      last: step,
      active: [...state.active.filter((s) => s.id !== step.id), step],
      started: state.started.includes(step.id) ? state.started : [...state.started, step.id],
    })),
  end: (id) => set((state) => ({ active: state.active.filter((s) => s.id !== id) })),
  finish: () => set({ phase: 'done', active: [] }),
}));
