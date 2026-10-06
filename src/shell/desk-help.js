/*
 * Die Hilfe am Desktop: ein Dialog hinter dem Fragezeichen unten in der
 * Seitenleiste (src/shell/desk-foot.js). Er erklärt in wenigen Sätzen, was
 * Paralist ist und kann, und nennt die wichtigsten Tastenkürzel — die
 * vollständige Liste öffnet der Knopf „Alle Kurzbefehle“ (Profil ›
 * Kurzbefehle). Der Dialog ist ein Blatt wie Profil und Fortschritt
 * (.modal-backdrop), damit Escape, Klick daneben und das Kreuz wie überall
 * schließen (src/shell/desk-keys.js, closeTopLayer).
 * Pfad: src/shell/desk-help.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sections -> die Absätze des Dialogs: Überschrift und Sätze
 * basics   -> die Kürzel, die der Dialog nennt (Beschriftung und Taste)
 *
 * Aussehen steht in styles/desk-help.css.
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { load } from "../core/lazy.js";
import { listKey, sideLink, withCommand, withShiftCommand } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";

const sections = [
  {
    title: "Was Paralist ist",
    text: [
      "Ein Ort für alles, was du festhalten willst: Notizen, Aufgaben, Termine, Projekte, Dokumente, Zeichnungen, Medien und Lesezeichen.",
      "Jeder Eintrag liegt an einem Ort — im Eingang, in einem Arbeitsbereich oder in einem Projekt — und lässt sich mit anderen Einträgen verknüpfen.",
    ],
  },
  {
    title: "Wie du arbeitest",
    text: [
      "Mit „Neu“ legst du an, was dir gerade einfällt; sortiert wird später. Die vier Seiten oben links zeigen das Ganze als Übersicht, Kalender, Aufgaben und Medien.",
      "Unter „Liste“ wählst du, welche Liste die Seitenleiste zeigt — Projekte, Arbeitsbereiche, Ressourcen, Archiv, Eingang, Aufgaben, Termine oder Lesezeichen. Ein Klick in die freie Fläche darunter legt gleich einen Eintrag in dieser Liste an.",
      "Das Seitenfenster rechts öffnet nebenbei einen Browser, deine Medien, eine Datei vom Gerät oder eine zweite Seite zum Nachschlagen.",
    ],
  },
];

const basics = [
  { label: "Neu anlegen", keys: "N" },
  { label: "Menü „Liste“ öffnen, dann Ziffer 1–8", keys: withCommand(listKey) },
  { label: "Suchen", keys: withCommand("K") },
  { label: "Seitenfenster rechts", keys: withShiftCommand(sideLink.letter) },
  { label: "Zurück und vor", keys: `${withCommand("[")} ${withCommand("]")}` },
  { label: "Alle Kurzbefehle", keys: "?" },
];

let backdrop = null;

function sectionMarkup(section) {
  return `
    <h3 class="desk-help-title">${escapeHtml(section.title)}</h3>
    ${section.text.map((line) => `<p class="desk-help-text">${escapeHtml(line)}</p>`).join("")}`;
}

function basicsMarkup() {
  const rows = basics
    .map((row) => `<li class="desk-help-row"><span>${escapeHtml(row.label)}</span>${keyCap(row.keys, "", true)}</li>`)
    .join("");
  return `
    <h3 class="desk-help-title">Die wichtigsten Kürzel</h3>
    <ul class="desk-help-list">${rows}</ul>`;
}

function dialogMarkup() {
  return `
    <div class="modal desk-help" role="dialog" aria-modal="true" aria-labelledby="desk-help-heading">
      <div class="modal-head">
        <h2 id="desk-help-heading">Hilfe</h2>
        <button class="modal-close" type="button" data-help="close" aria-label="Hilfe schließen">${icon("close")}</button>
      </div>
      <div class="modal-body desk-help-body">
        ${sections.map(sectionMarkup).join("")}
        ${basicsMarkup()}
        <button class="desk-help-all" type="button" data-help="shortcuts">${icon("keyboard")}<span>Alle Kurzbefehle</span></button>
      </div>
    </div>`;
}

/** Den Dialog schließen; die Auswahl kehrt zum Fragezeichen zurück. */
export function closeDeskHelp() {
  if (!backdrop || backdrop.hidden) return;
  backdrop.hidden = true;
  document.querySelector('[data-foot="help"]')?.focus({ preventScroll: true });
}

function onClick(event) {
  const action = event.target.closest("[data-help]")?.dataset.help;
  if (action === "close" || event.target === backdrop) closeDeskHelp();
  else if (action === "shortcuts") {
    closeDeskHelp();
    load("profile").then((module) => module.openPane("kurzbefehle"));
  }
}

/** Den Dialog öffnen; beim ersten Mal wird er in das Gerätefenster gehängt. */
export function openDeskHelp() {
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop desk-help-backdrop";
    backdrop.id = "desk-help";
    backdrop.innerHTML = dialogMarkup();
    backdrop.addEventListener("click", onClick);
    dom.device.append(backdrop);
  }
  backdrop.hidden = false;
  backdrop.querySelector(".modal-close").focus({ preventScroll: true });
}
