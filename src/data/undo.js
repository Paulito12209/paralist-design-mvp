/*
 * „Rückgängig“ für große Löschungen (alle Ressourcen, alle Einträge eines
 * Orts, alle Favoriten …): vorher den Stand merken, löschen, und auf Wunsch
 * den gemerkten Stand zurückschreiben. Die Meldung dazu zeigt
 * src/ui/undo-toast.js.
 * Pfad: src/data/undo.js
 *
 * Keine anpassbaren Werte: wie lange „Rückgängig“ möglich ist, steht in
 * src/ui/undo-toast.js (UNDO_MS).
 *
 * Gemerkt werden nur die Listen, die eine Löschung berührt: Einträge,
 * Arbeitsbereiche und die Projekt-Ansichten (ihre handverlesenen Listen und
 * Filter verlieren beim Löschen Verweise). Was zwischen Löschen und
 * Rückgängig neu angelegt wurde, bleibt beim Zurückschreiben erhalten.
 * Dateien und Vorschaubilder der gelöschten Einträge räumt commit() erst auf,
 * wenn die Entscheidung gefallen ist (holdPrune/releasePrune).
 */

import { sameId } from "../core/ids.js";
import { commit, holdPrune, releasePrune } from "./mutations.js";
import { state } from "./state.js";

/* Diese Listen in `state` schreibt eine Löschung um */
const keptLists = ["entries", "workspaces", "projectViews"];

/* Gemerkte Liste plus alles, was es heute gibt, aber damals noch nicht gab. */
function mergeBack(saved, now) {
  const added = now.filter((item) => !saved.some((old) => sameId(old.id, item.id)));
  return [...saved, ...added];
}

/**
 * `change()` ausführen und den Stand davor merken.
 * Zurück kommt { undo, settle }: undo() schreibt den alten Stand zurück,
 * settle() bestätigt die Löschung. Genau eins von beiden wird einmal
 * aufgerufen; ein zweiter Aufruf tut nichts.
 */
export function runUndoable(change) {
  const saved = structuredClone(Object.fromEntries(keptLists.map((key) => [key, state[key]])));
  holdPrune();
  change();
  let open = true;
  return {
    undo() {
      if (!open) return;
      open = false;
      keptLists.forEach((key) => {
        state[key] = mergeBack(saved[key], state[key]);
      });
      commit();
      releasePrune();
    },
    settle() {
      if (!open) return;
      open = false;
      releasePrune();
    },
  };
}
