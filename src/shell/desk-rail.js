/*
 * Die rechte Spalte am Desktop (ab 1280px Fensterbreite), die Kontextspalte.
 * Ihre Karten wechseln mit der Seite: Kalender, Aufgaben, Medien und Suche
 * bringen eigene mit (src/features/<bereich>/<bereich>-rail.js, angemeldet in
 * src/main.js über registerRailCards). Alle anderen Seiten zeigen die Karten
 * der Übersicht: oben die Kacheln „Eingang“ und „Fortschritt“, darunter „Als
 * Nächstes“, die dringendsten Aufgaben und was zuletzt geöffnet wurde.
 * Diese Datei baut je Kartensatz das Gerüst einmal, setzt bei jedem
 * Neuzeichnen nur die Karten neu ein, deren Inhalt sich wirklich geändert hat,
 * und hört mit EINEM Klick-Empfänger auf die ganze Spalte. Wann gezeichnet
 * wird, entscheidet src/shell/desk.js.
 * Pfad: src/shell/desk-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * checkDelay -> wie lange der gefüllte Haken zu sehen ist, bevor die erledigte
 *               Aufgabe aus der Liste verschwindet (Millisekunden)
 * inboxPage  -> welche Übersichtskarte ein Klick auf die Kachel „Eingang“ öffnet
 * hoursAhead -> „Termin anlegen“ schlägt die nächste volle Stunde vor: so viele
 *               Stunden nach der jetzigen
 * entranceMotions -> Namen der Bewegungen beim ersten Zeigen; müssen zu den
 *               @keyframes in styles/desk-rail.css passen
 *
 * Die Inhalte der Karten stehen in src/shell/desk-rail-cards.js, ihr Aussehen
 * in styles/desk-rail.css und styles/desk-rail-tiles.css, das Auftauchen beim
 * ersten Zeigen in styles/desk-rail.css.
 */

import { emit, events } from "../core/bus.js";
import { dayKey, pad2 } from "../core/dates.js";
import { dom } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { ui } from "../data/state.js";
import { openEntry, openTarget, showSearch, showTab } from "../ui/router.js";
import { toggleTaskFromCheck } from "../ui/task-status.js";
import { currentView, isViewActive } from "../ui/views.js";
import { inboxTile, levelTile, nextCard, recentSection, tasksCard } from "./desk-rail-cards.js";

const checkDelay = 220;
const inboxPage = "1";
const hoursAhead = 1;

/* Die Bewegungen des ersten Zeigens — dieselben Namen wie die @keyframes in styles/desk-rail.css. */
const entranceMotions = ["desk-rail-rise", "desk-rail-tick"];

/*
 * Die Plätze der Übersicht von oben nach unten. `group` legt die beiden Kacheln
 * nebeneinander in eine Zeile; `tag` ist das Element des Platzes. Die
 * Reihenfolge bestimmt auch, in welcher Folge die Karten beim ersten Zeigen
 * auftauchen.
 */
const slots = [
  { name: "inbox", tag: "div", className: "rail-tile rail-inbox", group: "tiles", render: inboxTile },
  { name: "level", tag: "div", className: "rail-tile rail-level", group: "tiles", render: levelTile },
  { name: "next", tag: "section", className: "rail-card rail-next", render: nextCard },
  { name: "tasks", tag: "section", className: "rail-card rail-tasks", render: tasksCard },
  { name: "recent", tag: "section", className: "rail-recent", render: recentSection },
];

let root = null;
let rendered = false;
/* Je Kartensatz („overview“ oder der Name einer Ansicht): sein Element, die
   Plätze und was zuletzt darin stand. */
const sets = new Map();
/* Angemeldete Kartensätze der Ansichten: erst die Funktion, die sie lädt,
   nach dem Laden das Modul mit `railCards` und `railActions`. */
const loaders = new Map();
const modules = new Map();
/* Der Kartensatz, der gerade zu sehen ist. */
let active = null;
/* Aufgaben, deren Haken gerade gefüllt wird — ein zweiter Klick in der kurzen Pause zählt nicht. */
const checking = new Set();

/* Steht die Seite „Eingang“ gerade offen? Die anderen Sammlungen haben eine
   `kind`, Arbeitsbereiche `isWorkspace`, das Archiv keinen `parent`. */
function isInboxOpen() {
  const page = ui.currentPage;
  return isViewActive("page") && Boolean(page) && !page.kind && !page.isWorkspace && page.parent === null;
}

/* Kachel „Eingang“: ist er schon offen, nur sanft nach oben rollen — ein zweites
   Öffnen legte denselben Schritt doppelt in den Verlauf, und Zurück bliebe
   einmal auf derselben Seite stehen. */
function openInbox() {
  if (isInboxOpen()) dom.content.scrollTo({ top: 0, behavior: "smooth" });
  else openTarget("overview", inboxPage);
}

