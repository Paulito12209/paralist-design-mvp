/*
 * Punktmatrix-Schrift der „OG Version“ (DotMatrix.swift in Organi7er): Ziffern,
 * Uhrzeiten und kleine Symbole werden aus runden Punkten gesetzt, Wörter
 * dazwischen bleiben normale Schrift. Jede Ziffer ist ein Raster aus 7 Zeilen;
 * der Text wird als EIN Pfad gezeichnet (ein Element je Zeichenfolge, nicht je Punkt).
 * Pfad: src/ui/dot-matrix.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rows     -> Zeilen des Rasters; die Schrifthöhe wird darauf geteilt (7 wie in der App)
 * dotScale -> Punktgröße im Verhältnis zum Rasterabstand (0.76 = fast Punkt an Punkt)
 * glyphs   -> das Raster jedes Zeichens, "1" ist ein Punkt; hier lassen sich Ziffern umzeichnen
 * symbols  -> die Rastersymbole (Auge, Stift) mit eigener Breite
 * Farbe der Punkte: currentColor, also die Textfarbe des umgebenden Elements.
 */

const rows = 7;
const dotScale = 0.76;

const glyphs = {
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ":": ["0", "1", "1", "0", "1", "1", "0"],
  ".": ["0", "0", "0", "0", "0", "1", "1"],
  ",": ["00", "00", "00", "00", "00", "01", "10"],
  "×": ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  " ": ["0", "0", "0", "0", "0", "0", "0"],
};

/* Die Symbole der Zeitstempel: „eye“ für geöffnet, „pencil“ für geschrieben und bearbeitet */
const symbols = {
  eye: ["001111100", "011111110", "111101111", "111000111", "111101111", "011111110", "001111100"],
  pencil: ["00000011", "00000111", "00001110", "00011100", "00111000", "01110000", "11100000"],
};

/* Die Punkte eines Rasters als Pfad aus lauter Kreisen; `unit` ist der Rasterabstand in Pixeln */
function pathOf(grid, offset, unit) {
  const radius = (unit * dotScale) / 2;
  let path = "";
  grid.forEach((line, y) => {
    [...line].forEach((dot, x) => {
      if (dot !== "1") return;
      const cx = ((offset + x) * unit + unit / 2).toFixed(2);
      const cy = (y * unit + unit / 2).toFixed(2);
      path += `M${(cx - radius).toFixed(2)} ${cy}a${radius.toFixed(2)} ${radius.toFixed(2)} 0 1 0 ${(radius * 2).toFixed(2)} 0a${radius.toFixed(2)} ${radius.toFixed(2)} 0 1 0 ${(-radius * 2).toFixed(2)} 0`;
    });
  });
  return path;
}

function svgOf(grids, size, label) {
  const unit = size / rows;
  let offset = 0;
  let path = "";
  grids.forEach((grid) => {
    path += pathOf(grid, offset, unit);
    offset += grid[0].length + 1;
  });
  const width = Math.max(0, offset - 1) * unit;
  return `<svg class="og-dm" width="${width.toFixed(1)}" height="${size}" viewBox="0 0 ${width.toFixed(1)} ${size}" role="img" aria-label="${label}"><path d="${path}" fill="currentColor"/></svg>`;
}

/** Eine Zeichenfolge aus Ziffern und Trennern als Punktschrift; `size` ist die Höhe in Pixeln. */
export function dotNumber(text, size = 12) {
  const grids = [...String(text)].map((char) => glyphs[char]).filter(Boolean);
  return svgOf(grids, size, String(text));
}

/** Ein Symbol im Punktraster („eye“ oder „pencil“). */
export function dotSymbol(name, size = 12) {
  return svgOf([symbols[name]], size, "");
}

/**
 * Gemischter Text: was eine Ziffer enthält, steht als Punktschrift, die Wörter
 * dazwischen bleiben Schrift („vor “ + 2 + “ Std.“). Das Ergebnis ist HTML.
 */
export function dotText(text, size = 10) {
  const parts = String(text).split(/([0-9:.,]*[0-9][0-9:.,]*)/);
  return parts
    .map((part, index) => {
      if (!part) return "";
      if (index % 2 === 1) return dotNumber(part, size);
      return `<span class="og-dm-word">${part.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</span>`;
    })
    .join("");
}
