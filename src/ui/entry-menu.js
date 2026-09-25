/*
 * Die Aktionen eines Eintrags — einmal zusammengestellt, an zwei Stellen
 * gezeigt: als Blatt hinter den drei Punkten auf der Eintragsseite und als
 * kleines Menü, wenn man eine Eintrags-Zeile in einer Liste gedrückt hält
 * (oder mit der Maus rechts klickt). So spart man sich den Weg in die Seite,
 * um z.B. einen Eintrag schnell mit einem Arbeitsbereich zu verknüpfen.
 * Pfad: src/ui/entry-menu.js
 *
 * Keine anpassbaren visuellen Werte: das Menü sieht aus wie in
 * src/ui/ctx-menu.js beschrieben (styles/overlays.css, Klasse .ctx-card).
 */

import { emit, events } from "../core/bus.js";
import { load } from "../core/lazy.js";
import { entryDetails } from "../data/details.js";
import { isTaskDone } from "../data/config.js";
import { deleteEntry, toggleFavorite } from "../data/mutations.js";
import { findEntry } from "../data/queries.js";
import { archiveEntry } from "../data/xp.js";
import { copyOptions } from "./copy-page.js";
import { openCtxMenu } from "./ctx-menu.js";
import { openDetails } from "./details.js";
import { openLinkPicker } from "./pickers.js";
import { toggleTaskFromCheck } from "./task-status.js";
import { typeChangeAction } from "./type-menu.js";

/**
 * Alle Aktionen eines Eintrags in der Reihenfolge des Menüs.
 * @param onPage true auf der Eintragsseite: nur dort gibt es „Zeichnung
 *   leeren“, weil nur dort die Zeichenfläche offen ist.
 * @param afterRemove läuft nach Archivieren und Löschen — die Eintragsseite
 *   kehrt dann zurück, in einer Liste verschwindet nur die Zeile.
 */
export function entryMenuOptions(entry, { onPage = false, afterRemove = () => {} } = {}) {
  const options = [];
  /* Bei einer Aufgabe steht das Abhaken ganz oben — es ist das Häufigste. */
  if (entry.type === "aufgabe") {
    const done = isTaskDone(entry);
    options.push({
      label: done ? "Wieder öffnen" : "Als erledigt markieren",
      icon: done ? "circle" : "check-circle",
      onSelect: () => toggleTaskFromCheck(entry.id),
    });
  }
  options.push(
    {
      label: entry.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: entry.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(entry),
    },
    {
      label: "Verknüpfen",
      icon: "link",
      onSelect: () => openLinkPicker(entry),
    }
  );
  /* „Typ ändern“ steht bei den Dingen, die den Eintrag umbauen (Verknüpfen),
     nicht bei den Aktionen, die ihn wegräumen. Fehlt bei Zeichnung und Medium. */
  const typeChange = typeChangeAction({ entry });
  if (typeChange) options.push(typeChange);
  options.push(
    {
      label: "Details",
      icon: "info",
      onSelect: () => openDetails(entry.title || "Ohne Titel", entryDetails(entry)),
    },
    /* Auch hier, nicht nur hinter dem Kopier-Knopf der Seite: wer das
       Gedrückthalten dort nicht kennt, findet beide Wege im Menü — und aus
       einer Liste kopiert man, ohne die Seite zu öffnen. */
    ...copyOptions(entry)
  );

  if (onPage && entry.type === "zeichnung") {
    options.push({
      label: "Zeichnung leeren",
      icon: "eraser",
      onSelect: () => load("drawing").then((module) => module.clearDrawing()),
    });
  }

  options.push(
    {
      label: "Archivieren",
      icon: "archive",
      onSelect: () => {
        archiveEntry(entry);
        emit(events.dataChanged);
        afterRemove();
      },
    },
    {
      label: "Eintrag löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        deleteEntry(entry.id);
        afterRemove();
      },
    }
  );
  return options;
}

/** Das kleine Menü neben einer gedrückt gehaltenen Eintrags-Zeile. */
export function openEntryCtxMenu(row) {
  const entry = findEntry(row.dataset.openEntry);
  if (entry) openCtxMenu(row, entryMenuOptions(entry));
}
