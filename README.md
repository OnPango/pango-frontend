# Pango - Frontend

Pango web application (SPA), a multi-organization SaaS platform for intelligent inventory management with demand forecasting for small and medium-sized businesses.

> This repository contains **only the frontend**. The back end (NestJS) and the forecasting service (FastAPI) are hosted in separate repositories.

## Table of contents

1. [Project status](#1-project-status)
2. [Scope](#2-scope)
3. [Stack](#3-stack)
4. [Architecture](#4-architecture)
5. [Structure](#5-structure)
6. [Routes and permissions](#6-routes-and-permissions)
7. [Naming conventions](#7-naming-conventions)
8. [Coding convention](#8-coding-conventions)
9. [Dark/light theme and visual identity](#9-dark-light-theme-and-visual-identity)
10. [Configuration and scripts](#10-configuration-and-scripts)
11. [Git flow](#11-git-flow)
12. [Documentation](#12-documentation)

## 1. Project status

| Area                                                                                    | Status                               |
| --------------------------------------------------------------------------------------- | ------------------------------------ |
| Skeleton (Vite + React + TS), feature-based structure, CI                               | ✅ Done                              |
| Light / dark / system theme with Tailwind v4                                            | ✅ Done                              |
| Session (HttpOnly cookies + refresh rotation), permission-based route guards, layout    | ✅ Done                              |
| Module screens                                                                          | ⏳ Placeholders                      |
| Owner sign-up, login, email confirmation, invitations (US-001 / CU-13)                  | ✅ Against `pango-core` and the mock |
| User management (CU-02): list, job title, roles, (de)activate, invitations              | ✅ Against `pango-core` and the mock |
| Products (CU-03, US-008): list, search, filter by family and status, register, edit     | ✅ Against `pango-core` and the mock |
| Warehouses (CU-04, US-017): list, search, filter, detail, register, edit, close, reopen | ✅ Against `pango-core` and the mock |
| Base components (table, modal, status badges, form fields)                              | ⏳ Pending                           |
| Login with the pangolin illustration and "under construction" screen                    | ⏳ Pending                           |
| ESLint + Prettier, tests (Vitest + Testing Library)                                     | ⏳ Pending                           |
| API contract and final permission catalog                                               | ⏳ To be agreed with the backend     |

## 2. Scope

### In scope

The frontend is the presentation layer for the use cases in the SRS. It consumes the backend API (BFF); it contains no business rules and does not compute forecasts.

| UC            | Use case                                                                          | Module (feature)          |
| ------------- | --------------------------------------------------------------------------------- | ------------------------- |
| CU-01         | Authenticate user                                                                 | `auth`                    |
| CU-02         | Manage users, profiles and permissions                                            | `users`                   |
| CU-03         | Manage materials (in the ER diagram: **Producto**)                                | `products`                |
| CU-04         | Manage warehouses and locations                                                   | `warehouses`              |
| CU-05         | Record inventory movement                                                         | `inventory`               |
| CU-06         | Identify material via RFID (display the identification result)                    | `inventory`               |
| CU-07         | View occupancy of warehouses and locations                                        | `warehouses`, `dashboard` |
| CU-08 / CU-09 | Create and handle internal requests                                               | `requests`                |
| CU-10 / CU-11 | View demand forecast and reorder point                                            | `forecast`                |
| CU-12         | View inventory alerts                                                             | `alerts`                  |
| —             | Areas (requesting / fulfilling) and the minimal Supplier and Purchase Order block | `areas`, `suppliers`      |
| —             | Dashboard for inventory, demand, forecasts and alerts                             | `dashboard`               |

> The use case IDs (CU-xx) come from the SRS and are kept in Spanish on purpose, so they match the source document.

### Out of scope

- Business logic, forecast computation, reorder point and alert generation (backend / FastAPI service).
- Multi-tenant isolation: enforced by the backend; the frontend only tells the API which organization a request targets (`X-Tenant`, taken from the subdomain) and sends the access token.
- Physical RFID reading: the reader is an external device integrated by the backend (RFID Adapter). The frontend only presents the result.
- Pricing, billing and last-mile logistics.
- Native mobile app. The web app must be responsive.
- Internationalization: the interface is in Spanish. No i18n library is included in the MVP.

## 3. Technologies

| Technology            | Version                                 | Purpose                                        |
| --------------------- | --------------------------------------- | ---------------------------------------------- |
| React                 | 19                                      | UI                                             |
| TypeScript            | 6.0.2 (`strict` mode)                   | Typing                                         |
| Vite                  | 8.3.0                                   | Dev server and build                           |
| Tailwind CSS          | 4.3.3 (CSS-first, no `tailwind.config`) | Styling and theming                            |
| React Router          | 7                                       | Routing (`createBrowserRouter`, `lazy` routes) |
| TanStack Query        | 5                                       | Server state: caching, retries, invalidation   |
| Zustand               | 5.0.15                                  | Client state (session, theme)                  |
| React Hook Form + Zod | 7 / 4 (`@hookform/resolvers` 7)         | Forms and validation                           |
| Axios                 | 1                                       | HTTP client with interceptors                  |

Requirements: Node.js 20+ and pnpm. Modern browsers (Chrome 111+, Safari 16.4+, Firefox 128+), due to Tailwind v4.

## 4. Frontend architecture

```
Browser ──► Frontend (SPA) ──► BFF / API Gateway (NestJS) ──► PostgreSQL · Redis
                                        └──► Forecasting service (FastAPI)
```

**State.** Each kind of state has exactly one home:

| Kind                | Tool                  | Example                                           |
| ------------------- | --------------------- | ------------------------------------------------- |
| Server data         | TanStack Query        | product list, alerts                              |
| Global client state | Zustand               | session (`useAuthStore`), theme (`useThemeStore`) |
| Form state          | React Hook Form + Zod | create-product form                               |
| Local UI state      | `useState`            | open modal, active tab                            |

**Requests.** Every request goes through an Axios client built by `core/api/client.ts`, which adds `X-Tenant` (the organization, read from the hostname). Every client sends the session cookies (`withCredentials`). `http` (`core/api/http.ts`) is for signed-in calls: on a 401 it renews the session once and repeats the request. It gets the renewal through `configureHttpAuth`, which `core/auth` fills in at startup (`bindHttpToSession`), so `core/api` never imports `core/auth`. `authHttp` is for the `/auth/*` and `/invitations/*` endpoints (see _Authentication and organizations_).

**Permissions.** The SRS states that profiles and permissions are configurable by each organization's administrator, so the frontend **does not hardcode roles**: the session carries a list of permissions (`resource.action`, e.g. `stock_request.approve`) and the UI decides based on it (`hasAnyPermission`, `RequirePermission`). Hiding an element is a UX concern only; real authorization is enforced by the backend.

**Anti-corruption layer.** Components never use the raw backend JSON: each `features/<x>/api/` converts responses into the frontend's domain types (camelCase, in English). If the contract changes, only that layer is touched.

**Loading.** Every page is loaded with `React.lazy`; the layout and session form the initial bundle.

## 5. Directory structure

```
pango-frontend/
├─ .github/
│  ├─ pull_request_template.md   # PR description template
│  └─ workflows/
│     ├─ ci.yml                  # format + lint + typecheck + test + build
│     └─ commit-convention.yml   # Conventional Commits check on PRs
├─ public/                       # static assets (favicon, pangolin illustrations)
├─ src/
│  ├─ main.tsx                   # entry point; initializes the theme, binds the HTTP client to the session
│  ├─ app/                       # app composition
│  │  ├─ App.tsx                 # providers (QueryClient, Router)
│  │  ├─ router.tsx              # route table and guards
│  │  ├─ routes.tsx              # the screens: path, menu entry, permissions, page
│  │  └─ SessionCheck.tsx        # screen shown while the session is restored
│  ├─ core/                      # cross-cutting infrastructure, no business UI
│  │  ├─ api/                    # client.ts (Axios factory) · http.ts (401 renewal) · authHttp.ts · errors.ts
│  │  ├─ auth/                   # session and auth contract
│  │  │                          #   auth.api/dto/mappers/types: every /auth and /invitations call
│  │  │                          #   session.api · refresh.coordinator · session.hint: local session
│  │  │                          #   auth.store · user · permissions · guards · http.binding
│  │  ├─ config/env.ts           # VITE_* variables
│  │  ├─ tenant/tenant.ts        # organization from the hostname, workspace URLs, slugify
│  │  └─ theme/theme.store.ts    # light/dark/system mode
│  ├─ shared/                    # reusable, no business logic
│  │  ├─ ui/                     # base components (PageHeader, ThemeToggle, …)
│  │  ├─ layout/                 # AppLayout, nav.ts
│  │  ├─ hooks/                  # generic hooks (useDebouncedValue, useShake, …)
│  │  └─ lib/                    # pure utilities (formatDate, formatQuantity, …)
│  ├─ features/                  # one directory per domain module
│  │  └─ <feature>/
│  │     ├─ api/                 # <feature>.api.ts · <feature>.keys.ts · <feature>.mappers.ts · query hooks
│  │     ├─ components/          # feature-specific components
│  │     ├─ content/             # static catalogs and copy (select options, permission catalog…)
│  │     ├─ hooks/               # feature logic that composes forms/queries (useLoginForm, useRegisterForm…)
│  │     ├─ lib/                 # pure business rules of the feature (no React, no I/O)
│  │     ├─ pages/               # <Name>Page.tsx (one per route)
│  │     └─ types/               # <feature>.types.ts · <feature>.schema.ts (Zod)
│  └─ styles/
│     ├─ index.css               # Tailwind entry + custom utilities (@utility)
│     └─ theme.css               # color tokens and fonts (light/dark)
├─ index.html                    # includes the anti-flash theme script
├─ vite.config.ts                # @ → src alias, Tailwind plugin, /api proxy
└─ .env.example
```

Current features: `auth`, `dashboard`, `products`, `warehouses`, `inventory`, `requests`, `suppliers`, `forecast`, `alerts`, `areas`, `users`.

### Dependency rules

```
app ──► features ──► shared ──► core
```

- A module may only import from those to its right. `core` never imports from `shared`, `features` or `app`.
- **A feature never imports from another feature.** If two features need the same thing, move it to `shared/` (if generic) or compose it in `app/` or in the page.
- Inside a feature use relative paths; across layers use the `@/` alias.
- No barrel files (`index.ts`): import from the file that defines the symbol.
- Import order: external libraries → `@/core` → `@/shared` → the feature's relative imports.

## 6. Routes and permissions

URLs are in English and kebab-case (`/roles-permissions`).

- **Routes.** [`src/app/routes.tsx`](src/app/routes.tsx) is the single place that declares the screens: path, menu label and icon, menu section, required permissions (`anyOf`, empty = any signed-in user) and page. The router, the sidebar menu and the header title are all derived from it. A new screen is one entry there (plus its `pages/<Name>Page.tsx`).
- **Permissions.** Codes are `resource.action` and mirror the backend's `permissions` table, including its scope (`ORGANIZATION` or `WAREHOUSE`). The list lives in `PERMISSION_SCOPES` in [`src/core/auth/user.ts`](src/core/auth/user.ts); their Spanish names and descriptions, used by the roles screen, in [`permissions.catalog.ts`](src/features/users/content/permissions.catalog.ts). A permission added to the first without the second does not compile.
- **Roles are configurable.** Each organization defines its own roles (the backend seeds a default set), so the UI must never branch on a role name, only on permissions.
- `/login`, `/register`, `/verify-email` and `/invitations/accept` are public (the last two are opened from emails); `/` needs only a session; everything else is guarded with `RequirePermission`, which shows the 403 page when the permission is missing.

## 7. Naming conventions

### 7.1 Language

- **Code identifiers** (directories, files, components, functions, variables, types, permissions): **English**.
- **User-facing text**: **Spanish**.
- **Documentation, code comments and commit messages**: **English**.
- ER diagram entities are translated with the glossary below; do not invent synonyms:
  | ER diagram (Spanish)           | Code (English)    |     | ER diagram (Spanish)     | Code (English)   |
  | ------------------------------ | ----------------- | --- | ------------------------ | ---------------- |
  | Producto (formerly "Material") | `Product`         |     | Predicción               | `Forecast`       |
  | Almacén                        | `Warehouse`       |     | Alerta de inventario     | `InventoryAlert` |
  | Ubicación                      | `Location`        |     | Parámetros de reposición | `ReorderParams`  |
  | Inventario                     | `Inventory`       |     | Proveedor                | `Supplier`       |
  | Movimiento                     | `Movement`        |     | Orden de compra          | `PurchaseOrder`  |
  | Solicitud interna              | `InternalRequest` |     | Área                     | `Area`           |
  | Usuario                        | `User`            |     | Organización (tenant)    | `Organization`   |

### 7.2 Summary

| Element                           | Convention                               | Example                                                |
| --------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Directories                       | `kebab-case`, lowercase                  | `features/purchase-orders/`                            |
| Component file                    | `PascalCase.tsx`, same as the component  | `ProductForm.tsx`                                      |
| Page file                         | `<Name>Page.tsx`, `export default`       | `ProductsPage.tsx`                                     |
| Hook file                         | `camelCase.ts`, `use` prefix             | `useProducts.ts`                                       |
| Other files                       | `kebab-case` + role suffix               | `product.api.ts`, `product.schema.ts`, `auth.store.ts` |
| Tests                             | next to the file, `.test.ts(x)` suffix   | `ProductForm.test.tsx`                                 |
| Components                        | `PascalCase`, noun                       | `StockBadge`                                           |
| Component props                   | `<Component>Props`                       | `ProductFormProps`                                     |
| Functions                         | `camelCase`, verb + object               | `getProducts`, `formatQuantity`                        |
| Handlers inside a component       | `handle<Event>`                          | `handleSubmit`                                         |
| Event props                       | `on<Event>`                              | `onSelect`, `onClose`                                  |
| Predicates                        | `is…`, `has…`, `can…`                    | `isLowStock`, `hasAnyPermission`                       |
| Variables                         | `camelCase`                              | `selectedWarehouse`                                    |
| Booleans                          | `is/has/can/should` prefix               | `isLoading`, `canEdit`                                 |
| Collections                       | plural                                   | `products`, `locations`                                |
| Module-level constants            | `UPPER_SNAKE_CASE`                       | `NAV_ITEMS`, `THEME_STORAGE_KEY`                       |
| Types and interfaces              | `PascalCase`, no `I` prefix              | `Product`, `SessionUser`                               |
| Backend DTOs                      | `Dto` suffix                             | `ProductDto`                                           |
| Form / mutation inputs            | `Input` / `FormValues` suffix            | `CreateProductInput`                                   |
| Literal unions                    | `PascalCase`; preferred over `enum`      | `type MovementType = 'in' \| 'out'`                    |
| Zod schemas                       | `camelCase` + `Schema`; type is inferred | `productFormSchema` → `ProductFormValues`              |
| Zustand stores                    | `use<Name>Store`                         | `useAuthStore`                                         |
| Query keys                        | `<feature>Keys` object                   | `productKeys.list(filters)`                            |
| Providers / contexts              | `<Name>Provider`                         | `ThemeProvider`                                        |
| Permissions                       | `resource.action` (English)              | `product.manage`                                       |
| URL routes                        | `kebab-case`, English                    | `/purchase-orders`                                     |
| Environment variables             | `VITE_` + `UPPER_SNAKE_CASE`             | `VITE_API_URL`                                         |
| Custom CSS utilities (`@utility`) | `kebab-case`                             | `btn-primary`                                          |
| Branches                          | `<type>/<module>-<description>`          | `feature/products-crud`                                |
| Commits                           | Conventional Commits, in English         | `feat(products): add create form`                      |

### 7.3 Additional rules

🔒 Enforced by lint: `camelCase` for variables, functions and parameters (`PascalCase` also allowed for components, `UPPER_CASE` for constants), `PascalCase` for types, no `I` prefix on interfaces, and `import type` for type-only imports. File naming and the boolean `is/has/can` prefix are review items.

- A component file exports **one** public component; private helpers may live in the same file if they are not reused.
- 🔒 Components use **named exports**; only pages (`src/features/*/pages/`) use `export default` (required by `React.lazy`).
- No ambiguous abbreviations (`prod`, `wh`, `qty`). `id`, `url`, `dto` are fine; `i`/`j` only for trivial indexes.
- Names describe the domain, not the implementation: `lowStockProducts`, not `filteredArray`.
- Files with a role suffix (`.api`, `.store`, `.schema`, `.types`, `.keys`, `.mappers`) contain only that role.

## 8. Code conventions

Rules marked 🔒 are enforced by ESLint (`eslint.config.js`) and fail CI; the rest are review items.

- 🔒 **Strict TypeScript**: no `any`; use `unknown` and narrow it. No `// @ts-ignore` (use `@ts-expect-error` with a reason).
- 🔒 **Styles**: only semantic theme tokens (`bg-surface`, `text-fg`, `border-line`, `bg-primary`…). **Literal colors are forbidden** in `className` (`bg-white`, `text-gray-500`, `bg-[#fff]`): they break dark mode.
- **Data**: read with `useQuery`, write with `useMutation` plus invalidation through the `*Keys` objects. No `fetch`/Axios calls inside components.
- **Forms**: React Hook Form with `zodResolver`; the Zod schema lives in `types/<feature>.schema.ts`.
- **Shared UI**: do not hand-roll controls; use `shared/ui/components`. Form: `form/TextBox`, `form/TextArea`, `form/select/Select`, `form/select/MultiSelect`, `form/date/DatePicker`, `form/Checkbox`, `form/Switch`, `form/RadioGroup` (label, hint, error and `aria-*` wiring included; `TextBox`, `TextArea`, `Checkbox` and `Switch` forward their ref, so they work with React Hook Form's `register`, while `Select`, `MultiSelect` and `DatePicker` take `value`/`onChange`, so use RHF's `Controller`). Display: `Avatar`, `Badge`, `Alert`, `Modal` (native `<dialog>`), `Button`. Dates travel as local `YYYY-MM-DD` strings.
- **Scrollbars**: styled once, globally, in `styles/index.css` (thin line, no arrows, same in Chromium/WebKit and Firefox). Do not restyle them per component.
- **Errors**: screens handle three explicit states — loading, error and empty — in addition to the data state.
- 🔒 **Accessibility**: real interactive elements (`button`, `a`) and `aria-label` on icon-only controls (`jsx-a11y` rules); visible focus and legible contrast in both themes are review items.
- **Security**: both tokens are HttpOnly cookies that JS never touches; never rely on the UI for authorization.
- **Performance**: pages are lazy-loaded; long lists are paginated server-side.

### Testing

- Vitest + Testing Library in a jsdom environment. Tests live next to the code they cover (`ProductForm.test.tsx`).
- Test behavior as the user sees it: query by role, label or text (`getByRole`) and interact with `userEvent`. No snapshot tests and no assertions on implementation details.
- Mock only the network boundary: `stubApi()` (`src/test/http.ts`) stubs the Axios adapter, so the real interceptors and API functions still run. Do not mock stores or your own modules.
- Helpers in `src/test/`: `renderWithProviders`, `renderRoutes` (route tables, guards, redirects), `signInAs(permissions)`, `buildSessionUser` and `stubApi`. `setup.ts` resets the session, theme, `localStorage` and the HTTP stub after every test, so tests need no manual cleanup.
- Naming: `describe('<unit>')` with `it('does X when Y')`, in English.
- A new feature ships with tests for its API functions (request shape and mapping), its page states (loading, error, empty, data) and any permission-dependent UI.
- `npm run test:coverage` shows coverage. There is no threshold yet; the placeholder pages are expected to show 0%.

## 9. Light / dark theme and visual identity

- Three modes: **Light**, **Dark** and **System** (follows the OS). The choice is stored in `localStorage` (`pango-theme`), and a script in `index.html` applies it before the first render to avoid a flash.
- The whole theme lives in `src/styles/theme.css`: `:root` (light) and `.dark` (dark) define the values, and `@theme inline` exposes them as Tailwind utilities. There is no `tailwind.config`.
- Tokens: `canvas`, `surface`, `sidebar`, `sidebar-fg`, `fg`, `muted`, `line`, `primary`, `primary-fg`, `accent`, `accent-fg`, `success`, `warning`, `danger`.
- Brand: Tinta `#1E2A22` · Arena `#F6F1E7` · Cobre `#B5502E` · Musgo `#3B6E58`. In dark mode, Musgo and Cobre are lightened to keep contrast.
- Typography: **Space Grotesk** (headings) and **Work Sans** (interface).
- Mascot: the pangolin appears on the login screen (peeking in from the bottom center, with the form in the middle) and on the "under construction" screen.

## 10. Setup and scripts

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173 — proxies /api → http://localhost:3000
```

| Script                                     | Description                                     |
| ------------------------------------------ | ----------------------------------------------- |
| `pnpm run dev`                             | Development server                              |
| `pnpm run build`                           | Typecheck + production build into `dist/`       |
| `pnpm run preview`                         | Serves the build locally                        |
| `pnpm run typecheck`                       | Type checking only                              |
| `pnpm run lint` / `npm run lint:fix`       | ESLint (check / auto-fix)                       |
| `pnpm run format` / `npm run format:check` | Prettier (write / check)                        |
| `pnpm test` / `npm run test:watch`         | Vitest (single run / watch mode)                |
| `pnpm run test:coverage`                   | Vitest with a V8 coverage report in `coverage/` |

| Variable               | Description                                                                                                                                                                            | Default     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `VITE_API_BASE_URL`    | Base URL of `pango-core` (no trailing slash). In development `/api`: Vite proxies it to `VITE_DEV_API_TARGET` (default `http://localhost:3000`) so the session cookies are same-origin | `/api`      |
| `VITE_APP_BASE_DOMAIN` | Domain organizations hang from: `<subdomain>.<domain>`. Must equal `APP_BASE_DOMAIN` in core                                                                                           | `localhost` |
| `VITE_DEV_TENANT`      | Pins the organization instead of reading it from the hostname (single-host dev, mock)                                                                                                  | _(empty)_   |
| `VITE_USE_MOCK`        | `true` = in-browser mock backend instead of `pango-core`                                                                                                                               | `false`     |

### Authentication and organizations

The contract is `docs/auth.md` in `pango-core`. In short:

- **Organization-first.** Every organization lives on its own subdomain (`mi-empresa.onpango.com`) and a session belongs to exactly one. The frontend reads the organization from the hostname (`core/tenant/tenant.ts`) and sends it as `X-Tenant`. On the main domain `/login` first asks for the workspace address and redirects there.
- **Tokens.** Both tokens are **HttpOnly cookies** set by the API, one pair per organization: `pango_access_<subdomain>` (15 min, path `/`) and `pango_refresh_<subdomain>` (30 days, path `/auth`), `SameSite=Lax`. JavaScript never sees them and no response body carries a token, so nothing token-like is in memory or storage; the browser attaches them to every request made `withCredentials`. When the access cookie expires the browser stops sending it, the API answers 401 and the `http` client calls `POST /auth/refresh` (no body) and repeats the request once. On boot the session is first recognized with `GET /auth/me` (read-only, while the access cookie is alive) and only renewed with refresh if that fails. Refresh tokens rotate and reusing one ends every session, so concurrent refreshes share one request and tabs serialize through the Web Locks API. Because JS cannot tell whether the cookie exists, `localStorage` keeps a non-secret hint (`pango.session_until`: when the session ends) so first-time visitors do not trigger a pointless refresh. Cookies are sent automatically, so CSRF is the API's job (`SameSite=Lax` plus an `Origin` check on unsafe methods); a script injected into the page (XSS) cannot read the tokens but can still make requests as the user, so keep the CSP strict and never render untrusted HTML.
- **Two clients.** `authHttp` (login, signup, refresh, logout, verify email, invitations: never refreshes on a 401) and `http` (everything else: renews the session and retries once on a 401). Both send credentials. All the auth calls live in `core/auth/auth.api.ts` and answer with domain types (`Session`, `SignupResult`…), never with the raw bodies.
- **Errors** carry a stable `code`; `features/auth/lib/auth.errors.ts` maps them to Spanish copy.
- **User management** (`features/users`, `/users`) follows `pango-core`'s model: people join through **invitations** (`POST /invitations`, resend = invite again, revoke = `DELETE`), not by being created, and a pending invitation is a row of the users table with the status _Invitado_; a user's name and email belong to their account and are not edited; roles are assignments `(role, warehouse)` (the Owner role applies to every warehouse), granted with `POST /users/:id/role-assignments` and removed with `DELETE …/:assignmentId`, and the API lets you grant only roles below your own on that warehouse; (de)activation is `POST /users/:id/(de)activate`. The role list comes from `GET /roles`, and `/roles-permissions` edits each role's permissions (`PATCH /roles/:id`); creating or deleting roles is not in the UI yet. There is no departments endpoint, so the department is read-only.
- **Warehouses** (`features/warehouses`, `/warehouses`) follow `pango-core`'s `docs/warehouses.md`: `GET /warehouses?status=ALL` is not paged, so the list searches (name, code, address), filters (type, status) and keeps them in the URL like products. A warehouse is a _Bodega_ (`WAREHOUSE`) or a _Tienda_ (`STORE`), with a code and a name unique in the organization; the form proposes the code from the name and type (`suggestCode`). Clicking a name opens the detail in a side panel (`shared/ui/components/Drawer.tsx`). Closing (`PATCH … isActive: false`) asks for confirmation and is refused while the warehouse has stock (`WAREHOUSE_HAS_STOCK`). Holders of `warehouse.manage` see every warehouse; others only those where a role grants `warehouse.read`. Locations (S6–S7) and occupancy (CU-07) are not built yet.
- **Products** (`features/products`, `/products`) follow `pango-core`'s catalog (`docs/catalog.md`): the list loads the whole catalog once (`GET /products?status=ALL`, 100 per request, the API's maximum) and searches, filters and paginates it in the browser (`content/productSearch.ts`), because US-09 asks to search by code, name or family and the API search only covers code and name. Every word typed must match the code, the name or the family with its parents, ignoring case and accents; the filters live in the URL. A product needs a family (`GET /categories`, shown with its parents, e.g. _Ferretería › Tornillería_) and a unit of measure (`GET /units-of-measure`, Spanish names in `content/catalog.labels.ts`). "Nuevo producto" (`POST /products`) asks for code, name, family, unit, description, tracking (only quantity or per lot) and optional measures in cm, kg and litres; with `category.manage` a family can be created from the form. "Editar" opens the same form filled in and sends only the changed fields (`PATCH /products/:id`); the code and the tracking lock once the product has movements, which only the detail says (`GET /products/:id`, `hasMovements`), so they stay read-only until it answers. Stock, reorder point and alert status are per warehouse and only come with a product's detail (`GET /products/:id`) or the alerts, so the list does not show them yet; archiving and the product page are next.
- **Sign-up** (`/register`, main domain) creates the account and the organization; the owner must confirm the email (`/verify-email?token=`) before logging in. Invited users join from `/invitations/accept?token=` on the organization's subdomain.

With `VITE_USE_MOCK=true` set `VITE_DEV_TENANT=pango`. Seed login: `carlosarango1107@outlook.com` / `Pango123*`; invitation link: `/invitations/accept?token=invite-demo`. The mock imitates the refresh cookie with a private cookie jar and "sends" confirmation emails to the browser console. The mock keeps a single role per user and ignores warehouse scoping.

## 11. Workflow (Git and CI)

- Branches: `main` (stable) ← `develop` ← `feature/<module>-<description>`. Changes land through Pull Requests.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) in English (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`), with the module as scope. Format: `<type>(<scope>)!: <description>` (scope and `!` optional, subject up to 100 characters).
- CI (`.github/workflows/ci.yml`, GitHub Actions) runs on every push to `main`/`develop` and on every PR targeting them, and can be started manually (`workflow_dispatch`). Steps: `npm ci` → `format:check` → `lint` → `typecheck` → `test` → `build`. A new push to a PR cancels its previous run.
- Commit convention (`.github/workflows/commit-convention.yml`) runs on every PR targeting `main`/`develop` and fails if the PR title or any non-merge commit in it does not follow Conventional Commits (the title matters because squash merges use it). Merge commits and history prior to the PR are ignored. Examples: `feat(auth): add organization registration`, `fix(layout)!: drop the legacy sidebar prop`.
- Branch protection (recommended): require the **CI / Checks** and **Commit convention / Conventional Commits** status checks on `main` and `develop`, and at least one approving review.
- PR template (`.github/pull_request_template.md`) pre-fills every PR description (summary, changes, how to test, screenshots, checklist, reviewer notes).
- PR checklist: `npm run format:check`, `npm run lint`, `npm test` and `npm run build` pass · looks right in light and dark · handles loading, error and empty states · new behavior has tests · a new feature is added to `FEATURES` in `eslint.config.js`.

## 12. Reference documents.

- Platform SRS (use cases, requirements and actors).
- Entity–Relationship diagram (ERD) and initial proposed architecture (Lucidchart).
- Project IEEE paper: _Pango: Gestión Inteligente de Inventarios con Predicción de Demanda para Pequeñas y Medianas Empresas_.
