/*
 * Die Karte mit den Einstellungen einer Ansicht als eigene Ebene: sie liegt
 * über der Liste, aber unter der Navigation, und hängt fest über ihr. Zwei
 * Lagen: eingeklappt schaut nur der Kopf über der Navigation hervor,
 * ausgeklappt steht die ganze Karte darüber. Die Liste darunter scrollt dabei
 * nicht mit — man sieht die Einstellungen, ohne seinen Platz zu verlieren.
 * Genutzt als Karte „Ansicht“ von der Aufgaben-Seite, von den Projekten
 * auf Übersicht und Seite Projekte, von den übrigen Sammlungen
 * (src/features/overview/collection-panel.js) und vom Kalender — überall derselbe Titel;
 * jede Seite legt ihre eigene Karte an und füllt sie mit ihren Zeilen. Der
 * Kalender stellt zusätzlich „Heute“ in den Kopf (Parameter `actions`).
 *
 * Umschalten: Tipp auf den Kopf oder das Symbol rechts, oder die Karte nach
 * oben bzw. unten ziehen — am Kopf wie über den Zeilen. Über den Zeilen wird
 * erst ab DRAG_START_PX gezogen, darunter bleibt es ein Tipp auf die Zeile.
 * Kopf und Karte werden einmal angelegt; beim
 * Neuzeichnen wird nur der Inhalt ersetzt — so blinkt die Karte nie leer auf.
 *
 * Als Blatt von unten (Android-Fassung, styles/android-sheet.css): dort
 * schaut eingeklappt nichts hervor — die Seite stellt stattdessen den Knopf
 * aus viewPanelButton() in ihre Reiterzeile, ein Tipp darauf holt die Karte
 * der offenen Seite herauf. Wie viel eingeklappt hervorschaut, sagt die
 * CSS-Variable --view-panel-peek an der Karte (ohne sie: --details-head-h).
 * Hinter der Karte liegt ein Schleier, der nur im Blatt zu sehen ist. Im Blatt
 * gibt es keinen Knopf im Kopf: Griff, Schleier, Ziehen nach unten und die
 * Zurück-Geste schließen es, wie bei Material 3 „Modal bottom sheet“.
 *
 * Von selbst zu: die Karte ist ein Werkzeug für einen Moment, kein fester
 * Teil der Seite. Sie klappt ein, sobald man sich wieder der Seite zuwendet —
 * ein Tipp oder Scrollen irgendwo außerhalb der Karte (Liste, Pillen, Kopf,
 * Navigation, das Plus zum Anlegen), das Eingabefeld geht auf, oder die
 * Ansicht wechselt (auch durch Browser-Zurück; zurück auf der Seite ist sie
 * dann eingeklappt). Offen bleibt sie, solange man in ihr oder in einem Blatt
 * darüber arbeitet: Sortieren, Filter, Menüs und Hinweise (OVERLAY_SELECTOR)
 * zählen nicht als „außerhalb“. Der Tipp selbst tut danach, was er immer tut.
 * Pfad: src/ui/view-panel.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * DRAG_START_PX -> so weit muss der Finger wandern, bevor aus einem Tipp ein Ziehen wird
 * SNAP_PX       -> so weit muss man ziehen, damit die Karte in die andere Lage springt
 * FLICK_SPEED   -> so schnell (Pixel je Millisekunde) muss ein kurzes Wischen sein,
 *                 damit die Karte auch unter SNAP_PX umspringt
 * SCRIM_CLICK_BLOCK_MS -> so lange nach einem Tipp auf den Schleier wird der Klick
 *                 verworfen, der sonst auf der Seite darunter landen würde
 * OVERLAY_SELECTOR -> Ebenen über der Seite, deren Tipps die Karte offen lassen
 * buttonLabel   -> Vorlesetext und Hinweis des Knopfs, der die Karte heraufholt
 *
 * Aussehen, Lage, Sichtbarkeit je Seite und Geschwindigkeit: styles/tasks-settings.css
 * (--details-head-h, --tasks-panel-gap, --tasks-panel-slide).
 */

import { events, on } from "../core/bus.js";
import { cssNumber } from "../core/css-vars.js";
import { icon } from "../core/html.js";

