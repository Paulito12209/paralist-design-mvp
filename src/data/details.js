/*
 * Was „Details“ zu einem Arbeitsbereich oder Eintrag zeigt — nach dem
 * Vorbild von Google Drive, aber nur mit Angaben, die die App wirklich hat.
 * Fehlt ein Wert, fällt die Zeile weg statt leer dazustehen.
 * Pfad: src/data/details.js
 *
 * Keine anpassbaren Werte: die Typnamen in der Einzahl („Projekt“, „Medium“)
 * stehen in src/data/config.js (typeSingulars).
 */

import { linkedEntries } from "./links.js";
import { entriesOf, isContainer, placesLabel } from "./queries.js";
import { entryRef, workspaceRef } from "./refs.js";
import { state } from "./state.js";
import { typeSingular } from "./config.js";
import { longDate } from "../core/format.js";

const createdFormat = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

/** Der Typname eines Eintrags in der Einzahl, z.B. „Notiz“, „Projekt“ oder „Medium“. */
export function entryTypeName(entry) {
  return typeSingular(entry.type);
}

/** Details eines Arbeitsbereichs als Liste von { label, value }. */
export function workspaceDetails(workspace) {
  const tab = state.tabs.find((item) => String(item.id) === String(workspace.tab));
  const rows = [
    { label: "Typ", value: "Arbeitsbereich" },
    { label: "Speicherort", value: tab ? `Übersicht · ${tab.name}` : "Übersicht" },
    { label: "Einträge", value: String(entriesOf(workspaceRef(workspace.id)).length) },
  ];
  if (workspace.favorite) rows.push({ label: "Favorit", value: "Ja" });
  return rows;
}

/** Details eines Eintrags als Liste von { label, value }. */
export function entryDetails(entry) {
  const rows = [
    { label: "Typ", value: entryTypeName(entry) },
    { label: "Speicherort", value: placesLabel(entry) },
  ];
  if (entry.date) rows.push({ label: "Datum", value: longDate(entry.date) });
  const count = isContainer(entry) ? entriesOf(entryRef(entry.id)).length : linkedEntries(entry).length;
  rows.push({ label: isContainer(entry) ? "Einträge" : "Verknüpfungen", value: String(count) });
  if (entry.favorite) rows.push({ label: "Favorit", value: "Ja" });
  if (entry.createdAt) rows.push({ label: "Erstellt", value: createdFormat.format(new Date(entry.createdAt)) });
  return rows;
}
