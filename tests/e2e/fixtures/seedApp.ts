import type { Page } from '@playwright/test';
import { applyPerformanceNetworkMode, type PerformanceNetworkOptions } from './performanceNetwork';
import { createPerformanceSeed, type PerformanceDatasetName } from './performanceSeed';
import { createRegressionSeed } from './testData';

type PersistSlices = Record<string, unknown>;
export type SyncCheckState = 'fresh' | 'due' | 'missing';

const SYNC_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type SeedAppOptions = PerformanceNetworkOptions & {
  dataset?: PerformanceDatasetName;
  syncCheckState?: SyncCheckState;
  /**
   * When true, seeds a cold-start catalog with NO dishes and NO ingredients (and no
   * scheduled meals) so WIZ-07's empty-catalog branch can be exercised. The
   * welcome-complete flag is still set (see below) so the app does NOT redirect to
   * /guide/welcome — a first-timer lands directly on the requested route with empty data.
   */
  emptyCatalog?: boolean;
};

// Empty cold-start dataset (planner decision 6): mirrors the createRegressionSeed shape
// but with empty shared catalog arrays and empty personal collections. Used by the
// WIZ-07 cold-start E2E. Kept structurally identical to the regression seed so the
// persist:shared / persist:personal writes below treat it as synced-but-empty rather
// than unfetched.
const createEmptyCatalogSeed = () => ({
  shared: {
    ingredient: { ingredients: [] },
    dishes: { dishes: [], searchText: '', currentPage: 1 },
  },
  personal: {
    appContext: { loading: false, currentFeatureName: '' },
    inventory: { items: {} },
    shoppingList: { shoppingLists: [] },
    scheduledMeal: { scheduledMeals: [], selectedMeals: [] },
    cookingSession: { sessions: [] },
  },
});

const persistRoot = (slices: PersistSlices): string => {
  return JSON.stringify({
    ...Object.fromEntries(Object.entries(slices).map(([key, value]) => [key, JSON.stringify(value)])),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });
};

export const seedApp = async (page: Page, options: SeedAppOptions = {}) => {
  const seed = options.emptyCatalog
    ? createEmptyCatalogSeed()
    : options.dataset
    ? createPerformanceSeed(options.dataset)
    : createRegressionSeed();
  const syncCheckState = options.syncCheckState ?? 'fresh';

  const networkMode = await applyPerformanceNetworkMode(page, options);

  await page.goto('/');
  await page.evaluate(async ({ shared, personal, syncCheckState, syncCheckIntervalMs }) => {
    const openAppDb = () => new Promise<IDBDatabase>((resolve, reject) => {
      // Open at the DB's current version (no fixed version): the app boots during the
      // preceding page.goto('/') and localforage lazily bumps the IndexedDB version when
      // it creates the blob-support store, so a hard-coded `version 1` open races into a
      // VersionError ("requested version (1) is less than the existing version (2)").
      // Omitting the version opens whatever exists, and still creates the stores on a
      // brand-new DB (onupgradeneeded fires at version 1).
      const request = indexedDB.open('my-recipes');
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('app_storage')) db.createObjectStore('app_storage');
        if (!db.objectStoreNames.contains('local-forage-detect-blob-support')) db.createObjectStore('local-forage-detect-blob-support');
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const setIndexedDbItems = async (items: Record<string, string>) => {
      const db = await openAppDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('app_storage', 'readwrite');
        const store = tx.objectStore('app_storage');
        store.clear();
        Object.entries(items).forEach(([key, value]) => store.put(value, key));
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();
      });
      db.close();
    };

    localStorage.clear();
    sessionStorage.clear();

    // MasterPage redirects to the welcome/onboarding screen on every navigation until this
    // flag is set (isUserGuideWelcomeComplete reads it from localStorage). Because the seed
    // clears localStorage above, every seeded page would otherwise boot into onboarding and
    // never reach the requested route. Mark the welcome flow complete so specs land on their
    // target route directly. Keep in sync with USER_GUIDE_WELCOME_STORAGE_KEY.
    localStorage.setItem('my-recipes-welcome-complete-v1', '1');

    const sharedPersist = JSON.stringify({
      ingredient: JSON.stringify(shared.ingredient),
      dishes: JSON.stringify(shared.dishes),
      _persist: JSON.stringify({ version: -1, rehydrated: true }),
    });

    const personalPersist = JSON.stringify({
      appContext: JSON.stringify(personal.appContext),
      inventory: JSON.stringify(personal.inventory),
      shoppingList: JSON.stringify(personal.shoppingList),
      scheduledMeal: JSON.stringify(personal.scheduledMeal),
      cookingSession: JSON.stringify(personal.cookingSession),
      _persist: JSON.stringify({ version: -1, rehydrated: true }),
    });

    let lastChecked: string | null = null;
    if (syncCheckState === 'fresh') {
      lastChecked = Date.now().toString();
    } else if (syncCheckState === 'due') {
      lastChecked = String(Date.now() - syncCheckIntervalMs - 1000);
    }

    await setIndexedDbItems({
      'persist:shared': sharedPersist,
      'persist:personal': personalPersist,
      ...(lastChecked ? { shared_last_checked: lastChecked } : {}),
      shared_synced_versions: JSON.stringify({ ingredientsVersion: 'e2e', dishesVersion: 'e2e' }),
    });

    void navigator.serviceWorker?.getRegistrations?.().then(registrations => {
      registrations.forEach(registration => void registration.unregister());
    });
    void caches?.keys?.().then(keys => {
      keys.forEach(key => void caches.delete(key));
    });
  }, { ...seed, syncCheckState, syncCheckIntervalMs: SYNC_CHECK_INTERVAL_MS });

  await page.goto('about:blank');

  return networkMode;
};

export const createPersistedSeed = () => {
  const seed = createRegressionSeed();
  return {
    shared: persistRoot(seed.shared),
    personal: persistRoot(seed.personal),
  };
};
