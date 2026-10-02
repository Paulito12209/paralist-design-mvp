/*
 * Android-Fassung: die Werkzeugzeile über den Projekten, gebaut wie der Kopf
 * einer Liste in Google Tasks. Links der Text-Knopf „Archiv“ — steht immer,
 * damit die Zeile nie leer wirkt; liegen Projekte im Archiv, folgt ihre Zahl
 * in Klammern („Archiv (2)“). Ein Tipp öffnet das Archiv mit der Pille
 * Projekte (data-open-archive, src/ui/list-clicks.js). Rechts Sortieren und,
 * außer bei „Alle“ (dort lässt sich nichts filtern), Filtern. Filtern holt
 * das Blatt „Ansicht“ herauf: darin stehen Ort, Nur Favoriten und Projekte
 * wählen (src/features/overview/project-settings.js). Umbenennen, Löschen &
 * Co. einer Ansicht gibt es beim Halten ihres Reiters.
 * Die Zeile steht in jeder Fassung im Dokument und ist nur in der
 * Android-Fassung zu sehen (styles/android-card.css).
 * Pfad: src/features/overview/project-card.js
 *
 * Markup und Klick-Zuordnung teilen sich alle Listen (src/ui/list-head.js).
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * archivePill -> welche Pille das Archiv beim Tipp auf „Archiv (n)“ zeigt
 * Beschriftung und Symbole der Zeile: src/ui/list-head.js.
 */

import { archivedEntries } from "../../data/queries.js";
import { handleListHeadClick, listHeadMarkup } from "../../ui/list-head.js";
import { openViewPanel } from "../../ui/view-panel.js";
import { openProjectSort } from "./project-settings.js";

const archivePill = "projekt";

/* Siebt die Ansicht etwas aus? Dann steht das Filter-Symbol in der Akzentfarbe. */
function isFiltering(view) {
  return view.ids.length > 0 || view.place !== "alle" || Boolean(view.favoritesOnly);
}

/** Die Werkzeugzeile für die gewählte Ansicht. */
export function projectCardHead(view) {
  const count = archivedEntries().filter((entry) => entry.type === "projekt").length;
  return listHeadMarkup({
    archive: { pill: archivePill, count },
    filter: !view.fixed,
    filtering: isFiltering(view),
  });
}

/** Klicks auf Sortieren und Filtern; „Archiv (n)“ erledigt src/ui/list-clicks.js. */
export function handleProjectCardClick(event, view) {
  handleListHeadClick(event, { sort: () => openProjectSort(view), filter: openViewPanel });
}
