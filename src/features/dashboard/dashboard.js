/*
 * Kopf der Übersicht in der Desktop-Fassung: neben „Übersicht“ das heutige
 * Datum in Grau, darunter vier große Zahlen, das Aktivitätsband der letzten
 * zwölf Wochen mit dem gläsernen Stufen-Chip und die zwei großen Karten
 * „Diese Woche“ und „Serie“. Die vier Übersichtskarten und die
 * Arbeitsbereiche folgen darunter wie gehabt.
 *
 * Das Modul wird nur geladen, wenn das Fenster breit genug ist (src/main.js);
 * am Handy blendet styles/dashboard.css Kopf und Datum ohnehin aus.
 * Pfad: src/features/dashboard/dashboard.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * bandDays        -> wie viele Tage das Aktivitätsband zeigt (84 = 12 Wochen)
 * streakDays      -> wie viele Tage die Punktsäulen in der Karte „Serie“ zeigen
 * titleDate       -> wie das Datum neben „Übersicht“ geschrieben wird („Mittwoch, 23. September“)
 * enterOrder      -> in welcher Reihenfolge Zahlen, Band und Karten auftauchen
 *
 * Aussehen und Abstände: styles/dashboard.css; Überfahren, Drücken und
 * Auftauchen: styles/dashboard-motion.css; die Werte: styles/tokens-desk.css.
 */

import { events, on } from "../../core/bus.js";
import { dayKey } from "../../core/dates.js";
import { load } from "../../core/lazy.js";
import { deskStats, levelSummary, usageByDay, xpByDay, xpThisWeek } from "../../data/insights.js";
import { ui } from "../../data/state.js";
import { usageStreaks } from "../../data/usage.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { showTab } from "../../ui/router.js";
import { isViewActive } from "../../ui/views.js";
import { bandBlock, heroCards, statRow } from "./dashboard-parts.js";

const bandDays = 84;
const streakDays = 28;
const titleDate = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" });

/* Platz beim Auftauchen: die vier Zahlen nehmen 0–3, danach das Band, dann die Karten. */
const enterOrder = { band: 4, cards: 5 };

/* Beim ersten Aufruf angelegt und dann behalten — beide hängen fest in der Startseite. */
let hero = null;
let dateLabel = null;

function openProgress() {
  load("progress").then((module) => module.open());
}

/*
 * Die Karte „Serie“ öffnet das Einstellungs-Blatt gleich mit der vollen Karte
 * „Serie“ statt mit der Liste: open() nimmt die aufzuklappende Kachel als
 * zweiten Wert. Im Verlauf liegt dabei nur ein Schritt — der Pfeil im Blatt
 * führt zur Liste der Einstellungen, das Kreuz und Browser-Zurück schließen
 * das Blatt und man steht wieder auf der Übersicht.
 */
function openStreak() {
  load("profile").then((module) => module.open(true, { detail: "streak" }));
}

/* „Heute“ zählt die Termine von heute — also auch den heutigen Tag zeigen,
   nicht den, den man zuletzt im Kalender gewählt hatte. */
function openToday() {
  ui.calendarDay = dayKey(new Date());
  showTab("calendar");
}

/* Was ein Klick auf einen Knopf mit `data-dash` öffnet. */
const actions = {
  tasks: () => showTab("tasks"),
  calendar: openToday,
  progress: openProgress,
  streak: openStreak,
};

/* Ein Empfänger für den ganzen Kopf statt einer an jedem Knopf. */
function onHeroClick(event) {
  const target = event.target.closest("[data-dash]");
  if (!target) return;
  const action = actions[target.dataset.dash];
  if (action) action();
}

/**
 * Den Kopf neu zeichnen — nur, wenn er zu sehen ist: Desktop und Übersicht offen.
 * @param entrance `true` lässt Zahlen, Band und Karten nacheinander auftauchen.
 *   Nur beim ersten Zeichnen und beim Öffnen der Übersicht; bei geänderten
 *   Daten nicht, sonst flackerte der Kopf bei jedem Haken.
 */
function render(entrance) {
  if (!hero || !isDesk() || !isViewActive("home")) return;
  dateLabel.textContent = titleDate.format(new Date());

  const level = levelSummary();
  /* Die Klasse vor dem Austausch setzen oder nehmen: nur neu eingesetzte
     Elemente mit der Klasse spielen die Bewegung ab, alle anderen stehen sofort. */
  hero.classList.toggle("is-entering", entrance);
  hero.innerHTML =
    statRow(deskStats()) +
    bandBlock(xpByDay(bandDays), level, enterOrder.band) +
    heroCards({
      week: xpThisWeek(),
      level,
      streak: usageStreaks(),
      usage: usageByDay(streakDays),
      order: enterOrder.cards,
    });
}

/* Datum und Kopf einmal in die Startseite einhängen und die Zuhörer anmelden. */
function mount() {
  const title = document.querySelector("#view-home .screen-title");
  if (!title) return false;

  dateLabel = document.createElement("span");
  dateLabel.className = "desk-title-date";
  /* Ein echtes Leerzeichen davor: dort darf der Titel umbrechen, und
     Vorlesehilfen lesen „Übersicht Mittwoch, …“ statt eines zusammengeklebten Wortes. */
  title.append(" ", dateLabel);

  hero = document.createElement("div");
  hero.className = "desk-hero";
  title.after(hero);
  hero.addEventListener("click", onHeroClick);

  /* dataChanged kommt auch nach Mitternacht (src/shell/desk.js): dann stimmen
     Datum, „Heute“ und die Säule ganz rechts wieder. */
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
