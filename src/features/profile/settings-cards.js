/*
 * Der Abschnitt „Analyse“ im Einstellungs-Blatt: zwei kleine Karten
 * nebeneinander — Nutzungszeit und Serie — wie die Kacheln in Apple Fitness.
 * Sie zeigen nur den Kopfwert und einen winzigen Verlauf; das ganze Diagramm
 * erscheint erst beim Antippen. Darunter der Abschnitt „Darstellung“.
 * Pfad: src/features/profile/settings-cards.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * miniDays    -> wie viele Tage die kleinen Balken und Punkte zeigen
 * minBarShare -> Mindesthöhe eines Balkens (Anteil der Kachelhöhe), damit ein
 *                kurzer Tag nicht ganz verschwindet
 * details     -> welche große Ansicht hinter welcher Kachel steckt
 *
 * Größen und Farben der Kacheln stehen in styles/settings.css.
 */

import { dayShift, startOfDay } from "../../core/dates.js";
import { icon } from "../../core/html.js";
import { usageOfDay, usageStreaks } from "../../data/usage.js";
import { streakCard, usageCard } from "./profile-cards.js";
import { themeListMarkup } from "./theme.js";

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
function miniCard({ key, title, label, value, unit, chart }) {
  return `
    <button class="mini-card" type="button" data-settings-detail="${key}" aria-label="${title} öffnen">
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
function usageMini() {
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
    key: "usage",
    title: "Nutzungszeit",
    label: "Heute",
    value: today.value,
    unit: today.unit,
    chart: `<span class="mini-bars">${bars}</span>`,
  });
}

/* Kachel „Serie“: laufende Serie in Tagen, darunter ein Punkt je Tag der Woche. */
function streakMini() {
  const streak = usageStreaks();
  const dots = recentDays()
    .map((day) => `<span class="dot${day.seconds ? " is-l4" : ""}"></span>`)
    .join("");
  return miniCard({
    key: "streak",
    title: "Serie",
    label: "Aktuell",
    value: String(streak.current),
    unit: streak.current === 1 ? "Tag" : "Tage",
    chart: `<span class="mini-dots">${dots}</span>`,
  });
}

/** Der Abschnitt „Analyse“: Überschrift und die beiden Kacheln. */
export function insightsSection() {
  return `<p class="psection">Analyse</p><div class="mini-grid">${usageMini()}${streakMini()}</div>`;
}

/** Der Abschnitt „Darstellung“: Überschrift und die drei Zeilen. */
export function appearanceSection() {
  return `<p class="psection">Darstellung</p>${themeListMarkup()}`;
}

/* Was hinter den Kacheln steckt: die volle Karte und das Stück für die Adresse. */
const details = {
  usage: { hash: "nutzungszeit", card: usageCard },
  streak: { hash: "serie", card: streakCard },
};

/** Gibt es zu diesem Schlüssel eine große Ansicht? */
export function isDetail(key) {
  return Boolean(details[key]);
}

/** Das Stück Adresse hinter „#/einstellungen/“. */
export function detailHash(key) {
  return details[key] ? details[key].hash : "";
}

/** Die große Ansicht einer Kachel: Zurück-Pfeil und darunter die volle Karte. */
export function detailMarkup(key) {
  const detail = details[key];
  if (!detail) return "";
  return `
    <div class="settings-detail-head">
      <button class="settings-back" type="button" data-settings-back="1" aria-label="Zurück">${icon("back")}</button>
    </div>
    ${detail.card()}
  `;
}
