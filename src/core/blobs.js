/*
 * Die echten Dateien hinter den Medien-Einträgen: Fotos, Videos, Aufnahmen
 * und PDFs liegen als Ganzes in der Datenbank des Browsers (IndexedDB), nicht
 * im übrigen Speicher. Nur so lassen sie sich später wirklich abspielen —
 * localStorage wäre nach wenigen Videos voll.
 * Pfad: src/core/blobs.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * dbName     -> Name der Browser-Datenbank (ändern heißt: alte Dateien sind weg)
 * storeName  -> Name der Ablage darin
 * dbVersion  -> hochzählen, wenn sich der Aufbau der Ablage ändert
 */

const dbName = "paralist-files";
const storeName = "files";
const dbVersion = 1;

let openTask = null;

/* Die Datenbank wird erst beim ersten Zugriff geöffnet und dann gemerkt. */
function openDb() {
  if (openTask) return openTask;
  openTask = new Promise((resolve, reject) => {
    /* indexedDB: die einzige Ablage im Browser, die ganze Dateien fassen kann */
    const request = indexedDB.open(dbName, dbVersion);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    /* Privates Fenster oder gesperrter Speicher: die App läuft ohne Dateien weiter */
    openTask = null;
    throw error;
  });
  return openTask;
}

/* Eine Aufgabe in der Ablage ausführen und auf ihr Ende warten. */
function run(mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const request = work(tx.objectStore(storeName));
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
        tx.oncomplete = () => resolve(request ? request.result : undefined);
      })
  );
}

/**
 * Datei zu einem Eintrag ablegen.
 * Gibt `false` zurück, wenn der Browser sie nicht speichern konnte — die
 * Kachel bleibt dann sichtbar, nur das Abspielen geht nicht.
 */
export function putBlob(id, file) {
  return run("readwrite", (store) => store.put(file, String(id))).then(
    () => true,
    () => false
  );
}

/** Datei eines Eintrags, oder `null`, wenn keine da ist. */
export function getBlob(id) {
  return run("readonly", (store) => store.get(String(id))).then(
    (value) => value || null,
    () => null
  );
}

/** Datei eines Eintrags entfernen. Fehler sind hier egal: sie bleibt dann liegen. */
export function deleteBlob(id) {
  return run("readwrite", (store) => store.delete(String(id))).then(
    () => true,
    () => false
  );
}

/**
 * Dateien aufräumen, zu denen es keinen Eintrag mehr gibt.
 * Wird nach dem Löschen aufgerufen, nicht bei jedem Speichern.
 */
export function pruneBlobs(aliveIds) {
  const alive = new Set(aliveIds.map((id) => String(id)));
  return run("readwrite", (store) => {
    const request = store.getAllKeys();
    request.onsuccess = () => {
      request.result.forEach((key) => {
        if (!alive.has(String(key))) store.delete(key);
      });
    };
    return null;
  }).catch(() => false);
}
