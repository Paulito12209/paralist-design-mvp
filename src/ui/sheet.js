/*
 * Das Auswahl-Blatt von unten: „Verknüpfen mit“, „Typ wählen“, Seitenmenüs.
 * Jede Option ist { label, icon, onSelect } plus optional active/danger/split/gap,
 * `stay` (das Blatt bleibt nach dem Antippen offen, z.B. zum An-/Abwählen),
 * `pair` (die Option rutscht ganz nach unten in eine Zeile neben die andere
 * `pair`-Option — so stehen Archivieren und Löschen nebeneinander) und
 * `heading` (keine Option, sondern eine Überschrift, die die Liste in
 * Abschnitte teilt — „Verknüpfen mit“ trennt damit Ablageorte und Einträge).
 * Für „Details“ gibt es zwei reine Anzeige-Zeilen: `lead` (der volle Titel,
 * groß und ungekürzt) und `detail` (Bezeichnung oben, Wert darunter); „Typ
 * ändern“ nutzt dazu `note` (ein Satz in normaler Schrift, z.B. was beim
 * Umwandeln mit den verknüpften Einträgen passiert).
 *
 * Eine gewählte Option (`active`) trägt rechts einen Haken — nicht nur die
 * Fläche, die man bei hellem Licht leicht übersieht.
 *
 * Mit Tabs (das Blatt einer Aufgabe): oben Icon und Name, eine Trennlinie
 * über die ganze Breite, darunter Pillen. Antippen oder waagerecht wischen
 * wechselt den Tab; senkrecht scrollt die Liste wie gewohnt
 * (src/ui/pill-swipe.js unterscheidet beides). Die neue Liste gleitet aus
 * der Richtung herein, in die man gewechselt hat.
 * Pfad: src/ui/sheet.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen und Abstände stehen in
 * styles/overlays.css (Klassen .sheet, .sheet-option) und
 * styles/sheet-tabs.css (Kopf, Tabs, Haken, Hereingleiten).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { closeCtxMenu } from "./ctx-menu.js";
import { bindModalPull } from "./modal-pull.js";
import { initPillSwipe, revealActive } from "./pill-swipe.js";

let actions = [];
/* Tabs des offenen Blatts: { tabs: [{ id, label }], tab, onTab } — oder null */
let tabbed = null;
/* Je Option: bleibt das Blatt nach dem Antippen offen? (für An-/Abwählen) */
let stays = [];

function optionMarkup(option, index) {
  /* Eine Überschrift ist kein Knopf: ohne data-sheet lässt sie sich nicht
     antippen und rutscht im Klick-Empfänger unten auch nie dazwischen. */
  if (option.heading) return `<p class="sheet-heading">${escapeHtml(option.label)}</p>`;
  if (option.lead) return `<p class="sheet-lead">${escapeHtml(option.label)}</p>`;
  if (option.note) return `<p class="sheet-note">${escapeHtml(option.label)}</p>`;
  if (option.detail) {
    return `<div class="sheet-detail"><span class="sheet-detail-label">${escapeHtml(option.label)}</span><span class="sheet-detail-value">${escapeHtml(option.value)}</span></div>`;
  }

  const classes = ["sheet-option"];
  if (option.active) classes.push("is-active");
  if (option.danger) classes.push("is-danger");
  /* split: setzt eine Trennlinie über die Option; gap: lässt etwas Luft darüber */
  if (option.split) classes.push("is-split");
  if (option.gap) classes.push("is-gap");
  /* pair: halbe Breite, damit zwei Optionen nebeneinander in eine Zeile passen */
  if (option.pair) classes.push("is-pair");
  const check = option.active && !option.pair ? icon("check", "sheet-check") : "";
  return `
    <button class="${classes.join(" ")}" type="button" data-sheet="${index}"${option.active ? ' aria-current="true"' : ""}>
      ${icon(option.icon)}
      <span class="sheet-option-label">${escapeHtml(option.label)}</span>${check}
    </button>
  `;
}

/* Erst die gewöhnlichen Optionen untereinander, darunter die `pair`-Optionen
   gemeinsam in einer Zeile. */
function sheetMarkup(options) {
  const marks = options.map(optionMarkup);
  const rest = options.map((option, index) => (option.pair ? "" : marks[index])).join("");
  const paired = options.map((option, index) => (option.pair ? marks[index] : "")).join("");
  return paired ? `${rest}<div class="sheet-pair">${paired}</div>` : rest;
}

