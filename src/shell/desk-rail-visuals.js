/*
 * Die kleinen Grafiken der rechten Spalte am Desktop: der Strich-Ring der
 * Stufe (dieselbe Idee wie die Level-Anzeige oben links), der Papierstapel des
 * Eingangs und die Tagesleiste von morgens bis abends. Alles entsteht als
 * Text-Schnipsel und wird mit seiner Karte in einem Zug eingesetzt — kein
 * Element wird einzeln angelegt oder vermessen.
 * Pfad: src/shell/desk-rail-visuals.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ringBox            -> Kantenlänge des Zeichenrasters, in dem der Ring liegt (ringCenter
 *                       ist seine Mitte); alle Maße des Rings unten beziehen sich darauf
 * ringTicks          -> wie viele Striche der Ring der Stufe hat (mehr = feiner)
 * ringDots           -> wie viele Punkte der blasse Punktkreis innen hat
 * tickInner / tickOuter -> wo ein Strich des Rings anfängt und aufhört (Raster 0–ringBox)
 * headInner          -> wie weit der Strich an der Spitze des Fortschritts nach innen ragt
 * dotRing / dotSize  -> Abstand des Punktkreises zur Mitte und Größe eines Punkts
 * decimals           -> Nachkommastellen von Koordinaten und Prozent-Angaben im Text;
 *                       mehr macht den Text länger, ohne dass man es sieht
 * percent            -> Umrechnung eines Anteils (0 bis 1) in Prozent — fest, nicht ändern
 * pileSize           -> wie viele Blätter der Stapel im Eingang immer zeigt
 * dayStartHour / dayEndHour -> welcher Ausschnitt des Tages auf der Tagesleiste liegt
 *
 * Farben, Strichstärken und Abstände stehen in styles/desk-rail-tiles.css.
 */

import { pad2 } from "../core/dates.js";
import { escapeHtml } from "../core/html.js";

const ringBox = 100;
const ringCenter = ringBox / 2;
const ringTicks = 60;
const ringDots = 40;
const tickInner = 42.5;
const tickOuter = 48.5;
const headInner = 38.5;
const dotRing = 35;
const dotSize = 0.85;
const decimals = 2;
const percent = 100;
const fullTurn = Math.PI * 2;
/* Der Ring beginnt oben in der Mitte, wie ein Uhrzeiger auf zwölf. */
const ringStart = -Math.PI / 2;

export const pileSize = 3;
const dayStartHour = 6;
const dayEndHour = 22;
const msPerHour = 3600000;

/* Punkt auf einem Kreis um die Mitte, auf `decimals` Stellen gerundet — kürzerer Text, gleiches Bild. */
function onCircle(radius, angle) {
  return [
    (ringCenter + Math.cos(angle) * radius).toFixed(decimals),
    (ringCenter + Math.sin(angle) * radius).toFixed(decimals),
  ];
}

/**
 * Ring aus Strichen für die Kachel „Stufe“: so viele Striche leuchten, wie
 * von der Stufe schon geschafft ist; der letzte leuchtende reicht etwas weiter
 * nach innen und markiert, wo man gerade steht.
 * @param progress Fortschritt in der Stufe, 0 bis 1.
 */
