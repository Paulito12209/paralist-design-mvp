/*
 * Die Typ-Wahl des Eingabefelds: die runden Typ-Knöpfe unten, die Typ-Pille
 * oben und das Blatt „Typ wählen“, das die Pille öffnet. Eigene Datei, damit
 * src/features/composer/composer.js beim Anlegen bleiben kann.
 * Pfad: src/features/composer/composer-types.js
 *
 * ANPASSBARE WERTE (alle in src/data/config.js)
 * -----------------------------------
 * composerPlaceholders  -> Platzhaltertext im Eingabefeld je gewähltem Typ
 * mediaTitlePlaceholder -> Platzhalter eines Mediums, sobald eine Datei angehängt ist
 * xpItems[*].color      -> Icon-Farbe des gewählten Typ-Knopfs
 *
 * Größe und Farben von Knöpfen und Pille stehen in styles/composer.css.
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import {
  composerPlaceholders,
  defaultType,
  mediaTitlePlaceholder,
  typeSingular,
  types,
  xpItemStyle,
} from "../../data/config.js";
import { isEntryRef } from "../../data/refs.js";
import { openSheet } from "../../ui/sheet.js";
import {
  chooseTypeByHand,
  clearComposerPick,
  composer,
  composerPickButtons,
  isComposerPreset,
} from "./composer-state.js";

/* Diese Typen stehen im Blatt abgesetzt unter den vier mit eigenem Knopf —
   in der Reihenfolge aus `types`, also Dokument, Zeichnung, Medium. */
const sheetResourceTypes = ["dokument", "zeichnung", "medien"];

/*
 * Darf gerade ein Projekt entstehen? Steht als Ablageort schon ein Projekt
 * fest, dann nicht: ein Projekt in einem Projekt schließt src/data/config.js
 * aus (containerTypes), sonst könnte ein Kreis entstehen.
 */
function projectAllowed() {
  return !isEntryRef(composer.place);
}

/* Was im leeren Feld steht. Ein Medium ohne Datei sagt, wie man zu einer
   kommt; mit Datei, dass ein eigener Titel freiwillig ist. */
function placeholderText(typeId) {
  if (typeId === "medien" && composer.files.length) return mediaTitlePlaceholder;
  return composerPlaceholders[typeId] || "Neuen Eintrag einfügen …";
}

/** Typ-Pille neben dem Ablageort: zeigt den gewählten Typ und setzt den Platzhaltertext. */
function renderComposerTypePill() {
  const type =
    types.find((item) => item.id === composer.type) || types.find((item) => item.id === defaultType);
  dom.composerTypeIcon.setAttribute("href", `#icon-${type.icon}`);
  /* In der Einzahl: die Pille benennt den einen Eintrag, der gleich entsteht. */
  dom.composerTypeLabel.textContent = typeSingular(type.id);
  dom.composerInput.placeholder = placeholderText(type.id);
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

/* Die Typ-Pille oben öffnet die volle Liste der Typen. */
function openTypeSheet(refresh) {
  const allowProject = projectAllowed();
  const sheetTypes = types.filter(
    (type) =>
      (type.pick || sheetResourceTypes.includes(type.id)) &&
      !(type.id === "projekt" && !allowProject)
  );
  openSheet(
    "Typ wählen",
    sheetTypes.map((type) => ({
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
    }))
  );
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
 */
export function initComposerTypes(refresh) {
  dom.composerTypes.addEventListener("click", (event) => onTypeClick(event, refresh));
  dom.composerTypePill.addEventListener("click", () => openTypeSheet(refresh));
}