/*
 * Den Kalender auf heute öffnen und den Tagesschlüssel zurückgeben. Steht er
 * schon offen, rollt showTab() nur nach oben — ein anderer gewählter Tag
 * braucht dann ein Neuzeichnen, sonst zeigte der Streifen noch den alten Tag,
 * während neue Einträge schon auf heute fielen.
 */
function openCalendarOn(key) {
  const todayKey = dayKey(new Date());
  if (isViewActive("calendar") && key === todayKey) {
    /* Derselbe Weg wie der Knopf „Heute“ im Kalender: er rollt das
       Stundenraster auch zur Jetzt-Linie. */
    dom.calTodayBtn.click();
  } else {
    const moved = ui.calendarDay !== key;
    ui.calendarDay = key;
    if (moved && isViewActive("calendar")) emit(events.dataChanged);
  }
  showTab("calendar");
  return key;
}

function openCalendarToday() {
  return openCalendarOn(dayKey(new Date()));
}

/* „Termin anlegen“: Kalender auf den Tag der nächsten vollen Stunde, dann das
   Eingabefeld wie nach einem Tipp auf diese Stunde — so bekommt der Termin Tag
   und Uhrzeit. Nach 23 Uhr ist das schon morgen früh. */
function newEventSoon() {
  const start = new Date();
  start.setHours(start.getHours() + hoursAhead, 0, 0, 0);
  const date = openCalendarOn(dayKey(start));
  emit(events.composerRequested, { date, time: `${pad2(start.getHours())}:00` });
}

/* Was ein Klick auf einen Knopf mit data-rail="…" auslöst. */
const actions = {
  inbox: openInbox,
  create: (button) => emit(events.createRequested, button.dataset.pick),
  level: () => load("progress").then((module) => module.open()),
  entry: (button) => openEntry(button.dataset.id),
  calendar: openCalendarToday,
  event: newEventSoon,
  tasks: () => showTab("tasks"),
  /* „Zuletzt geöffnet“ steht vollständig, nach Tagen gruppiert, auf der Suchseite. */
  recent: () => showSearch(false),
  done: checkTask,
};

/*
 * Haken füllen, kurz stehen lassen, dann erst abhaken: sonst verschwände die
 * Zeile im selben Augenblick, in dem man klickt, und man sähe nie, dass es
 * geklappt hat. Das Abhaken speichert selbst und meldet die Änderung — die
 * Spalte zeichnet sich darauf neu.
 */
function checkTask(button) {
  const id = button.dataset.id;
  if (checking.has(id)) return;
  checking.add(id);
  button.classList.add("is-checking");
  setTimeout(() => {
    checking.delete(id);
    /* Derselbe Weg wie der Haken in den Listen: mit Meldung und „Rückgängig“ */
    toggleTaskFromCheck(id);
  }, checkDelay);
}

/*
 * Erst darf der sichtbare Bereich selbst (railClick, etwa die Schalter von
 * „Ansicht konfigurieren“), dann seine Knöpfe, dann die gemeinsamen
 * (Eintrag öffnen, abhaken …).
 */
function onClick(event) {
  const module = modules.get(active?.name);
  if (module?.railClick?.(event)) return;
  const button = event.target.closest("[data-rail]");
  if (!button || !root.contains(button)) return;
  const own = module?.railActions || {};
  const action = own[button.dataset.rail] || actions[button.dataset.rail];
  if (action) action(button);
}

/* Merkzeichen eines Knopfes: was er tut und für welchen Eintrag. */
function keyOf(button) {
  return `${button.dataset.rail}|${button.dataset.id || ""}`;
}

/*
 * Steht der Tastatur-Fokus in einem Platz, der gleich ersetzt wird, merkt
 * sich diese Funktion, auf welchem Knopf — und an welcher Stelle. Sonst
 * spränge der Fokus bei jedem Neuzeichnen (auch beim Minutentakt) an den
 * Anfang der Seite.
 */
function focusIn(box) {
  const active = document.activeElement;
  if (!active || !box.contains(active) || !active.dataset.rail) return null;
  return { key: keyOf(active), index: [...box.querySelectorAll("[data-rail]")].indexOf(active) };
}

/* Fokus nach dem Ersetzen zurückgeben: auf denselben Knopf, sonst auf den, der jetzt an seiner Stelle steht. */
function restoreFocus(box, focus) {
  const buttons = [...box.querySelectorAll("[data-rail]")];
  const same = buttons.find((button) => keyOf(button) === focus.key);
  const target = same || buttons[Math.min(focus.index, buttons.length - 1)];
  if (target) target.focus({ preventScroll: true });
}

/* Einen Platz füllen — nur, wenn sich sein Inhalt geändert hat. Ein leerer Platz wird ausgeblendet. */
function fill(set, slot, html) {
  if (set.shown.get(slot.name) === html) return;
  set.shown.set(slot.name, html);
  const box = set.boxes.get(slot.name);
  const focus = focusIn(box);
  box.innerHTML = html;
  box.hidden = !html;
  if (focus) restoreFocus(box, focus);
}

