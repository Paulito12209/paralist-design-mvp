/*
 * Löschen mit „Rückgängig“: die Löschung passiert sofort, unten steht ein paar
 * Sekunden die Meldung „… gelöscht · Rückgängig“ (Snackbar nach Material 3).
 * Am Handy ist das schneller als eine Rückfrage vorher — und wer sich vertippt
 * hat, holt alles mit einem Tipp zurück.
 * Pfad: src/ui/undo-toast.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * UNDO_MS     -> wie lange „Rückgängig“ möglich ist (und die Meldung steht)
 * words.undo  -> Beschriftung des Knopfes in der Meldung
 *
 * Aussehen der Meldung: src/ui/toast.js und styles/toast.css.
 * Den Stand merken und zurückschreiben: src/data/undo.js.
 */

import { runUndoable } from "../data/undo.js";
import { showToast } from "./toast.js";

/* Material 3 empfiehlt 4–10 Sekunden für eine Snackbar mit Knopf; 5 reicht,
   um „Rückgängig“ zu treffen, ohne lange im Weg zu stehen. */
const UNDO_MS = 5000;

const words = { undo: "Rückgängig" };

/* Die noch offene Löschung: { settle, timer } — oder null */
let pending = null;

/* Eine ältere Löschung gilt, sobald die nächste kommt: es gibt immer nur
   eine Meldung, also auch nur ein „Rückgängig“. */
function settlePending() {
  if (!pending) return;
  clearTimeout(pending.timer);
  pending.settle();
  pending = null;
}

/**
 * Löschen und dabei „Rückgängig“ anbieten.
 * @param change  führt die Löschung aus (z.B. () => deleteCollection("projects"))
 * @param title   was passiert ist, z.B. „Alle Projekte gelöscht“
 * @param icon    Icon links in der Meldung, Vorgabe der Papierkorb
 */
export function deleteWithUndo(change, { title, icon = "trash" }) {
  settlePending();
  const step = runUndoable(change);
  const own = { settle: step.settle, timer: 0 };
  own.timer = setTimeout(() => {
    if (pending === own) pending = null;
    step.settle();
  }, UNDO_MS);
  pending = own;
  showToast({
    icon,
    accent: "var(--muted)",
    title,
    ms: UNDO_MS,
    action: {
      label: words.undo,
      icon: "undo",
      onSelect: () => {
        clearTimeout(own.timer);
        if (pending === own) pending = null;
        step.undo();
      },
    },
  });
}
