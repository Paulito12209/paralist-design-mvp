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
import { isTaskDone } from "../data/config-tasks.js";
import { deleteEntry, restoreFromArchive, setCover, setEntryIcon, toggleFavorite } from "../data/mutations.js";
import { findEntry } from "../data/queries.js";
import { archiveEntry } from "../data/xp.js";
import { copyOptions } from "./copy-page.js";
import { openDrawingExport } from "./drawing-export.js";
import { openCtxMenu } from "./ctx-menu.js";
import { openDetails } from "./details.js";
import { openLinkSheet } from "./link-sheet.js";
import { iconPickerAction } from "./pickers.js";
import { toggleTaskFromCheck } from "./task-status.js";
import { typeChangeAction } from "./type-menu.js";

/**
 * Alle Aktionen eines Eintrags in der Reihenfolge des Menüs.
 * @param onPage true auf der Eintragsseite: nur dort gibt es Cover und Icon
 *   (wie in Notion — beides wirkt oben auf der Seite) und „Zeichnung
 *   leeren“, weil nur dort die Zeichenfläche offen ist. „Details“ fehlt
 *   dort dafür: es steht als Karte am Ende der Seite.
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
      onSelect: () => openLinkSheet(entry),
    }
  );
  /* „Typ ändern“ steht bei den Dingen, die den Eintrag umbauen (Verknüpfen),
     nicht bei den Aktionen, die ihn wegräumen. Fehlt bei Zeichnung und Medium. */
  const typeChange = typeChangeAction({ entry });
  if (typeChange) options.push(typeChange);
  /* Cover und Icon gestalten die Seite selbst: darum nur dort, gleich nach
     dem, was den Eintrag umbaut. Das Cover ist ein Farbverlauf in der Farbe
     der Kategorie — ein Schalter, keine Auswahl. */
  if (onPage) {
    options.push(
      {
        label: entry.cover ? "Cover entfernen" : "Cover hinzufügen",
        icon: "image",
        onSelect: () => setCover(entry, !entry.cover),
      },
      iconPickerAction(entry.icon, (name) => setEntryIcon(entry, name))
    );
  }
  /* Auf der Seite steht „Details“ als Karte am Ende des Reiters „Inhalt“
     (src/features/entry/entry-details.js) — im Menü nur aus einer Liste heraus. */
  if (!onPage) {
    options.push({
      label: "Details",
      icon: "info",
      onSelect: () => openDetails(entry.title || "Ohne Titel", entryDetails(entry)),
    });
  }
  /* Auch hier, nicht nur hinter dem Kopier-Knopf der Seite: wer das
     Gedrückthalten dort nicht kennt, findet beide Wege im Menü — und aus
     einer Liste kopiert man, ohne die Seite zu öffnen. */
  options.push(...copyOptions(entry));
  /* Eine Zeichnung lässt sich auch als Datei sichern — PNG oder JPEG */
  if (entry.type === "zeichnung") {
    options.push({ label: "Exportieren", icon: "share", onSelect: () => openDrawingExport(entry) });
  }

  if (onPage && entry.type === "zeichnung") {
    options.push({
      label: "Zeichnung leeren",
      icon: "eraser",
      onSelect: () => load("drawing").then((module) => module.clearDrawing()),
    });
  }

  /* Ein archivierter Eintrag (Archiv-Liste, seine Seite von dort aus) wird
     zurückgeholt statt noch einmal archiviert; er bleibt dabei offen. */
  options.push(
    entry.archived
      ? { label: "Zurückholen", icon: "history", onSelect: () => restoreFromArchive(entry) }
      : {
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

/* Optionen, die eine Seite vor das Menü einer Zeile stellt — die
   Aufgaben-Seite und die Sammlungen „Auswählen“. Die Seiten geben sie
   herein (addEntryMenuLead), damit diese Datei keinen Bereich kennen muss. */
const leads = [];

/** Optionen oben im Menü einer Zeile anmelden: fn(entry, row) -> Optionen (oft leer). */
export function addEntryMenuLead(fn) {
  leads.push(fn);
}

/**
 * Das kleine Menü neben einer gedrückt gehaltenen Eintrags-Zeile — in einer
 * Liste (data-open-entry) oder im Board der Aufgaben (data-board-row).
 * @param anchor wo das Menü aufgeht, wenn nicht an der Zeile: die drei Punkte
 *   rechts in der Android-Fassung.
 */
export function openEntryCtxMenu(row, anchor = row) {
  const entry = findEntry(row.dataset.openEntry || row.dataset.boardRow);
  if (entry) openCtxMenu(anchor, [...leads.flatMap((lead) => lead(entry, row)), ...entryMenuOptions(entry)]);
}
