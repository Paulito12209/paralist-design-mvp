/*
 * Liest Zahlenwerte aus den CSS-Variablen in styles/tokens.css.
 * Die Werte werden gemerkt, weil `getComputedStyle` den Browser jedes Mal
 * neu rechnen lässt — beim Ziehen und Wischen passiert das sonst hundertfach
 * pro Sekunde und die Bewegung wird ruckelig.
 * Pfad: src/core/css-vars.js
 *
 * Keine eigenen anpassbaren Werte: die Werte selbst stehen in styles/tokens.css.
 */

const cache = new Map();

/**
 * Zahlenwert einer CSS-Variablen, z.B. `cssNumber("--cal-hour-h", 56)`.
 * @param name Name der Variablen mit den zwei Bindestrichen.
 * @param fallback Wert, falls die Variable fehlt oder keine Zahl ist.
 */
export function cssNumber(name, fallback) {
  if (cache.has(name)) return cache.get(name);
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = parseFloat(raw);
  const result = Number.isFinite(value) ? value : fallback;
  cache.set(name, result);
  return result;
}

/**
 * Gemerkte Werte verwerfen. Nötig, wenn sich die Darstellung ändert
 * (Hell/Dunkel, Fenstergröße), weil Variablen dann andere Werte haben können.
 */
export function clearCssCache() {
  cache.clear();
}

/* Nach einem Wechsel der Fenstergröße oder Darstellung neu einlesen. */
window.addEventListener("resize", clearCssCache);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", clearCssCache);
