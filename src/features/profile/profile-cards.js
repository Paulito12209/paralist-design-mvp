/*
 * Die Karten im Profil-Blatt: Kopf mit Bild und Namen, Balkenverlauf der
 * Nutzungszeit, Punkte-Raster der Serie und die Listen darunter.
 * Pfad: src/features/profile/profile-cards.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * profile        -> Name, Mailadresse, Plan und Version im Kopf
 * supportLinks   -> wohin „Feedback“ und „Roadmap“ unter „Support“ führen
 * stepSizes      -> die runden Schritte der senkrechten Achse (Minuten)
 * barWidthShare  -> wie breit ein Balken im Verhältnis zu seiner Spalte ist
 * dotLevels      -> wie viele Helligkeitsstufen das Punkte-Raster hat
 *
 * Farben und Größen stehen in styles/profile.css (--profile-avatar-size, --dot-1..4).
 */

import { dayShift, parseDay, startOfDay } from "../../core/dates.js";
import { axisDateFormat, formatAxisSpan, formatSpan } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { chartRanges } from "../../data/config.js";
import { ui } from "../../data/state.js";
import { usageDays, usageOfDay, usageStreaks } from "../../data/usage.js";
import { chartBox, dateMarks, gridLines, niceStep, rangeSwitch, yAxis } from "../../ui/chart.js";
import { currentPhoto } from "./avatar.js";

/** Die festen Angaben im Kopf des Blatts. */
const profile = {
  name: "Paul Angeles",
  mail: "paul@paralist.app",
  meta: "Pro · Dabei seit Juni 2025",
  version: "PARALIST 0.1.0 (MVP)",
  initials: "PA",
};

/*
 * Die beiden Wege zum öffentlichen Board. Getrennt, weil man das Formular
 * sonst nicht findet: die Startseite zeigt nur die Roadmap, das Schreibfeld
 * liegt eine Ebene tiefer und geht mit „/create“ sofort auf.
 */
const supportLinks = {
  feedback: "https://xool.canny.io/paralist/create",
  roadmap: "https://xool.canny.io",
};

const stepSizes = [5, 10, 15, 30, 60, 90, 120, 180, 240, 360, 480];
const fallbackStep = 720;
const barWidthShare = 0.55;
const dotLevels = 4;

/** Die Versionszeile — das Feedback-Formular schickt sie mit. */
export function appVersion() {
  return profile.version;
}

/** Das runde Bild oder die Initialen. */
export function avatarMarkup() {
  const photo = currentPhoto();
  return photo ? `<img src="${photo}" alt="">` : profile.initials;
}

/** Kopf des Blatts: Bild, Name, Mailadresse, Plan. */
export function identityCard() {
  return `
    <section class="profile-id">
      <div class="profile-avatar-wrap">
        <button class="profile-avatar" type="button" data-avatar-view="1" aria-label="Profilbild anzeigen">${avatarMarkup()}</button>
        <button class="profile-avatar-edit" type="button" data-avatar-edit="1" aria-label="Profilbild ändern">${icon("pencil")}</button>
      </div>
      <p class="profile-name">${escapeHtml(profile.name)}</p>
      <p class="profile-mail">${escapeHtml(profile.mail)}</p>
      <p class="profile-meta">${escapeHtml(profile.meta)}</p>
    </section>
  `;
}

/** Balken je Tag: wie lange die App an diesem Tag offen war. */
export function usageCard() {
  const days = ui.usageRange;
  const today = startOfDay(Date.now());
  const rows = [];
  for (let back = days - 1; back >= 0; back -= 1) {
    const ts = dayShift(today, -back);
    rows.push({ ts, seconds: usageOfDay(ts) });
  }

  const total = rows.reduce((sum, row) => sum + row.seconds, 0);
  const activeDays = rows.filter((row) => row.seconds > 0).length;
  const maxMinutes = Math.max(...rows.map((row) => row.seconds / 60), 1);

  const step = niceStep(maxMinutes, stepSizes, 4) || fallbackStep;
  const { yMax, y } = yAxis(maxMinutes, step);
  const x = (index) => chartBox.left + ((index + 0.5) / days) * (chartBox.right - chartBox.left);

  const format = axisDateFormat(days);
  const grid = gridLines(yMax, step, y, formatAxisSpan);
  const marks = dateMarks(days, x, (index) => format.format(new Date(rows[index].ts)));

  const barWidth = Math.max(2, ((chartBox.right - chartBox.left) / days) * barWidthShare);
  const bars = rows
    .map((row, index) => {
      const minutes = row.seconds / 60;
      if (!minutes) return "";
      const top = y(minutes);
      /* x/y/width/height in SVG-Einheiten: die Höhe ergibt sich erst aus der Zeit */
      return `<rect class="usage-bar" x="${(x(index) - barWidth / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(1.5, chartBox.bottom - top).toFixed(1)}" rx="${Math.min(2.5, barWidth / 2).toFixed(1)}" />`;
    })
    .join("");

  const average = activeDays ? total / activeDays : 0;
  return `
    <section class="pcard">
      <div class="pcard-head">${icon("clock")}<span>Nutzungszeit</span></div>
      <p class="stat-big">${formatSpan(total)}</p>
      <p class="stat-sub">an ${activeDays} von ${days} Tagen · ⌀ ${formatSpan(average)} je aktivem Tag</p>
      ${rangeSwitch("usage-range", chartRanges, days, "data-usage-range")}
      <svg class="chart" viewBox="0 0 ${chartBox.width} ${chartBox.height}" aria-hidden="true">
        ${grid}
        ${marks}
        ${bars}
      </svg>
    </section>
  `;
}

