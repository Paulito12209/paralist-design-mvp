/*
 * Zugriff auf den Browser-Speicher. In privaten Fenstern kann jeder Zugriff
 * fehlschlagen — deshalb ist hier alles abgesichert und die App läuft dann
 * einfach ohne Merken weiter.
 * Pfad: src/core/storage.js
 *
 * Keine anpassbaren visuellen Werte.
 */

/** Alle Schlüssel an einer Stelle, damit nichts doppelt vergeben wird. */
export const storageKeys = {
  state: "paralist-mvp",
  theme: "paralist-theme",
  usage: "paralist-usage",
  avatar: "paralist-avatar",
  media: "paralist-media",
};

/** Liest gespeichertes JSON. Fehlt es oder ist es kaputt, kommt `fallback` zurück. */
export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

/** Schreibt JSON. Gibt `false` zurück, wenn der Speicher nicht zur Verfügung steht oder voll ist. */
export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

/** Liest einen einfachen Text (z.B. das Profilbild als Data-URL). */
export function readText(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

/** Schreibt einen einfachen Text; ein leerer Wert löscht den Eintrag. */
export function writeText(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}
