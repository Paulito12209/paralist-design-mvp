/*
 * Das Eingabefeld unten: öffnet sich über der Navigation, nimmt Titel, Typ,
 * Ablageort und Anhänge und legt daraus einen Eintrag an.
 * Pfad: src/features/composer/composer.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgrößen, Pillen und Knöpfe stehen in
 * styles/composer.css (--composer-input-size, --composer-btn-size …), die
 * Rundung des Containers in styles/navigation.css (--composer-radius).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { dayKey, timeKey } from "../../core/dates.js";
import { icon } from "../../core/html.js";
import {
  composerPlaceholders,
  defaultType,
  overviewPages,
  typeSingular,
  types,
  xpItemStyle,
  xpKinds,
} from "../../data/config.js";
import { applyEntryDefaults } from "../../data/mutations.js";
import { parentName } from "../../data/queries.js";
import { entryRef, isEntryRef } from "../../data/refs.js";
import { state, ui } from "../../data/state.js";
import { awardXp } from "../../data/xp.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { openPlacePicker } from "../../ui/pickers.js";
import { openEntry } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";
import { hideToast, showToast } from "../../ui/toast.js";
import { isViewActive } from "../../ui/views.js";
import {
  addComposerFiles,
  attachFilesTo,
  dropComposerFile,
  renderComposerAttachments,
} from "./attachments.js";
import { contextDefaults, pickOverrides } from "./composer-defaults.js";
import {
  chooseComposerType,
  clearComposerPick,
  composer,
  composerPickButtons,
  isComposerPreset,
  rememberComposerPreset,
  resetComposerDraft,
} from "./composer-state.js";
import { stopDictation } from "./dictation.js";

/* Die Dateiquellen hinter dem Plus-Knopf. */
const fileSources = [
  { id: "photo", label: "Foto aufnehmen", icon: "camera" },
  { id: "video", label: "Video aufnehmen", icon: "video" },
  { id: "audio", label: "Audio hinzufügen", icon: "mic" },
  { id: "import", label: "Importieren", icon: "import" },
];

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
 * Darf gerade ein Projekt entstehen? Steht als Ablageort schon ein Projekt
 * fest, dann nicht: ein Projekt in einem Projekt schließt src/data/config.js
 * aus (containerTypes), sonst könnte ein Kreis entstehen.
 */
function projectAllowed() {
  return !isEntryRef(composer.place);
}

/** Die Typ-Knöpfe unten neu zeichnen. */
function renderComposerTypes() {
  const allowProject = projectAllowed();
  dom.composerTypes.innerHTML = composerPickButtons()
    .map((pick) => {
      const active = pick.id === composer.pick;
      const locked = pick.id === "projekt" && !allowProject;
      /* Der gewählte Typ hebt sich nur über die Icon-Farbe ab — je Typ wie in Kalender und Verlauf */
      const style = active ? ` style="--type-color:${xpItemStyle(pick.typeId).color}"` : "";
      return `
        <button class="composer-type${active ? " is-active" : ""}" type="button" data-type="${pick.id}" aria-label="${pick.label}"${locked ? " disabled" : ""}${style}>
          ${icon(pick.icon)}
        </button>
      `;
    })
    .join("");
  renderComposerTypePill();
}

/** Typ-Pille neben „Inbox“: zeigt den gewählten Typ und setzt den Platzhaltertext. */
function renderComposerTypePill() {
  const type =
    types.find((item) => item.id === composer.type) || types.find((item) => item.id === defaultType);
  dom.composerTypeIcon.setAttribute("href", `#icon-${type.icon}`);
  dom.composerTypeLabel.textContent = type.label;
  dom.composerInput.placeholder = composerPlaceholders[type.id] || "Neuen Eintrag einfügen …";
  dom.composerTypePill.classList.toggle("is-preset", isComposerPreset("type"));
}

