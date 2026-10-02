/*
 * Die Seite eines Eintrags: Titel, zwei Pillen „Inhalt“ und „Verknüpfte
 * Einträge“ (wie auf der Seite eines Arbeitsbereichs; waagerecht wischen
 * wechselt zwischen ihnen), und das Menü oben rechts. Bei einer Zeichnung steht im Inhalt die Zeichenfläche statt des
 * Textes.
 *
 * Mittig in der Kopfzeile steht nur die Kategorie („Aufgabe“, „Notiz“) als
 * Pille, die das Blatt „Typ ändern“ öffnet (src/ui/type-menu.js); nur eine
 * Zeichnung und ein Medium bleiben, was sie sind. Status und Dringlichkeit
 * einer Aufgabe stehen unten in der Karte „Details“.
 *
 * Unter der zweiten Pille steht bei einem Projekt sein INHALT — was dort
 * abgelegt ist. Bei jedem anderen Eintrag stehen dort die VERKNÜPFTEN
 * Einträge: die Verbindung gilt auf beiden Seiten, keiner der beiden ist dem
 * anderen untergeordnet (src/data/links.js).
 *
 * Der Text unter „Inhalt“ besteht aus Bausteinen wie in Notion — „/“ öffnet
 * die Auswahl (Listen, Checkboxen, Trennlinie, Standort, Video, Link). Ein
 * Tipp auf eine YouTube-Karte spielt das Video an der Stelle der Karte ab
 * (src/ui/video-player.js, nachgeladen); gekürzter Text klappt dafür aus.
 *
 * Unter „Inhalt“ startet ein Tipp in die freie Fläche unter dem Text das
 * Schreiben am Textende; bei offener Tastatur schließt ein Tipp nur sie
 * (src/ui/write-tap.js).
 *
 * Rechts neben den Pillen stehen je nach Pille andere Knöpfe: Kopieren unter
 * „Inhalt“, Filter und Plus unter „Verknüpfte Einträge“ (entry-tools.js).
 *
 * Unter „Inhalt“ endet die Seite bei jeder Kategorie mit der Karte „Details“
 * und dem Ketten-Symbol „Verknüpfen“ (entry-details.js). Ihr Kopf schaut beim
 * Öffnen gerade über der Navigation hervor; langer Text wird dafür gekürzt
 * und lässt sich mit „Mehr anzeigen“ ausklappen (entry-fold.js). Hochgeklappt
 * gleitet die Karte über den Text, nie über den Titel (entry-lift.js). „Details“
 * steht darum nicht mehr im Menü oben rechts.
 *
 * Über dem Titel können ein Farbverlauf in der Farbe der Kategorie und ein
 * eigenes Icon stehen, beides aus dem Menü oben rechts (entry-cover.js;
 * das Cover teilt sich die Seite mit dem Arbeitsbereich: src/ui/page-cover.js).
 * Am Desktop stehen Favorit und Cover als Knöpfe rechts in der Kopfzeile
 * (entry-head.js), ab 1280px die Details rechts in der Spalte (entry-rail.js).
 * Pfad: src/features/entry/entry.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgrößen stehen in styles/entry.css
 * (--entry-title-size, --entry-body-size).
 */

