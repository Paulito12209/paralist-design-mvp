/*
 * Der Abschnitt „Analyse“: zwei kleine Karten nebeneinander — Nutzungszeit und
 * Serie — wie die Kacheln in Apple Fitness. Sie zeigen nur den Kopfwert und
 * einen winzigen Verlauf; die ganze Seite mit Diagramm erscheint erst beim
 * Antippen (src/ui/usage-pages.js). Am Handy steht der Abschnitt im
 * Fortschritt-Blatt, am Desktop im Profil unter „Analyse“ — beide rufen diese
 * Datei auf und nennen, mit welchem Attribut die Kachel ihre Seite öffnet.
 * Pfad: src/ui/insight-tiles.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * miniDays    -> wie viele Tage die kleinen Balken und Punkte zeigen
 * minBarShare -> Mindesthöhe eines Balkens (Anteil der Kachelhöhe), damit ein
 *                kurzer Tag nicht ganz verschwindet
 *
 * Größen und Farben der Kacheln stehen in styles/settings.css.
 */

import { dayShift, startOfDay } from "../core/dates.js";
import { icon } from "../core/html.js";
import { usageOfDay, usageStreaks } from "../data/usage.js";

const miniDays = 7;
const minBarShare = 0.08;

/** Die letzten Tage von links (ältester) nach rechts (heute). */
function recentDays() {
  const today = startOfDay(Date.now());
  const days = [];
  for (let back = miniDays - 1; back >= 0; back -= 1) {
    const ts = dayShift(today, -back);
    days.push({ ts, seconds: usageOfDay(ts) });
  }
  return days;
}

/*
 * Große Zahl und Einheit getrennt, damit beides in der schmalen Kachel
 * nebeneinander passt: unter einer Stunde in Minuten, darüber als „1:20 Std“.
 */
function miniSpanParts(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return { value: String(minutes), unit: "Min" };
  const rest = minutes % 60;
  return { value: `${Math.floor(minutes / 60)}:${String(rest).padStart(2, "0")}`, unit: "Std" };
}

/* Gerüst einer Kachel; `chart` ist die kleine Grafik unter der Zahl. */
function miniCard({ attr, key, title, label, value, unit, chart }) {
  return `
    <button class="mini-card" type="button" ${attr}="${key}" aria-label="${title} öffnen">
      <span class="mini-head">
        <span class="mini-title">${title}</span>
        <span class="mini-go">${icon("chevron")}</span>
      </span>
      <span class="mini-label">${label}</span>
      <span class="mini-value">${value}<span class="mini-unit">${unit}</span></span>
      <span class="mini-chart">${chart}</span>
    </button>
  `;
}

/* Kachel „Nutzungszeit“: heutiger Wert, darunter ein Balken je Tag der Woche. */
function usageMini(attr) {
  const days = recentDays();
  const max = Math.max(...days.map((day) => day.seconds), 1);
  const bars = days
    .map((day) => {
      const share = day.seconds ? Math.max(day.seconds / max, minBarShare) : 0;
      /* height in Prozent: die Balkenhöhe steht erst fest, wenn die Zeit bekannt ist.
         Ein Tag ohne Nutzung bleibt als blasser Stummel stehen, damit die Woche
         vollständig zu sehen ist. */
      return `<span class="mini-bar${day.seconds ? "" : " is-empty"}" style="height:${(share * 100).toFixed(0)}%"></span>`;
    })
    .join("");
  const today = miniSpanParts(days[days.length - 1].seconds);
  return miniCard({
    attr,
    key: "usage",
    title: "Nutzungszeit",
    label: "Heute",
    value: today.value,
    unit: today.unit,
    chart: `<span class="mini-bars">${bars}</span>`,
  });
}

/* Kachel „Serie“: laufende Serie in Tagen, darunter ein Punkt je Tag der Woche. */
function streakMini(attr) {
  const streak = usageStreaks();
  const dots = recentDays()
    .map((day) => `<span class="dot${day.seconds ? " is-l4" : ""}"></span>`)
    .join("");
  return miniCard({
    attr,
    key: "streak",
    title: "Serie",
    label: "Aktuell",
    value: String(streak.current),
    unit: streak.current === 1 ? "Tag" : "Tage",
    chart: `<span class="mini-dots">${dots}</span>`,
  });
}

/**
 * Der Abschnitt „Analyse“: Überschrift und die beiden Kacheln.
 * @param attr Name des data-Attributs, über das eine Kachel ihre Seite öffnet.
 */
export function insightsSection(attr) {
  return `<p class="psection">Analyse</p><div class="mini-grid">${usageMini(attr)}${streakMini(attr)}</div>`;
}
