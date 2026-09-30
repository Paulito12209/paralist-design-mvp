/*
 * Die Bausteine, die man im Inhalt einer Notiz wählen kann, und was beim
 * Wählen mit der Zeile passiert. Gemeinsam genutzt vom „/“-Menü unter der
 * Zeile (src/ui/slash-menu.js, Rechner) und von der Leiste über der
 * Bildschirmtastatur mit ihrer Auswahl an Stelle der Tastatur
 * (src/ui/block-bar.js, Handy) — so stehen hier wie dort dieselben Kacheln.
 * Pfad: src/ui/block-choices.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * blockGroups -> welche Bausteine es gibt, in welcher Gruppe und Reihenfolge,
 *                mit Icon, Name und Suchwörtern (fürs Filtern hinter „/“);
 *                dieselbe Reihenfolge haben die Icons in der Leiste über der Tastatur
 *
 * Aussehen der Kacheln: styles/slash-menu.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { normalizeUrl } from "../data/link-kinds.js";
import { isTextKind, makeBlock } from "../data/note-blocks.js";
import { commitUrl } from "./block-embeds.js";

export const blockGroups = [
  {
    title: "Grundlagen",
    items: [
      { kind: "text", label: "Text", icon: "text", words: "absatz text normal" },
      { kind: "bullet", label: "Stichpunkte", icon: "list", words: "liste aufzählung punkte bullet" },
      { kind: "number", label: "Nummerierte Liste", icon: "list-num", words: "nummer zahlen liste reihenfolge" },
      { kind: "check", label: "Checkbox", icon: "check-circle", words: "to-do todo aufgabe haken checkliste" },
      { kind: "divider", label: "Trennlinie", icon: "divider", words: "linie trenner abschnitt divider" },
    ],
  },
  {
    title: "Einbettungen",
    items: [
      { kind: "place", label: "Standort", icon: "pin", words: "ort karte google maps adresse location" },
      { kind: "video", label: "Video", icon: "video", words: "youtube film clip" },
      { kind: "link", label: "Web-Lesezeichen", icon: "bookmark", words: "link website url seite lesezeichen" },
    ],
  },
];

/** Alle Bausteine in einer Reihe, wie sie in der Leiste über der Tastatur stehen. */
export const allChoices = blockGroups.flatMap((group) => group.items);

/**
 * Gruppen mit Überschrift und Kacheln. Jede Kachel trägt data-choice mit
 * ihrer Stelle in der Reihe aller gezeigten Kacheln; `active` ist die mit
 * den Pfeiltasten markierte (-1: keine).
 */
export function choicesMarkup(groups, active = -1) {
  let flat = 0;
  return groups
    .map((group) => {
      const tiles = group.items
        .map((item) => {
          const index = flat++;
          const on = index === active;
          return `<button class="slash-item${on ? " is-active" : ""}" type="button" role="option" aria-selected="${on}" data-choice="${index}">${icon(item.icon)}<span>${escapeHtml(item.label)}</span></button>`;
        })
        .join("");
      return `<p class="slash-heading">${escapeHtml(group.title)}</p><div class="slash-grid">${tiles}</div>`;
    })
    .join("");
}

/**
 * Zeile `index` wird zum Baustein `kind`. cut = { start, length } nimmt
 * dabei ein getipptes „/…“ aus dem Text; ohne cut bleibt der Text, wie er
 * ist, und der Cursor an Stelle `caret`.
 * Eine Textzeile, die schon diese Art hat (Stichpunkt auf Stichpunkt), wird
 * wieder zu Text — so schaltet derselbe Knopf hin und zurück.
 */
export function applyChoice(ed, index, kind, { cut = null, caret = 0 } = {}) {
  const block = ed.blocks[index];
  if (!block) return;
  const text = cut ? block.text.slice(0, cut.start) + block.text.slice(cut.start + cut.length) : block.text;
  const at = cut ? cut.start : Math.min(caret, text.length);
  if (isTextKind(kind)) {
    const next = !cut && block.kind === kind && kind !== "text" ? "text" : kind;
    ed.replace(index, 1, makeBlock(next, { text }));
    ed.focusBlock(index, at);
    return;
  }
  /* Steht in der Zeile nur ein Link (z.B. ein eingefügter Maps-Link), wird
     er direkt zur Karte — ohne ihn noch einmal einfügen zu müssen. */
  if (kind !== "divider" && normalizeUrl(text)) {
    ed.replace(index, 1, makeBlock(kind));
    const input = ed.nodeAt(index).querySelector(".nb-url");
    input.value = text.trim();
    commitUrl(ed, index, input);
    return;
  }
  /* Trennlinie und Karten sind eigene Zeilen: steht noch Text in der Zeile,
     bleibt er darüber stehen. */
  const keep = text.trim() ? [{ ...block, text }] : [];
  const inserted = kind === "divider" ? [makeBlock("divider"), makeBlock()] : [makeBlock(kind)];
  ed.replace(index, 1, ...keep, ...inserted);
  ed.focusBlock(index + keep.length + (kind === "divider" ? 1 : 0), 0);
  if (kind !== "divider") ed.nodeAt(index + keep.length)?.scrollIntoView({ block: "nearest" });
}
