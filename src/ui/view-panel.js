/*
 * Die Karte mit den Einstellungen einer Ansicht als eigene Ebene: sie liegt
 * über der Liste, aber unter der Navigation, und hängt fest über ihr. Zwei
 * Lagen: eingeklappt schaut nur der Kopf über der Navigation hervor,
 * ausgeklappt steht die ganze Karte darüber. Die Liste darunter scrollt dabei
 * nicht mit — man sieht die Einstellungen, ohne seinen Platz zu verlieren.
 * Genutzt als Karte „Ansicht“ von der Aufgaben-Seite, von den Projekten
 * auf Übersicht und Seite Projekte und vom Kalender — überall derselbe Titel;
 * jede Seite legt ihre eigene Karte an und füllt sie mit ihren Zeilen. Der
 * Kalender stellt zusätzlich „Heute“ in den Kopf (Parameter `actions`).
 *
 * Umschalten: Tipp auf den Kopf oder das Symbol rechts, oder den Kopf nach
 * oben bzw. unten ziehen. Kopf und Karte werden einmal angelegt; beim
 * Neuzeichnen wird nur der Inhalt ersetzt — so blinkt die Karte nie leer auf.
 * Pfad: src/ui/view-panel.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * DRAG_START_PX -> so weit muss der Finger wandern, bevor aus einem Tipp ein Ziehen wird
 * SNAP_PX       -> so weit muss man ziehen, damit die Karte in die andere Lage springt
 *
 * Aussehen, Lage, Sichtbarkeit je Seite und Geschwindigkeit: styles/tasks-settings.css
 * (--details-head-h, --tasks-panel-gap, --tasks-panel-slide).
 */

import { cssNumber } from "../core/css-vars.js";
import { icon } from "../core/html.js";

const DRAG_START_PX = 6;
const SNAP_PX = 40;

/**
 * Eine Karte anlegen und vor der unteren Leiste einhängen.
 * @param title     Überschrift im Kopf
 * @param className eigene Klasse der Karte — styles/tasks-settings.css zeigt
 *                  sie darüber nur auf ihrer Seite (z.B. „tasks-panel“)
 * @param onClick   bekommt die Klicks im Inhalt — und die auf Knöpfe im Kopf
 * @param actions   HTML für Knöpfe im Kopf links vom Symbol (optional); jeder
 *                  trägt `data-settings`, ein Tipp darauf klappt nicht um
 * @returns { setContent(html), actions } — setContent ersetzt nur den Inhalt,
 *          actions ist der Behälter der Kopf-Knöpfe
 */
export function createViewPanel({ title, className, onClick, actions = "" }) {
  const panel = document.createElement("section");
  panel.className = `details-card view-panel ${className}`;
  panel.setAttribute("aria-label", title);
  panel.innerHTML = `
    <div class="details-head view-panel-head">
      <button class="details-title" type="button">${title}</button>
      <div class="view-panel-actions">${actions}</div>
      <button class="details-link view-panel-toggle" type="button"
        aria-label="${title}" aria-expanded="false">${icon("panel-open")}</button>
    </div>
    <div class="view-panel-body"></div>
  `;
  const body = panel.querySelector(".view-panel-body");
  const head = panel.querySelector(".view-panel-head");
  const toggle = panel.querySelector(".view-panel-toggle");
  const headActions = panel.querySelector(".view-panel-actions");
  let expanded = false;
  /* Beim Ziehen: { y, from, moved, id } — from ist die Lage in px beim Aufsetzen. */
  let drag = null;
  /* Nach einem Ziehen kommt noch ein Klick — der schaltet nicht noch einmal um. */
  let skipClick = false;

  /* Wie weit die Karte eingeklappt nach unten geschoben ist. */
  const collapsedOffset = () => Math.max(0, panel.offsetHeight - cssNumber("--details-head-h", 48));

  const setExpanded = (next) => {
    expanded = next;
    panel.classList.toggle("is-expanded", next);
    toggle.setAttribute("aria-expanded", String(next));
  };

  head.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    /* Ein Knopf im Kopf ist kein Griff: sein Klick soll ihn selbst treffen. */
    if (event.target.closest(".view-panel-actions [data-settings]")) return;
    skipClick = false;
    drag = { y: event.clientY, from: expanded ? 0 : collapsedOffset(), moved: false, id: event.pointerId };
    /* Der Kopf behält den Finger, auch wenn er ihn beim Ziehen gleich verlässt. */
    head.setPointerCapture(event.pointerId);
  });

  head.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dy = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(dy) < DRAG_START_PX) return;
      drag.moved = true;
      panel.classList.add("is-dragging");
    }
    const top = Math.min(collapsedOffset(), Math.max(0, drag.from + dy));
    panel.style.transform = `translateY(${top}px)`;
  });

  const onPointerUp = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dy = event.clientY - drag.y;
    /* Auch ohne Zwischenschritte zählt die Strecke vom Aufsetzen bis zum Loslassen. */
    const moved = drag.moved || Math.abs(dy) >= DRAG_START_PX;
    drag = null;
    if (!moved) return;
    panel.classList.remove("is-dragging");
    panel.style.transform = "";
    if (Math.abs(dy) >= SNAP_PX) setExpanded(dy < 0);
    skipClick = true;
  };
  head.addEventListener("pointerup", onPointerUp);
  head.addEventListener("pointercancel", onPointerUp);

  /* Der ganze Kopf schaltet um — mit festgehaltenem Zeiger trifft der Klick
     den Kopf selbst, nicht den Knopf darin. */
  head.addEventListener("click", (event) => {
    if (event.target.closest(".view-panel-actions [data-settings]")) {
      onClick(event);
      return;
    }
    if (skipClick) {
      skipClick = false;
      return;
    }
    setExpanded(!expanded);
  });
  body.addEventListener("click", onClick);

  /* Vor der unteren Leiste einhängen: dieselbe Ebene wie die Seite, die
     Navigation (styles/navigation.css) bleibt darüber. */
  document.querySelector(".bottom-bar").before(panel);

  return {
    setContent(html) {
      body.innerHTML = html;
    },
    actions: headActions,
  };
}