export function levelRing(progress) {
  const lit = Math.round(progress * ringTicks);
  let ticks = "";
  for (let n = 0; n < ringTicks; n += 1) {
    const angle = ringStart + (fullTurn / ringTicks) * n;
    const isOn = n < lit;
    const isHead = n === lit - 1;
    const [x1, y1] = onCircle(isHead ? headInner : tickInner, angle);
    const [x2, y2] = onCircle(tickOuter, angle);
    const flags = `${isOn ? " is-on" : ""}${isHead ? " is-head" : ""}`;
    /* --k: laufende Nummer, damit die leuchtenden Striche beim ersten Zeigen nacheinander angehen. */
    const order = isOn ? ` style="--k:${n}"` : "";
    ticks += `<line class="rail-ring-tick${flags}"${order} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }

  let dots = "";
  for (let n = 0; n < ringDots; n += 1) {
    const [cx, cy] = onCircle(dotRing, ringStart + (fullTurn / ringDots) * n);
    dots += `<circle class="rail-ring-dot" cx="${cx}" cy="${cy}" r="${dotSize}" />`;
  }

  /* svg: Striche und Punkte im Kreis lassen sich nur als Vektorgrafik sauber zeichnen. */
  return `<svg class="rail-ring" viewBox="0 0 ${ringBox} ${ringBox}" aria-hidden="true">${dots}${ticks}</svg>`;
}

/**
 * Papierstapel für die Kachel „Eingang“: vorn das Neueste, dahinter die
 * älteren, jedes Blatt ein wenig höher und schmaler. Es sind immer
 * `pileSize` Blätter — fehlende bleiben leer, damit die Kachel stets gleich
 * gebaut ist und ein leerer Eingang wie ein aufgeräumter Stapel aussieht.
 * @param entries die neuesten Einträge im Eingang, der jüngste zuerst.
 */
export function paperPile(entries) {
  let sheets = "";
  /* Von hinten nach vorn einsetzen: was später im Text steht, liegt oben. */
  for (let n = pileSize - 1; n >= 0; n -= 1) {
    const entry = entries[n];
    const title = entry ? escapeHtml(entry.title || "Ohne Titel") : "";
    const flags = `${n > 0 ? " is-back" : ""}${entry ? "" : " is-blank"}`;
    sheets += `<span class="rail-sheet${flags}" style="--n:${n}">${title}</span>`;
  }
  return `<div class="rail-pile" aria-hidden="true">${sheets}</div>`;
}

/* Beginn der Tagesleiste am Tag von `now`, als Zeitpunkt. */
function trackStart(now) {
  const start = new Date(now);
  start.setHours(dayStartHour, 0, 0, 0);
  return start.getTime();
}

/** Wo ein Zeitpunkt auf der Tagesleiste liegt, in Prozent — vor Beginn 0, nach Ende 100. */
function trackShare(ts, dayStart) {
  const share = (ts - dayStart) / ((dayEndHour - dayStartHour) * msPerHour);
  return (Math.min(1, Math.max(0, share)) * percent).toFixed(decimals);
}

/**
 * Tagesleiste: ein dünner Balken von `dayStartHour` bis `dayEndHour`, der
 * vergangene Teil dunkler, ein Knopf bei „jetzt“, darüber ein feiner Strich
 * für jeden Termin des Tages. Darunter je Stunde ein Punkt und die beiden
 * Randzeiten. Nur zum Ansehen — für Vorlesehilfen steht alles in `label`.
 * @param now   jetziger Zeitpunkt.
 * @param marks Termine von heute: [{ ts, isNext }] — `isNext` hebt den nächsten hervor.
 * @param label Satz für Vorlesehilfen, z.B. „Heute 3 Termine, der Tag ist zu 40 % vorbei“.
 */
export function dayTrack(now, marks, label) {
  const dayStart = trackStart(now);

  const lines = marks
    .map((mark) => {
      const flags = `${mark.ts < now ? " is-past" : ""}${mark.isNext ? " is-next" : ""}`;
      return `<span class="rail-track-mark${flags}" style="--at:${trackShare(mark.ts, dayStart)}%"></span>`;
    })
    .join("");
  const hourDots = "<span></span>".repeat(dayEndHour - dayStartHour + 1);

  return `
    <div class="rail-track" role="img" aria-label="${escapeHtml(label)}">
      <div class="rail-track-bar" style="--at:${trackShare(now, dayStart)}%">${lines}<span class="rail-track-knob"></span></div>
      <div class="rail-track-hours">${hourDots}</div>
      <div class="rail-track-scale"><span>${pad2(dayStartHour)}</span><span>${pad2(dayEndHour)}</span></div>
    </div>
  `;
}

/** Anteil des Tagesausschnitts, der schon vorbei ist, in ganzen Prozent — für den Satz der Vorlesehilfen. */
export function dayPassed(now) {
  return Math.round(Number(trackShare(now, trackStart(now))));
}
