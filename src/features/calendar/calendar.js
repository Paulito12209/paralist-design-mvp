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
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { openSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";
import { initCalendarGestures, setRedraw as setGestureRedraw } from "./calendar-gestures.js";
import { moveNowLine, renderGrid, scrollToNow } from "./calendar-grid.js";
import { renderList } from "./calendar-list.js";
import {
  goToday,
  setMode,
  setRedraw as setNavRedraw,
  setSegment,
  setSpan,
  shiftMonth,
} from "./calendar-nav.js";
import { cal } from "./calendar-state.js";
import { renderStrip } from "./calendar-strip.js";
import { pad2 } from "../../core/dates.js";

const tickSeconds = 30;

let tickTimer = null;

/**
 * Die ganze Seite neu zeichnen.
 * @param jumpToNow true, wenn die Fläche zur aktuellen Uhrzeit rollen soll.
 */
export function renderCalendar(jumpToNow = false) {
  renderStrip();
  const grid = state.prefs.calendar.mode === "grid";
  dom.calPanel.innerHTML = grid ? renderGrid() : renderList();
  if (jumpToNow && grid) scrollToNow();
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

/* Das Monatsmenü hinter dem Monatsnamen. */
function openMonthMenu() {
  openCtxMenu(dom.calMonthBtn, [
    { icon: "back", label: "Vorheriger Monat", onSelect: () => shiftMonth(-1) },
    { icon: "chevron", label: "Nächster Monat", onSelect: () => shiftMonth(1) },
    { icon: "calendar", label: "Zu heute", onSelect: goToday },
  ]);
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

  dom.calMonthBtn.addEventListener("click", openMonthMenu);
  dom.calModeBtn.addEventListener("click", () =>
    setMode(state.prefs.calendar.mode === "grid" ? "list" : "grid")
  );
  dom.calTodayBtn.addEventListener("click", goToday);
  dom.calSpanBtn.addEventListener("click", openSpanSheet);
  dom.calPanel.addEventListener("click", onPanelClick);

  on(events.viewOpened, (name) => {
    if (name !== "calendar") {
      stopTick();
      return;
    }
    renderCalendar(true);
    startTick();
  });
  on(events.dataChanged, () => {
    if (isViewActive("calendar")) renderCalendar();
  });

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("calendar")) {
    renderCalendar(true);
    startTick();
  }
}

init();