import { events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { load, loadedModule } from "../../core/lazy.js";
import { canChangeType } from "../../data/convert.js";
import { entryTypeName } from "../../data/details.js";
import { linkedEntries } from "../../data/links.js";
import { entriesOf, findEntry, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { groupedListMarkup, linkedListMarkup } from "../../ui/groups.js";
import { markEdited } from "../../data/mutations.js";
import { scheduleSave, ui } from "../../data/state.js";
import { entryMenuOptions } from "../../ui/entry-menu.js";
import { initEntryCover, renderEntryCover } from "./entry-cover.js";
import { initEntryDetails, renderEntryDetails } from "./entry-details.js";
import { initEntryHead, renderEntryHead } from "./entry-head.js";
import { initEntryInline } from "./entry-inline.js";
import { entrySteps, mountPath, renderPath } from "../../ui/page-path.js";
import { expandEntryFold, initEntryFold, layoutEntryFold, resetEntryFold } from "./entry-fold.js";
import { dropLift } from "./entry-lift.js";
import { initEntryTitle, showEntryTitle } from "./entry-title.js";
import { initEntryTools, linkFilterFor, renderEntryTools } from "./entry-tools.js";
import { bindHeadTitle, setHeadTitle } from "../../ui/head-title.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { goBack, restoreFrom } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";
import { openTypeChangeSheet, typeCrumbMarkup } from "../../ui/type-menu.js";
import { isViewActive } from "../../ui/views.js";
import { addWritePage } from "../../ui/write-tap.js";
import { createBlockEditor } from "../../ui/block-editor.js";
import { fillVideoTitle } from "../../ui/bookmark-title.js";

/* Der Pfad oben links in der Kopfzeile am Desktop (src/ui/page-path.js), angelegt in initEntry. */
let path = null;

/* Der Baustein-Editor unter „Inhalt“ (src/ui/block-editor.js), angelegt in initEntry. */
let bodyEditor = null;
/* Der Text, den der Editor gerade zeigt — ändert ihn jemand anderes (Link in
   den Details, nachgeholter Videotitel), wird er neu geladen */
let shownBody = "";

/* Ein offener Videoplayer (src/ui/video-player.js, nachgeladen) schließt,
   sobald der Text neu gezeichnet oder verlassen wird — nur wenn das Modul schon da ist. */
function closeVideoIfOpen() {
  loadedModule("video")?.closeVideo();
}

/* Die beiden Pillen; die zweite trägt die Anzahl dessen, was darunter steht.
   Kein Icon: es wird nie mehr als diese zwei geben, das Wort allein reicht. */
const entryPills = [
  { id: "notes", label: "Inhalt" },
  { id: "links", label: "Verknüpfte Einträge" },
];

/** Die Zahl auf der zweiten Pille: bei einem Projekt sein Inhalt, sonst die Verknüpfungen. */
function entryLinksCount(entry) {
  return isContainer(entry) ? entriesOf(entryRef(entry.id)).length : linkedEntries(entry).length;
}

/** Pillen neu zeichnen und die passende Fläche darunter zeigen.
    Das Wort steht in einem eigenen span: wird es eng, kürzt nur das Wort
    mit „…“, die Zahl dahinter bleibt ganz (styles/entry.css). */
function renderEntryPills(entry) {
  const count = entryLinksCount(entry);
  dom.entryPills.innerHTML = entryPills
    .map(
      (pill) => `
        <button class="tab-pill${pill.id === ui.entryPill ? " is-active" : ""}" type="button" data-entry-pill="${pill.id}">
          <span class="tab-pill-label">${pill.label}</span>${pill.id === "links" && count ? `<span class="media-count">${count}</span>` : ""}
        </button>`
    )
    .join("");
  dom.entryPanelNotes.hidden = ui.entryPill !== "notes";
  dom.entryPanelLinks.hidden = ui.entryPill !== "links";
  renderEntryTools(entry);
  /* Erst jetzt ist „Inhalt“ zu sehen und lässt sich messen */
  layoutEntryFold();
}

/* Ein Projekt zeigt, was darin liegt; jeder andere Eintrag, womit er verknüpft ist.
   Ein gesetzter Filter lässt nur die Gruppe eines Typs stehen. */
function renderLinks(entry) {
  const type = linkFilterFor(entry);
  dom.entryLinks.innerHTML = isContainer(entry)
    ? groupedListMarkup(entryRef(entry.id), type)
    : linkedListMarkup(entry, type);
}

/* Mitte der Kopfzeile: nur die Kategorie, als Pille zum Typ-Wechsel.
   Status und Dringlichkeit stehen in der Karte „Details“ — oben bleibt es ruhig. */
function renderCrumb(entry) {
  const name = entryTypeName(entry);
  if (canChangeType(entry)) dom.entryCrumb.innerHTML = typeCrumbMarkup(name);
  else dom.entryCrumb.textContent = name;
}

/* Der graue Untertitel des kleinen Kopfzeilen-Titels nennt den Typ — nach
   einem Typwechsel muss er mitziehen, ohne den Titel zu verstecken. */
function syncHeadSub(entry) {
  const sub = el("entry-head").querySelector(".head-title-sub");
  if (sub) sub.textContent = entryTypeName(entry);
}

/** Die Seite mit dem Eintrag füllen, der gerade offen ist. */
function renderEntry() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;

  closeVideoIfOpen();
  renderEntryCover(entry);
  showEntryTitle(entry);
  bodyEditor.setText(entry.body || "");
  shownBody = entry.body || "";
  /* Jede geöffnete Seite beginnt mit gekürztem Text und hervorschauender Karte */
  resetEntryFold();
  dropLift();
  renderEntryDetails(entry);
  /* Mittig die Kategorie, nicht der Ort: der Zurück-Pfeil führt dorthin, wo
     man zuletzt war — nicht zwingend an den Ort des Eintrags. */
  renderCrumb(entry);
  renderEntryHead(entry);
  renderPath(path, entrySteps(entry));
  setHeadTitle(el("entry-head"), entry.title || "Ohne Titel", entryTypeName(entry));

  /* Zeichnungen zeigen statt des Textes die Zeichenfläche. */
  const isDrawing = entry.type === "zeichnung";
  dom.entryBody.hidden = isDrawing;
  dom.drawPad.hidden = !isDrawing;
  if (isDrawing) load("drawing").then((module) => module.openDrawing(entry));
  renderLinks(entry);
  renderEntryPills(entry);
  /* Ein Lesezeichen mit YouTube-Link ohne Titel: Titel holen — die Änderung
     kommt über dataChanged zurück auf die Seite */
  fillVideoTitle(entry);
}

/* Das Menü oben rechts auf der Eintragsseite — dieselben Aktionen wie beim
   gedrückt Halten einer Zeile (src/ui/entry-menu.js), hier als Blatt. */
function openEntryMenu() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;
  const options = entryMenuOptions(entry, {
    onPage: true,
    afterRemove: () => restoreFrom(ui.sourceView),
  });
  openSheet(entry.title || "Eintrag", options);
}

