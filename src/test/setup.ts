import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { resetApiStub } from './http';

// Every test starts clean: no DOM left over, no HTTP stub, no stored state, no stubbed env/globals.
afterEach(() => {
  cleanup();
  resetApiStub();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
