/*
 * Die Zeilen der Listen: Eintrag, Arbeitsbereich und die Wisch-Knöpfe dahinter.
 * Nur Markup — wer die Zeile anklickt, entscheidet src/ui/list-clicks.js.
 * Pfad: src/ui/rows.js
 *
 * Keine anpassbaren visuellen Werte: Höhe, Farben und Abstände stehen in
 * styles/rows.css (Klassen .workspace-row, .swipe, .swipe-action).
 */

import { escapeHtml, icon } from "../core/html.js";
import { sameId } from "../core/ids.js";
import { typeIcon } from "../data/config.js";
import { mediaKindOf, workspaceIcon, workspaceLabel } from "../data/queries.js";
import { ui } from "../data/state.js";
import { thumbOf } from "../data/thumbs.js";

/** Eine Zeile mit Wisch-Knöpfen; die Knöpfe liegen hinter der Zeile. */
export function swipeRow(dataAttr, actionsLeft, actionsRight, rowHtml) {
  const side = (position, actions) =>
    actions.length
      ? `<div class="swipe-actions swipe-actions-${position}">${actions.join("")}</div>`
      : "";

  return `
    <div class="swipe" ${dataAttr}>
      ${side("left", actionsLeft)}
      ${side("right", actionsRight)}
      <div class="swipe-body">${rowHtml}</div>
    </div>
  `;
}

/** Ein runder Wisch-Knopf. „action“ sagt, was passiert, „tone“ nur, welche Farbe der Kreis hat. */
export function swipeAction(action, label, iconName, tone = action) {
  return `
    <button class="swipe-action swipe-action-${tone}" type="button" data-swipe="${action}" aria-label="${label}">
      ${icon(iconName)}
    </button>
  `;
}

/**
 * Bild vor dem Titel: kleine Vorschau bei Fotos, Videos und Zeichnungen,
 * sonst das Typ-Icon. Medien zeigen ihre Art statt des allgemeinen Icons.
 */
export function entryGlyph(entry) {
  const thumb = thumbOf(entry.id);
  const kind = mediaKindOf(entry);
  const hasPreview =
    entry.type === "zeichnung" || (entry.type === "medien" && (kind === "image" || kind === "video"));
  if (thumb && hasPreview) return `<img class="entry-thumb" src="${thumb}" alt="" loading="lazy" decoding="async" />`;
  if (entry.type === "medien") {
    const kindIcons = { image: "image", video: "video", audio: "wave", doc: "doc" };
    return icon(kindIcons[kind] || "doc", "entry-type");
  }
  return icon(typeIcon(entry.type), "entry-type");
}

/**
 * Die vier Wisch-Knöpfe einer Eintrags-Zeile, je zwei auf jeder Seite: links
 * steht, was den Eintrag in der Liste lässt (Favorit, Verknüpfen), rechts das,
 * was ihn herausnimmt — Archivieren direkt neben dem roten Löschen.
 *
 * Die Liste steht hier und nicht bei den einzelnen Zeilen, weil es zwei Arten
 * von Eintrags-Zeilen gibt (diese hier und die Aufgaben-Liste). Standen die
 * Knöpfe zweimal im Code, hatte eine Seite sie irgendwann anders als die andere.
 */
export function entryActions(entry) {
  return {
    left: [
      swipeAction("favorite", "Favorit", entry.favorite ? "star" : "star-outline", "favorite"),
      swipeAction("link", "Verknüpfen", "link"),
    ],
    right: [
      swipeAction("archive", "Archivieren", "archive"),
      swipeAction("delete", "Löschen", "trash"),
    ],
  };
}

/**
 * Zeile eines Eintrags mit ihren Wisch-Knöpfen.
 * @param prefix optionaler Einschub vor dem Titel, z.B. die Uhrzeit im Kalender.
 */
export function entryRow(entry, prefix = "") {
  const actions = entryActions(entry);
  return swipeRow(
    `data-entry="${entry.id}"`,
    actions.left,
    actions.right,
    `
      <button class="workspace-row entry-row" type="button" data-open-entry="${entry.id}">
        ${entryGlyph(entry)}
        ${prefix}
        <span>${escapeHtml(entry.title)}</span>
        ${icon("chevron", "chevron")}
      </button>
    `
  );
}

/**
 * Zeile eines Arbeitsbereichs.
 * @param canEdit true, wenn beim Umbenennen an dieser Stelle ein Eingabefeld stehen darf.
 */
export function workspaceRow(workspace, canEdit = false) {
  if (canEdit && workspace.id === ui.editingWorkspaceId) {
    /* Der Vorgabename steht grau als Platzhalter; wer nichts tippt, bekommt ihn.
       Schon Getipptes bleibt stehen, auch wenn die Liste zwischendurch neu gezeichnet wird. */
    const draft = ui.nameDraft && sameId(ui.nameDraft.id, workspace.id) ? ui.nameDraft.value : workspace.name;
    return `
      <div class="workspace-row">
        ${icon(workspaceIcon(workspace))}
        <input class="workspace-name-input" id="workspace-name-input" type="text" data-editing="${workspace.id}" value="${escapeHtml(draft)}" placeholder="${escapeHtml(workspace.placeholder || workspaceLabel(workspace))}" aria-label="Arbeitsbereich benennen" />
      </div>
    `;
  }

  return swipeRow(
    `data-workspace="${workspace.id}"`,
    [],
    [swipeAction("delete-workspace", "Löschen", "trash", "delete")],
    `
      <button class="workspace-row" type="button" data-open-workspace="${workspace.id}">
        ${icon(workspaceIcon(workspace))}
        <span>${escapeHtml(workspaceLabel(workspace))}</span>
        ${icon("chevron", "chevron")}
      </button>
    `
  );
}
