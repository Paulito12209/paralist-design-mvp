/*
 * Die Momentaufnahme für Export und Import: alles, was die App im
 * Browser-Speicher hält — der Zustand (Tabs, Arbeitsbereiche, Einträge,
 * Ansichten), die Vorschaubilder samt Zeichnungsstrichen und die
 * Einstellungen (Darstellung, Profil, gewählte Fassung …). Die Dateien der
 * Medien liegen in der Browser-Datenbank (src/core/blobs.js) und kommen nur
 * in den ZIP-Export; hier steht nur ihre Liste.
 *
 * Außerdem die Sicherung von vor einem „Ersetzen“: ein Import überschreibt
 * nie still, der alte Stand lässt sich unter Einstellungen › Daten
 * importieren zurückholen, bis der nächste Import ihn ablöst.
 * Pfad: src/data/transfer-snapshot.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * transferFormat  -> Kennung in der Datei, an der der Import sie erkennt
 * transferVersion -> Fassung des Dateiaufbaus; hochzählen, wenn er sich ändert
 * skipKeys        -> Speicherschlüssel, die nicht in den Export gehören
 */

import { readJson, readText, storageKeys, writeJson, writeText } from "../core/storage.js";
import { appVersion } from "./version.js";

export const transferFormat = "paralist";
export const transferVersion = 1;

/* state und media (Vorschaubilder) stehen eigens in der Datei; Sicherungen gehören nicht hinein */
const skipKeys = ["state", "media", "demoBackup", "importBackup"];

/** Dateiendung aus Name oder MIME-Typ einer Mediendatei („mp4“, „jpg“, …). */
export function fileExtension(media) {
  const fromName = /\.([a-z0-9]{1,5})$/i.exec(media.name || "");
  if (fromName) return fromName[1].toLowerCase();
  const fromMime = /^[a-z]+\/([a-z0-9.+-]+)$/i.exec(media.mime || "");
  if (!fromMime) return "bin";
  const sub = fromMime[1].toLowerCase();
  return sub === "jpeg" ? "jpg" : sub === "quicktime" ? "mov" : sub === "x-m4a" ? "m4a" : sub;
}

/** Die Medien-Einträge eines Zustands als Liste für die Datei: Nummer, Name, Typ, Größe. */
export function mediaList(state) {
  return (state.entries || [])
    .filter((entry) => entry.type === "medien" && entry.media)
    .map((entry) => ({
      id: entry.id,
      name: entry.media.name || "",
      mime: entry.media.mime || "",
      size: entry.media.size || 0,
      file: `medien/${entry.id}.${fileExtension(entry.media)}`,
    }));
}

/* Alle Einstellungen roh, unter ihrem Kurznamen aus storageKeys. */
function readSettings() {
  const settings = {};
  Object.entries(storageKeys).forEach(([name, key]) => {
    if (skipKeys.includes(name)) return;
    const raw = readText(key);
    if (raw !== null) settings[name] = raw;
  });
  return settings;
}

/**
 * Die Momentaufnahme bauen.
 * @param withThumbs true: Vorschaubilder und Zeichnungen stecken als Data-URLs
 *   mit in der Datei (Export „Paralist-Datei“); false: sie liegen daneben im ZIP
 */
export function buildSnapshot({ withThumbs }) {
  const state = readJson(storageKeys.state, {});
  return {
    format: transferFormat,
    version: transferVersion,
    app: appVersion,
    exportedAt: new Date().toISOString(),
    state,
    thumbs: withThumbs ? readJson(storageKeys.media, {}) : undefined,
    settings: readSettings(),
    media: mediaList(state),
  };
}

/** Ist das eine Paralist-Datei, die dieser Stand lesen kann? */
export function isSnapshot(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.format === transferFormat &&
      Number(value.version) >= 1 &&
      value.state &&
      typeof value.state === "object"
  );
}

/** Die Vorschaubilder einer Datei — ein Objekt { "12": "data:…" }, sonst leer. */
export function thumbsOf(snapshot) {
  const thumbs = snapshot.thumbs;
  return thumbs && typeof thumbs === "object" && !Array.isArray(thumbs) ? thumbs : {};
}

/**
 * Eine Momentaufnahme als neuen Stand schreiben (Zustand, Vorschaubilder,
 * Einstellungen). Danach muss die Seite neu laden — der laufende Zustand im
 * Speicher stimmt sonst nicht mehr mit dem Browser-Speicher überein.
 * Gibt false zurück, wenn der Zustand nicht geschrieben werden konnte.
 */
export function writeSnapshot(snapshot, thumbs) {
  if (!writeJson(storageKeys.state, snapshot.state)) return false;
  writeJson(storageKeys.media, thumbs || {});
  const settings = snapshot.settings && typeof snapshot.settings === "object" ? snapshot.settings : {};
  Object.entries(settings).forEach(([name, raw]) => {
    if (skipKeys.includes(name) || !storageKeys[name] || typeof raw !== "string") return;
    writeText(storageKeys[name], raw);
  });
  return true;
}

/** Den jetzigen Stand (Zustand und Vorschaubilder) sichern. false, wenn der Speicher dafür nicht reicht. */
export function backupBeforeImport() {
  return writeJson(storageKeys.importBackup, {
    savedAt: new Date().toISOString(),
    state: readJson(storageKeys.state, {}),
    thumbs: readJson(storageKeys.media, {}),
  });
}

/** Wann der Stand von vor dem letzten Import gesichert wurde — null, wenn es keinen gibt. */
export function importBackupTime() {
  const backup = readJson(storageKeys.importBackup);
  return backup && backup.state ? backup.savedAt || "" : null;
}

/** Den gesicherten Stand zurückschreiben und die Sicherung löschen. Danach neu laden. */
export function restoreImportBackup() {
  const backup = readJson(storageKeys.importBackup);
  if (!backup || !backup.state) return false;
  if (!writeJson(storageKeys.state, backup.state)) return false;
  writeJson(storageKeys.media, backup.thumbs || {});
  writeText(storageKeys.importBackup, "");
  return true;
}
