/*
 * Das Eingabefeld unten: öffnet sich über der Navigation, nimmt Titel, Typ,
 * Ablageort und Anhänge und legt daraus einen Eintrag an. Die Typ-Wahl steht
 * in composer-types.js, die Anhänge in attachments.js.
 * Pfad: src/features/composer/composer.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgrößen, Pillen und Knöpfe stehen in
 * styles/composer.css (--composer-input-size, --composer-btn-size …), die
 * Rundung des Containers in styles/navigation.css (--composer-radius).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { dayKey, timeKey } from "../../core/dates.js";
import { overviewPages, typePlurals, typeSingular, xpKinds } from "../../data/config.js";
import { connectEntries } from "../../data/links.js";
import { applyEntryDefaults } from "../../data/mutations.js";
import { findEntry, parentName } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { state, ui } from "../../data/state.js";
import { awardXp, commitXp } from "../../data/xp.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { openPlacePicker } from "../../ui/pickers.js";
import { openEntry, openEntryOrFile } from "../../ui/router.js";
import { hideToast, showToast } from "../../ui/toast.js";
import { isViewActive } from "../../ui/views.js";
import {
  attachFilesTo,
  createMediaEntries,
  initComposerAttachments,
  renderComposerAttachments,
} from "./attachments.js";
import { contextDefaults, pickOverrides } from "./composer-defaults.js";
import {
  chooseComposerType,
  composer,
  followFileDraft,
  isComposerPreset,
  rememberComposerPreset,
  resetComposerDraft,
} from "./composer-state.js";
import { initComposerTypes, renderComposerTypes } from "./composer-types.js";
import { stopDictation } from "./dictation.js";

/** Anlegen-Knopf: erst aktiv, wenn Text da ist oder ein Anhang den Titel liefern kann. */
export function updateComposerSend() {
  /* Ein Medium besteht aus seiner Datei. Ohne Anhang gäbe es auch mit Titel
     nur eine Kachel, die nie etwas zeigt — dann bleibt der Knopf grau und der
     Plus-Knopf daneben ist der Weg. */
  if (composer.type === "medien") {
    dom.composerSend.disabled = !composer.files.length;
    return;
  }
  dom.composerSend.disabled = !dom.composerInput.value.trim() && !composer.files.length;
}

/*
 * Name in der Ablageort-Pille. Ein Medium ohne gewählten Ort landet nicht im
 * Eingang, sondern bei den Ressourcen — `inboxEntries` in
 * src/data/queries.js siebt Medien aus. Die Pille sagt dann auch das, statt
 * einen Ort zu versprechen, an dem der Eintrag nie auftaucht.
 */
function composerPlaceName() {
  if (!composer.place && composer.type === "medien") return overviewPages[4].title;
  return parentName(composer.place);
}

/** Die Pille mit dem Ablageort auffrischen. */
function renderComposerLink() {
  dom.composerLinkLabel.textContent = composerPlaceName();
  /* Angedeutet, solange dort noch der Vorschlag der Seite steht — gefüllt,
     sobald man selbst einen anderen Ort gewählt hat. */
  dom.composerLink.classList.toggle("is-preset", isComposerPreset("place"));
}

/**
 * Eingabefeld öffnen; die Navigation und die Knopfleisten weichen dafür.
 * @param overrides Typ, Knopf oder Ablageort, die die Vorgaben der Seite überstimmen.
 */
export function openComposer(overrides = {}) {
  closeCtxMenu();
  /* Eine noch stehende Meldung geht weg: sie spricht über den vorigen Eintrag,
     und die Leiste rückt beim Tippen näher an den Rand — die Meldung würde
     sonst seitlich zucken, während der Finger ihren Knopf sucht. */
  hideToast();
  const start = { ...contextDefaults(), ...overrides };
  chooseComposerType(start.type, start.pick);
  composer.place = start.place;
  composer.link = start.link || null;
  rememberComposerPreset();
  dom.navShell.classList.add("is-composing");
  dom.tabBar.hidden = true;
  dom.composer.hidden = false;
  dom.mediaActions.hidden = true;
  dom.drawTools.hidden = true;
  renderComposerTypes();
  renderComposerLink();
  renderComposerAttachments(updateComposerSend);
  updateComposerSend();
  dom.composerInput.focus();
}

