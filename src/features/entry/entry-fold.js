/*
 * Der Reiter „Inhalt“ einer Eintragsseite endet mit der Karte „Details“
 * (entry-details.js). Beim Öffnen schaut ihr Kopf — „Details“ und das
 * Ketten-Symbol — immer gerade über der Navigation hervor; der Rest der Karte
 * liegt eine Ebene darunter und kommt beim Scrollen:
 *
 * - Kein oder kurzer Text: die Fläche darüber wird so hoch, dass die Karte
 *   trotzdem unten steht. Ein Tipp in diese Fläche schreibt am Textende
 *   weiter (src/ui/write-tap.js).
 * - Langer Text: er endet dort und läuft weich aus, darunter „Mehr anzeigen“.
 *   Ausgeklappt steht am Textende „Weniger anzeigen“. Jede Seite beginnt beim
 *   Öffnen eingeklappt; wer in den Text tippt, klappt ihn von selbst aus,
 *   damit beim Schreiben nichts verdeckt ist.
 * - Zeichnung: die Zeichenfläche ist genau so hoch, dass unter ihr die
 *   Werkzeugleiste und darunter der Kopf der Karte Platz haben.
 * - Ein Videoplayer im Text (src/ui/video-player.js) klappt den Text aus,
 *   damit er nicht unter dem Auslaufen liegt.
 *
 * Kennzahlen und Abschnitte der Karte erscheinen erst, wenn sie beim
 * Hochscrollen über der Navigation auftauchen. Beim Öffnen liegt unter der
 * Navigation darum nur die leere Kartenfläche — keine halben Zeilen neben
 * oder unter ihr.
 *
 * Dafür liegen Text und Zeichenfläche in einem gemeinsamen Rahmen
 * (.entry-fold), den diese Datei beim Start um beide legt. Gemessen wird nur,
 * wenn sich wirklich etwas ändert (Seite öffnen, Pille wechseln, Größe von
 * Titel, Text oder Anzeigefläche), nie beim Scrollen.
 *
 * Die Bildschirmtastatur verschiebt nichts davon. Wo die Navigation liegt
 * und wann die Kennzahlen einblenden, misst src/ui/details-peek.js — dieselbe
 * Rechnung gilt für die Karte eines Arbeitsbereichs.
 * Pfad: src/features/entry/entry-fold.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * PEEK_BELOW_HEAD_PX -> so viel der Karte ist unter ihrem Kopf noch zu sehen, bevor die Navigation beginnt
 *                       (0: die Navigation schließt direkt an den Kopf an)
 * MIN_ROOM_PX        -> kleinste Höhe für Text oder Zeichenfläche, auch bei offener Tastatur
 * moreLabel / lessLabel -> Beschriftung des Knopfs unter dem Text
 *
 * Aussehen (Auslaufen des Textes, Knopf) in styles/entry-details.css.
 *
 * Am Desktop mit rechter Spalte (ab 1280px) gilt nichts davon: die Details
 * stehen rechts (entry-rail.js), der Text bleibt ganz. Nur die Zeichenfläche
 * bekommt dort eine Höhe: sie reicht bis zum Seitenende, darunter stehen die
 * Werkzeugleiste und der Freiraum am Seitenende (--tab-space in styles/tokens-desk.css).
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { cssNumber } from "../../core/css-vars.js";
import { isRailShown } from "../../ui/desk-mode.js";
import { coveredFrom, revealWatcher } from "../../ui/details-peek.js";
import { isViewActive } from "../../ui/views.js";
import { detailsCard } from "./entry-details.js";

const PEEK_BELOW_HEAD_PX = 0;
const MIN_ROOM_PX = 120;
const moreLabel = "Mehr anzeigen";
const lessLabel = "Weniger anzeigen";

let fold = null;
let more = null;
/* Ausgeklappt? Beginnt bei jeder geöffneten Seite eingeklappt. */
let expanded = false;
/* Blendet Kennzahlen und Abschnitte ein, sobald sie über der Navigation
   auftauchen (src/ui/details-peek.js) — angelegt beim ersten Messen */
let watchReveal = null;

/*
 * Höhe der Zeichenfläche am Desktop mit rechter Spalte: bis zum unteren Rand
 * der Seite, abzüglich Werkzeugleiste und Freiraum am Seitenende. Ohne diese
 * Höhe bliebe die Leinwand bei ihrer Grundhöhe von 150px stehen.
 */
function railDrawRoom() {
  const foldRect = fold.getBoundingClientRect();
  const top = foldRect.top + dom.content.scrollTop;
  const tools = dom.drawTools.getBoundingClientRect().bottom - foldRect.bottom;
  const bottom = dom.content.getBoundingClientRect().bottom - cssNumber("--tab-space", 64);
  return Math.max(MIN_ROOM_PX, Math.round(bottom - tools - top));
}

function setMore(show, open) {
  more.hidden = !show;
  if (show) more.innerHTML = `<span>${open ? lessLabel : moreLabel}</span>${icon("chevron", open ? "is-up" : "")}`;
}

