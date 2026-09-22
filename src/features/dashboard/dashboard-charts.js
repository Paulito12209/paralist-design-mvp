/*
 * Die Grafiken im Kopf der Übersicht am Desktop: das Punkteband der letzten
 * Wochen, die gerade abgerollte Strich-Skala der Stufe (dieselben Striche wie
 * die runde Level-Anzeige oben links) und die Punktsäulen der Nutzungszeit.
 * Alles einfarbig: Punkte in den Tinten-Tönen aus styles/tokens-desk.css,
 * Striche in den Farben der Level-Anzeige — die Farben setzt styles/dashboard.css.
 * Pfad: src/features/dashboard/dashboard-charts.js
 *
 * Die Grafiken haben absichtlich keine viewBox: waagerecht stehen die Säulen
 * in Prozent der Breite, senkrecht in Pixeln. So füllen sie jede Breite, und
 * die Punkte bleiben trotzdem rund und gleich groß.
 *
 * Eine Punktsäule ist kein Kreis je Punkt, sondern eine gestrichelte Linie
 * (dotRun): höchstens zwei Knoten je Tag statt fünf oder sechs. Der ganze
 * Kopf bleibt so unter 300 Grafik-Knoten statt gut 640 mit einem Kreis je
 * Punkt — das hält das Neuzeichnen nach jedem Haken leicht.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * bandRows          -> wie viele Punkte eine Tagessäule im Aktivitätsband hat
 * bandHeight        -> Höhe des Aktivitätsbands in Pixeln (die Punkte teilen sie gleichmäßig)
 * bandDot           -> Durchmesser eines Punktes im Band (Pixel)
 * bandDotToday      -> Durchmesser der Punkte von heute (etwas größer, damit „jetzt“ auffällt)
 * maxLevel          -> höchste Aktivitätsstufe aus src/data/insights.js (4 = „viel“)
 * labelGap          -> wie viele Tage zwei Monatsnamen unter dem Band mindestens auseinanderstehen
 * footHeight        -> Höhe der Grafik unten in den zwei großen Karten (Pixel)
 * gaugeTicks        -> wie viele Striche die gerade Stufen-Skala hat
 * gaugeMajorEvery   -> jeder wievielte Strich lang ist, wie auf einem Lineal
 * gaugeMinor        -> Länge der kurzen Striche als Anteil der Höhe (0.5 = halb so hoch)
 * gaugeStroke       -> Strichstärke der Skala in Pixeln
 * streakRows        -> wie viele Punkte eine Tagessäule der Nutzungszeit höchstens hat
 * streakDot         -> Durchmesser dieser Punkte (Pixel)
 * percentDigits     -> Nachkommastellen der Prozent-Lagen (mehr = genauer, längerer Text)
 * columnMiddle      -> wo in ihrer Säule die Punkte stehen (0.5 = genau in der Mitte)
 * percent           -> Umrechnung eines Anteils in Prozent der Breite (nicht verstellen)
 * dotDash           -> Länge eines Strichs in einer Punktsäule: fast null, die runden
 *                      Enden machen daraus den Punkt (nicht sichtbar verstellen)
 * dotOverrun        -> wie weit eine Punktsäule über ihren obersten Punkt hinausreicht,
 *                      in Punktabständen; muss zwischen 0 und 1 liegen (nicht sichtbar)
 */

import { escapeHtml } from "../../core/html.js";

const bandRows = 5;
const bandHeight = 72;
const bandDot = 4.6;
const bandDotToday = 6.2;
const maxLevel = 4;
const labelGap = 7;
const footHeight = 56;
const gaugeTicks = 49;
const gaugeMajorEvery = 6;
const gaugeMinor = 0.5;
const gaugeStroke = 1.5;
const streakRows = 6;
const streakDot = 4.6;
const percentDigits = 3;
const columnMiddle = 0.5;
const percent = 100;
const dotDash = 0.001;
const dotOverrun = 0.5;

/* Kurzer Monatsname wie „Sept.“ — einmal angelegt, weil das Band ihn bei jedem Zeichnen braucht. */
const monthShort = new Intl.DateTimeFormat("de-DE", { month: "short" });

/** Waagerechte Mitte der Säule `index` von `count`, in Prozent der Breite. */
function columnX(index, count) {
  return (((index + columnMiddle) / count) * percent).toFixed(percentDigits);
}

/* Aus der Stufe 0–4 wird die Zahl der hellen Punkte: 0 bleibt dunkel, 4 füllt die Säule. */
function litOf(level) {
  return Math.round((level / maxLevel) * bandRows);
}

/**
 * Eine senkrechte Reihe runder Punkte als EINE Linie, von unten nach oben.
 * Die Strichelung setzt alle `pitch` Pixel einen Strich der Länge fast null;
 * runde Linienenden (styles/dashboard.css) machen aus jedem einen Punkt mit
 * der Strichstärke als Durchmesser — genau wie ein Kreis, nur ohne eigenen Knoten.
 * @param x Mitte der Säule in Prozent, @param bottom Mitte des untersten Punktes (Pixel),
 * @param count Zahl der Punkte (0 = nichts), @param pitch Abstand von Punkt zu Punkt,
 * @param size Durchmesser, @param tone Stufen-Klasse wie " is-l3" oder "" für „nichts“.
 */
function dotRun(x, bottom, count, pitch, size, tone) {
  if (count <= 0) return "";
  /* Die Linie endet ein Stück über dem obersten Punkt, damit er nicht an einer
     Rundung der Linienlänge scheitert; der nächste Strich käme erst später. */
  const top = bottom - (count - 1 + dotOverrun) * pitch;
  return `<line class="dash-dots${tone}" x1="${x}%" x2="${x}%" y1="${bottom}" y2="${top}" stroke-width="${size}" stroke-dasharray="${dotDash} ${pitch - dotDash}" />`;
}

