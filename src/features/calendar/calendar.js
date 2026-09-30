/*
 * Die Kalenderseite. Wird erst beim ersten Öffnen nachgeladen und setzt dann
 * Streifen, Fläche, das Panel „Ansicht“ (calendar-settings.js) und Gesten zusammen. Am Desktop kommen die
 * Werkzeugzeile und die Ansichten Woche und Monat dazu (calendar-week.js). In der Listenansicht wechselt
 * waagerechtes Wischen unter dem Streifen zwischen Aufgaben, Termine und
 * Projekte (src/ui/pill-swipe.js).
 * Pfad: src/features/calendar/calendar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tickSeconds -> wie oft die Jetzt-Linie nachgeführt wird (Sekunden)
 *
 * Alle Größen und Farben stehen in styles/calendar.css.
 */

import { emit, events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { calendarSegments } from "../../data/config.js";
import { state, ui } from "../../data/state.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { registerReselect } from "../../ui/router.js";
import { onDeskChange } from "../../ui/desk-mode.js";
import { isViewActive } from "../../ui/views.js";
import { openDatePicker } from "./calendar-date-picker.js";
import { initCalendarSettings, renderCalendarSettings, setTodayActive } from "./calendar-settings.js";
import { initCalendarGestures, setRedraw as setGestureRedraw } from "./calendar-gestures.js";
import { moveNowLine, nowLineVisible, renderGrid, scrollToNow, sizeGrid } from "./calendar-grid.js";
import { renderList } from "./calendar-list.js";
import {
  goToDay,
  goToday,
  setRedraw as setNavRedraw,
  setSegment,
  shiftMonth,
  shiftWeeks,
} from "./calendar-nav.js";
import { cal } from "./calendar-state.js";
import { renderStrip } from "./calendar-strip.js";
import {
  deskView,
  renderMonth,
  renderToolbar,
  renderWeek,
  scrollWeekToNow,
  setDeskView,
  sizeWeek,
  toolbarElement,
} from "./calendar-week.js";
import { addDays, dayKey, pad2, parseDay } from "../../core/dates.js";

const tickSeconds = 30;

let tickTimer = null;

/* Der Tag, den der Kalender zuletzt gezeigt hat — wechselt er, zieht die Spalte rechts nach. */
let shownDay = null;

/* Was in die Fläche kommt: am Desktop Woche oder Monat, sonst Tagesraster oder Liste. */
function panelMarkup(wide, grid) {
  if (wide === "week") return renderWeek();
  if (wide === "month") return renderMonth();
  return grid ? renderGrid() : renderList();
}

/**
 * Die ganze Seite neu zeichnen.
 * @param jumpToNow true, wenn das Raster zur aktuellen Uhrzeit rollen soll.
 */
export function renderCalendar(jumpToNow = false) {
  /* Der Scrollstand des Rasters geht beim Neuzeichnen verloren: erst merken,
     danach wiederherstellen — sonst springt der Tag bei jeder Änderung auf
     00:00 zurück. */
  const keepScroll = dom.calPanel.scrollTop;
  renderStrip();
  renderCalendarSettings();
  renderToolbar();
  const wide = deskView();
  /* Die Woche ist ein Stundenraster wie der Tag; der Monat rollt mit der Seite. */
  const grid = wide === "week" || (wide !== "month" && state.prefs.calendar.mode === "grid");
  /* is-grid: nur das Stundenraster rollt in sich selbst (styles/calendar-panel.css) */
  dom.calPanel.classList.toggle("is-grid", grid);
  dom.calPanel.innerHTML = panelMarkup(wide, grid);
  if (grid) {
    if (wide === "week") sizeWeek();
    else sizeGrid();
    if (jumpToNow && wide === "week") scrollWeekToNow();
    else if (jumpToNow) scrollToNow();
    else dom.calPanel.scrollTop = keepScroll;
    updateGridLock();
  } else {
    dom.calPanel.style.height = "";
  }
  /* rAF: die Sichtbarkeit der Jetzt-Linie erst messen, wenn das Rollen im
     Raster übernommen wurde. */
  requestAnimationFrame(updateTodayPill);
  /* Am Desktop zeigt die rechte Spalte den gewählten Tag (calendar-rail.js). */
  if (ui.calendarDay !== shownDay) {
    shownDay = ui.calendarDay;
    emit(events.contextChanged);
  }
}

/* Ob der gewählte Tag der heutige ist. */
function isOnToday() {
  return ui.calendarDay === dayKey(new Date());
}

/*
 * Der „Heute“-Knopf im Kopf des Panels bleibt immer sichtbar. Volle
 * Pillen-Optik mit blauer Schrift bekommt er nur am heutigen Tag und nur,
 * solange die Jetzt-Linie im sichtbaren Ausschnitt steht; sonst bleibt er
 * zurückhaltend im Hintergrund (styles/calendar.css, Klasse .cal-today).
 */
function updateTodayPill() {
  setTodayActive(isOnToday() && nowLineVisible());
}

/*
 * Zwei Stufen beim Scrollen: Solange die Seite noch nicht ganz oben
 * angekommen ist, rollt ein Wisch im Raster die ganze Seite — Titel, Monat
 * und Streifen wandern nach oben, bis der Streifen unter der Suchleiste
 * einrastet. Erst danach darf das Raster in sich selbst rollen.
 * Dafür ist es vorher gesperrt (styles/calendar-panel.css, Klasse is-free);
 * gesperrt heißt nur: kein eigenes Scrollen — sein Stand bleibt erhalten.
 */
function updateGridLock() {
  if (!dom.calPanel.classList.contains("is-grid")) return;
  const page = dom.content;
  const atEnd = page.scrollTop >= page.scrollHeight - page.clientHeight - 1;
  dom.calPanel.classList.toggle("is-free", atEnd);
}

/* Beim Scrollen im Raster oder auf der Seite kann die Jetzt-Linie in den
   sichtbaren Ausschnitt hinein- oder herauslaufen — die Optik des Knopfes
   zieht dann sofort nach. An anderen Tagen gibt es keine Jetzt-Linie: dann
   gar nicht erst messen. */
function onScroll() {
  if (!isViewActive("calendar")) return;
  updateGridLock();
  if (!isOnToday()) return;
  setTodayActive(nowLineVisible());
}

/* Die Jetzt-Linie läuft nur, solange die Kalenderseite offen ist. */
function startTick() {
  if (tickTimer) return;
  tickTimer = setInterval(moveNowLine, tickSeconds * 1000);
}

function stopTick() {
  clearInterval(tickTimer);
  tickTimer = null;
}

/*
 * „Kalender“ unten noch einmal antippen: zuerst wie der „Heute“-Knopf —
 * heutiger Tag, die Jetzt-Linie gut sichtbar —, steht sie schon im Bild, rollt
 * die Seite nach oben und Titel, Monat und Streifen rasten wieder ein.
 */
function onReselect() {
  const grid = state.prefs.calendar.mode === "grid";
  /* Die Liste hat keine Jetzt-Linie: dort nur nach oben rollen, oben dann „Heute“. */
  if (grid && !(isOnToday() && nowLineVisible())) {
    goToday();
    return;
  }
  if (dom.content.scrollTop > 1) dom.content.scrollTo({ top: 0, behavior: "smooth" });
  else goToday();
}

/*
 * In der Fläche: Spalte wechseln, einen Tag der Woche oder des Monats öffnen,
 * im Monat einen Tag wählen oder eine leere Stunde antippen, um dort einen
 * Termin anzulegen (in der Woche an dem Tag ihrer Spalte).
 */
function onPanelClick(event) {
  const seg = event.target.closest("[data-seg]");
  if (seg) {
    setSegment(seg.dataset.seg);
    return;
  }
  if (event.target.closest("[data-open-entry]")) return;
  const day = event.target.closest("[data-cw-day]");
  if (day) {
    ui.calendarDay = day.dataset.cwDay;
    switchDeskView("day");
    return;
  }
  const cell = event.target.closest("[data-cm-day]");
  if (cell) {
    goToDay(cell.dataset.cmDay);
    return;
  }
  const hour = event.target.closest("[data-hour]");
  if (!hour) return;
  const date = hour.dataset.day || ui.calendarDay;
  emit(events.composerRequested, { date, time: `${pad2(Number(hour.dataset.hour))}:00` });
}

/* Am Desktop die Ansicht wechseln; die Seite steht danach wieder oben. */
function switchDeskView(id) {
  setDeskView(id);
  dom.content.scrollTop = 0;
  renderCalendar(true);
}

/* Die Pfeile blättern um das, was gerade zu sehen ist: einen Tag, eine Woche, einen Monat. */
function stepDeskView(direction) {
  const wide = deskView();
  if (wide === "month") shiftMonth(direction);
  else if (wide === "week") shiftWeeks(direction);
  else goToDay(dayKey(addDays(parseDay(ui.calendarDay), direction)));
}

/* Klicks in der Werkzeugzeile am Desktop. */
function onToolbarClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  const { calView, calStep, calToday, calPicker, calAdd } = target.dataset;
  if (calView) switchDeskView(calView);
  else if (calStep) stepDeskView(Number(calStep));
  else if (calToday) goToday();
  else if (calPicker) openDatePicker("date");
  else if (calAdd) emit(events.createRequested, "termin");
}

