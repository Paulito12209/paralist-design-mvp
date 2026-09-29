/*
 * Die kleinen Grafiken der rechten Spalte am Desktop: der Papierstapel des
 * Eingangs und die Tagesleiste von morgens bis abends. Alles entsteht als
 * Text-Schnipsel und wird mit seiner Karte in einem Zug eingesetzt — kein
 * Element wird einzeln angelegt oder vermessen.
 * Pfad: src/shell/desk-rail-visuals.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * decimals           -> Nachkommastellen der Prozent-Angaben im Text;
 *                       mehr macht den Text länger, ohne dass man es sieht
 * percent            -> Umrechnung eines Anteils (0 bis 1) in Prozent — fest, nicht ändern
 * pileSize           -> wie viele Blätter der Stapel im Eingang immer zeigt
 * dayStartHour / dayEndHour -> welcher Ausschnitt des Tages auf der Tagesleiste liegt
 *
 * Farben, Strichstärken und Abstände stehen in styles/desk-rail-tiles.css.
 */

import { pad2 } from "../core/dates.js";
import { escapeHtml } from "../core/html.js";

const decimals = 2;
const percent = 100;

export const pileSize = 3;
const dayStartHour = 6;
const dayEndHour = 22;
const msPerHour = 3600000;

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
