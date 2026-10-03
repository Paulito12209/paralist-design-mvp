/*
 * Was man mit der Mitschrift einer Aufnahme machen kann: die zwei Knöpfe
 * rechts neben der Zwischenüberschrift „Mitschrift“. „Kopieren“ legt den
 * Text in die Zwischenablage, „Umwandeln“ fragt im Blatt nach Notiz oder
 * Dokument und legt den Text als neuen Eintrag im Eingang an — die Aufnahme
 * selbst läuft dabei weiter und wird wie gewohnt gespeichert.
 * Benutzt von src/features/media/recorder.js.
 * Pfad: src/features/media/recorder-text.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * targets -> wohinein man umwandeln kann und wie der neue Eintrag heißt
 *            („Text aus Sprachmemo 04.10.2026 14:03“)
 *
 * Aussehen der Knöpfe: styles/recorder.css (.recorder-text-tools).
 */

import { copyText } from "../../core/clipboard.js";
import { createEntryInline } from "../../data/mutations-inline.js";
import { openSheet } from "../../ui/sheet.js";
import { showToast } from "../../ui/toast.js";

/* Je Ziel: Typ des Eintrags, Name im Blatt, Icon und was vor dem Namen der Aufnahme steht */
const targets = [
  { type: "notiz", label: "Notiz", icon: "note", prefix: "Notiz aus", done: "Als Notiz gespeichert" },
  { type: "dokument", label: "Dokument", icon: "doc", prefix: "Text aus", done: "Als Dokument gespeichert" },
];

const labels = {
  convertTitle: "Mitschrift umwandeln",
  convertNote: "Der Text wird ein neuer Eintrag im Eingang. Die Aufnahme bleibt, wie sie ist.",
  copied: "Mitschrift kopiert",
  copyFailed: "Kopieren nicht möglich",
};

/** Die Mitschrift in die Zwischenablage legen und melden. */
export async function copyTranscript(text) {
  if (!text) return;
  if (await copyText(text)) showToast({ icon: "copy", title: labels.copied });
  else showToast({ icon: "info", title: labels.copyFailed, accent: "var(--danger)" });
}

/**
 * Das Blatt „Mitschrift umwandeln“: Notiz oder Dokument wählen, der Eintrag
 * entsteht sofort. `name` ist der Name der Aufnahme.
 */
export function convertTranscript(text, name) {
  if (!text) return;
  const options = targets.map((target) => ({
    label: target.label,
    icon: target.icon,
    onSelect: () => {
      const title = `${target.prefix} ${name}`;
      createEntryInline({ title, type: target.type, fields: { body: text } });
      showToast({ icon: target.icon, title: target.done, note: title });
    },
  }));
  openSheet(labels.convertTitle, [{ note: true, label: labels.convertNote }, ...options], { icon: "convert" });
}
