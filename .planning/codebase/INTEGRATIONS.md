# External Integrations

**Analysis Date:** 2026-06-14

## APIs & External Services

**GitHub REST API (`https://api.github.com`):**
- Gist API - Personal data backup/restore (`src/Hooks/useGistBackup.ts`)
  - `GET/PATCH /gists/{gistId}` - Read and update backup gist
  - `GET /user` - Validate token
  - `GET {file.raw_url}` - Fetch individual gist part files
  - Auth: Personal Access Token supplied by the user, stored in IndexedDB (`personal_gist_token`)
- Repository Contents API - Admin shared-data publishing (`src/Hooks/useSharedPublish.ts`)
  - `GET /user`, `GET /repos/{REPO_OWNER}/{REPO_NAME}` - Token/repo validation
  - Writes split shared files under `docs/sync/shared/` (manifest, ingredients, dishes, config)
  - Repo: `quantran-epi/my-recipes` (`REPO_OWNER`, `REPO_NAME` constants)
  - Auth: GitHub token (build-time `REACT_APP_GH_TOKEN`, obfuscated; or token stored under `shared_publish_github_token`)

**GitHub Raw Content (`https://raw.githubusercontent.com`):**
- Shared data sync (read-only) - `src/Hooks/useSharedDataSync.ts`, `src/Hooks/useSharedPublish.ts`
  - Base: `.../quantran-epi/my-recipes/refs/heads/main/docs/sync/shared`
  - `SHARED_MANIFEST_URL` (`/manifest.json`) plus per-part `ingredients.json`, `dishes.json`, `config.json`
  - No auth (public raw content); cache-busted with `?t={timestamp}`

## Data Storage

**Databases:**
- IndexedDB (browser) - Primary durable store
  - Wrapper: `localforage ^1.10.0`, instance `my-recipes` / store `app_storage` (`src/Common/Storage/AppStorage.ts`)
  - Redux state persisted via `redux-persist` over IndexedDB adapter (`src/Store/Store.ts`)
  - No server-side database

**File Storage:**
- GitHub Gist - Personal backup parts stored as gist files (`src/Hooks/useGistBackup.ts`)
- GitHub repo files - Shared data published as JSON under `docs/sync/shared/` (`src/Hooks/useSharedPublish.ts`)

**Caching:**
- Workbox service worker - Precache + `StaleWhileRevalidate` runtime caching (`src/service-worker.ts`)
- IndexedDB stores synced version stamps (`shared_synced_versions`, `shared_last_checked`)

## Authentication & Identity

**Auth Provider:**
- Custom, client-side only — no user accounts or identity provider
  - Admin mode: PIN gate (`src/Hooks/useAdminMode.ts`). PIN sourced from obfuscated `REACT_APP_ADMIN_PIN`; unlock flag stored as `app_admin_unlocked` in IndexedDB
  - GitHub access: user-supplied PAT (Gist backup) or build-injected obfuscated token (shared publish)
  - Token obfuscation: simple XOR-with-key over base64 (`_dt` helper in `useSharedPublish.ts` and `useAdminMode.ts`) — obfuscation, not encryption

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Bugsnag/etc.)

**Logs:**
- Web Vitals reporting hook present but not wired to a backend (`src/reportWebVitals.ts`)
- Browser console only

## CI/CD & Deployment

**Hosting:**
- GitHub Pages - Static build served from `docs/` directory
- Deploy flow (`AGENTS.md`, `docs/deployment.md`): `yarn build`, copy `build/*` into `docs/` (excluding `build/manifest.json`), then `git add`/`git push`

**CI Pipeline:**
- None detected (no `.github/workflows`, CI config files found)

## Environment Configuration

**Required env vars (names only):**
- `REACT_APP_GH_TOKEN` - Build-time GitHub token for shared-data publishing
- `REACT_APP_ADMIN_PIN` - Build-time admin PIN
- `PUBLIC_URL` - Service worker base path

**Secrets location:**
- `.env` at repo root (present; contents not read). Note: `REACT_APP_*` values are inlined into the client bundle at build time, so the obfuscated token/PIN ship to the browser
- Runtime user tokens stored in IndexedDB keys: `personal_gist_token`, `shared_publish_github_token`

## Webhooks & Callbacks

**Incoming:**
- None (static SPA, no server endpoints)

**Outgoing:**
- None (no webhook dispatch; all GitHub interaction is direct fetch from the client)

---

*Integration audit: 2026-06-14*
