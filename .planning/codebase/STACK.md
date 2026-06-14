# Technology Stack

**Analysis Date:** 2026-06-14

## Languages

**Primary:**
- TypeScript `^4.9.5` - All application source under `src/` (`.ts`/`.tsx`), service worker, E2E tests
- JavaScript (ES5 target) - Build tooling (`craco.config.js`), performance test runner (`tests/e2e/runPerformanceCommand.cjs`)

**Secondary:**
- Less - Component/theme styling via `craco-less` (Ant Design theme overrides in `craco.config.js`)
- CSS - `src/App.css`, `src/index.css`

## Runtime

**Environment:**
- Node.js - Dev server and build run with `NODE_OPTIONS=--max-old-space-size=4096` (`package.json` scripts)
- Browser - Client-side SPA; no backend server. Targets defined in `browserslist` (`package.json`)

**Package Manager:**
- Yarn (lockfile `yarn.lock` present, ~521 KB)
- npm also referenced (`npm start` in `playwright.config.ts` webServer command)
- Lockfile: present (`yarn.lock`)

## Frameworks

**Core:**
- React `^18.2.0` - UI framework (`react`, `react-dom`)
- Redux Toolkit `^2.2.3` - State management (`@reduxjs/toolkit`, `react-redux ^9.1.0`)
- React Router DOM `^6.22.3` - Client-side routing (`src/Routing/`)
- Ant Design `^5.16.1` - Component library (`antd`), wrapped by local components in `src/Components/`

**Testing:**
- Jest (via `react-scripts test`) - Unit tests; `@testing-library/react ^13.4.0`, `@testing-library/jest-dom ^5.17.0`, `@testing-library/user-event ^13.5.0`
- Playwright `^1.60.0` - E2E and performance tests (`playwright.config.ts`, `tests/e2e/`)

**Build/Dev:**
- Create React App via `react-scripts 5.0.1`
- CRACO `^7.1.0` (`@craco/craco`) - Overrides CRA webpack config (`craco.config.js`)
- craco-less `^3.0.1` - Less loader integration with theme `modifyVars`
- Workbox `^6.6.0` (multiple `workbox-*` packages) - Service worker / PWA precaching (`src/service-worker.ts`)

## Key Dependencies

**Critical:**
- `redux-persist ^6.0.0` - Persists Redux state to IndexedDB (`src/Store/Store.ts`)
- `localforage ^1.10.0` - IndexedDB wrapper backing all durable storage (`src/Common/Storage/AppStorage.ts`)
- `redux-thunk ^3.1.0` - Async action support
- `reselect ^5.1.0` - Memoized selectors (`src/Store/Selectors.ts`)
- `nanoid 4.0.1` - ID generation
- `lodash ^4.17.21` - Utility functions

**Infrastructure:**
- `react-window ^2.2.7` - Virtualized list rendering (`src/Hooks/usePagedVirtualItems.ts`)
- `recharts ^3.8.1` - Charts/visualizations
- `dayjs ^1.11.10` and `moment ^2.30.1` - Date handling (both present)
- `react-copy-to-clipboard ^5.1.0` - Clipboard helper
- `web-vitals ^2.1.4` - Performance metrics (`src/reportWebVitals.ts`)

## Configuration

**Environment:**
- `.env` file present at repo root - contains build-time environment configuration (contents not read)
- Env vars referenced in code (all `REACT_APP_*` are build-time inlined by CRA):
  - `REACT_APP_GH_TOKEN` - Obfuscated GitHub token for shared-data publishing (`src/Hooks/useSharedPublish.ts`)
  - `REACT_APP_ADMIN_PIN` - Obfuscated admin PIN for admin mode (`src/Hooks/useAdminMode.ts`)
  - `PUBLIC_URL` - Service worker scope/registration (`src/service-worker.ts`, `src/serviceWorkerRegistration.ts`)
  - `NODE_ENV` - Toggles Redux devtools and SW registration (`src/Store/Store.ts`, `src/serviceWorkerRegistration.ts`)
  - `PORT`, `BROWSER`, `E2E_PORT`, `E2E_BROWSER_CHANNEL`, `PERF_DIAGNOSTIC` - E2E config (`playwright.config.ts`)
  - `FAST_REFRESH`, `GENERATE_SOURCEMAP`, `NODE_OPTIONS` - Build/dev flags (`package.json` scripts)

**Build:**
- `craco.config.js` - Webpack alias setup (`@components`, `@routing`, `@modules`, `@store`, `@common`, `@hooks`), removes `ModuleScopePlugin`, Less theme vars
- `tsconfig.json` - Target `es5`, `strict: false`, `jsx: react-jsx`, path aliases mirroring webpack aliases
- `package.json` - `browserslist`, ESLint config (`react-app`, `react-app/jest`)

## Platform Requirements

**Development:**
- Node.js with ~4 GB heap (`--max-old-space-size=4096`)
- Yarn for dependency install
- Dev server served under `/my-recipes/` base path (E2E `baseURL`)

**Production:**
- Static SPA hosted via GitHub Pages — built assets copied from `build/` into `docs/` (`AGENTS.md`, `docs/deployment.md`)
- PWA with offline support via service worker (`src/service-worker.ts`)
- Deployed at `quantran-epi/my-household` repo path; shared data served from `quantran-epi/my-recipes` raw GitHub content

---

*Stack analysis: 2026-06-14*
