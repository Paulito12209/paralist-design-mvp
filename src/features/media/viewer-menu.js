/*
 * Das Drei-Punkte-Menü der Dateiansicht und der Teilen-Knopf. Verknüpfen hat
 * einen eigenen Knopf in der Leiste unten (viewer.js) und steht deshalb nicht
 * mehr hier. Oben stehen Umbenennen und Favorisieren, unten nebeneinander
 * Archivieren und Löschen.
 * Pfad: src/features/media/viewer-menu.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * noteTime -> wie lange der kurze Hinweis nach dem Teilen stehen bleibt (Millisekunden)
 *
 * Das Aussehen des Blatts steht in styles/overlays.css (.sheet-option, .sheet-pair).
 */

import { getBlob } from "../../core/blobs.js";
import { emit, events } from "../../core/bus.js";
import { deleteEntry, toggleFavorite } from "../../data/mutations.js";
import { archiveEntry } from "../../data/xp.js";
import { openSheet } from "../../ui/sheet.js";

const noteTime = 2200;

let noteTimer = 0;

/** Kurzer Hinweis unten in der Dateiansicht, z.B. wenn Teilen nicht geht. */
function showNote(note, text) {
  note.textContent = text;
  note.hidden = false;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    note.hidden = true;
  }, noteTime);
}

/**
 * Die Datei weitergeben. Handys zeigen dafür ihr eigenes Teilen-Fenster;
 * kann der Browser das nicht, wird die Datei stattdessen heruntergeladen.
 */
export async function shareEntry(entry, note) {
  const file = await getBlob(entry.id);
  const title = entry.title || "Datei";
  if (!file) {
    showNote(note, "Diese Datei liegt nicht in diesem Browser und lässt sich nicht teilen.");
    return;
  }

  const name = (entry.media && entry.media.name) || title;
  /* File: das Teilen-Fenster des Geräts braucht die Datei mit Namen, nicht nur die Daten */
  const shared = new File([file], name, { type: file.type || "application/octet-stream" });

  if (navigator.canShare && navigator.canShare({ files: [shared] })) {
    try {
      await navigator.share({ files: [shared], title });
      return;
    } catch (error) {
      /* Abgebrochen oder verboten: dann bleibt der Download unten als Weg */
      return;
    }
  }

  /* a + download: ohne Teilen-Fenster ist Herunterladen das, was der Browser kann */
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
  showNote(note, "Datei wird heruntergeladen.");
}

/**
 * Das Menü öffnen.
 * @param onRename wird gerufen, wenn der Name geändert werden soll (Feld oben).
 * @param onClose schließt die Dateiansicht, nachdem der Eintrag weg ist.
 */
export function openViewerMenu(entry, { onRename, onClose }) {
  openSheet(entry.title || "Datei", [
    {
      label: "Umbenennen",
      icon: "pencil",
      onSelect: onRename,
    },
    {
      label: entry.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: entry.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(entry),
    },
    {
      label: "Archivieren",
      icon: "archive",
      pair: true,
      onSelect: () => {
        archiveEntry(entry);
        emit(events.dataChanged);
        onClose();
      },
    },
    {
      label: "Löschen",
      icon: "trash",
      pair: true,
      danger: true,
      onSelect: () => {
        deleteEntry(entry.id);
        onClose();
      },
    },
  ]);
}
