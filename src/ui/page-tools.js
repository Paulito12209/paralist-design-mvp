/*
 * Die Knöpfe rechts neben den Pillen „Inhalt“ und „Verknüpfte Einträge“ —
 * auf der Seite eines Eintrags wie auf der eines Arbeitsbereichs. Sie
 * wechseln mit der Pille: links wählt man die Ansicht, rechts handelt man
 * darin.
 *
 * - unter „Inhalt“ der Kopier-Knopf: Antippen kopiert die ganze Seite als
 *   Markdown, Gedrückthalten (oder Rechtsklick) fragt „Seite“ oder „Titel“,
 * - unter „Verknüpfte Einträge“ Filter und Plus. Was das Plus tut, weiß die
 *   jeweilige Seite; der Filter zeigt „Alle“ oder genau einen Typ.
 *
 * Wird es eng, kürzt die zweite Pille ihr Wort mit „…“ — die Knöpfe hier
 * bleiben immer ganz sichtbar (styles/entry.css, Klasse .page-pills-row).
 * Pfad: src/ui/page-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * COPIED_MS -> wie lange der Kopier-Knopf nach dem Kopieren einen Haken zeigt
 *
 * Aussehen steht in styles/entry.css (Klasse .page-tool, Maße in tokens.css:
 * --page-tool-size, --page-tool-icon, --page-tool-gap).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { copyEntry, copyOptions } from "./copy-page.js";
import { openCtxMenu } from "./ctx-menu.js";
import { cancelHold } from "./long-press.js";

/* Lang genug, um den Haken zu sehen, kurz genug für ein zweites Kopieren. */
const COPIED_MS = 1500;

/* Gewählter Typ, nur für die Seite, auf der er gesetzt wurde (`key`, z.B.
   „e:12“ oder „w:3“). Jedes Öffnen einer Seite beginnt wieder mit „Alle“ —
   sonst fehlten beim nächsten Besuch Einträge, ohne dass man den Grund sieht. */
const filter = { key: null, type: "" };
/* Je Ansicht ("entry", "page") eine Funktion, die liefert, was kopiert wird:
   { title, body, type } — oder null, wenn dort gerade nichts offen ist. */
const copySources = {};
let copiedTimer = 0;

/** Anmelden, was der Kopier-Knopf in einer Ansicht kopiert. */
export function registerCopySource(view, getDoc) {
  copySources[view] = getDoc;
}

/* Die Ansicht, in der der Knopf steht, bestimmt die Quelle. */
function sourceFor(button) {
  const view = button.closest("[data-view]")?.dataset.view;
  const get = copySources[view];
  return get ? get() : null;
}

/** Der gefilterte Typ dieser Seite; leer, wenn alles zu sehen ist.
    Ist die Gruppe inzwischen leer (Eintrag gelöscht), gilt wieder „Alle“. */
export function activeFilter(key, groups) {
  if (filter.key !== key || !filter.type) return "";
  return groups.some((group) => group.type === filter.type) ? filter.type : "";
}

/* Ein runder Knopf ohne Rahmen, wie die Werkzeuge über anderen Listen. */
function toolButton(name, label, data, extra = "") {
  return `<button class="page-tool${extra}" type="button" ${data} aria-label="${label}" title="${label}">${icon(name)}</button>`;
}

/**
 * Die Knöpfe passend zur gewählten Pille.
 * @param pill   "notes" (Inhalt) oder "links" (Verknüpfte Einträge)
 * @param key    Schlüssel der Seite für den Filter
 * @param groups die Gruppen unter der zweiten Pille
 */
export function pageToolsMarkup(pill, key, groups) {
  if (pill === "notes") {
    return toolButton("copy", "Seite kopieren — gedrückt halten für nur den Titel", "data-copy-page");
  }
  const active = activeFilter(key, groups);
  /* Bei nur einer Gruppe gibt es nichts zu filtern — der Knopf bleibt stehen,
     damit nichts springt, lässt sich aber nicht drücken. */
  const useless = !active && groups.length < 2;
  return (
    toolButton("sliders", active ? "Filter aktiv" : "Filtern", `data-link-filter${useless ? " disabled" : ""}`, active ? " is-active" : "") +
    toolButton("plus", "Hinzufügen", "data-link-add")
  );
}

/** Die Pillen mit ihrem Knopf-Bereich daneben — für Seiten, die alles als Text zeichnen. */
export function pillsRowMarkup(pillsHtml, toolsHtml) {
  return `<div class="page-pills-row">${pillsHtml}<div class="page-tools">${toolsHtml}</div></div>`;
}

/** „Alle“ oder genau ein Typ; ein Haken zeigt, was gerade gilt. `onChange` zeichnet neu. */
export function openFilterMenu(button, key, groups, onChange) {
  const current = activeFilter(key, groups);
  const choose = (type) => () => {
    filter.key = key;
    filter.type = type;
    onChange();
  };
  openCtxMenu(button, [
    { label: "Alle", icon: "layers", active: !current, onSelect: choose("") },
    ...groups.map((group) => ({
      label: group.label,
      icon: group.icon,
      active: current === group.type,
      onSelect: choose(group.type),
    })),
  ]);
}

/** Auswahl „Seite“ oder „Titel“ neben dem Kopier-Knopf — nach Gedrückthalten oder Rechtsklick. */
export function openCopyChoice(anchor) {
  const doc = sourceFor(anchor);
  if (doc) openCtxMenu(anchor, copyOptions(doc));
}

/* Kurz einen Haken statt der zwei Blätter zeigen — die Bestätigung direkt am Finger. */
function showCopied(button) {
  button.innerHTML = icon("check");
  button.classList.add("is-done");
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    if (!button.isConnected) return;
    button.innerHTML = icon("copy");
    button.classList.remove("is-done");
  }, COPIED_MS);
}

/**
 * Kopier-Knopf anmelden — einmal für alle Seiten. Das Gedrückthalten startet
 * src/ui/swipe.js wie bei allen Zeilen; geöffnet wird dann `openCopyChoice`
 * (angemeldet in src/main.js). Filter und Plus melden die Seiten selbst an.
 */
export function initPageTools() {
  dom.content.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy-page]");
    if (!button) return;
    const doc = sourceFor(button);
    if (doc) copyEntry(doc, "page").then((done) => done && button.isConnected && showCopied(button));
  });

  /* Rechtsklick mit der Maus — und das lange Drücken auf Android, das hier
     ebenfalls „contextmenu“ auslöst. Der Halte-Timer wird verworfen, sonst
     ginge die Auswahl beim Loslassen ein zweites Mal auf. */
  dom.content.addEventListener("contextmenu", (event) => {
    const button = event.target.closest("[data-copy-page]");
    if (!button) return;
    event.preventDefault();
    cancelHold();
    openCopyChoice(button);
  });

  on(events.viewOpened, () => {
    filter.key = null;
    filter.type = "";
  });
}