const DRAG_START_PX = 6;
const SNAP_PX = 40;
const FLICK_SPEED = 0.4;
const SCRIM_CLICK_BLOCK_MS = 500;
const OVERLAY_SELECTOR = '[class*="backdrop"], .toast-host, .slash-menu';
const buttonLabel = "Ansicht";

/* Alle angelegten Karten mit ihrer Funktion zum Einklappen. */
const collapsers = new Set();
/* Bis wann ein Klick nach einem Tipp auf den Schleier verworfen wird. */
let scrimClickUntil = 0;
/* Alle angelegten Karten mit ihrer Funktion zum Aufklappen — für den Knopf in der Reiterzeile. */
const openers = new Map();

function collapseAll() {
  collapsers.forEach((collapse) => collapse());
}

/** Der Knopf, der die Karte der offenen Seite heraufholt (nur im Blatt zu sehen).
    `asFilter`: statt des Kartensymbols die zwei Regler, in der Farbe der Werkzeuge
    neben den Pillen (Projekte-Zeile auf Übersicht und Seite Projekte). */
export function viewPanelButton(asFilter = false) {
  const cls = asFilter ? "view-panel-btn is-filter" : "view-panel-btn";
  return `<button class="${cls}" type="button" data-view-panel-open aria-label="${buttonLabel}" title="${buttonLabel}">${icon(asFilter ? "sliders" : "panel-open")}</button>`;
}

/** Die Karte der offenen Seite aufklappen. Welche das ist, entscheidet das
    Stylesheet (Klassen am body): nur sie nimmt gerade Platz ein. Von außen
    ruft das Filtern in der Werkzeugzeile über den Projekten (src/features/overview/project-card.js). */
export function openViewPanel() {
  openers.forEach((open, panel) => {
    if (panel.getClientRects().length) open();
  });
}

/* Tippt oder scrollt man hier, wendet man sich der Seite zu? Nicht in einer
   Karte, nicht in einem Blatt oder Menü darüber. */
function isOutside(target) {
  return target instanceof Element && target.isConnected && !target.closest(".view-panel") && !target.closest(OVERLAY_SELECTOR);
}

/* Einmal für alle Karten anmelden. pointerdown statt click, damit auch der
   Beginn eines Wischens über die Liste zählt; capture, damit kein Zuhörer
   darunter das Ereignis vorher verschluckt. wheel deckt Mausrad und Trackpad
   am Desktop ab. */
