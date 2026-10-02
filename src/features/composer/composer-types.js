/*
 * Die Typ-Wahl des Eingabefelds: die runden Typ-Knöpfe unten, die Typ-Pille
 * oben und das Blatt „Typ wählen“, das die Pille öffnet. Eigene Datei, damit
 * src/features/composer/composer.js beim Anlegen bleiben kann.
 * Pfad: src/features/composer/composer-types.js
 *
 * ANPASSBARE WERTE (alle in src/data/config.js)
 * -----------------------------------
 * composerPlaceholders  -> Platzhaltertext im Eingabefeld je gewähltem Typ
 * sheetPlaceholders     -> kürzerer Platzhalter im Blatt der Android-Fassung („Neue Aufgabe“)
 * mediaPlaceholders     -> Platzhalter eines Mediums, sobald eine Datei angehängt ist
 *                          (im Blatt der Android-Fassung als getippter Hinweis, composer-hint.js)
 * xpItems[*].color      -> Icon-Farbe des gewählten Typ-Knopfs
 *
 * Größe und Farben von Knöpfen und Pille stehen in styles/composer.css.
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import {
  composerPlaceholders,
  defaultType,
  mediaPlaceholders,
  sheetPlaceholders,
  typeSingular,
  types,
  xpItemStyle,
} from "../../data/config.js";
import { isEntryRef } from "../../data/refs.js";
import { isMobileOs } from "../../ui/platform.js";
import { openSheet } from "../../ui/sheet.js";
import { startPlaceholderHint, stopPlaceholderHint } from "./composer-hint.js";
import { openOverComposer } from "./composer-sheet.js";
import {
  chooseTypeByHand,
  clearComposerPick,
  composer,
  composerPickButtons,
  isComposerPreset,
} from "./composer-state.js";

/* Diese Typen stehen im Blatt abgesetzt unter den vier mit eigenem Knopf —
   in der Reihenfolge aus `types`, also Dokument, Zeichnung, Medium, Lesezeichen. */
const sheetResourceTypes = ["dokument", "zeichnung", "medien", "lesezeichen"];

/*
 * Darf gerade ein Projekt entstehen? Steht als Ablageort schon ein Projekt
 * fest, dann nicht: ein Projekt in einem Projekt schließt src/data/config.js
 * aus (containerTypes), sonst könnte ein Kreis entstehen.
 */
function projectAllowed() {
  return !isEntryRef(composer.place);
}

/* Was im leeren Feld steht. Ein Medium ohne Datei sagt, wie man zu einer
   kommt. Mit Datei: hat das Eingabefeld von selbst umgestellt, dass Text ein
   Dokument daraus macht — sonst, dass ein eigener Titel freiwillig ist. */
function placeholderText(typeId) {
  /* Das Blatt der Android-Fassung sagt nur, was entsteht (styles/android-composer.css);
     den Hinweis zum Medium tippt composer-hint.js ab und zu hinein */
  if (isMobileOs("android") && sheetPlaceholders[typeId]) return sheetPlaceholders[typeId];
  if (typeId === "medien" && composer.files.length) {
    return composer.mediaSwitch ? mediaPlaceholders.auto : mediaPlaceholders.title;
  }
  return composerPlaceholders[typeId] || "Neuen Eintrag einfügen …";
}

/** Typ-Pille neben dem Ablageort: zeigt den gewählten Typ und setzt den Platzhaltertext. */
function renderComposerTypePill() {
  const type =
    types.find((item) => item.id === composer.type) || types.find((item) => item.id === defaultType);
  dom.composerTypeIcon.setAttribute("href", `#icon-${type.icon}`);
  /* In der Einzahl: die Pille benennt den einen Eintrag, der gleich entsteht. */
  dom.composerTypeLabel.textContent = typeSingular(type.id);
  /* Im Blatt der Android-Fassung ist der Name ausgeblendet — Vorleser hören ihn trotzdem */
  dom.composerTypePill.setAttribute("aria-label", `Typ: ${typeSingular(type.id)}`);
  dom.composerInput.placeholder = placeholderText(type.id);
  /* Hat das Feld von selbst auf „Medium“ umgestellt, erklärt ein getippter
     Hinweis, dass Text ein Dokument daraus macht — nur im Blatt (Android) */
  if (isMobileOs("android") && composer.mediaSwitch && composer.files.length) {
    startPlaceholderHint(mediaPlaceholders.auto);
  } else {
    stopPlaceholderHint();
  }
  dom.composerTypePill.classList.toggle("is-preset", isComposerPreset("type"));
}

/** Die Typ-Knöpfe unten und die Typ-Pille neu zeichnen. */
export function renderComposerTypes() {
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

/*
 * Der Arbeitsbereich ist kein Typ — er hat keinen Eintrag, sondern eine eigene
 * Seite —, steht aber wie im Plus-Menü (src/shell/create-menu.js) in der Liste:
 * wer alles sehen will, was „Neu“ anlegen kann, findet es hier vollständig.
 * Er folgt dem Projekt.
 */
const workspaceOption = { label: "Arbeitsbereich", icon: "layers" };

/* Die Typ-Pille oben öffnet die volle Liste der Typen. */
function openTypeSheet(refresh, createWorkspace) {
  const allowProject = projectAllowed();
  const sheetTypes = types.filter(
    (type) =>
      (type.pick || sheetResourceTypes.includes(type.id)) &&
      !(type.id === "projekt" && !allowProject)
  );
  const options = sheetTypes.map((type) => ({
    label: typeSingular(type.id),
    icon: type.icon,
    active: type.id === composer.type,
    /* gap und split gliedern die Liste: Ressourcen stehen abgesetzt unter den vier Typen */
    gap: type.id === "termin" || type.id === "projekt",
    split: type.id === sheetResourceTypes[0],
    onSelect: () => {
      chooseTypeByHand(type.id);
      refresh();
    },
  }));
  /* Hinter dem Projekt; ohne Projekt (schon in einem Projekt abgelegt) vor den Ressourcen */
  const at = options.findIndex((option) => option.split);
  options.splice(at, 0, { ...workspaceOption, onSelect: createWorkspace });
  openOverComposer(() => openSheet("Typ wählen", options));
}

/* Ein Klick auf einen Typ-Knopf wählt ihn oder wählt ihn wieder ab. */
function onTypeClick(event, refresh) {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  if (button.disabled) return;
  const pick = composerPickButtons().find((item) => item.id === button.dataset.type);
  if (!pick) return;

  if (composer.pick === pick.id) clearComposerPick();
  else chooseTypeByHand(pick.typeId, pick.id);
  refresh();
}

/**
 * Knöpfe und Pille anmelden.
 * @param refresh zeichnet nach einer Wahl alles nach, was am Typ hängt:
 *   Knöpfe, Ablageort-Pille, Anlegen-Knopf — und setzt den Cursor ins Feld.
 * @param createWorkspace schließt das Eingabefeld und legt einen Arbeitsbereich an.
 */
export function initComposerTypes(refresh, createWorkspace) {
  dom.composerTypes.addEventListener("click", (event) => onTypeClick(event, refresh));
  dom.composerTypePill.addEventListener("click", () => openTypeSheet(refresh, createWorkspace));
}
