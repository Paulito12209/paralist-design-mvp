/*
 * Das Suchfeld der „OG Version“ nach GlobalSearchOverlay (Organi7er): ohne
 * Eingabe steht nur die Seite „Suchen“ mit der Reiterleiste. Erst ein zweiter
 * Tipp auf die Suche (Lupe bzw. Reiter „Suchen“, solange sie offen ist) oder
 * ein Tipp in ein Feld klappt unten die Glas-Pille „Nach etwas suchen …“ mit
 * Mikrofon auf, daneben der runde ✕-Knopf; die Reiterleiste ist dann weg.
 * Die Pille bleibt, solange ein Begriff im Feld steht, auch wenn die Tastatur
 * zugeht. Das Feld selbst ist dasselbe wie in der Kopfzeile (src/shell/search-bar.js);
 * in der „OG Version“ wohnt es in einer eigenen Zeile der unteren Leiste
 * (.og-field-row) und kehrt in den anderen Fassungen in die Kopfzeile zurück.
 * Dazu kommen Mikrofon und ✕ und die Klasse „is-search-field“ am <body>, nach
 * der styles/og-search-field.css Zeile und Reiterleiste ein- und ausblendet.
 * Pfad: src/shell/og-search-field.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ogPlaceholder -> Hinweistext im Feld der „OG Version“
 *
 * Maße und Farben der Pille: styles/og-search-field.css.
 */

import { events, on } from "../core/bus.js";
import { dom, el } from "../core/dom.js";
import { icon } from "../core/html.js";
import { ui } from "../data/state.js";
import { isDesk } from "../ui/desk-mode.js";
import { isMobileOs } from "../ui/platform.js";
import { isViewActive } from "../ui/views.js";
import { initSearchVoice } from "./search-voice.js";

const ogPlaceholder = "Nach etwas suchen …";

/* Ob der Nutzer die Pille aufgeklappt hat, bevor etwas im Feld steht */
let fieldOpen = false;
let normalPlaceholder = "";
let row = null;

/** Gilt die „OG Version“ am Handy? */
export function isOgField() {
  return isMobileOs("ios") && document.documentElement.dataset.mobileVariant === "og" && !isDesk();
}

/* Das Feld an seinen Platz setzen: unten in der Zeile der „OG Version“, sonst in der Kopfzeile.
   Mit Fokus bleibt es, wo es ist — ein Umhängen ließe die Tastatur zuklappen. */
function placeField(og) {
  const entry = el("search-entry");
  if (document.activeElement === dom.searchInput) return;
  if (og && entry.parentElement !== row) row.prepend(entry);
  if (!og && entry.parentElement === row) el("profile-btn").before(entry);
}

/** Klasse, Hinweistext und Platz des Feldes nachführen; nach jeder Änderung von Fokus, Eingabe und Seite aufrufen. */
export function syncSearchField() {
  const og = isOgField();
  placeField(og);
  const open = og && (fieldOpen || ui.searchTyping || Boolean(ui.searchQuery));
  document.body.classList.toggle("is-search-field", open);
  dom.searchInput.placeholder = og ? ogPlaceholder : normalPlaceholder;
}

/** Die Pille aufklappen und die Tastatur holen. */
export function openSearchField() {
  if (!isOgField()) return;
  fieldOpen = true;
  syncSearchField();
  dom.searchInput.focus();
}

/** Die Pille schließen, wenn nichts mehr im Feld steht (Tastatur zu). */
export function releaseSearchField() {
  if (!ui.searchQuery) fieldOpen = false;
  syncSearchField();
}

/**
 * Mikrofon und ✕ einhängen und die Tipps auf die Suche anmelden.
 * @param close      wird vom ✕ gerufen: Feld leeren, Tastatur weg, Pille zu
 */
export function initOgSearchField({ close }) {
  normalPlaceholder = dom.searchInput.placeholder;

  /* Mikrofon im Feld: spricht in dasselbe Feld wie die Pille unten in den anderen Fassungen */
  const mic = document.createElement("button");
  mic.className = "og-field-mic";
  mic.type = "button";
  mic.setAttribute("aria-label", "Suchbegriff diktieren");
  mic.innerHTML = icon("mic");
  el("search-entry").append(mic);
  initSearchVoice(mic);

  row = document.createElement("div");
  row.className = "og-field-row";
  dom.bottomBar.append(row);

  /* ✕ rechts neben der Pille: beendet die Suche */
  const x = document.createElement("button");
  x.className = "og-field-close";
  x.type = "button";
  x.setAttribute("aria-label", "Suche schließen");
  x.innerHTML = icon("close");
  x.addEventListener("click", () => {
    fieldOpen = false;
    close();
    syncSearchField();
  });
  row.append(x);

  /* Ein Tipp auf die Lupe oder den Reiter „Suchen“, während die Suche schon offen ist:
     capture, weil die Lupe selbst die Seite öffnet und danach „offen“ immer stimmte. */
  let wasOpen = false;
  document.addEventListener(
    "click",
    (event) => {
      wasOpen = Boolean(event.target.closest(".og-search, [data-tab='search']")) && isViewActive("search");
    },
    true
  );
  document.addEventListener("click", (event) => {
    if (wasOpen && event.target.closest(".og-search, [data-tab='search']")) openSearchField();
  });
  /* Das Pendant, falls die Leiste „Reiter noch einmal angetippt“ meldet */
  on(events.tabReselected, (tab) => {
    if (tab === "search") openSearchField();
  });

  /* Frisch geöffnet: erst ohne Pille; nach dem Verlassen bleibt keine alte Wahl zurück */
  on(events.viewOpened, (name) => {
    if (name !== "search") fieldOpen = false;
    syncSearchField();
  });
  on(events.contextChanged, syncSearchField);
  syncSearchField();
}
