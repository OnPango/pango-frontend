# Frontend validation
Run `powershell -ExecutionPolicy Bypass -File testing/run.ps1` from repo root. This validates formatting, lint, types and production build; not browser functionality.
Use manual-cases.csv with disposable tenants only. Record actual results, screenshot references, tester and date; leave unexecuted cases pending. PF15 requires Core API isolation test, not hidden UI.
Run Chrome DevTools Lighthouse desktop Navigation three times each for login, dashboard, inventory and forecasts. Confirm authenticated pages actually rendered. Save HTML reports and record median Performance, Accessibility and Best Practices; record browser, device and network. Do not publish private screenshots.
