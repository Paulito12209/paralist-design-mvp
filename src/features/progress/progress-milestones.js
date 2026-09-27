/*
 * Meilensteine im Fortschritt-Blatt: eine Karte mit allen Plaketten im
 * Kleinen und die eigene Seite dahinter. Dort steht je Kategorie eine Zeile
 * mit Plakette, Stufe und Balken bis zur nächsten Stufe; ein Tipp klappt die
 * ganze Leiter mit Schwellen und Datum auf — wie die Erfolge bei Duolingo.
 * Pfad: src/features/progress/progress-milestones.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pageTitle   -> Überschrift der Seite und der Karte
 * reachedDate -> wie das Datum einer erreichten Stufe geschrieben wird
 *
 * Namen, Schwellen und Farben der Abzeichen stehen in
 * src/data/milestone-tracks.js, Größen und Farben der Plaketten in
 * styles/milestones.css und styles/tokens-pages.css.
 */

import { formatNumber } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { milestoneTiers, unitFor } from "../../data/milestone-tracks.js";
import { markMilestonesSeen, milestoneStatus, milestoneTotals, nextMilestone } from "../../data/milestones.js";

const pageTitle = "Meilensteine";
const reachedDate = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });

/* Welche Zeile aufgeklappt ist und was beim Öffnen der Seite neu war. */
let openId = null;
let freshIds = new Set();

/**
 * Die Seite wird geöffnet: merken, was seit dem letzten Mal neu ist, und es
 * danach als gesehen speichern — so bleibt „Neu“ stehen, solange man auf der
 * Seite ist, und ist beim nächsten Öffnen weg.
 */
export function enterMilestones() {
  const list = milestoneStatus();
  freshIds = new Set(list.filter((item) => item.fresh).map((item) => item.track.id));
  openId = null;
  markMilestonesSeen(list);
}

/** Eine Zeile auf- oder zuklappen. */
export function toggleMilestone(id) {
  openId = openId === id ? null : id;
}

/*
 * Die runde Plakette: Icon in der Farbe der Kategorie, außen ein Ring bis zur
 * nächsten Stufe, unten die Stufe als Zahl. Gesperrt bleibt sie grau.
 */
function medal(item, small = false) {
  const style = `--ms-color:${item.track.color};--ms-share:${(item.progress * 100).toFixed(1)}%`;
  const classes = ["ms-medal", small ? "is-small" : "", item.tier ? "" : "is-locked", item.maxed ? "is-max" : ""];
  const tier = item.tier && !small ? `<span class="ms-medal-tier">${item.tier}</span>` : "";
  return `
    <span class="${classes.filter(Boolean).join(" ")}" style="${style}" aria-hidden="true">
      <span class="ms-medal-face">${icon(item.track.icon)}</span>${tier}
    </span>
  `;
}

/* „37 / 50 Aufgaben erledigt“ oder, oben angekommen, nur die Zahl. */
function countLine(item) {
  if (item.maxed) return `${formatNumber(item.value)} ${unitFor(item.track, item.value)} · höchste Stufe`;
  return `${formatNumber(item.value)} / ${formatNumber(item.to)} ${unitFor(item.track, item.to)}`;
}

/** Karte im Fortschritt-Blatt: alle Plaketten klein, die Summe und wie viel neu ist. */
export function milestonesTeaser() {
  const list = milestoneStatus();
  const totals = milestoneTotals(list);
  const fresh = list.filter((item) => item.fresh).length;
  const badge = fresh ? `<span class="ms-new">${fresh} neu</span>` : "";
  return `
    <button class="pcard ms-teaser" type="button" data-progress-detail="milestones" aria-label="${pageTitle} öffnen">
      <span class="pcard-head">${icon("trophy")}<span>${pageTitle}</span>${badge}<span class="ms-go">${icon("chevron")}</span></span>
      <span class="ms-shelf">${list.map((item) => medal(item, true)).join("")}</span>
      <span class="ms-teaser-sum">${totals.reached} von ${totals.all} Stufen erreicht</span>
    </button>
  `;
}

/* Kopf der Seite: Summe, Balken und die Stufe, die am nächsten liegt. */
function summaryCard(list) {
  const totals = milestoneTotals(list);
  const next = nextMilestone(list);
  const share = totals.all ? (totals.reached / totals.all) * 100 : 0;
  const nextLine = next
    ? `Als Nächstes: <b>${escapeHtml(next.track.title)} · ${milestoneTiers[next.tier]}</b> — noch ${formatNumber(next.to - next.value)} ${unitFor(next.track, next.to - next.value)}`
    : "Alle Stufen erreicht. Respekt!";
  return `
    <section class="pcard ms-summary">
      <p class="ms-summary-value"><b>${totals.reached}</b> / ${totals.all}</p>
      <p class="ms-summary-label">Stufen erreicht</p>
      <span class="ms-bar"><span style="width:${share.toFixed(1)}%"></span></span>
      <p class="ms-summary-next">${nextLine}</p>
    </section>
  `;
}

/* Die aufgeklappte Leiter: jede Stufe mit Schwelle und Datum oder dem Rest bis
   dahin. `ol` statt `ul`: die Stufen haben eine feste Reihenfolge. */
function ladder(item) {
  const rows = item.track.steps
    .map((step, index) => {
      const reached = index < item.tier;
      const when = reached && item.at[index] ? reachedDate.format(new Date(item.at[index])) : "";
      const note = reached ? when : `noch ${formatNumber(step - item.value)}`;
      return `
        <li class="ms-step${reached ? " is-reached" : ""}">
          <span class="ms-step-dot">${reached ? icon("check") : index + 1}</span>
          <span class="ms-step-name">${milestoneTiers[index]}</span>
          <span class="ms-step-goal">${formatNumber(step)}</span>
          <span class="ms-step-note">${note}</span>
        </li>
      `;
    })
    .join("");
  return `
    <div class="ms-ladder" style="--ms-color:${item.track.color}">
      <p class="ms-hint">${escapeHtml(item.track.hint)}</p>
      <ol class="ms-steps">${rows}</ol>
    </div>
  `;
}

/* Eine Zeile je Kategorie; ein Tipp klappt darunter die Leiter auf. */
function trackRow(item) {
  const open = openId === item.track.id;
  const fresh = freshIds.has(item.track.id) ? `<span class="ms-new">Neu</span>` : "";
  const tierLine = item.tier ? `Stufe ${item.tier} · ${item.tierName}` : item.tierName;
  return `
    <div class="ms-item${open ? " is-open" : ""}">
      <button class="ms-row" type="button" data-milestone="${item.track.id}" aria-expanded="${open}">
        ${medal(item)}
        <span class="ms-copy">
          <span class="ms-title">${escapeHtml(item.track.title)}${fresh}</span>
          <span class="ms-tier">${tierLine}</span>
          <span class="ms-bar" style="--ms-color:${item.track.color}"><span style="width:${(item.progress * 100).toFixed(1)}%"></span></span>
          <span class="ms-count">${countLine(item)}</span>
        </span>
        <span class="ms-go">${icon("chevron")}</span>
      </button>
      ${open ? ladder(item) : ""}
    </div>
  `;
}

/** Die ganze Seite „Meilensteine“. */
export function milestonesPage() {
  const list = milestoneStatus();
  return `
    <h3 class="ms-heading">${pageTitle}</h3>
    ${summaryCard(list)}
    <section class="pcard ms-list">${list.map(trackRow).join("")}</section>
  `;
}