/*
 * Name in der Ablageort-Pille. Ein Medium ohne gewählten Ort landet nicht in
 * der Inbox, sondern bei den Ressourcen — `inboxEntries` in
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

/** Aus dem Entwurf einen Eintrag machen. */
export function createEntry() {
  /* Ohne Titel reicht ein Anhang: dann heißt der Eintrag wie die erste Datei. */
  const title = dom.composerInput.value.trim() || (composer.files[0] ? composer.files[0].title : "");
  if (!title) return;

  const entry = {
    id: state.nextEntryId++,
    type: composer.type,
    title,
    body: "",
    places: composer.place ? [composer.place] : [],
    archived: false,
    favorite: false,
    createdAt: Date.now(),
  };
  applyCalendarDate(entry);
  /* Status, Priorität und Sortiernummer einer Aufgabe kommen aus der Datenschicht. */
  applyEntryDefaults(entry);

  state.entries.push(entry);
  attachFilesTo(entry);
  /* Jeder Anhang wird ein eigener Medien-Eintrag und bringt dieselben Punkte
     wie der Eintrag selbst (src/features/composer/attachments.js) — die
     Meldung muss also mitzählen, sonst nennt sie eine andere Zahl als die
     Stufenanzeige gleich danach. */
  const points = xpKinds.created.amount * (1 + (entry.attachments || []).length);

  dom.composerInput.value = "";
  closeComposer();
  /* Auf der Seite eines Arbeitsbereichs oder eines Projekts soll man den neuen
     Eintrag gleich sehen — beide zeigen ihre Liste erst unter der zweiten Pille. */
  if (isViewActive("page") && ui.currentPage?.isWorkspace && entry.places.includes(ui.currentPage.parent)) {
    ui.pagePill = "links";
  }
  if (isViewActive("entry") && entry.places.includes(entryRef(ui.currentEntryId))) {
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
      title: `${typeSingular(entry.type)} erstellt`,
      note: `+${points} XP`,
      action: { label: "Zur Seite", onSelect: () => openEntry(entry.id) },
    });
  }
  awardXp("created", entry.type, title);

  /* Eine neue Zeichnung öffnet sich gleich, damit man sofort loslegen kann. */
  if (entry.type === "zeichnung") openEntry(entry.id);
}

/* Die Typ-Pille oben öffnet die volle Liste der Typen. */
function openTypeSheet() {
  const allowProject = projectAllowed();
  const sheetTypes = types.filter(
    (type) =>
      (type.pick || type.id === "dokument" || type.id === "zeichnung") &&
      !(type.id === "projekt" && !allowProject)
  );
  openSheet(
    "Typ wählen",
    sheetTypes.map((type) => ({
      label: type.label,
      icon: type.icon,
      active: type.id === composer.type,
      /* gap und split gliedern die Liste: Ressourcen stehen abgesetzt unter den vier Typen */
      gap: type.id === "termin" || type.id === "projekt",
      split: type.id === "dokument",
      onSelect: () => {
        chooseComposerType(type.id);
        renderComposerTypes();
        renderComposerLink();
        updateComposerSend();
        dom.composerInput.focus();
      },
    }))
  );
}

/* Ein Klick auf einen Typ-Knopf wählt ihn oder wählt ihn wieder ab. */
function onTypeClick(event) {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  if (button.disabled) return;
  const pick = composerPickButtons().find((item) => item.id === button.dataset.type);
  if (!pick) return;

  if (composer.pick === pick.id) clearComposerPick();
  else chooseComposerType(pick.typeId, pick.id);

  renderComposerTypes();
  renderComposerLink();
  updateComposerSend();
  dom.composerInput.focus();
}

/** Alle Knöpfe und Felder des Eingabefelds anmelden. */
export function initComposer() {
  document.querySelector(".tab-add").addEventListener("click", () => {
    if (dom.composer.hidden) openComposer();
    else closeComposer();
  });

  el("composer-close").addEventListener("click", closeComposer);
  dom.composerSend.addEventListener("click", createEntry);
  dom.composerTypes.addEventListener("click", onTypeClick);
  dom.composerTypePill.addEventListener("click", openTypeSheet);

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

  dom.composerAttach.addEventListener("click", () => {
    openSheet(
      "Medien hinzufügen",
      fileSources.map((source) => ({
        label: source.label,
        icon: source.icon,
        onSelect: () => el(`composer-file-${source.id}`).click(),
      }))
    );
  });

  fileSources.forEach((source) => {
    const input = el(`composer-file-${source.id}`);
    input.addEventListener("change", () => {
      addComposerFiles(input.files, source.id, updateComposerSend);
      input.value = "";
    });
  });

  dom.composerAttachments.addEventListener("click", (event) => {
    const button = event.target.closest("[data-drop-attachment]");
    if (button) dropComposerFile(button.dataset.dropAttachment, updateComposerSend);
  });

  dom.composerInput.addEventListener("input", updateComposerSend);
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