/** Eingabefeld schließen und den Entwurf verwerfen. */
export function closeComposer() {
  if (dom.composer.hidden) return;
  dom.navShell.classList.remove("is-composing");
  dom.composer.hidden = true;
  dom.tabBar.hidden = false;
  dom.mediaActions.hidden = false;
  dom.drawTools.hidden = false;
  dom.composerInput.value = "";
  resetComposerDraft();
  /* Die Spalte, um die der Knopf am Board-Ende gebeten hat, gilt nur für den
     Entwurf, der gerade offen war. Ohne diese Zeile erbt die nächste Aufgabe
     — auch die von der Startseite — still deren Priorität. */
  ui.taskDraftColumn = null;
  renderComposerAttachments(updateComposerSend);
  stopDictation();
}

/** Ist das Eingabefeld offen? */
export function isComposerOpen() {
  return !dom.composer.hidden;
}

/** Eingabefeld auf der Kalenderseite an einer angetippten Stunde öffnen. */
export function openComposerForSlot(slot) {
  composer.slot = slot;
  openComposer({ type: "termin", pick: "termin" });
}

/*
 * Was im Kalender entsteht, gehört an den Tag, den man ansieht — nicht an heute.
 * Ein Termin bekommt zusätzlich eine Uhrzeit: die der angetippten Stunde, sonst
 * die aktuelle Uhrzeit am heutigen Tag und 09:00 an jedem anderen Tag.
 */
function applyCalendarDate(entry) {
  if (!isViewActive("calendar")) return;
  const day = composer.slot ? composer.slot.date : ui.calendarDay;
  entry.date = day;
  if (entry.type !== "termin") return;
  if (composer.slot) entry.time = composer.slot.time;
  else entry.time = day === dayKey(new Date()) ? timeKey(Date.now()) : "09:00";
}

/* Ein gewöhnlicher Eintrag; jede angehängte Datei hängt als Medium an ihm.
   Gibt den Eintrag und danach seine Medien zurück. */
function createPlainEntry(title, places, source) {
  const entry = {
    id: state.nextEntryId++,
    type: composer.type,
    title,
    body: "",
    places,
    links: [],
    archived: false,
    favorite: false,
    createdAt: Date.now(),
  };
  applyCalendarDate(entry);
  /* Status, Priorität und Sortiernummer einer Aufgabe kommen aus der Datenschicht. */
  applyEntryDefaults(entry);

  state.entries.push(entry);
  const attached = attachFilesTo(entry);
  if (source) connectEntries(entry, source);
  return [entry, ...attached];
}

/* „Notiz erstellt“ — bei mehreren Dateien als Medium „3 Medien erstellt“. */
function createdTitle(entry, count) {
  if (entry.type === "medien" && count > 1) return `${count} ${typePlurals.medien} erstellt`;
  return `${typeSingular(entry.type)} erstellt`;
}

/** Aus dem Entwurf einen Eintrag machen — beim Typ „Medium“ nur die Dateien selbst. */
export function createEntry() {
  const typed = dom.composerInput.value.trim();
  const isMedia = composer.type === "medien";
  /* Ohne Titel reicht ein Anhang: dann heißt der Eintrag wie die erste Datei.
     Ein Medium braucht dagegen immer eine Datei — es IST die Datei. */
  const title = typed || (composer.files[0] ? composer.files[0].title : "");
  if (!title || (isMedia && !composer.files.length)) return;

  const places = composer.place ? [composer.place] : [];
  /* Von der Seite eines Eintrags aus Angelegtes wird mit ihm verknüpft — in
     beide Richtungen. Der Ablageort kommt davon unabhängig aus `composer.place`. */
  const source = composer.link ? findEntry(composer.link) : null;
  /* Ein Medium bekommt keinen Eintrag drumherum: sonst stünde neben dem Foto
     „IMG_2968“ noch ein gleichnamiges Dokument, das nichts enthält. */
  const created = isMedia ? createMediaEntries(typed, places, source) : createPlainEntry(title, places, source);
  const entry = created[0];
  /* Jede Datei wird ein eigener Medien-Eintrag und bringt dieselben Punkte wie
     ein Eintrag (src/features/composer/attachments.js) — die Meldung zählt sie
     also mit, sonst nennt sie eine andere Zahl als die Stufenanzeige danach. */
  const points = xpKinds.created.amount * created.length;

  dom.composerInput.value = "";
  closeComposer();
  /* Auf der Seite eines Arbeitsbereichs oder eines Projekts soll man den neuen
     Eintrag gleich sehen — beide zeigen ihre Liste erst unter der zweiten Pille. */
  if (isViewActive("page") && ui.currentPage?.isWorkspace && entry.places.includes(ui.currentPage.parent)) {
    ui.pagePill = "links";
  }
  if (isViewActive("entry") && (source || entry.places.includes(entryRef(ui.currentEntryId)))) {
    ui.entryPill = "links";
  }
  emit(events.dataChanged);

  /*
   * Ohne Rückmeldung merkt man vom Anlegen nichts — nur eine Zahl auf einer
   * Karte springt hoch. Erst die Meldung, dann die Punkte: steigt dabei die
   * Stufe, löst deren Meldung diese hier ab. Die größere Nachricht gewinnt.
   *
   * Eine Zeichnung bekommt keine: ihre Fläche geht gleich auf, das ist die
   * Rückmeldung. Die Meldung läge sonst über dem unteren Rand der Fläche und
   * böte einen Weg auf die Seite an, auf der man schon steht.
   */
  if (entry.type !== "zeichnung") {
    showToast({
      title: createdTitle(entry, created.length),
      note: `+${points} XP`,
      /* Ein Medium will man ansehen — es öffnet sich als Datei, nicht als Seite. */
      action: { label: isMedia ? "Ansehen" : "Zur Seite", onSelect: () => openEntryOrFile(entry.id) },
    });
  }
  /* Medien sind schon einzeln protokolliert (attachments.js) — es fehlt nur das Speichern. */
  if (isMedia) commitXp();
  else awardXp("created", entry.type, title);

  /* Eine neue Zeichnung öffnet sich gleich, damit man sofort loslegen kann. */
  if (entry.type === "zeichnung") openEntry(entry.id);
}

