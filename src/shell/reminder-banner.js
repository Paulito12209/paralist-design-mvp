/*
 * Die Erinnerung als Banner von oben — wie eine Benachrichtigung unter
 * Android, nur in der Optik der App. Links das Icon der Kategorie (beim
 * Arbeitsbereich sein eigenes), daneben
 * der Titel und „Erinnerung“ bzw. „Fällig: Heute, 14:00“, rechts ein Knopf:
 * bei Aufgabe, Projekt und Termin ein Haken (setzt „Erledigt“, mit der
 * Meldung „Rückgängig“ unten), sonst ein ✕ (zur Kenntnis genommen).
 *
 * Schließen geht auf drei Wegen: der Knopf, ein Tipp auf den Text (öffnet den
 * Eintrag) oder nach oben wischen. Ohne Zutun geht das Banner nach
 * AUTO_HIDE_MS von selbst; solange der Finger darauf liegt, steht die Zeit.
 * Es hat immer dieselbe Höhe (eine Titelzeile mit „…“), darum genügt eine
 * feste Zeit. Mehrere fällige Erinnerungen kommen nacheinander, älteste
 * zuerst — nie zwei übereinander.
 *
 * Eine Erinnerung ist verbraucht, sobald ihr Banner erscheint
 * (consumeReminder in src/data/reminders.js) — so meldet sie sich auch nach
 * einem Neuladen nicht doppelt. War die App zu, kommen die verpassten beim
 * nächsten Öffnen. Der Zeitgeber läuft nur, solange eine Erinnerung aussteht,
 * und wartet höchstens CHECK_EVERY_MS; beim Zurückkehren in die App schaut
 * src/shell/lifecycle.js zusätzlich nach (checkReminders).
 * Pfad: src/shell/reminder-banner.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * AUTO_HIDE_MS   -> wie lange das Banner ohne Zutun stehen bleibt
 * CHECK_EVERY_MS -> längste Pause zwischen zwei Blicken auf fällige Erinnerungen
 * SWIPE_CLOSE_PX -> wie weit man nach oben wischen muss, damit es geht
 * DRAG_START_PX  -> ab welcher Strecke ein Tipp als Wischen gilt
 * LEAVE_MS       -> wie lange das Wegschieben nach oben dauert (wie --toast-anim)
 *
 * Aussehen in styles/reminder-banner.css.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { dayClock } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { typeIcon, xpItemStyle } from "../data/config.js";
import { isTaskDone, isTimeType } from "../data/config-tasks.js";
import { findEntry, findWorkspace, workspaceColor, workspaceIcon, workspaceLabel } from "../data/queries.js";
import { consumeReminder, dueReminders, dueTime, isWorkspaceTarget, nextReminderAt } from "../data/reminders.js";
import { openEntryOrFile, openTarget } from "../ui/router.js";
import { toggleTaskFromCheck } from "../ui/task-status.js";

const AUTO_HIDE_MS = 12000;
const CHECK_EVERY_MS = 30000;
const SWIPE_CLOSE_PX = 32;
const DRAG_START_PX = 4;
const LEAVE_MS = 260;

let host = null;
/* Was das Banner gerade zeigt: { kind: "entry" | "workspace", id } — oder null */
let shown = null;
let checkTimer = 0;
let hideTimer = 0;
/* Restzeit bis zum Verschwinden — der Finger auf dem Banner hält sie an */
let remaining = 0;
let hideStarted = 0;
/* Wischen nach oben: wo der Finger aufsetzte, wie weit er zog */
let dragStart = null;
let dragged = 0;

/* Nebenzeile: bei einer Fälligkeit, wann sie ist; sonst schlicht „Erinnerung“ */
function noteOf(entry) {
  const due = isTimeType(entry.type) ? dueTime(entry) : null;
  if (due === null) return "Erinnerung";
  return `${entry.type === "termin" ? "Termin" : "Fällig"}: ${dayClock(due)}`;
}

function ensureHost() {
  if (host) return host;
  host = document.createElement("div");
  host.className = "reminder-host";
  host.hidden = true;
  host.addEventListener("click", onClick);
  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);
  /* Wie das Update-Fenster direkt im Gerät: so liegt es über jeder Seite und jedem Blatt */
  dom.device.append(host);
  return host;
}

/* Titel, Icon und Farbe — ein Arbeitsbereich hat keinen Typ, aber sein eigenes Icon */
function lookOf(item, isWorkspace) {
  if (isWorkspace) return { title: workspaceLabel(item), icon: workspaceIcon(item), color: workspaceColor() };
  return { title: item.title || "Ohne Titel", icon: typeIcon(item.type), color: xpItemStyle(item.type).color };
}