const weekdayLetters = ["M", "D", "M", "D", "F", "S", "S"];
const weekdayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const monthLetters = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const monthNames = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/*
 * Punkte-Raster: eine Spalte je Monat, eine Zeile je Wochentag.
 * Je dunkler der Punkt, desto mehr Zeit lief an diesem Wochentag im Monat.
 */
export function streakCard() {
  const streak = usageStreaks();
  const year = new Date().getFullYear();
  const cells = Array.from({ length: 12 }, () => new Array(7).fill(0));

  usageDays().forEach((key) => {
    const date = parseDay(key);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return;
    /* (getDay() + 6) % 7 rückt Montag an die erste Stelle */
    cells[date.getMonth()][(date.getDay() + 6) % 7] += usageOfDay(date.getTime());
  });

  const max = Math.max(...cells.flat(), 1);
  let grid = "";
  for (let row = 0; row < 7; row += 1) {
    grid += `<span class="dot-label">${weekdayLetters[row]}</span>`;
    for (let month = 0; month < 12; month += 1) {
      const value = cells[month][row];
      const level = value ? Math.min(dotLevels, Math.ceil((value / max) * dotLevels)) : 0;
      const spent = value ? formatSpan(value) : "keine Zeit";
      grid += `<span class="dot is-l${level}" title="${weekdayNames[row]} im ${monthNames[month]}: ${spent}"></span>`;
    }
  }
  grid += `<span class="dot-label"></span>`;
  grid += monthLetters.map((letter) => `<span class="dot-month">${letter}</span>`).join("");

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("flame")}<span>Serie</span></div>
      <div class="streak-row">
        <div class="streak-box">
          <p class="streak-label">Aktuelle Serie</p>
          <p class="streak-value">${streak.current} T</p>
        </div>
        <div class="streak-box">
          <p class="streak-label">Längste</p>
          <p class="streak-value">${streak.longest} T</p>
        </div>
      </div>
      <div class="dotgrid">${grid}</div>
      <p class="chart-note">Wochentage von Montag oben bis Sonntag unten · ${year}</p>
    </section>
  `;
}

/*
 * Die Zeilenkarten unter den Diagrammen. `detail` nennt die Seite, die sich
 * beim Antippen auftut (siehe `details` in settings-cards.js), `link` eine
 * Adresse außerhalb der App; Zeilen ohne beides zeigen im MVP nur den Aufbau.
 */
const listSections = [
  { title: "Plan", rows: [{ icon: "arrow-up-circle", label: "Plan verwalten", trail: "chevron" }] },
  {
    title: "Support",
    rows: [
      { icon: "note", label: "Feedback", trail: "external", link: supportLinks.feedback },
      { icon: "roadmap", label: "Roadmap", trail: "external", link: supportLinks.roadmap },
      { icon: "cube", label: "Danksagungen", trail: "chevron", detail: "credits" },
    ],
  },
  { title: "Mehr", rows: [{ icon: "signout", label: "Abmelden" }] },
  { title: "Gefahrenzone", rows: [{ icon: "trash", label: "Konto löschen", danger: true }] },
];

/** Die Listen unter den Karten. */
export function listsMarkup() {
  const sections = listSections
    .map((section) => {
      const rows = section.rows
        .map((row) => {
          const shell = `class="plist-row${row.danger ? " is-danger" : ""}"`;
          const inner = `
          ${icon(row.icon)}
          <span>${escapeHtml(row.label)}</span>
          ${row.trail ? icon(row.trail, "plist-trail") : ""}`;
          /* a statt button: nur ein echter Link öffnet verlässlich einen neuen
             Tab. target: die App bleibt dahinter stehen, sonst müsste man sich
             von der fremden Seite mehrfach zurücktippen. rel: der neue Tab darf
             sonst über window.opener auf die App zugreifen. */
          if (row.link) {
            return `<a ${shell} href="${escapeHtml(row.link)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
          }
          return `<button ${shell} type="button"${row.detail ? ` data-settings-detail="${row.detail}"` : ""}>${inner}</button>`;
        })
        .join("");
      return `<p class="psection">${section.title}</p><section class="plist">${rows}</section>`;
    })
    .join("");

  return `${sections}<p class="profile-version">${escapeHtml(profile.version)}</p>`;
}