/*
 * Das Auftauchen beim ersten Zeigen ist vorbei, sobald keine seiner
 * Bewegungen mehr läuft (auch abgebrochene zählen, etwa wenn das Fenster
 * währenddessen schmal gezogen wird). Erst dann fällt die Klasse weg — so
 * schneidet ein frühes Neuzeichnen die Bewegung nicht mittendrin ab, und
 * danach taucht beim Neuzeichnen oder erneuten Zeigen nichts mehr auf. Der
 * dauernde Puls im Zeit-Chip zählt nicht mit, sonst endete es nie.
 */
function endEntrance() {
  const running = root
    .getAnimations({ subtree: true })
    .some((animation) => entranceMotions.includes(animation.animationName));
  if (running) return;
  root.classList.remove("is-entering");
  root.removeEventListener("animationend", endEntrance);
  root.removeEventListener("animationcancel", endEntrance);
}

/*
 * Das leere Gerüst eines Kartensatzes: ein Element je Platz, Plätze mit
 * `group` gemeinsam in einer Zeile (die zwei Kacheln der Übersicht). Der Satz
 * steht in einem eigenen Element, das die Spalte selbst nicht verändert
 * (display: contents in styles/desk-rail-views.css).
 */
function buildSet(name, cards) {
  const element = document.createElement("div");
  element.className = "rail-set";
  element.dataset.railSet = name;
  const set = { name, cards, element, boxes: new Map(), shown: new Map() };
  const groups = new Map();
  cards.forEach((slot, index) => {
    const box = document.createElement(slot.tag || "section");
    box.className = slot.className;
    box.dataset.slot = slot.name;
    /* --i: Platz in der Reihe, daraus rechnet das Stylesheet die Verzögerung beim Auftauchen. */
    box.style.setProperty("--i", String(index));
    set.boxes.set(slot.name, box);
    if (!slot.group) {
      element.append(box);
      return;
    }
    if (!groups.has(slot.group)) {
      const row = document.createElement("div");
      row.className = `rail-${slot.group}`;
      groups.set(slot.group, row);
      element.append(row);
    }
    groups.get(slot.group).append(box);
  });
  root.append(element);
  sets.set(name, set);
  return set;
}

/**
 * Eigene Karten für eine Ansicht anmelden. Wird von src/main.js über
 * src/shell/desk.js hereingegeben — so kennt src/shell/ keinen Bereich.
 * @param view Name der Ansicht, z.B. "calendar".
 * @param importFn holt das Modul; es exportiert `railCards` (Plätze wie
 *   `slots` oben, mit `render(now)`), wahlweise `railActions` (Name →
 *   Funktion(Knopf)) für seine eigenen data-rail-Knöpfe und `railClick(event)`
 *   für alles andere — gibt es `true` zurück, ist der Klick erledigt.
 */
export function registerRailCards(view, importFn) {
  loaders.set(view, importFn);
}

/*
 * Der Kartensatz für die offene Ansicht. Ist ihr Modul noch nicht geladen,
 * wird es jetzt geholt; bis dahin bleibt der bisherige Satz stehen (oder die
 * Übersicht), danach zeichnet sich die Spalte neu.
 */
function setForView() {
  const view = currentView();
  const module = modules.get(view);
  if (module) return sets.get(view) || buildSet(view, module.railCards);
  if (loaders.has(view)) {
    const importFn = loaders.get(view);
    loaders.delete(view);
    importFn().then((loaded) => {
      modules.set(view, loaded);
      if (currentView() === view) renderDeskRail();
    });
    return active || sets.get("overview");
  }
  return sets.get("overview");
}

/**
 * Die Spalte einhängen: Gerüst bauen und den einen Klick-Empfänger anmelden.
 * Wird von src/shell/desk.js genau einmal aufgerufen; gezeichnet wird erst mit
 * renderDeskRail(), sobald die Spalte zu sehen ist.
 * @param element die leere Spalte (aside.desk-rail).
 */
export function mountDeskRail(element) {
  if (root) return;
  root = element;
  buildSet("overview", slots);
  root.addEventListener("click", onClick);
}

/**
 * Inhalte neu zeichnen — bei Datenänderungen und im Minutentakt, solange die
 * Spalte zu sehen ist. Die Karten tauchen nur beim allerersten Zeichnen
 * sichtbar auf; danach wechselt ihr Inhalt still, ohne Flackern.
 */
export function renderDeskRail() {
  if (!root) return;
  if (!rendered) {
    rendered = true;
    root.classList.add("is-entering");
    root.addEventListener("animationend", endEntrance);
    root.addEventListener("animationcancel", endEntrance);
  }
  const set = setForView();
  if (set !== active) {
    sets.forEach((each) => {
      each.element.hidden = each !== set;
    });
    active = set;
  }
  const now = Date.now();
  set.cards.forEach((slot) => fill(set, slot, slot.render(now)));
}
