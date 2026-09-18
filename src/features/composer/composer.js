/*
 * Das Eingabefeld unten: öffnet sich über der Navigation, nimmt Titel, Typ,
 * Ablageort und Anhänge und legt daraus einen Eintrag an.
 * Pfad: src/features/composer/composer.js
 *
 * Keine anpassbaren visuellen Werte: Rundung, Schriftgrößen und Knöpfe stehen
 * in styles/composer.css (--composer-radius, --composer-input-size …).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { dayKey, timeKey } from "../../core/dates.js";
import { icon } from "../../core/html.js";
import { composerPlaceholders, defaultType, types, xpItemStyle } from "../../data/config.js";
import { parentName } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { awardXp } from "../../data/xp.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { openParentPicker } from "../../ui/pickers.js";
import { openEntry } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";
import {
  addComposerFiles,
  attachFilesTo,
  dropComposerFile,
  renderComposerAttachments,
} from "./attachments.js";
import {
  chooseComposerType,
  clearComposerPick,
  composer,
  composerPickButtons,
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
  dom.composerSend.disabled = !dom.composerInput.value.trim() && !composer.files.length;
}

/** Die Typ-Knöpfe unten neu zeichnen. */
function renderComposerTypes() {
  dom.composerTypes.innerHTML = composerPickButtons()
    .map((pick) => {
      const active = pick.id === composer.pick;
      /* Der gewählte Typ hebt sich nur über die Icon-Farbe ab — je Typ wie in Kalender und Verlauf */
      const style = active ? ` style="--type-color:${xpItemStyle(pick.typeId).color}"` : "";
      return `
        <button class="composer-type${active ? " is-active" : ""}" type="button" data-type="${pick.id}" aria-label="${pick.label}"${style}>
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
}

/** Die Pille mit dem Ablageort auffrischen. */
function renderComposerLink() {
  dom.composerLinkLabel.textContent = parentName(composer.parent);
}

/** Eingabefeld öffnen; die Navigation und die Knopfleisten weichen dafür. */
export function openComposer() {
  closeCtxMenu();
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
  chooseComposerType("termin", "termin");
  openComposer();
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
    parent: composer.parent,
    archived: false,
    favorite: false,
    createdAt: Date.now(),
  };
  applyCalendarDate(entry);

  state.entries.push(entry);
  attachFilesTo(entry);
  awardXp("created", composer.type, title);

  dom.composerInput.value = "";
  closeComposer();
  emit(events.dataChanged);

  /* Eine neue Zeichnung öffnet sich gleich, damit man sofort loslegen kann. */
  if (entry.type === "zeichnung") openEntry(entry.id);
}

/* Die Typ-Pille oben öffnet die volle Liste der Typen. */
function openTypeSheet() {
  const sheetTypes = types.filter(
    (type) => type.pick || type.id === "dokument" || type.id === "zeichnung"
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
        dom.composerInput.focus();
      },
    }))
  );
}

/* Ein Klick auf einen Typ-Knopf wählt ihn oder wählt ihn wieder ab. */
function onTypeClick(event) {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  const pick = composerPickButtons().find((item) => item.id === button.dataset.type);
  if (!pick) return;

  if (composer.pick === pick.id) clearComposerPick();
  else chooseComposerType(pick.typeId, pick.id);

  renderComposerTypes();
  renderComposerLink();
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

  el("composer-link").addEventListener("click", () => {
    openParentPicker("Ablegen in", composer.parent, (parent) => {
      composer.parent = parent;
      renderComposerLink();
      dom.composerInput.focus();
    });
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

  /* Beim Wechsel der Ansicht schließt sich das Eingabefeld von selbst. */
  on(events.viewWillChange, closeComposer);
  /* Der Kalender bittet über diese Nachricht um das Eingabefeld, damit er es
     nicht importieren muss. */
  on(events.composerRequested, openComposerForSlot);
  /* Geht ein Blatt von unten auf, gibt das Eingabefeld auf: es lag sonst
     unsichtbar dahinter weiter offen — samt laufendem Diktat. */
  on(events.overlayOpened, closeComposer);

  renderComposerTypes();
}
