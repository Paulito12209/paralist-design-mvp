/*
 * Die zehn Formen, die man in eine Zeichnung setzen kann. Jede ist ein
 * SVG-Pfad in einem Kasten von 100 × 100 — derselbe Pfad zeichnet die Form
 * auf der Fläche (src/features/drawing/draw-layer.js), ihr Bild im
 * Auswahlfenster und beim Exportieren als Bild (src/ui/drawing-compose.js).
 * Reine Daten ohne Zugriff auf die Seite.
 * Pfad: src/data/draw-shapes.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * shapes[*].label     -> Name der Form (Tooltip und Vorlesehilfe)
 * shapes[*].path      -> Umriss im Kasten 0–100; mehrere Teilpfade sind erlaubt,
 *                        Überlappungen werden beim Füllen ausgespart (evenodd)
 * shapes[*].keepRatio -> true: die Form behält ihr Seitenverhältnis (Person, Haus …),
 *                        sonst dehnt sie sich mit ihrem Rahmen (Rechteck, Kreis …)
 * starPoints / starInner -> Zacken des Sterns und wie tief sie eingeschnitten sind (0–1)
 */

const starPoints = 5;
const starInner = 0.45;

/* Der Stern wird einmal ausgerechnet statt als lange Zahlenreihe dazustehen. */
function starPath() {
  const points = [];
  for (let index = 0; index < starPoints * 2; index += 1) {
    const radius = index % 2 ? 47 * starInner : 47;
    const angle = (Math.PI / starPoints) * index - Math.PI / 2;
    points.push(`${(50 + radius * Math.cos(angle)).toFixed(1)} ${(53 + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `M${points.join("L")}Z`;
}

/* Ein Kreis als zwei Halbbögen — Pfad statt <circle>, damit alle Formen gleich gezeichnet werden. */
function circle(cx, cy, r) {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
}

export const shapes = [
  { id: "rect", label: "Rechteck", path: "M4 4H96V96H4Z" },
  { id: "ellipse", label: "Kreis", path: circle(50, 50, 46) },
  { id: "triangle", label: "Dreieck", path: "M50 5L96 94H4Z" },
  { id: "arrow", label: "Pfeil", path: "M4 38H60V14L96 50L60 86V62H4Z" },
  { id: "star", label: "Stern", path: starPath(), keepRatio: true },
  {
    id: "bubble",
    label: "Sprechblase",
    path: "M12 8H88A8 8 0 0 1 96 16V62A8 8 0 0 1 88 70H42L22 92V70H12A8 8 0 0 1 4 62V16A8 8 0 0 1 12 8Z",
  },
  {
    id: "person",
    label: "Person",
    path: `${circle(50, 22, 15)}M22 96V70C22 53 34 44 50 44C66 44 78 53 78 70V96Z`,
    keepRatio: true,
  },
  { id: "house", label: "Haus", path: "M50 6L95 44H82V95H18V44H5ZM42 95V68H58V95Z", keepRatio: true },
  {
    id: "car",
    label: "Auto",
    path:
      "M5 70V57C5 53 8 50 12 49L24 47L34 32C36 29 39 28 43 28H65C69 28 72 30 74 33L84 47L89 48C93 49 95 52 95 56V70Z" +
      circle(28, 72, 10) +
      circle(72, 72, 10),
    keepRatio: true,
  },
  {
    id: "tree",
    label: "Baum",
    path:
      "M50 5C66 5 76 17 74 29C86 33 91 47 83 57C78 67 64 71 50 69C36 71 22 67 17 57C9 47 14 33 26 29C24 17 34 5 50 5Z" +
      "M44 69H56V96H44Z",
    keepRatio: true,
  },
];

/** Die Form mit dieser ID, sonst das Rechteck. */
export function shapeOf(id) {
  return shapes.find((shape) => shape.id === id) || shapes[0];
}