function show(entry) {
  const element = ensureHost();
  const isWorkspace = isWorkspaceTarget(entry);
  const done = !isWorkspace && isTimeType(entry.type);
  const look = lookOf(entry, isWorkspace);
  shown = { kind: isWorkspace ? "workspace" : "entry", id: entry.id };
  /* role="status": Sprachausgaben lesen die Erinnerung vor, ohne sie anzuspringen */
  element.innerHTML = `
    <div class="reminder-banner" role="status">
      <button class="reminder-open" type="button" aria-label="${escapeHtml(`${look.title} öffnen`)}">
        <span class="reminder-icon" style="color:${look.color}">${icon(look.icon)}</span>
        <span class="reminder-text">
          <span class="reminder-title">${escapeHtml(look.title)}</span>
          <span class="reminder-note">${escapeHtml(isWorkspace ? "Erinnerung" : noteOf(entry))}</span>
        </span>
      </button>
      <button class="reminder-act${done ? " is-done" : ""}" type="button" data-reminder-act aria-label="${done ? "Erledigt" : "Schließen"}">
        ${icon(done ? "check-circle" : "close")}
      </button>
    </div>`;
  element.classList.remove("is-leaving");
  element.style.transform = "";
  element.hidden = false;
  /* Sofort verbraucht: sie meldet sich nie ein zweites Mal */
  consumeReminder(entry);
  remaining = AUTO_HIDE_MS;
  resumeHide();
}

/* Das Banner nach oben wegschieben; danach kommt die nächste, falls eine wartet */
function hide() {
  if (!host || host.hidden || host.classList.contains("is-leaving")) return;
  clearTimeout(hideTimer);
  host.classList.add("is-leaving");
  host.style.transform = "";
  setTimeout(() => {
    host.hidden = true;
    host.classList.remove("is-leaving");
    shown = null;
    checkReminders();
  }, LEAVE_MS);
}

function pauseHide() {
  clearTimeout(hideTimer);
  remaining = Math.max(0, remaining - (Date.now() - hideStarted));
}

function resumeHide() {
  clearTimeout(hideTimer);
  hideStarted = Date.now();
  hideTimer = setTimeout(hide, remaining);
}

function onClick(event) {
  /* Ein Wisch endet auch mit einem Klick — der soll nichts öffnen */
  if (dragged || !shown) return;
  const { kind, id } = shown;
  const entry = kind === "entry" ? findEntry(id) : null;
  if (event.target.closest("[data-reminder-act]")) {
    if (entry && isTimeType(entry.type) && !isTaskDone(entry)) toggleTaskFromCheck(entry.id);
    hide();
    return;
  }
  if (!event.target.closest(".reminder-open")) return;
  hide();
  if (entry) openEntryOrFile(entry.id);
  else if (findWorkspace(id)) openTarget("workspace", id);
}

function onDown(event) {
  dragStart = event.clientY;
  dragged = 0;
  pauseHide();
}

/* Nur nach oben folgt das Banner dem Finger; nach unten bleibt es stehen */
function onMove(event) {
  if (dragStart === null) return;
  const distance = Math.min(0, event.clientY - dragStart);
  if (!dragged && Math.abs(distance) > DRAG_START_PX) {
    /* Erst ab hier festhalten: so folgt das Banner auch, wenn der Finger es
       verlässt, und ein einfacher Tipp trifft weiter seinen Knopf */
    host.setPointerCapture(event.pointerId);
  }
  if (Math.abs(distance) > DRAG_START_PX) dragged = distance;
  host.style.transform = dragged ? `translateY(${distance}px)` : "";
}

function onUp() {
  if (dragStart === null) return;
  dragStart = null;
  if (dragged < -SWIPE_CLOSE_PX) {
    hide();
  } else {
    host.style.transform = "";
    resumeHide();
  }
  /* Den Klick, der dem Loslassen folgt, noch abfangen — danach zählen Tipps wieder */
  setTimeout(() => {
    dragged = 0;
  }, 0);
}

/* Den Zeitgeber auf die nächste Erinnerung stellen — höchstens CHECK_EVERY_MS,
   weil der Browser Zeitgeber im Hintergrund ausbremst. Ohne ausstehende keiner. */
function arm() {
  clearTimeout(checkTimer);
  const next = nextReminderAt();
  if (next === null) return;
  const wait = Math.min(CHECK_EVERY_MS, Math.max(0, next - Date.now()));
  checkTimer = setTimeout(checkReminders, wait);
}

/** Fällige Erinnerung zeigen, falls gerade keine steht, und den Zeitgeber neu stellen. */
export function checkReminders() {
  if (!shown) {
    const [first] = dueReminders();
    if (first) show(first);
  }
  arm();
}

/** Beim Start anmelden: verpasste Erinnerungen kommen gleich, neue werden beobachtet. */
export function initReminderBanner() {
  on(events.dataChanged, arm);
  checkReminders();
}
