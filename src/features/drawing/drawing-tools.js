/*
 * Die Werkzeuge der Zeichenfläche: Stift, Marker, Radierer, Farben, Rückgängig.
 * Aufgebaut wie Apples Stiftpalette — Stift dünn und deckend, Marker breit und
 * durchscheinend, der Radierer nimmt Farbe weg, statt Weiß aufzutragen.
 * Pfad: src/features/drawing/drawing-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tools[*].width -> Strichbreite, mit der das Werkzeug startet
 * tools[*].alpha -> Deckkraft (1 = volldeckend, 0.35 = durchscheinend)
 * widthPresets   -> die drei wählbaren Strichbreiten je Werkzeug am Desktop (fein, mittel, breit)
 * colors         -> die fünf Farbpunkte in der Leiste
 * paletteColors  -> das Farbraster im Farbwähler am Desktop, Zeile für Zeile (je 8 Farben)
 *
 * Größe der Knöpfe und Punkte steht in styles/tokens-entry.css
 * (--draw-tool-size, --draw-color-size).
 */

export const tools = {
  pen: { width: 3, alpha: 1, erase: false },
  marker: { width: 16, alpha: 0.35, erase: false },
  eraser: { width: 22, alpha: 1, erase: true },
};

export const widthPresets = {
  pen: [2, 3, 6],
  marker: [10, 16, 26],
  eraser: [10, 22, 44],
};

export const colors = ["#1c1c1e", "#007aff", "#ff3b30", "#ffcc00", "#34c759"];

export const paletteColors = [
  "#7f1d1d", "#7c2d12", "#713f12", "#14532d", "#134e4a", "#1e3a8a", "#4c1d95", "#831843",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0d9488", "#2563eb", "#7c3aed", "#db2777",
  "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#30b0c7", "#007aff", "#af52de", "#ff2d55",
  "#fca5a5", "#fdba74", "#fde68a", "#86efac", "#5eead4", "#93c5fd", "#c4b5fd", "#f9a8d4",
  "#000000", "#1c1c1e", "#48484a", "#8e8e93", "#aeaeb2", "#d1d1d6", "#e5e5ea", "#ffffff",
];

/** Die Farbpunkte als HTML; der gewählte bekommt einen Ring. */
export function colorsMarkup(selected) {
  return colors
    .map(
      (color) =>
        `<button class="draw-color${color === selected ? " is-active" : ""}" type="button" data-draw-color="${color}" style="--draw-color: ${color}" aria-label="Farbe ${color}" title="Farbe ${color}"></button>`
    )
    .join("");
}
