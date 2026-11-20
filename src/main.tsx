import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { bindHttpToSession } from './core/auth/http.binding.ts';
import { env } from './core/config/env.ts';
import { initTheme } from './core/theme/theme.store.ts';
import { App } from './app/App.tsx';

/** The mock backend must be installed before the first request (the session check on boot). */
async function enableMockingIfNeeded() {
  if (!env.useMock) return;
  const { enableMocking } = await import('./mocks');
  enableMocking();
}

initTheme();
bindHttpToSession();

void enableMockingIfNeeded().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
