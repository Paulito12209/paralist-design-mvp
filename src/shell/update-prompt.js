/*
 * Das Fenster „Neue Version verfügbar“. Die App schaut beim Start, beim
 * Zurückkehren und alle paar Minuten nach, ob auf dem Server ein anderer
 * Versionsstempel liegt als der, mit dem sie gestartet ist
 * (src/data/version.js, geschrieben von tools/version.py). Ist das so, fragt
 * dieses Fenster, ob jetzt aktualisiert werden soll.
 *
 * Aktualisieren heißt: den Zustand sichern, jede Datei der App am
 * Zwischenspeicher des Browsers vorbei neu holen und die Seite neu laden. Ein
 * einfaches Neuladen reicht nicht — der Browser hält Skripte und Stile eine
 * Weile für frisch und zeigte sonst weiter die alte Fassung.
 * Pfad: src/shell/update-prompt.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * FIRST_CHECK_MS -> wie lange nach dem Start zum ersten Mal nachgesehen wird
 * CHECK_EVERY_MS -> wie oft danach nachgesehen wird, solange die App offen ist
 * MIN_GAP_MS     -> kürzester Abstand zwischen zwei Nachfragen, damit schnelles
 *                   Hin- und Herwechseln zwischen Apps nicht jedes Mal fragt
 *
 * Aussehen und Maße stehen in styles/update.css (--update-radius, --update-width …).
 */

import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { flushSave } from "../data/state.js";
import { appVersion } from "../data/version.js";

const FIRST_CHECK_MS = 4000;
const CHECK_EVERY_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 30 * 1000;

/* Adressen relativ zu dieser Datei, damit es auch in einem Unterordner des
   Servers stimmt (z.B. bei GitHub Pages unter /paralist-design-mvp/). */
const STAMP_URL = new URL("../data/version.js", import.meta.url);
const APP_ROOT = new URL("../../", import.meta.url);

let lastCheck = 0;
/* Die Fassung, die auf dem Server liegt und noch nicht übernommen wurde. */
let pending = null;
/* Zu dieser Fassung hat man „Später“ gesagt — sie fragt nicht noch einmal. */
let dismissed = "";
let updating = false;
let host = null;

/*
 * Den Stempel auf dem Server lesen. Die Datei wird als Text geholt, nicht als
 * Modul: ein Modul lädt der Browser pro Adresse nur einmal und gäbe danach
 * immer wieder den Stand vom Start zurück.
 */
async function fetchServerStamp() {
  const response = await fetch(STAMP_URL, { cache: "no-store" });
  if (!response.ok) return null;
  const text = await response.text();
  const version = text.match(/appVersion = "([^"]+)"/);
  const list = text.match(/appFiles = \[([\s\S]*?)\]/);
  if (!version || !list) return null;
  const files = Array.from(list[1].matchAll(/"([^"]+)"/g), (match) => match[1]);
  return { version: version[1], files };
}

/** Nachsehen, ob es eine neue Fassung gibt, und dann fragen. Offline passiert nichts. */
export async function checkForUpdate() {
  const now = Date.now();
  if (updating || document.hidden || now - lastCheck < MIN_GAP_MS) return;
  lastCheck = now;

  let server = null;
  try {
    server = await fetchServerStamp();
  } catch {
    return; /* kein Netz: beim nächsten Mal wieder */
  }
  if (!server || server.version === appVersion || server.version === dismissed) return;
  pending = server;
  showPrompt();
}

/* Das Fenster entsteht beim ersten Mal und bleibt danach im Gerät stehen. */
function ensureHost() {
  if (host && host.isConnected) return host;
  host = document.createElement("div");
  host.className = "update-backdrop";
  host.hidden = true;
  host.addEventListener("click", (event) => {
    if (event.target.closest("[data-update='now']")) applyUpdate(event.target.closest("button"));
    /* Tippen auf den abgedunkelten Rand heißt „Später“, wie bei jedem Dialog */
    else if (event.target.closest("[data-update='later']") || event.target === host) later();
  });
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape") later();
  });
  dom.device.append(host);
  return host;
}

function showPrompt() {
  const element = ensureHost();
  if (!element.hidden) return;
  /* role="alertdialog": Sprachausgaben lesen Titel und Text sofort vor, weil
     das Fenster eine Entscheidung verlangt. */
  element.innerHTML = `
    <div class="update-dialog" role="alertdialog" aria-modal="true" aria-labelledby="update-title" aria-describedby="update-text">
      ${icon("arrow-up-circle", "update-icon")}
      <h2 class="update-title" id="update-title">Neue Version verfügbar</h2>
      <p class="update-text" id="update-text">Paralist hat ein Update bekommen. Jetzt neu laden, um die neueste Fassung zu nutzen — deine Einträge bleiben erhalten.</p>
      <div class="update-actions">
        <button class="update-btn update-later" type="button" data-update="later">Später</button>
        <button class="update-btn update-now" type="button" data-update="now">Aktualisieren</button>
      </div>
    </div>
  `;
  element.hidden = false;
  element.querySelector(".update-now").focus({ preventScroll: true });
}

function later() {
  if (updating || !pending) return;
  dismissed = pending.version;
  host.hidden = true;
}

/* Sichern, alle Dateien frisch holen, neu laden. Schlägt eine Datei fehl, wird
   trotzdem neu geladen — dann holt der Browser sie beim Laden selbst. */
async function applyUpdate(button) {
  if (updating || !pending) return;
  updating = true;
  button.disabled = true;
  button.textContent = "Wird geladen …";
  flushSave();
  await Promise.allSettled(pending.files.map((name) => fetch(new URL(name, APP_ROOT), { cache: "reload" })));
  location.reload();
}

/** Das regelmäßige Nachsehen starten. Das Nachsehen beim Zurückkehren meldet src/shell/lifecycle.js. */
export function initUpdatePrompt() {
  setTimeout(checkForUpdate, FIRST_CHECK_MS);
  setInterval(checkForUpdate, CHECK_EVERY_MS);
}