/* Tippen speichert erst kurz nach dem letzten Buchstaben, nicht bei jedem Zeichen. */
function saveBody(text) {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;
  entry.body = text;
  shownBody = text;
  markEdited(entry);
  scheduleSave();
}

/** Felder, Pillen, Menü und Zurück-Pfeil der Eintragsseite anmelden. */
export function initEntry() {
  initEntryCover();
  /* Rahmen und Karte vor dem Editor: sein „/“-Menü hängt sich in den Rahmen */
  initEntryFold();
  initEntryDetails();
  initEntryHead();
  initEntryInline();
  path = mountPath(el("entry-head"));
  initEntryTitle();
  bodyEditor = createBlockEditor(dom.entryBody, {
    onChange: saveBody,
    /* YouTube-Karte: Player an ihrer Stelle statt neuer Tab (src/ui/video-player.js,
       nachgeladen). Der Text klappt aus, damit der Player nicht unterm Auslaufen liegt. */
    onVideo: (block, card) =>
      load("video").then((module) => {
        module.openVideo({ ...block, entryId: ui.currentEntryId }, card);
        expandEntryFold();
      }),
  });
  /* Wörter, Zeichen und „Zuletzt bearbeitet“ erst nach dem Schreiben
     auffrischen, nicht bei jedem Buchstaben — und nur, wenn der Fokus Titel
     oder Text verlässt: Knöpfe auf der Seite (Player, Karte „Details“)
     würden die Karte sonst mitten im Tipp ersetzen, und der Tipp ginge verloren */
  el("view-entry").addEventListener("focusout", (event) => {
    if (!event.target.closest(".entry-title, .nb-edit")) return;
    const entry = findEntry(ui.currentEntryId);
    if (entry) renderEntryDetails(entry);
  });
  initEntryTools({
    rerender: (entry) => {
      renderLinks(entry);
      renderEntryTools(entry);
    },
  });
  bindHeadTitle(el("entry-head"), dom.entryTitle, () => isViewActive("entry"));

  const selectPill = (id) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    /* Der Text verschwindet gleich: vorher den Cursor herausnehmen, sonst
       bliebe die Tastatur für ein unsichtbares Feld offen. */
    if (id !== "notes") {
      bodyEditor.blur();
      closeVideoIfOpen();
    }
    ui.entryPill = id;
    dropLift();
    renderEntryPills(entry);
  };

  dom.entryPills.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-entry-pill]");
    if (pill) selectPill(pill.dataset.entryPill);
  });

  /* Waagerecht wischen irgendwo auf der Seite wechselt ebenfalls die Pille. */
  initPillSwipe(el("view-entry"), {
    order: entryPills.map((pill) => pill.id),
    current: () => ui.entryPill,
    select: selectPill,
  });

  /* Ein Tipp in die freie Fläche unter dem Text schreibt weiter; bei offener
     Tastatur schließt ein Tipp nur sie. Eine Zeichnung hat kein Textfeld. */
  addWritePage({
    view: "entry",
    field: () => (ui.entryPill === "notes" && !dom.entryBody.hidden ? dom.entryBody : null),
    focusEnd: () => bodyEditor.focusEnd(),
  });

  /* Die Pille mit der Kategorie öffnet das Blatt „Typ ändern“ */
  dom.entryCrumb.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (entry && event.target.closest("[data-type-sheet]")) openTypeChangeSheet({ entry });
  });

  dom.entryMenu.addEventListener("click", openEntryMenu);
  dom.entryBack.addEventListener("click", (event) => {
    event.preventDefault();
    goBack();
  });

  on(events.viewOpened, (name) => {
    if (name === "entry") renderEntry();
  });

  /* Inhalt und Verknüpfungen können sich ändern, während die Seite offen ist. */
  on(events.dataChanged, () => {
    if (!isViewActive("entry")) return;
    const entry = findEntry(ui.currentEntryId);
    if (!entry) {
      dom.entryLinks.innerHTML = "";
      return;
    }
    /* Verknüpfungen können sich im offenen Blatt gerade ändern, der Typ auch —
       und mit ihm die Farbe des Covers und die Angaben der Karte „Details“ */
    renderEntryCover(entry);
    renderEntryDetails(entry);
    renderCrumb(entry);
    renderEntryHead(entry);
    renderPath(path, entrySteps(entry));
    syncHeadSub(entry);
    renderLinks(entry);
    renderEntryPills(entry);
    /* Text von außen geändert (neuer Link, nachgeholter Titel): Editor und Titel nachziehen */
    if ((entry.body || "") !== shownBody) {
      shownBody = entry.body || "";
      bodyEditor.setText(shownBody);
      showEntryTitle(entry);
      setHeadTitle(el("entry-head"), entry.title || "Ohne Titel", entryTypeName(entry));
    }
  });
}