/* Alles, was am Typ hängt, neu zeichnen: Knöpfe, Typ- und Ort-Pille, Anlegen-Knopf. */
function renderTypeDependents() {
  renderComposerTypes();
  renderComposerLink();
  updateComposerSend();
}

/* Hängt eine Datei dran, folgt der Typ Anhängen und Text (followFileDraft in
   composer-state.js) — Knöpfe und Pillen müssen dann mit. */
function onFilesChanged() {
  followFileDraft(Boolean(dom.composerInput.value.trim()));
  renderTypeDependents();
}

/**
 * Nach jeder Änderung im Textfeld, getippt oder diktiert: aus einem Medium
 * kann mit dem ersten Buchstaben ein Dokument werden und umgekehrt.
 */
export function onComposerText() {
  if (followFileDraft(Boolean(dom.composerInput.value.trim()))) renderTypeDependents();
  else updateComposerSend();
}

/** Alle Knöpfe und Felder des Eingabefelds anmelden. */
export function initComposer() {
  document.querySelector(".tab-add").addEventListener("click", () => {
    if (dom.composer.hidden) openComposer();
    else closeComposer();
  });

  el("composer-close").addEventListener("click", closeComposer);
  dom.composerSend.addEventListener("click", createEntry);
  initComposerTypes(() => {
    renderTypeDependents();
    dom.composerInput.focus();
  });
  initComposerAttachments(onFilesChanged);

  dom.composerLink.addEventListener("click", () => {
    /* Der Typ des Entwurfs kommt mit: ein Projekt bekommt nur Arbeitsbereiche
       angeboten, nie ein anderes Projekt. */
    openPlacePicker(
      "Ablegen in",
      composer.place,
      (place) => {
        composer.place = place;
        /* Der neue Ort kann den Projekt-Knopf sperren, darum beide neu zeichnen. */
        renderComposerTypes();
        renderComposerLink();
        dom.composerInput.focus();
      },
      composer.type
    );
  });

  dom.composerInput.addEventListener("input", onComposerText);
  dom.composerInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    createEntry();
  });

  /* Beim Wechsel der Ansicht schließt sich das Eingabefeld von selbst — und
     die Meldung geht mit: sie spräche auf der neuen Seite über die alte. */
  on(events.viewWillChange, () => {
    closeComposer();
    hideToast();
  });
  /* Der Kalender bittet über diese Nachricht um das Eingabefeld, damit er es
     nicht importieren muss. */
  on(events.composerRequested, openComposerForSlot);
  /* Dasselbe für die Aufgaben-Seite: ihr Knopf am Spaltenende will eine Aufgabe. */
  on(events.taskRequested, () => openComposer({ type: "aufgabe", pick: "aufgabe" }));
  on(events.createRequested, (pick) => openComposer(pickOverrides(pick)));
  /* Geht ein Blatt von unten auf, gibt das Eingabefeld auf: es lag sonst
     unsichtbar dahinter weiter offen — samt laufendem Diktat. */
  on(events.overlayOpened, closeComposer);

  renderComposerTypes();
}
