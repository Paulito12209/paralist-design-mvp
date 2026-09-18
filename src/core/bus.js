/*
 * Winziger Nachrichtenverteiler. Damit müssen sich die Bereiche der App
 * (Übersicht, Kalender, Medien …) nicht gegenseitig kennen: wer etwas ändert,
 * ruft `emit`, und jeder Bereich zeichnet sich selbst neu, wenn er sichtbar ist.
 * Pfad: src/core/bus.js
 *
 * Keine anpassbaren visuellen Werte.
 */

/** Namen aller Nachrichten an einer Stelle, damit sich keine Tippfehler einschleichen. */
export const events = {
  /* Einträge, Arbeitsbereiche oder Tabs haben sich geändert: alle Listen neu zeichnen. */
  dataChanged: "data:changed",
  /* Die Ansicht wechselt gleich: Eingabefeld und Menüs schließen sich. */
  viewWillChange: "view:will-change",
  /* Eine Ansicht wurde geöffnet: der zuständige Bereich soll sich aufbauen. */
  viewOpened: "view:opened",
  /* Punkte haben sich geändert: Level-Anzeige oben links auffrischen. */
  xpChanged: "xp:changed",
  /* Eine Seite möchte das Eingabefeld öffnen — mit Tag und Uhrzeit, wenn im
     Kalender eine Stunde angetippt wurde. */
  composerRequested: "composer:requested",
  /* Ein Blatt von unten (Fortschritt, Profil) geht auf: das Eingabefeld schließt. */
  overlayOpened: "overlay:opened",
};

const listeners = new Map();

/** Meldet eine Funktion für eine Nachricht an. Gibt eine Funktion zum Abmelden zurück. */
export function on(name, handler) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(handler);
  return () => listeners.get(name).delete(handler);
}

/** Schickt eine Nachricht an alle angemeldeten Funktionen. */
export function emit(name, payload) {
  const handlers = listeners.get(name);
  if (!handlers) return;
  handlers.forEach((handler) => handler(payload));
}
