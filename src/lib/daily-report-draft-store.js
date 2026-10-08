const DRAFT_PREFIX = "daily-report-draft";
const DB_NAME = "daily-report-drafts";
const DB_VERSION = 1;
const PHOTO_STORE = "pending-photos";

const isBrowser = () => typeof window !== "undefined";

export const createDailyReportDraftKey = (siteId, reportDate) =>
  `${DRAFT_PREFIX}:${siteId || "unknown"}:${reportDate || "unknown"}`;

export const loadDailyReportDraft = (draftKey) => {
  if (!isBrowser() || !draftKey) return null;

  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveDailyReportDraft = (draftKey, payload) => {
  if (!isBrowser() || !draftKey) return;

  try {
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        ...payload,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {}
};

export const clearDailyReportDraft = (draftKey) => {
  if (!isBrowser() || !draftKey) return;

  try {
    window.localStorage.removeItem(draftKey);
  } catch {}
};

const openDb = () =>
  new Promise((resolve, reject) => {
    if (!isBrowser() || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        const store = db.createObjectStore(PHOTO_STORE, {
          keyPath: "tempId",
        });
        store.createIndex("draftKey", "draftKey", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (mode, callback) => {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, mode);
    const store = tx.objectStore(PHOTO_STORE);
    const result = callback(store);

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

export const putPendingPhotoDraft = async (record) => {
  if (!record?.tempId) return;

  await withStore("readwrite", (store) => {
    store.put(record);
  });
};

export const patchPendingPhotoDraft = async (tempId, patch) => {
  if (!tempId) return;

  const current = await getPendingPhotoDraft(tempId);
  if (!current) return;

  await putPendingPhotoDraft({
    ...current,
    ...patch,
  });
};

export const getPendingPhotoDraft = async (tempId) => {
  if (!tempId) return null;

  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readonly");
    const store = tx.objectStore(PHOTO_STORE);
    const request = store.get(tempId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const listPendingPhotoDrafts = async (draftKey) => {
  if (!draftKey) return [];

  const db = await openDb();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readonly");
    const store = tx.objectStore(PHOTO_STORE);
    const index = store.index("draftKey");
    const request = index.getAll(draftKey);

    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => reject(request.error);
  });
};

export const deletePendingPhotoDraft = async (tempId) => {
  if (!tempId) return;

  await withStore("readwrite", (store) => {
    store.delete(tempId);
  });
};
