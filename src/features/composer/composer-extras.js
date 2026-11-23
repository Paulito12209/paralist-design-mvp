/*
 * „Android (Xool-DB)“: das Eingabe-Blatt wie in der Xool-App (Vorbild Google
 * Tasks). Über dem Feld steht „Eingang ▾“ erst, sobald etwas getippt ist oder
 * ein Ort feststeht; unter dem Feld auf Wunsch die Details und das gewählte
 * Datum als Chip; unten die Werkzeuge Anhang (+) · Details · Uhr · Favorit ·
 * Anpinnen und rechts „Speichern“. Was zum Typ nicht passt, fehlt: die Uhr
 * gibt es nur an Aufgabe, Termin und Projekt, an Medium und Arbeitsbereich
 * keine der vier Werkzeuge (sie würden dort nicht übernommen).
 * Die Teile entstehen in jeder Fassung, sichtbar sind sie nur in dieser
 * (styles/android-xool-composer.css) — und übernommen wird auch nur dort.
 * Pfad: src/features/composer/composer-extras.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * datedTypes    -> Typen, die ein Datum tragen und darum die Uhr bekommen
 * tools         -> die Werkzeuge von links nach rechts (Icon, Name für Vorleser,
 *                  activeIcon = Zeichen im eingeschalteten Zustand)
 * detailsHint   -> Platzhalter des Details-Felds
 * whenFormat    -> wie der Tag im Datums-Chip steht („Fr., 17. Okt.“)
 *
 * Maße und Farben: styles/android-xool-composer.css.
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { openWhenPicker } from "../../ui/date-field.js";
import { isDesk } from "../../ui/desk-mode.js";
import { isMobileVariant } from "../../ui/platform.js";
import { composer } from "./composer-state.js";
import { isWorkspaceDraft } from "./composer-workspace.js";

const datedTypes = ["aufgabe", "termin", "projekt"];
const tools = [
  { id: "details", icon: "align-left", label: "Details" },
  { id: "when", icon: "clock", label: "Datum und Uhrzeit" },
  { id: "favorite", icon: "star-outline", activeIcon: "star", label: "Favorit" },
  { id: "pinned", icon: "pinned", label: "Anpinnen" },
];
const detailsHint = "Details hinzufügen";
const whenFormat = { weekday: "short", day: "numeric", month: "short" };

/* Was der Entwurf neben Titel, Typ und Ort trägt; `slot` merkt sich die
   Kalenderstunde, aus der das Datum schon übernommen wurde. */
const blank = () => ({ showDetails: false, favorite: false, pinned: false, date: "", time: "", slot: null });
let extras = blank();

/* Die Teile im Eingabefeld, einmal angelegt */
let details = null;
let whenChip = null;
let whenText = null;
const toolButtons = {};

/* Gilt das Blatt der Xool-App gerade? Am Desktop hat das Eingabefeld seine eigene Form. */
function isXoolSheet() {
  return isMobileVariant("xool") && !isDesk();
}

/* Medien und Arbeitsbereiche übernehmen weder Details noch Datum noch Markierungen */
function takesExtras() {
  return !isWorkspaceDraft() && composer.type !== "medien";
}

/* „Fr., 17. Okt., 09:00“ — kurz genug für eine Chip-Zeile */
function whenLabel() {
  if (!extras.date) return "";
  const day = new Intl.DateTimeFormat("de-DE", whenFormat).format(new Date(`${extras.date}T12:00`));
  return [day, extras.time].filter(Boolean).join(", ");
}

/** Werkzeuge, Details, Datums-Chip und „Eingang ▾“ zum Stand des Entwurfs zeichnen. */
export function renderComposerExtras() {
  if (!details) return;
  const on = isXoolSheet();
  const usable = on && takesExtras();
  const dated = usable && datedTypes.includes(composer.type);
  /* Aus einer angetippten Kalenderstunde steht das Datum gleich im Chip */
  if (composer.slot && extras.slot !== composer.slot) {
    extras.slot = composer.slot;
    extras.date = composer.slot.date;
    extras.time = composer.slot.time || "";
  }
  details.hidden = !(usable && extras.showDetails);
  whenText.textContent = dated ? whenLabel() : "";
  whenChip.hidden = !whenText.textContent;
  const active = { details: extras.showDetails, when: Boolean(extras.date), favorite: extras.favorite, pinned: extras.pinned };
  tools.forEach((tool) => {
    const button = toolButtons[tool.id];
    button.hidden = !usable || (tool.id === "when" && !dated);
    button.classList.toggle("is-active", active[tool.id]);
    button.setAttribute("aria-pressed", String(active[tool.id]));
    if (tool.activeIcon) button.querySelector("use").setAttribute("href", `#icon-${active[tool.id] ? tool.activeIcon : tool.icon}`);
  });
  /* „Eingang ▾“ erst, wenn etwas getippt ist oder der Ort schon feststeht —
     vorher zählt nur das Feld. Das Zeichen sagt: Eingang oder verknüpft. */
  const inbox = !composer.place && !composer.link;
  const hasDraft = Boolean(dom.composerInput.value.trim() || composer.files.length);
  dom.composer.classList.toggle("is-place-quiet", on && inbox && !hasDraft);
  dom.composerLink.querySelector("use").setAttribute("href", on && inbox ? "#icon-inbox" : "#icon-link");
}