/* Titel mit Icon davor (in der Farbe der Kategorie) oder nur als Text. */
function renderTitle(title, titleIcon, iconColor) {
  if (!titleIcon) {
    dom.sheetTitle.textContent = title;
    return;
  }
  const color = iconColor ? ` style="color:${iconColor}"` : "";
  dom.sheetTitle.innerHTML = `<span class="sheet-title-icon"${color}>${icon(titleIcon)}</span><span class="sheet-title-text">${escapeHtml(title)}</span>`;
}

/* Pillen zeichnen; wechselt der Tab, gleitet die neue Liste aus der
   Richtung herein, in der der neue Tab liegt. */
function renderTabs(previous) {
  const box = dom.sheet.querySelector(".sheet");
  box.classList.toggle("has-tabs", Boolean(tabbed));
  dom.sheetTabs.hidden = !tabbed;
  const list = dom.sheetOptions;
  list.classList.remove("is-slide-next", "is-slide-prev");
  if (!tabbed) {
    dom.sheetTabs.innerHTML = "";
    return;
  }
  dom.sheetTabs.innerHTML = tabbed.tabs
    .map((tab) => {
      const on = tab.id === tabbed.tab;
      return `<button class="tab-pill${on ? " is-active" : ""}" type="button" role="tab" aria-selected="${on}" data-sheet-tab="${tab.id}">${escapeHtml(tab.label)}</button>`;
    })
    .join("");
  const ids = tabbed.tabs.map((tab) => tab.id);
  const step = ids.indexOf(tabbed.tab) - ids.indexOf(previous);
  if (previous == null || !step) return;
  /* Einmal messen, damit die Animation neu startet, auch bei schnellem Wischen */
  void list.offsetWidth;
  list.classList.add(step > 0 ? "is-slide-next" : "is-slide-prev");
  list.scrollTop = 0;
}

/**
 * Blatt mit Titel und Optionen öffnen.
 * extra (optional): icon und iconColor vor dem Titel; tabs, tab und onTab(id)
 * für Pillen über der Liste — onTab öffnet das Blatt mit dem neuen Tab neu.
 */
export function openSheet(title, options, { icon: titleIcon, iconColor, tabs, tab, onTab } = {}) {
  closeCtxMenu();
  /* Nur ein Wechsel im offenen Blatt gleitet, nicht das erste Öffnen */
  const previous = tabbed && tabs && !dom.sheet.hidden ? tabbed.tab : null;
  tabbed = tabs ? { tabs, tab, onTab } : null;
  renderTitle(title, titleIcon, iconColor);
  dom.sheetOptions.innerHTML = sheetMarkup(options);
  renderTabs(previous);
  actions = options.map((option) => option.onSelect);
  stays = options.map((option) => Boolean(option.stay));
  dom.sheet.hidden = false;
}

/** Blatt schließen. */
export function closeSheet() {
  dom.sheet.hidden = true;
  tabbed = null;
  actions = [];
  stays = [];
}

/** Klicks im Blatt: Option ausführen, Klick daneben schließt. Ziehen schließt es auch. */
export function initSheet() {
  bindModalPull(dom.sheet, closeSheet);

  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — schließt sich das
     Blatt. Sonst bliebe es über der neuen Seite liegen und seine Aktionen
     bezögen sich noch auf die verlassene. */
  on(events.viewWillChange, closeSheet);

  /* Waagerecht wischen auf dem Blatt wechselt den Tab; nur das Blatt selbst,
     nicht der abgedunkelte Rand daneben. */
  const box = dom.sheet.querySelector(".sheet");
  const selectTab = (id) => {
    if (tabbed && id !== tabbed.tab) tabbed.onTab(id);
  };
  initPillSwipe(box, {
    order: () => (tabbed ? tabbed.tabs.map((tab) => tab.id) : []),
    current: () => tabbed?.tab,
    select: selectTab,
    enabled: () => Boolean(tabbed),
  });

  dom.sheet.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-sheet-tab]");
    if (tab) {
      selectTab(tab.dataset.sheetTab);
      revealActive(box);
      return;
    }
    const option = event.target.closest("[data-sheet]");
    if (!option) {
      if (event.target === dom.sheet) closeSheet();
      return;
    }
    const index = Number(option.dataset.sheet);
    const run = actions[index];
    if (!stays[index]) closeSheet();
    if (run) run();
  });
}
