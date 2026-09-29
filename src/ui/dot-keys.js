/*
 * Tasten-Schilder in Punkt-Schrift: jede Taste („N“, „G I“, „⌘K“, „1“) wird
 * aus Punkten eines 5×7-Rasters gezeichnet — wie eine Punktmatrix-Anzeige,
 * ohne Kachel dahinter. Im Dunkeln leuchten die Punkte im Silber von
 * Paralist, im Hellen umgekehrt in Graphit (styles/desk-kbd.css). Liegt in
 * src/ui/, weil Seitenleiste, Reiterzeile, Such-Palette und Profil sie nutzen.
 * Pfad: src/ui/dot-keys.js
 *
 * Ein Schild ist ein einziger Pfad: je Punkt ein Strich der Länge null, die
 * runden Enden machen daraus den Punkt. So bleibt auch eine volle Seitenleiste
 * bei einem Grafik-Knoten je Schild.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * glyphs     -> das Aussehen jedes Zeichens: sieben Reihen von oben nach unten,
 *               „1“ = Punkt an, „0“ = aus; die Breite ergibt sich aus der Reihe
 * rows       -> Höhe des Rasters in Punkten (alle Zeichen gleich hoch)
 * letterGap  -> Lücke zwischen zwei Zeichen, in Punkten
 * spaceWidth -> Breite eines Leerzeichens („G I“), in Punkten
 *
 * Größe, Punktdicke, Farbe und Leuchten: styles/desk-kbd.css.
 */

import { escapeHtml } from "../core/html.js";

const rows = 7;
const letterGap = 1;
const spaceWidth = 3;

const glyphs = {
  0: "01110 10001 10011 10101 11001 10001 01110",
  1: "00100 01100 00100 00100 00100 00100 01110",
  2: "01110 10001 00001 00010 00100 01000 11111",
  3: "11111 00010 00100 00010 00001 10001 01110",
  4: "00010 00110 01010 10010 11111 00010 00010",
  5: "11111 10000 11110 00001 00001 10001 01110",
  6: "00110 01000 10000 11110 10001 10001 01110",
  7: "11111 00001 00010 00100 01000 01000 01000",
  8: "01110 10001 10001 01110 10001 10001 01110",
  9: "01110 10001 10001 01111 00001 00010 01100",
  A: "01110 10001 10001 11111 10001 10001 10001",
  B: "11110 10001 10001 11110 10001 10001 11110",
  C: "01110 10001 10000 10000 10000 10001 01110",
  D: "11100 10010 10001 10001 10001 10010 11100",
  E: "11111 10000 10000 11110 10000 10000 11111",
  F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01110 10001 10000 10111 10001 10001 01111",
  H: "10001 10001 10001 11111 10001 10001 10001",
  I: "111 010 010 010 010 010 111",
  J: "00111 00010 00010 00010 00010 10010 01100",
  K: "10001 10010 10100 11000 10100 10010 10001",
  L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10101 10001 10001 10001",
  N: "10001 10001 11001 10101 10011 10001 10001",
  O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000",
  Q: "01110 10001 10001 10001 10101 10010 01101",
  R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110",
  T: "11111 00100 00100 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100",
  W: "10001 10001 10001 10101 10101 10101 01010",
  X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 10001 01010 00100 00100 00100",
  Z: "11111 00001 00010 00100 01000 10000 11111",
  ",": "00 00 00 00 11 01 10",
  ".": "0 0 0 0 0 0 1",
  "/": "00001 00010 00010 00100 01000 01000 10000",
  "\\": "10000 01000 01000 00100 00010 00010 00001",
  "[": "111 100 100 100 100 100 111",
  "]": "111 001 001 001 001 001 111",
  "?": "01110 10001 00001 00010 00100 00000 00100",
  "-": "00000 00000 00000 11111 00000 00000 00000",
  "⌘": "0100010 1011101 0100010 0100010 0100010 1011101 0100010",
};

/* Unbekannte Zeichen (Umlaute, Pfeile) stehen als leerer Kasten da, statt zu fehlen. */
const unknown = "11111 10001 10001 10001 10001 10001 11111";

/* Punkte eines Textes als Pfad-Befehle, dazu die Breite in Punkten. */
function dotPath(text) {
  let x = 0;
  let path = "";
  const chars = [...text.toUpperCase()];
  chars.forEach((char, index) => {
    if (char === " ") {
      x += spaceWidth;
      return;
    }
    if (index > 0 && chars[index - 1] !== " ") x += letterGap;
    const lines = (glyphs[char] || unknown).split(" ");
    lines.forEach((line, y) => {
      [...line].forEach((bit, column) => {
        if (bit === "1") path += `M${x + column + 0.5} ${y + 0.5}h0`;
      });
    });
    x += lines[0].length;
  });
  return { path, width: x };
}

/**
 * Ein Tasten-Schild als HTML.
 * @param text   was auf der Taste steht („N“, „G I“, „⌘K“, „Enter“)
 * @param extraClass weitere Klassen mit führendem Leerzeichen, z.B. " desk-kbd-inverse"
 * @param spoken true, wenn Vorlesehilfen die Taste hören sollen (Liste der
 *   Kurzbefehle); sonst ist das Schild stumm — der Knopf sagt es schon über
 *   aria-keyshortcuts.
 */
export function keyCap(text, extraClass = "", spoken = false) {
  const { path, width } = dotPath(text);
  const voice = spoken ? `role="img" aria-label="${escapeHtml(text)}"` : 'aria-hidden="true"';
  /* svg: die Punkte sind Grafik; --dots gibt CSS die Breite im Verhältnis zur Höhe */
  return `<kbd class="desk-kbd${extraClass}" ${voice} style="--dots: ${(width / rows).toFixed(3)}"><svg class="desk-kbd-dots" viewBox="0 0 ${width} ${rows}"><path d="${path}" /></svg></kbd>`;
}