/** Den Entwurf leeren — nach dem Anlegen oder Schließen. */
export function resetComposerExtras() {
  extras = blank();
  if (details) details.value = "";
  renderComposerExtras();
}

/** Details, Datum, Favorit und Anpinnen an den neuen Eintrag geben (nur in dieser Fassung). */
export function applyComposerExtras(entry) {
  if (!details || !isXoolSheet() || !takesExtras()) return;
  const body = details.value.trim();
  if (extras.showDetails && body) entry.body = body;
  if (extras.favorite) entry.favorite = true;
  if (extras.pinned) entry.pinned = true;
  if (!extras.date || !datedTypes.includes(entry.type)) return;
  entry.date = extras.date;
  if (extras.time) entry.time = extras.time;
  else delete entry.time;
}

/* Die Auswahl des Systems für Tag und Uhrzeit; leeren nimmt das Datum weg */
function pickWhen(anchor) {
  openWhenPicker(anchor, extras.date, extras.time, (date, time) => {
    extras.date = date;
    extras.time = date ? time : "";
    renderComposerExtras();
  });
}

function toggleDetails() {
  if (extras.showDetails && !details.value.trim()) {
    extras.showDetails = false;
    renderComposerExtras();
    dom.composerInput.focus();
    return;
  }
  extras.showDetails = true;
  renderComposerExtras();
  details.focus();
}

/* Die Teile anlegen und ins Eingabefeld hängen; die Reihenfolge legt das CSS fest */
function build() {
  details = document.createElement("textarea");
  details.className = "composer-details";
  details.rows = 2;
  details.placeholder = detailsHint;
  details.setAttribute("aria-label", "Details");
  /* form: Chromes Verlaufs-Chips fernhalten wie am Titel (src/core/no-history.js) */
  details.setAttribute("form", "no-history");
  details.hidden = true;

  whenChip = document.createElement("div");
  whenChip.className = "composer-when";
  whenChip.hidden = true;
  /* Außen die volle Zeile, innen der Chip selbst — so steht er allein unter den Details */
  whenChip.innerHTML = `<div class="composer-when-chip"><button class="composer-when-main" type="button">${icon("calendar")}<span></span></button>
    <button class="composer-when-clear" type="button" aria-label="Datum entfernen">${icon("close")}</button></div>`;
  whenText = whenChip.querySelector("span");

  tools.forEach((tool) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "composer-tool";
    button.dataset.tool = tool.id;
    button.hidden = true;
    button.setAttribute("aria-label", tool.label);
    button.innerHTML = icon(tool.icon);
    toolButtons[tool.id] = button;
  });
  dom.composer.append(details, whenChip, ...Object.values(toolButtons));
}

/**
 * Teile anlegen und die Werkzeuge anmelden.
 * @param close schließt das Eingabefeld (Escape im Details-Feld).
 */
export function initComposerExtras(close) {
  build();
  /* Ein Tipp auf ein Werkzeug lässt die Tastatur stehen — außer bei der Uhr,
     deren Auswahl selbst den Platz braucht */
  const keepFocus = (event) => {
    if (!event.target.closest("[data-tool='when'], .composer-when-main")) event.preventDefault();
  };
  [...Object.values(toolButtons), whenChip].forEach((part) => part.addEventListener("pointerdown", keepFocus));
  toolButtons.details.addEventListener("click", toggleDetails);
  toolButtons.when.addEventListener("click", () => pickWhen(toolButtons.when));
  toolButtons.favorite.addEventListener("click", () => {
    extras.favorite = !extras.favorite;
    renderComposerExtras();
  });
  toolButtons.pinned.addEventListener("click", () => {
    extras.pinned = !extras.pinned;
    renderComposerExtras();
  });
  whenChip.querySelector(".composer-when-main").addEventListener("click", (event) => pickWhen(event.currentTarget));
  whenChip.querySelector(".composer-when-clear").addEventListener("click", () => {
    extras.date = "";
    extras.time = "";
    renderComposerExtras();
  });
  details.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}
