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
  /* Stand von vor „?demo=1“ — src/shell/demo-load.js stellt ihn mit „?demo=0“ wieder her */
  demoBackup: "paralist-mvp-vor-demo",
  /* Stand von vor dem letzten „Ersetzen“ beim Import — zurück unter Einstellungen › Daten importieren (src/data/transfer-snapshot.js) */
  importBackup: "paralist-mvp-vor-import",
  /* Name, Mail, Telefon, Links und der Tag des ersten Öffnens („Dabei seit“) */
  profile: "paralist-profile",
  theme: "paralist-theme",
  usage: "paralist-usage",
  avatar: "paralist-avatar",
  avatarSource: "paralist-avatar-source",
  media: "paralist-media",
  feedback: "paralist-feedback",
  navLabels: "paralist-nav-labels",
  searchKeyboard: "paralist-search-keyboard",
  navGlow: "paralist-nav-glow",
  pageHead: "paralist-page-head",
  /* Erklärtext und Emblem in leeren Sammlungen: „0“ = aus, sonst an */
  emptyExplain: "paralist-empty-explain",
  tabIcons: "paralist-tab-icons",
  /* Reiter über den Listen je Seite („…-home“, „…-projects“, „…-tasks“, „…-pages“): „on“ oder „off“ — nur Android (Experiment) */
  tabsVisible: "paralist-tabs-visible",
  newViewPlace: "paralist-new-view-place",
  /* Gewählte Fassung je Gerät, {mobile, desk} — index.html liest denselben Namen. */
  versions: "paralist-versions",
  milestones: "paralist-milestones",
  deskNav: "paralist-desk-nav",
  deskHints: "paralist-desk-hints",
  /* Seitenleiste am Desktop: welche Liste unter „Liste“ steht und ob „Archiviert“ offen ist */
  deskList: "paralist-desk-list",
  deskArchive: "paralist-desk-archive",
  /* Werkzeugleiste der Zeichnung am Desktop: wo sie steht, Strichbreiten, eigene Farben */
  drawPrefs: "paralist-draw-prefs",
  /* Seitenfenster rechts am Desktop: offen, breit, was darin steht, letzte Adresse */
  deskSide: "paralist-desk-side",
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
