/*
 * Ab welcher Fensterbreite die App als Desktop-Fassung erscheint: links die
 * Seitenleiste, in der Mitte die Seite, ab noch mehr Breite rechts die Spalte
 * mit „Heute“, Aufgaben und zuletzt Geöffnetem. Darunter bleibt alles wie am
 * Handy — dieselbe App im Gerätefenster.
 *
 * Die Stufen folgen den Fenstergrößen von Material 3, damit die spätere
 * Android-App auf Tablets und Chromebooks dieselben Grenzen nimmt:
 * „Expanded“ bekommt die Seitenleiste, „Large“ zusätzlich die rechte Spalte.
 * Pfad: src/ui/desk-mode.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * deskQuery -> ab welcher Breite die Seitenleiste erscheint
 * railQuery -> ab welcher Breite zusätzlich die rechte Spalte erscheint
 *
 * Achtung: dieselben Breiten stehen in den @media-Abfragen aller
 * styles/desk*.css, styles/dashboard*.css und in styles/tokens-desk.css. Wer
 * hier ändert, ändert dort mit — sonst zeichnet die App eine Spalte, die das
 * Stylesheet gar nicht zeigt.
 */

export const deskQuery = "(min-width: 1024px)";
export const railQuery = "(min-width: 1280px)";

const desk = window.matchMedia(deskQuery);
const rail = window.matchMedia(railQuery);

/** Ist die Desktop-Fassung gerade zu sehen? */
export function isDesk() {
  return desk.matches;
}

/** Ist zusätzlich die rechte Spalte zu sehen? Nur dann lohnt es, sie zu zeichnen. */
export function isRailShown() {
  return rail.matches;
}

/**
 * Meldet jeden Wechsel über eine der beiden Grenzen — beim Ziehen des
 * Fensters oder beim Drehen eines Tablets. `handler` bekommt nichts
 * übergeben und fragt selbst mit isDesk() und isRailShown() nach.
 *
 * Springt das Fenster auf einmal über beide Grenzen (Maximieren), kommen zwei
 * Meldungen im selben Bild — `handler` läuft dann trotzdem nur einmal, im
 * nächsten Bild, statt alles zweimal zu zeichnen.
 */
export function onDeskChange(handler) {
  let queued = 0;
  const once = () => {
    if (queued) return;
    queued = requestAnimationFrame(() => {
      queued = 0;
      handler();
    });
  };
  desk.addEventListener("change", once);
  rail.addEventListener("change", once);
}
