/*
 * Das Eingabefeld in einer Pille (Tab umbenennen, Ansicht der Aufgaben-Seite
 * benennen) so schmal wie seinen Text machen, damit eine neue Pille nicht
 * extra groß aussieht. Die Breite lässt sich nur messen, indem man denselben
 * Text unsichtbar daneben setzt.
 * Pfad: src/ui/pill-input.js
 *
 * Keine anpassbaren visuellen Werte: Schrift und Fläche der Pille stehen in
 * styles/overview.css (.tab-pill-input).
 */

/** Breite des Feldes nach seinem Text (oder Platzhalter) setzen. */
export function fitPillInput(input) {
  if (!input) return;
  const sample = input.value || input.placeholder || "";
  const style = getComputedStyle(input);
  const probe = document.createElement("span");
  probe.textContent = sample || " ";
  /* position/visibility/white-space: nötig, damit die Messhilfe nichts verschiebt und nicht umbricht */
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "pre";
  probe.style.font = style.font;
  probe.style.fontSize = style.fontSize;
  probe.style.fontWeight = style.fontWeight;
  probe.style.fontFamily = style.fontFamily;
  probe.style.letterSpacing = style.letterSpacing;
  document.body.appendChild(probe);
  const width = Math.ceil(probe.getBoundingClientRect().width);
  probe.remove();
  input.style.width = `${Math.max(width, 1)}px`;
}
