/*
 * Die Werkzeuge der Zeichenfläche: Stift, Marker, Radierer, Farben, Rückgängig.
 * Aufgebaut wie Apples Stiftpalette — Stift dünn und deckend, Marker breit und
 * durchscheinend, der Radierer nimmt Farbe weg, statt Weiß aufzutragen.
 * Pfad: src/features/drawing/drawing-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tools[*].width -> Strichbreite des Werkzeugs
 * tools[*].alpha -> Deckkraft (1 = volldeckend, 0.35 = durchscheinend)
 * colors         -> die fünf Farbpunkte in der Leiste
 *
 * Größe der Knöpfe und Punkte steht in styles/drawing.css
 * (--draw-tool-size, --draw-color-size).
 */

export const tools = {
  pen: { width: 3, alpha: 1, erase: false },
  marker: { width: 16, alpha: 0.35, erase: false },
  eraser: { width: 22, alpha: 1, erase: true },
};

export const colors = ["#1c1c1e", "#007aff", "#ff3b30", "#ffcc00", "#34c759"];

/** Die Farbpunkte als HTML; der gewählte bekommt einen Ring. */
export function colorsMarkup(selected) {
  return colors
    .map(
      (color) =>
        `<button class="draw-color${color === selected ? " is-active" : ""}" type="button" data-draw-color="${color}" style="--draw-color: ${color}" aria-label="Farbe ${color}"></button>`
    )
    .join("");
}
