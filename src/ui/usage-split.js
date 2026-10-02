/*
 * Karte „Wo die Zeit hingeht“ unter dem Balkenverlauf der Nutzungszeit:
 * ein geteiltes Band über die ganze Breite und darunter je Bereich eine Zeile
 * mit Icon, Dauer und Anteil. Zeitraum wie der Umschalter darüber.
 * Pfad: src/ui/usage-split.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * minShownShare -> kleinster Anteil, der im Band noch als eigenes Stück
 *                  erscheint (darunter nur in der Liste, sonst Striche)
 *
 * Namen, Icons und Farben der Bereiche stehen in src/data/usage-areas.js,
 * Größen und Abstände in styles/usage-split.css.
 */

import { formatSpan } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { usageAreaStyle } from "../data/usage-areas.js";
import { usageByArea } from "../data/usage.js";

const minShownShare = 0.01;

/* Anteil als ganze Prozent; unter einem Prozent steht „< 1 %“ statt einer Null. */
function percentLabel(share) {
  const percent = Math.round(share * 100);
  return percent < 1 ? "< 1 %" : `${percent} %`;
}

/* Wenige Sekunden stünden sonst als „0 Min“ da — als wäre dort nichts gewesen. */
function spanLabel(seconds) {
  return seconds < 60 ? "< 1 Min" : formatSpan(seconds);
}

/** Die Karte für die letzten `days` Tage. */
export function usageSplitCard(days) {
  const rows = usageByArea(days);
  const total = rows.reduce((sum, row) => sum + row.seconds, 0);

  if (!total) {
    return `
      <section class="pcard usage-split">
        <div class="pcard-head">${icon("layers")}<span>Wo die Zeit hingeht</span></div>
        <p class="chart-note">Noch keine Zeit aufgezeichnet. Sobald du Notizen, Dokumente oder andere Bereiche offen hast, erscheint hier die Aufteilung.</p>
      </section>
    `;
  }

  /* flex-grow statt Breite in Prozent: so füllen die Stücke das Band ohne
     Rundungslücke, auch wenn winzige Anteile weggelassen werden. */
  const band = rows
    .filter((row) => row.seconds / total >= minShownShare)
    .map((row) => `<span style="flex-grow:${row.seconds};background:${usageAreaStyle(row.area).color}"></span>`)
    .join("");

  const list = rows
    .map((row) => {
      const style = usageAreaStyle(row.area);
      const share = row.seconds / total;
      /* --area-color färbt Icon und Anteilsbalken dieser Zeile (styles/profile.css) */
      return `
        <li class="usage-split-row" style="--area-color:${style.color}">
          <span class="usage-split-icon">${icon(style.icon)}</span>
          <span class="usage-split-main">
            <span class="usage-split-line">
              <span class="usage-split-label">${escapeHtml(style.label)}</span>
              <span class="usage-split-time">${spanLabel(row.seconds)}</span>
            </span>
            <span class="usage-split-bar"><span style="width:${(share * 100).toFixed(1)}%"></span></span>
          </span>
          <span class="usage-split-share">${percentLabel(share)}</span>
        </li>
      `;
    })
    .join("");

  return `
    <section class="pcard usage-split">
      <div class="pcard-head">${icon("layers")}<span>Wo die Zeit hingeht</span></div>
      <div class="usage-split-band" aria-hidden="true">${band}</div>
      <ul class="usage-split-list">${list}</ul>
    </section>
  `;
}