/**
 * Das Punkteband: je Tag eine Säule, von unten gefüllt. Wie viele Punkte
 * leuchten und wie kräftig, sagt beides die Aktivitätsstufe des Tages —
 * so liest man Höhe und Ton in einem. Die letzte Säule ist heute.
 * @param days aus xpByDay(): [{ key, ts, xp, level }], der älteste zuerst.
 * @param label ausgeschriebene Zusammenfassung für Vorlesehilfen.
 */
export function bandSvg(days, label) {
  const pitch = bandHeight / (bandRows + 1);
  const bottom = bandHeight - pitch;
  const last = days.length - 1;
  let columns = "";
  days.forEach((day, index) => {
    const x = columnX(index, days.length);
    const lit = litOf(day.level);
    const size = index === last ? bandDotToday : bandDot;
    /* unten die hellen Punkte in der Stufe des Tages, darüber die dunklen bis oben */
    columns += dotRun(x, bottom, lit, pitch, size, ` is-l${day.level}`);
    columns += dotRun(x, bottom - lit * pitch, bandRows - lit, pitch, size, "");
  });
  /* svg: gut 400 Punkte in Prozent der Breite verteilt — als Grafik schneller und schärfer als mit Kästchen */
  return `<svg class="dash-band-svg" width="100%" height="${bandHeight}" role="img" aria-label="${escapeHtml(label)}">${columns}</svg>`;
}

/**
 * Die Monatsnamen unter dem Band — als Text der Seite, nicht in der Grafik,
 * damit sie bei jeder Breite gleich groß und scharf bleiben. Ein Name steht
 * dort, wo ein Monat beginnt; ganz rechts steht „Heute“. Namen, die zu nah
 * an ihrem rechten Nachbarn stünden, fallen weg.
 */
export function bandLabels(days) {
  const marks = [];
  days.forEach((day, index) => {
    const date = new Date(day.ts);
    if (index === 0 || date.getDate() === 1) marks.push({ index, text: monthShort.format(date) });
  });

  let next = days.length - 1;
  const kept = marks
    .reverse()
    .filter((mark) => {
      if (next - mark.index < labelGap) return false;
      next = mark.index;
      return true;
    })
    .reverse();

  const names = kept
    .map((mark) => {
      const at = ((mark.index / days.length) * percent).toFixed(percentDigits);
      return `<span class="dash-month" style="--at: ${at}%">${mark.text}</span>`;
    })
    .join("");
  return `<div class="dash-months" aria-hidden="true">${names}<span class="dash-month is-today">Heute</span></div>`;
}

/**
 * Die Stufen-Skala als gerades Lineal: dieselben Striche wie die runde
 * Anzeige oben links, nur abgerollt. Erreichte Striche leuchten; der letzte
 * erreichte steht in voller Höhe da — die Nadel, die „hier bist du“ zeigt.
 * @param progress Fortschritt in der Stufe, 0 bis 1.
 */
export function gaugeSvg(progress) {
  const lit = Math.round(progress * gaugeTicks);
  const inset = gaugeStroke / 2;
  let ticks = "";
  for (let n = 0; n < gaugeTicks; n += 1) {
    const x = columnX(n, gaugeTicks);
    const isNow = n === lit - 1;
    const long = isNow || n % gaugeMajorEvery === 0;
    const top = long ? inset : footHeight * (1 - gaugeMinor);
    const tone = n < lit ? ` is-on${isNow ? " is-now" : ""}` : "";
    ticks += `<line class="dash-tick${tone}" x1="${x}%" x2="${x}%" y1="${top}" y2="${footHeight - inset}" stroke-width="${gaugeStroke}" />`;
  }
  /* svg: Striche in Prozent der Breite verteilt — so füllt die Skala jede Kartenbreite */
  return `<svg class="dash-foot-svg" width="100%" height="${footHeight}" aria-hidden="true">${ticks}</svg>`;
}

/* Die laufende Serie am Ende der Liste: endet heute, oder gestern, solange heute noch nichts lief. */
function currentRun(days) {
  let end = days.length - 1;
  if (!days[end].seconds) end -= 1;
  let start = end + 1;
  while (start > 0 && days[start - 1].seconds > 0) start -= 1;
  return { start, end };
}

/**
 * Nutzungszeit als Punktsäulen: je Tag eine Säule, ihre Höhe im Verhältnis
 * zum längsten Tag. Tage der laufenden Serie leuchten kräftig, ältere
 * Nutzung bleibt gedämpft — so sieht man die Serie, ohne sie zu zählen.
 * @param days aus usageByDay(): [{ key, ts, seconds }], der älteste zuerst.
 */
export function streakSvg(days) {
  const longest = Math.max(1, ...days.map((day) => day.seconds));
  const pitch = footHeight / streakRows;
  const bottom = footHeight - pitch / 2;
  const run = currentRun(days);
  let columns = "";
  days.forEach((day, index) => {
    const x = columnX(index, days.length);
    const lit = day.seconds > 0 ? Math.max(1, Math.round((day.seconds / longest) * streakRows)) : 0;
    const tone = index >= run.start && index <= run.end ? " is-l4" : " is-l2";
    columns += dotRun(x, bottom, lit, pitch, streakDot, tone);
    columns += dotRun(x, bottom - lit * pitch, streakRows - lit, pitch, streakDot, "");
  });
  /* svg: dieselben runden Punkte wie im Band, in Prozent der Kartenbreite verteilt */
  return `<svg class="dash-foot-svg" width="100%" height="${footHeight}" aria-hidden="true">${columns}</svg>`;
}
