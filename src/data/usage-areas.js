/*
 * Die Bereiche, nach denen die Nutzungszeit aufgeteilt wird: welche offene
 * Ansicht zu welchem Bereich zählt und wie er in der Aufteilung heißt.
 * Kein DOM — die Ansicht und den Eintragstyp reicht src/shell/lifecycle.js herein.
 * Pfad: src/data/usage-areas.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * usageAreas   -> Name, Icon und Farbe je Bereich in der Aufteilung; die
 *                 Eintragstypen nehmen dieselbe Farbe wie in der Historie,
 *                 Sammlungen die Farbe der Tabs, die Suche ein eigenes Indigo
 * viewAreas    -> welche Ansicht ohne offenen Eintrag zu welchem Bereich zählt
 * fallbackArea -> Bereich für alles, was keiner Ansicht zuzuordnen ist
 */

import { xpItems } from "./config.js";

/* Gezählt wird unter diesem Schlüssel, bis die erste Ansicht gemeldet ist. */
export const fallbackArea = "sonstiges";

/* Reiter und Aufgaben/Termine landen beim passenden Eintragstyp, damit
   „Kalender“ nicht einmal als Reiter und einmal als Termin auftaucht. */
const viewAreas = {
  home: "uebersicht",
  calendar: "termin",
  tasks: "aufgabe",
  media: "medien",
  page: "sammlung",
  search: "suche",
};

export const usageAreas = {
  uebersicht: { label: "Übersicht", icon: "inbox", color: "var(--muted)" },
  notiz: { label: "Notizen", icon: xpItems.notiz.icon, color: xpItems.notiz.color },
  dokument: { label: "Dokumente", icon: xpItems.dokument.icon, color: xpItems.dokument.color },
  aufgabe: { label: "Aufgaben", icon: xpItems.aufgabe.icon, color: xpItems.aufgabe.color },
  termin: { label: "Kalender & Termine", icon: xpItems.termin.icon, color: xpItems.termin.color },
  projekt: { label: "Projekte", icon: xpItems.projekt.icon, color: xpItems.projekt.color },
  zeichnung: { label: "Zeichnungen", icon: xpItems.zeichnung.icon, color: xpItems.zeichnung.color },
  medien: { label: "Medien", icon: xpItems.medien.icon, color: xpItems.medien.color },
  lesezeichen: { label: "Lesezeichen", icon: xpItems.lesezeichen.icon, color: xpItems.lesezeichen.color },
  sammlung: { label: "Sammlungen", icon: "folder", color: xpItems.tab.color },
  arbeitsbereich: { label: "Arbeitsbereiche", icon: xpItems.arbeitsbereich.icon, color: xpItems.arbeitsbereich.color },
  suche: { label: "Suche", icon: "search", color: "#5e5ce6" },
  sonstiges: { label: "Sonstiges", icon: "placeholder", color: "var(--muted)" },
};

/**
 * Bereich zur offenen Ansicht. Bei einem offenen Eintrag zählt sein Typ —
 * so landet die Zeit in einer Notiz bei „Notizen“, nicht bei „Eintrag“.
 * Die Unterseite ist entweder ein Arbeitsbereich oder eine Sammlung (Eingang,
 * Favoriten, Archiv …).
 * @param detail { entryType, isWorkspace } — was in der Ansicht offen ist.
 */
export function usageAreaOf(view, { entryType = null, isWorkspace = false } = {}) {
  if (view === "entry") return usageAreas[entryType] ? entryType : fallbackArea;
  if (view === "page" && isWorkspace) return "arbeitsbereich";
  return viewAreas[view] || fallbackArea;
}

/** Anzeige eines Bereichs; unbekannte Schlüssel landen bei „Sonstiges“. */
export function usageAreaStyle(key) {
  return usageAreas[key] || usageAreas[fallbackArea];
}
