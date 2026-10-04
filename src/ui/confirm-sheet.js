/*
 * Eine kurze Rückfrage von unten, im Stil des Auswahl-Blatts: Titel, ein Satz,
 * darunter zwei Knöpfe nebeneinander — links „Behalten“, rechts die rote
 * Aktion. Für Dinge, die sich nicht rückgängig machen lassen, z.B. eine
 * laufende Aufnahme verwerfen. Was sich zurückholen lässt, löscht lieber
 * sofort und bietet „Rückgängig“ an (src/ui/undo-toast.js).
 * Pfad: src/ui/confirm-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * words.keep -> Beschriftung des Knopfes, der nichts tut
 *
 * Aussehen: das Auswahl-Blatt (src/ui/sheet.js) mit `note` und zwei
 * `pair`-Optionen, Stile in styles/overlays.css und styles/details.css,
 * in Android styles/android-bottom-sheet.css.
 */

import { openSheet } from "./sheet.js";

const words = { keep: "Behalten" };

/**
 * Rückfrage öffnen. Antippen daneben oder Wegziehen gilt wie „Behalten“.
 * @param title         die Frage, z.B. „Aufnahme verwerfen?“
 * @param text          ein Satz, was dabei verloren geht
 * @param confirmLabel  Beschriftung der roten Aktion, z.B. „Verwerfen“
 * @param confirmIcon   Icon dazu, Vorgabe der Papierkorb
 * @param onConfirm     läuft nach „Verwerfen“
 * @param onKeep        läuft nach „Behalten“ (optional)
 */
export function openConfirmSheet({ title, text, confirmLabel, confirmIcon = "trash", onConfirm, onKeep = () => {} }) {
  openSheet(title, [
    { note: true, label: text },
    { label: words.keep, icon: "check", pair: true, onSelect: onKeep },
    { label: confirmLabel, icon: confirmIcon, pair: true, danger: true, onSelect: onConfirm },
  ]);
}