/**
 * Text bzw. Zeichenfläche so hoch machen, dass der Kopf der Karte gerade
 * über der Navigation steht — bei ganz nach oben gescrollter Seite gerechnet.
 */
export function layoutEntryFold() {
  const card = detailsCard();
  if (!fold || !card || !isViewActive("entry") || dom.entryPanelNotes.hidden) return;
  const drawing = !dom.drawPad.hidden;
  const head = card.firstElementChild;

  /* Erst alles zurücksetzen, dann messen */
  fold.classList.remove("is-folded");
  fold.style.minHeight = "";
  fold.style.maxHeight = "";
  fold.style.height = "";
  setMore(false);
  /* Am Desktop mit rechter Spalte stehen die Details dort (entry-rail.js):
     der Text bleibt ganz, nichts wird gekürzt oder für die Karte freigehalten. */
  if (isRailShown()) {
    if (drawing) fold.style.height = `${railDrawRoom()}px`;
    return;
  }

  const foldRect = fold.getBoundingClientRect();
  /* Oberkante des Rahmens, als stünde die Seite ganz oben */
  const top = foldRect.top + dom.content.scrollTop;
  /* Was zwischen Rahmen und Karte steht: der Abstand über der Karte, bei
     einer Zeichnung dazu die Werkzeugleiste. Gemessen statt aus dem CSS
     gelesen — so zählt alles mit, was dort gerade steht. Über offsetTop,
     nicht über die Lage auf dem Schirm: gleitet die Karte gerade zurück
     (entry-lift.js), zählte ihre Verschiebung sonst mit. */
  const between = card.offsetTop - fold.offsetTop - fold.offsetHeight;
  const covered = coveredFrom();
  const cardTop = covered - PEEK_BELOW_HEAD_PX - head.offsetHeight;
  if (!watchReveal) watchReveal = revealWatcher(card);
  watchReveal(covered);
  const room = Math.max(MIN_ROOM_PX, Math.round(cardTop - between - top));

  if (drawing) {
    fold.style.height = `${room}px`;
    return;
  }

  const overflow = dom.entryBody.offsetHeight > room;
  if (overflow && !expanded) {
    setMore(true, false);
    fold.classList.add("is-folded");
    fold.style.maxHeight = `${Math.max(MIN_ROOM_PX, room - more.offsetHeight)}px`;
    return;
  }
  /* Ausgeklappt oder kurz genug: nichts abschneiden, kurzer Text bekommt die freie Fläche */
  setMore(overflow, true);
  if (!overflow) fold.style.minHeight = `${room}px`;
}

/** Beim Öffnen einer Seite: wieder eingeklappt beginnen. */
export function resetEntryFold() {
  expanded = false;
}

/** Den Text ausklappen (für den Videoplayer im Text) und neu messen. */
export function expandEntryFold() {
  expanded = true;
  layoutEntryFold();
}

/* Wer Bewegung abgeschaltet hat, springt sofort statt zu gleiten. */
function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/**
 * Den Rahmen um Text und Zeichenfläche legen und den Knopf darunter anlegen.
 * Muss vor dem Baustein-Editor laufen: dessen „/“-Menü hängt sich direkt
 * hinter den Text und gehört damit in denselben Rahmen.
 */
export function initEntryFold() {
  fold = document.createElement("div");
  fold.className = "entry-fold";
  dom.entryBody.before(fold);
  fold.append(dom.entryBody, dom.drawPad);

  more = document.createElement("button");
  more.className = "entry-more";
  more.type = "button";
  more.hidden = true;
  fold.after(more);

  more.addEventListener("click", () => {
    expanded = !expanded;
    layoutEntryFold();
    /* Eingeklappt zurück nach oben, wo Text und Kartenkopf zusammen zu sehen sind */
    if (!expanded) dom.content.scrollTo({ top: 0, behavior: scrollBehavior() });
  });

  /* Schreiben im eingeklappten Text: erst ausklappen, sonst tippt man ins Verdeckte */
  dom.entryBody.addEventListener("focusin", () => {
    if (expanded) return;
    expanded = true;
    layoutEntryFold();
  });

  /* ResizeObserver: neu messen, wenn Titel oder Text höher werden oder die
     Anzeigefläche sich ändert (Drehen, Tastatur) — ohne bei jedem Tastendruck zu rechnen.
     Auch die Leiste unten zählt: öffnet oder schließt dort das Eingabefeld,
     ändert sich ihre Höhe, und die Karte muss wieder an ihre Oberkante rasten.
     Sonst bliebe sie nach „Tastatur zu, dann ✕“ in der Höhe des Eingabefelds hängen. */
  const observer = new ResizeObserver(() => layoutEntryFold());
  [dom.content, dom.entryTitle, dom.entryBody, dom.navShell].forEach((node) => observer.observe(node));

  /* Tastatur zu: am iPhone ändert sich dabei keine Größe, der Beobachter
     schweigt. Neu messen, falls die Seite mit offener Tastatur geöffnet
     wurde und die Lage ohne Tastatur noch nicht kannte. */
  on(events.keyboardClosed, () => layoutEntryFold());
}
