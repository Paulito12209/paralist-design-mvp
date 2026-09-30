/*
 * Datum und Uhrzeit eines Eintrags wählen — aus der Karte „Details“ heraus
 * (Kennzahl „Datum“ bzw. „Uhrzeit“, auf dem Handy und in der Spalte rechts
 * am Desktop). Es öffnet sich die Auswahl des Systems für Tag und Uhrzeit in
 * einem Zug; unter Android ist das der Kalender, danach die Uhr — genau das,
 * was die spätere native App auch zeigt. Leeren entfernt Datum und Uhrzeit.
 * Pfad: src/ui/date-field.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * defaultTime -> Uhrzeit, mit der die Auswahl beginnt, wenn der Eintrag noch keine hat
 *
 * Das Feld selbst ist unsichtbar (styles/entry-details.css, Klasse .date-field).
 */

import { dayKey } from "../core/dates.js";
import { commit, markEdited } from "../data/mutations.js";

const defaultTime = "09:00";

/* Datum und Uhrzeit übernehmen; ein leerer Wert nimmt beides weg. */
function applyWhen(entry, value) {
  const [date, time] = value ? value.split("T") : ["", ""];
  if ((entry.date || "") === date && (entry.time || "") === (time || "")) return;
  if (date) {
    entry.date = date;
    entry.time = time;
  } else {
    delete entry.date;
    delete entry.time;
  }
  markEdited(entry);
  commit();
}

/* Ein einziges Feld für alle Aufrufe, einmal angelegt; `current` ist der
   Eintrag, dessen Datum es gerade trägt. Es bleibt im Dokument — manche
   Systeme nehmen dem Feld beim Öffnen der Auswahl den Fokus, ein Entfernen
   dabei würde die Wahl verschlucken. */
let input = null;
let current = null;

function ensureInput() {
  if (input) return input;
  /* input type=datetime-local: Tag und Uhrzeit in einer Auswahl des Systems */
  input = document.createElement("input");
  input.type = "datetime-local";
  input.className = "date-field";
  input.tabIndex = -1;
  input.setAttribute("aria-label", "Datum und Uhrzeit");
  input.addEventListener("change", () => {
    if (current) applyWhen(current, input.value);
  });
  document.body.append(input);
  return input;
}

/**
 * Die Auswahl über `anchor` öffnen. Das unsichtbare Feld liegt dafür genau
 * auf dem angetippten Knopf, damit die Auswahl am Desktop dort aufklappt.
 */
export function openDateField(entry, anchor) {
  const field = ensureInput();
  const rect = anchor.getBoundingClientRect();
  current = entry;
  field.value = `${entry.date || dayKey(new Date())}T${entry.time || defaultTime}`;
  Object.assign(field.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  /* showPicker öffnet die Auswahl sofort; ältere Browser kennen es nicht —
     dort genügt Fokus und Klick auf das Feld */
  try {
    field.showPicker();
  } catch {
    field.focus({ preventScroll: true });
    field.click();
  }
}
