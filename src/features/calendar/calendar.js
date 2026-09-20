/*
 * Die Kalenderseite. Wird erst beim ersten Öffnen nachgeladen und setzt dann
 * Streifen, Fläche, Knöpfe und Gesten zusammen.
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
import { calendarSpans } from "../../data/config.js";
import { state, ui } from "../../data/state.js";
import { openSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";
import { openDatePicker } from "./calendar-date-picker.js";
import { initCalendarGestures, setRedraw as setGestureRedraw } from "./calendar-gestures.js";
import { moveNowLine, nowLineVisible, renderGrid, scrollToNow, sizeGrid } from "./calendar-grid.js";
import { renderList } from "./calendar-list.js";
import {
  goToday,
  setMode,
  setRedraw as setNavRedraw,
  setSegment,
  setSpan,
} from "./calendar-nav.js";
import { cal } from "./calendar-state.js";
import { renderStrip } from "./calendar-strip.js";
import { dayKey, pad2 } from "../../core/dates.js";

const tickSeconds = 30;

let tickTimer = null;

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
  const grid = state.prefs.calendar.mode === "grid";
  /* is-grid: nur das Stundenraster rollt in sich selbst (styles/calendar-panel.css) */
  dom.calPanel.classList.toggle("is-grid", grid);
  dom.calPanel.innerHTML = grid ? renderGrid() : renderList();
  if (grid) {
    sizeGrid();
    if (jumpToNow) scrollToNow();
    else dom.calPanel.scrollTop = keepScroll;
  } else {
    dom.calPanel.style.height = "";
  }
  /* rAF: die Sichtbarkeit der Jetzt-Linie erst messen, wenn das Rollen im
     Raster übernommen wurde. */
  requestAnimationFrame(updateTodayPill);
}

/* Ob der gewählte Tag der heutige ist. */
function isOnToday() {
  return ui.calendarDay === dayKey(new Date());
}

/*
 * Der „Heute“-Knopf bleibt immer sichtbar. Volle Pillen-Optik mit blauer
 * Schrift bekommt er nur am heutigen Tag und nur, solange die Jetzt-Linie im
 * sichtbaren Ausschnitt steht; sonst bleibt er zurückhaltend im Hintergrund
 * (styles/calendar.css, Klasse .cal-today).
 */
function updateTodayPill() {
  dom.calTodayBtn.classList.toggle("is-on", isOnToday() && nowLineVisible());
}

/* Beim Scrollen im Raster oder auf der Seite kann die Jetzt-Linie in den
   sichtbaren Ausschnitt hinein- oder herauslaufen — die Optik des Knopfes
   zieht dann sofort nach. An anderen Tagen gibt es keine Jetzt-Linie: dann
   gar nicht erst messen. */
function onScroll() {
  if (!isViewActive("calendar") || !isOnToday()) return;
  dom.calTodayBtn.classList.toggle("is-on", nowLineVisible());
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

/* Das Blatt hinter dem Zeitraum-Knopf. */
function openSpanSheet() {
  openSheet(
    "Zeitraum",
    calendarSpans.map((span) => ({
      icon: "calendar",
      label: span.label,
      active: span.id === state.prefs.calendar.span,
      onSelect: () => setSpan(span.id),
    }))
  );
}

/* In der Fläche: Spalte wechseln oder eine leere Stunde antippen, um dort einen Termin anzulegen. */
function onPanelClick(event) {
  const seg = event.target.closest("[data-seg]");
  if (seg) {
    setSegment(seg.dataset.seg);
    return;
  }
  if (event.target.closest("[data-open-entry]")) return;
  const hour = event.target.closest("[data-hour]");
  if (!hour) return;
  emit(events.composerRequested, { date: ui.calendarDay, time: `${pad2(Number(hour.dataset.hour))}:00` });
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  setNavRedraw(renderCalendar);
  setGestureRedraw(renderCalendar);
  initCalendarGestures();

  /* Der Monatsname öffnet das Blatt „Monat und Jahr“ mit den drei Rollen. */
  dom.calMonthBtn.addEventListener("click", openDatePicker);
  dom.calModeBtn.addEventListener("click", () =>
    setMode(state.prefs.calendar.mode === "grid" ? "list" : "grid")
  );
  dom.calTodayBtn.addEventListener("click", goToday);
  dom.calSpanBtn.addEventListener("click", openSpanSheet);
  dom.calPanel.addEventListener("click", onPanelClick);
  dom.content.addEventListener("scroll", onScroll, { passive: true });
  dom.calPanel.addEventListener("scroll", onScroll, { passive: true });
  /* Dreht sich das Gerät oder ändert sich die Fensterhöhe, passt die Höhe des
     Rasters nicht mehr: neu messen. */
  window.addEventListener("resize", () => {
    if (isViewActive("calendar") && state.prefs.calendar.mode === "grid") sizeGrid();
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

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("calendar")) {
    dom.content.scrollTop = 0;
    renderCalendar(true);
    startTick();
  }
}

init();