/* Neue Fenstergröße: das Raster (Tag oder Woche) misst seine Höhe neu. */
function onResize() {
  if (!isViewActive("calendar")) return;
  const wide = deskView();
  if (wide === "month" || (wide !== "week" && state.prefs.calendar.mode !== "grid")) return;
  if (wide === "week") sizeWeek();
  else sizeGrid();
  updateGridLock();
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  setNavRedraw(renderCalendar);
  setGestureRedraw(renderCalendar);
  initCalendarGestures();

  initCalendarSettings();
  /* Das Datum unter „Kalender“ öffnet das Blatt „Datum“ mit den drei Rollen. */
  dom.calMonthBtn.addEventListener("click", () => openDatePicker("date"));
  dom.calPanel.addEventListener("click", onPanelClick);
  toolbarElement().addEventListener("click", onToolbarClick);
  /* Nur auf der Fläche unter dem Streifen: dort blättert waagerechtes Wischen
     schon Wochen um. Das Stundenraster hat keine Tabs. */
  initPillSwipe(dom.calPanel, {
    order: calendarSegments.map((item) => item.id),
    current: () => state.prefs.calendar.seg,
    select: setSegment,
    enabled: () => state.prefs.calendar.mode !== "grid",
  });
  dom.content.addEventListener("scroll", onScroll, { passive: true });
  dom.calPanel.addEventListener("scroll", onScroll, { passive: true });
  /* Dreht sich das Gerät oder ändert sich die Fensterhöhe, passt die Höhe des
     Rasters nicht mehr: neu messen. */
  window.addEventListener("resize", onResize);
  /* Über die Breitengrenze: Werkzeugzeile und Woche kommen oder gehen. */
  onDeskChange(() => {
    if (isViewActive("calendar")) renderCalendar(true);
  });

  on(events.viewOpened, (name) => {
    if (name !== "calendar") {
      stopTick();
      return;
    }
    /* Beim Öffnen steht die Seite wieder ganz oben: Titel, Monat, Streifen
       und die drei Knöpfe sind vollständig zu sehen. Die Uhrzeit sucht sich
       das Raster in sich selbst. */
    dom.content.scrollTop = 0;
    renderCalendar(true);
    startTick();
  });
  on(events.dataChanged, () => {
    if (isViewActive("calendar")) renderCalendar();
  });
  registerReselect("calendar", onReselect);

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("calendar")) {
    dom.content.scrollTop = 0;
    renderCalendar(true);
    startTick();
  }
}

init();
