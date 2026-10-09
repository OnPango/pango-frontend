import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { MaintenancePage } from './fallbacks/maintenance_page/MaintenancePage.tsx';
import { initTheme } from './core/theme/theme.sore.ts';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MaintenancePage />
  </StrictMode>,
);
