/*
 * Das Cover einer Detailseite — Eintrag oder Arbeitsbereich, wie in Notion
 * im Menü oben rechts ein- und ausgeschaltet. Ein Verlauf in der Farbe der
 * Kategorie hinter Kopfzeile und Titel: oben kräftig, an der Oberkante der
 * Pillen „Inhalt“ / „Verknüpfte Einträge“ im Hintergrund aufgegangen.
 *
 * Das Element legt dieser Baustein beim Anmelden selbst in die Ansicht,
 * index.html braucht dafür nichts. Wo die Pillen liegen, hängt von Icon und
 * Titellänge ab: ihr Abstand zur Oberkante der Ansicht wird gemessen und als
 * --cover-solid an styles/page-cover.css gegeben — beim Zeichnen und immer,
 * wenn der Titel beim Tippen höher oder niedriger wird.
 * Pfad: src/ui/page-cover.js
 *
 * Keine anpassbaren visuellen Werte: Stärke des Verlaufs steht in
 * styles/page-cover.css (--page-cover-mix in styles/tokens-pages.css).
 */

/* Je Ansicht: { cover, row } — row() liefert die gerade gezeichnete Pillen-Zeile. */
const covers = new Map();

/* Abstand der Pillen-Zeile zur Oberkante der Ansicht. Über die Bildschirm-
   Lage gerechnet, nicht über offsetTop: so ist egal, welcher Vorfahr
   positioniert ist, und Scrollen verschiebt beide gleich weit. */
function measure(view) {
  const item = covers.get(view);
  if (!item || view.hidden || item.cover.hidden) return;
  const row = item.row();
  if (!row) return;
  const top = row.getBoundingClientRect().top - view.getBoundingClientRect().top;
  view.style.setProperty("--cover-solid", `${Math.round(top)}px`);
}

/**
 * Eine Ansicht für ein Cover anmelden — einmal beim Start.
 * @param view  die Ansicht (#view-entry, #view-page)
 * @param title der große Titel: wächst er beim Tippen, rutschen die Pillen
 * @param row   Funktion, die die Pillen-Zeile liefert (oder null ohne Pillen)
 */
export function registerCover(view, { title, row }) {
  const cover = document.createElement("div");
  cover.className = "page-cover";
  cover.hidden = true;
  view.prepend(cover);
  covers.set(view, { cover, row });
  /* ResizeObserver meldet eine neue Titelhöhe, ohne bei jedem Tastendruck zu messen */
  new ResizeObserver(() => measure(view)).observe(title);
}

/**
 * Cover zeigen oder verbergen. Die Farbe wird auch ohne Cover gesetzt: das
 * Icon über dem Titel eines Eintrags liest sie ebenfalls.
 * @param on    ob das Cover zu sehen ist
 * @param color Farbe der Kategorie
 */
export function renderCover(view, { on, color }) {
  const item = covers.get(view);
  if (!item) return;
  view.classList.toggle("has-cover", on);
  item.cover.hidden = !on;
  view.style.setProperty("--cover-accent", color);
  measure(view);
}