function watchOutside() {
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (isOutside(event.target)) collapseAll();
    },
    true
  );
  document.addEventListener(
    "wheel",
    (event) => {
      if (isOutside(event.target)) collapseAll();
    },
    { capture: true, passive: true }
  );
  on(events.viewWillChange, collapseAll);
  on(events.composerRequested, collapseAll);
  on(events.createRequested, collapseAll);
  /* Der Knopf steht in Zeilen, die beim Zeichnen ersetzt werden — darum ein
     Empfänger für alle. Der pointerdown davor hat schon alles eingeklappt. */
  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-view-panel-open]")) openViewPanel();
  });
  /* Ein Tipp auf den Schleier klappt schon beim Aufsetzen ein; der Schleier
     lässt danach durch, und der Klick beim Loslassen träfe die Zeile darunter
     (z.B. „Projekt hinzufügen“). Der Tipp soll nur schließen — darum wird
     dieser eine Klick verschluckt. capture: vor allen anderen Zuhörern. */
  window.addEventListener(
    "click",
    (event) => {
      if (Date.now() > scrimClickUntil) return;
      scrimClickUntil = 0;
      event.stopPropagation();
      event.preventDefault();
    },
    true
  );
}

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

  /* Wie weit die Karte eingeklappt nach unten geschoben ist. Gemessen nur beim
     Aufsetzen, nicht in jeder Bewegung: --view-panel-peek setzt das Blatt der
     Android-Fassung, sonst gilt die Kopfhöhe. */
  const collapsedOffset = () => {
    const peek = parseFloat(getComputedStyle(panel).getPropertyValue("--view-panel-peek"));
    return Math.max(0, panel.offsetHeight - (Number.isNaN(peek) ? cssNumber("--details-head-h", 48) : peek));
  };

  const setExpanded = (next) => {
    expanded = next;
    panel.classList.toggle("is-expanded", next);
    toggle.setAttribute("aria-expanded", String(next));
  };
  if (!collapsers.size) watchOutside();
  collapsers.add(() => {
    /* Mitten im Ziehen gehört die Karte dem Finger */
    if (expanded && !drag) setExpanded(false);
  });
  openers.set(panel, () => setExpanded(true));

  /* Die ganze Karte ist Griff. Der Kopf hält den Zeiger selbst fest; über
     den Zeilen hält ihn die angetippte Zeile — so erreicht jede Bewegung die
     Karte, auch über der Navigation, und ein Tipp trifft weiter die Zeile.
     (Ein Finger wird ohnehin so festgehalten, die Maus nicht.) */
  panel.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    /* Ein Knopf im Kopf ist kein Griff: sein Klick soll ihn selbst treffen. */
    if (event.target.closest(".view-panel-actions [data-settings]")) return;
    skipClick = false;
    const max = collapsedOffset();
    drag = { y: event.clientY, from: expanded ? 0 : max, max, moved: false, id: event.pointerId, at: event.timeStamp };
    /* Der Kopf behält den Finger, auch wenn er ihn beim Ziehen gleich verlässt. */
    try {
      (head.contains(event.target) ? head : event.target).setPointerCapture(event.pointerId);
    } catch (error) {
      /* Zeiger schon weg (Browser-Geste): die Bewegungen kommen trotzdem über die Karte an */
    }
  });

  panel.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dy = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(dy) < DRAG_START_PX) return;
      drag.moved = true;
      panel.classList.add("is-dragging");
    }
    const top = Math.min(drag.max, Math.max(0, drag.from + dy));
    panel.style.transform = `translateY(${top}px)`;
  });

  const onPointerUp = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dy = event.clientY - drag.y;
    /* Auch ohne Zwischenschritte zählt die Strecke vom Aufsetzen bis zum Loslassen. */
    const moved = drag.moved || Math.abs(dy) >= DRAG_START_PX;
    /* Ein schnelles kurzes Wischen zählt wie ein langes Ziehen — wie bei
       den Blättern in Android. Gemessen über die ganze Geste, nicht je Bewegung. */
    const flick = Math.abs(dy) / Math.max(1, event.timeStamp - drag.at) >= FLICK_SPEED;
    drag = null;
    if (!moved) return;
    panel.classList.remove("is-dragging");
    panel.style.transform = "";
    if (Math.abs(dy) >= SNAP_PX || flick) setExpanded(dy < 0);
    skipClick = true;
  };
  panel.addEventListener("pointerup", onPointerUp);
  panel.addEventListener("pointercancel", onPointerUp);

  /* Nach einem Ziehen kommt noch ein Klick — weder die Zeile darunter noch
     der Kopf sollen ihn bekommen. Capture: vor allen anderen Zuhörern. */
  panel.addEventListener(
    "click",
    (event) => {
      if (!skipClick) return;
      skipClick = false;
      event.stopPropagation();
    },
    true
  );

  /* Der ganze Kopf schaltet um — mit festgehaltenem Zeiger trifft der Klick
     den Kopf selbst, nicht den Knopf darin. */
  head.addEventListener("click", (event) => {
    if (event.target.closest(".view-panel-actions [data-settings]")) {
      onClick(event);
      return;
    }
    setExpanded(!expanded);
  });
  body.addEventListener("click", onClick);

  /* Vor der unteren Leiste einhängen: dieselbe Ebene wie die Seite, die
     Navigation (styles/navigation.css) bleibt darüber. Der Schleier steht
     direkt davor; ein Tipp auf ihn zählt als „außerhalb“ und klappt ein. */
  const scrim = document.createElement("div");
  scrim.className = "view-panel-scrim";
  scrim.setAttribute("aria-hidden", "true");
  scrim.addEventListener("pointerdown", () => {
    scrimClickUntil = Date.now() + SCRIM_CLICK_BLOCK_MS;
  });
  document.querySelector(".bottom-bar").before(scrim, panel);

  return {
    setContent(html) {
      body.innerHTML = html;
    },
    actions: headActions,
  };
}
