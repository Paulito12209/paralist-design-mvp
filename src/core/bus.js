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
  /* Die Aufgaben-Seite bittet um das Eingabefeld mit schon gewähltem Typ
     „Aufgabe“ — der Knopf am Ende einer Board-Spalte. */
  /* Die Pille im Platzhalter einer leeren Liste bittet um das Eingabefeld mit
     dem Typ, der auf diese Liste passt („aufgabe“, „projekt“, „ressourcen“ …). */
  createRequested: "create:requested",
  /* Ein Blatt von unten (Fortschritt, Profil) geht auf: das Eingabefeld schließt. */
  overlayOpened: "overlay:opened",
  /* Die Bildschirmtastatur ist aufgegangen: schreibt man auf der Seite, bleibt
     die untere Leiste weg (src/shell/writing.js). */
  keyboardOpened: "keyboard:opened",
  /* Die Bildschirmtastatur ist zu — auch wenn sie weggewischt statt mit
     einem Tipp geschlossen wurde und das Feld deshalb noch fokussiert ist. */
  keyboardClosed: "keyboard:closed",
  /* Die Wahl im Einstellungs-Blatt hat sich geändert: die Navigationsleiste
     zeigt oder verbirgt die Namen unter den Icons sofort, ohne Neuladen. */
  navLabelsChanged: "nav:labels-changed",
  /* Einstellungen › Design: der Verlauf hinter der Leiste wurde ein- oder
     ausgeschaltet — die Hülle übernimmt es sofort. */
  navGlowChanged: "nav:glow-changed",
  /* „Nach Updates suchen“ in den Einstellungen: die Hülle sieht sofort nach und
     lädt eine neuere Fassung gleich. `report(status)` meldet zurück, was war. */
  updateRequested: "update:requested",
  /* Der schon offene Reiter wurde unten noch einmal angetippt, während die
     Seite schon ganz oben steht: der Bereich stellt seinen Ausgangszustand
     her (Übersicht: erste Kartenseite, Kalender: wie „Heute“). */
  tabReselected: "tab:reselected",
  /* Das Profilbild wurde neu gesetzt oder entfernt: alles, was es zeigt (die
     Konto-Zeile unten in der Seitenleiste am Desktop), zeichnet sich neu. */
  profileChanged: "profile:changed",
  /* Was die Kontextspalte rechts am Desktop zeigt, hat sich geändert, ohne dass
     sich Daten geändert hätten: ein anderer Tag im Kalender, ein anderer
     markierter Treffer in der Suche. Die Spalte zeichnet sich neu. */
  contextChanged: "context:changed",
  /* Unter Profil › Kurzbefehle wurden die Tasten-Schilder ein- oder
     ausgeblendet: Seitenleiste und Reiterzeile passen sich an. */
  shortcutHintsChanged: "shortcut-hints:changed",
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
