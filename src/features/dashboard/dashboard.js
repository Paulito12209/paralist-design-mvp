/*
 * Kopf der Übersicht in der Desktop-Fassung: unter dem Titel „Übersicht“, der
 * allein steht, die vier großen Zahlen und darunter die Bühne mit den zuletzt
 * geöffneten Seiten samt der Reihe ihrer verknüpften Einträge
 * (dashboard-stage.js). Das Aktivitätsband und die Karten „Diese Woche“ und
 * „Serie“ stehen auf der Seite Fortschritt; die vier Sammlungs-Karten und die
 * Arbeitsbereiche blendet styles/desk-views.css aus — beides steht schon in
 * der Seitenleiste.
 *
 * Das Modul wird nur geladen, wenn das Fenster breit genug ist (src/main.js);
 * am Handy blendet styles/dashboard.css den Kopf ohnehin aus.
 * Pfad: src/features/dashboard/dashboard.js
 *
 * Keine anpassbaren visuellen Werte: die Zahlen stehen in src/ui/dash-parts.js
 * (statOrder), die Bühne in dashboard-stage.js; Aussehen und Abstände in
 * styles/dashboard.css und styles/dashboard-stage.css; Überfahren, Drücken und
 * Auftauchen in styles/dashboard-motion.css; die Werte in styles/tokens-desk.css.
 */

import { events, on } from "../../core/bus.js";
import { dayKey } from "../../core/dates.js";
import { load } from "../../core/lazy.js";
import { deskStats } from "../../data/insights.js";
import { ui } from "../../data/state.js";
import { statRow } from "../../ui/dash-parts.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { showTab } from "../../ui/router.js";
import { isViewActive } from "../../ui/views.js";
import { mountStage, renderStage } from "./dashboard-stage.js";

/* Beim ersten Aufruf angelegt und dann behalten — hängen fest in der Startseite. */
let hero = null;
let stats = null;

function openProgress() {
  load("progress").then((module) => module.open());
}

/* „Heute“ zählt die Termine von heute — also auch den heutigen Tag zeigen,
   nicht den, den man zuletzt im Kalender gewählt hatte. */
function openToday() {
  ui.calendarDay = dayKey(new Date());
  showTab("calendar");
}

/* Was ein Klick auf eine der vier Zahlen (`data-dash`) öffnet. */
const actions = {
  tasks: () => showTab("tasks"),
  calendar: openToday,
  progress: openProgress,
};

/* Ein Empfänger für die Zahlenreihe statt einer an jedem Knopf. */
function onStatsClick(event) {
  const target = event.target.closest("[data-dash]");
  if (!target) return;
  const action = actions[target.dataset.dash];
  if (action) action();
}

/**
 * Den Kopf neu zeichnen — nur, wenn er zu sehen ist: Desktop und Übersicht offen.
 * @param entrance `true` lässt Zahlen und Bühne nacheinander auftauchen und
 *   stellt die zuletzt geöffnete Seite nach vorn. Nur beim ersten Zeichnen und
 *   beim Öffnen der Übersicht; bei geänderten Daten nicht, sonst flackerte der
 *   Kopf bei jedem Haken.
 */
function render(entrance) {
  if (!hero || !isDesk() || !isViewActive("home")) return;
  /* Die Klasse vor dem Austausch setzen oder nehmen: nur neu eingesetzte
     Elemente mit der Klasse spielen die Bewegung ab, alle anderen stehen sofort. */
  hero.classList.toggle("is-entering", entrance);
  stats.innerHTML = statRow(deskStats());
  renderStage(entrance);
}

/* Den Kopf einmal in die Startseite einhängen und die Zuhörer anmelden. */
function mount() {
  const title = document.querySelector("#view-home .screen-title");
  if (!title) return false;

  hero = document.createElement("div");
  hero.className = "desk-hero";
  stats = document.createElement("div");
  stats.addEventListener("click", onStatsClick);
  hero.append(stats);
  mountStage(hero);
  title.after(hero);

  /* dataChanged kommt auch nach Mitternacht (src/shell/desk.js): dann stimmt
     die Zahl „Heute“ wieder. */
  on(events.dataChanged, () => render(false));
  on(events.xpChanged, () => render(false));
  on(events.viewOpened, (name) => {
    if (name === "home") render(true);
  });
  /* Beim Wechsel über eine Breitengrenze ohne Auftauchen: die Seite war ja schon da. */
  onDeskChange(() => render(false));
  return true;
}

/**
 * Den Kopf der Übersicht einhängen und zum ersten Mal zeichnen. Darf mehrmals
 * aufgerufen werden — src/main.js tut das bei jedem Wechsel in die
 * Desktop-Breite. Nach dem ersten Einhängen passiert hier nichts mehr: den
 * Wechsel zeichnet schon der eigene Zuhörer aus mount() (onDeskChange) neu,
 * so gibt es je Wechsel genau ein Neuzeichnen.
 */
export function initDashboard() {
  if (hero) return;
  if (mount()) render(true);
}
