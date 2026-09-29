/*
 * Profil › Kurzbefehle (nur am Desktop): alle Tastenkürzel nach Gruppen —
 * Seiten, Sammlungen, Überall — und zwei Schalter, mit denen man die blauen
 * Schilder in der Seitenleiste und in der Reiterzeile ausblendet. Die Tasten
 * der Reiter und Sammlungen kommen aus src/ui/desk-links.js, dieselbe Quelle
 * wie die Kürzel selbst (src/shell/desk.js). Geklickt wird in
 * src/features/profile/profile.js; hier entsteht Markup und die Änderung.
 * Pfad: src/features/profile/shortcuts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * everywhere  -> die Zeilen der Gruppe „Überall“ (Beschriftung und Taste)
 * hintToggles -> Beschriftung und Icon der beiden Schalter
 *
 * Aussehen in styles/shortcuts.css, die Schilder selbst in styles/desk-kbd.css.
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import { hintsShown, setHintsShown } from "../../data/shortcut-hints.js";
import { chordKey, collectionLinks, pageLinks, withCommand } from "../../ui/desk-links.js";
import { keyCap } from "../../ui/dot-keys.js";

/* Kürzel, die auf jeder Seite gelten. Die Befehlstaste heißt je nach Rechner ⌘ oder Strg. */
const everywhere = [
  { label: "Neu", keys: ["N"] },
  { label: "Suchen", keys: [withCommand("K"), "/"] },
  { label: "Zurück", keys: [withCommand("[")] },
  { label: "Vorwärts", keys: [withCommand("]")] },
  { label: "Seitenleiste ein- und ausklappen", keys: [withCommand("\\")] },
  { label: "Profil und Einstellungen", keys: [withCommand(",")] },
  { label: "Diese Seite", keys: ["?"] },
  { label: "Schließen, was obenauf liegt", keys: ["Esc"] },
];

const hintToggles = [
  { place: "nav", label: "Schilder in der Seitenleiste", icon: "sidebar" },
  { place: "tabs", label: "Schilder in der Reiterzeile", icon: "panel-open" },
];

/* Eine Zeile: links wofür, rechts die Schilder. Mehrere Tasten sind Alternativen. */
function shortcutRow(label, keys) {
  const chips = keys.map((key) => keyCap(key, "", true)).join('<span class="shortcut-or">oder</span>');
  return `<li class="shortcut-row"><span>${escapeHtml(label)}</span><span class="shortcut-keys">${chips}</span></li>`;
}

function group(title, rows) {
  return `<p class="psection">${title}</p><ul class="shortcut-list">${rows.join("")}</ul>`;
}

/* Ein Schalter; der Haken steht, solange die Schilder zu sehen sind. */
function toggleRow(toggle) {
  const on = hintsShown(toggle.place);
  return `
    <button class="settings-row${on ? " is-active" : ""}" type="button" data-hints-toggle="${toggle.place}" aria-pressed="${on}">
      ${icon(toggle.icon)}
      <span>${toggle.label}</span>
      ${icon("check", "settings-check")}
    </button>`;
}

/** Die ganze Unterseite: Schalter oben, darunter die drei Gruppen. */
export function shortcutsMarkup() {
  const pages = pageLinks.map((link) => shortcutRow(link.label, [link.key]));
  const places = collectionLinks.map((link) => shortcutRow(link.title, [`${chordKey} ${link.key}`]));
  const always = everywhere.map((row) => shortcutRow(row.label, row.keys));
  return `
    <p class="psection">Schilder</p>
    <div class="settings-group">${hintToggles.map(toggleRow).join("")}</div>
    ${group("Seiten", pages)}
    ${group("Sammlungen", places)}
    ${group("Überall", always)}
  `;
}

/** Schilder an einem Ort ein- oder ausblenden; die Hülle hört über den Bus mit. */
export function toggleHints(place) {
  setHintsShown(place, !hintsShown(place));
  emit(events.shortcutHintsChanged);
}
