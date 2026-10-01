/*
 * Zeilen einer Liste verschieben (Android-Fassung). Hält man eine Zeile lange
 * gedrückt und zieht, hebt src/ui/row-lift.js sie an; ist sie Teil einer Liste
 * mit data-reorder, wandert ihr Platz in der Liste mit dem Finger, die übrigen
 * Zeilen weichen gleitend aus — wie in Material 3 („Lists“, Zeilen umordnen).
 * Beim Loslassen wird die neue Reihenfolge gemerkt (src/data/manual-order.js).
 * In einer Sammlung (Eingang, Favoriten, Ressourcen, Arbeitsbereiche) schaltet
 * das ihre Sortierung auf „Eigene Reihenfolge“; eine Gruppe im Arbeitsbereich
 * oder Projekt folgt ihr einfach.
 *
 * Eine Liste steht als Element mit data-reorder="<Schlüssel>"; ihre Zeilen
 * sind die .swipe-Kinder. Arbeitsbereiche und Einträge lassen sich nur unter
 * ihresgleichen verschieben (Favoriten zeigen beide in einer Liste). Teilt sich
 * ein Schlüssel mehrere Listen (Ressourcen nach Monaten), zählt ihre Folge auf
 * der Seite.
 * Pfad: src/ui/row-reorder.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * slideMs     -> wie lange die übrigen Zeilen zum Ausweichen brauchen (Millisekunden)
 * edgeZone    -> Streifen am oberen und unteren Rand des Inhalts, in dem die Seite beim Ziehen mitrollt (Pixel)
 * edgeSpeed   -> wie schnell sie dort höchstens rollt (Pixel je Bild)
 *
 * Aussehen der angehobenen Zeile und des freien Platzes: styles/android-reorder.css.
 */

import { emit, events } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { collectionSort, manualId, setCollectionSort } from "../data/collection-sorts.js";
import { rowKey, saveManualOrder } from "../data/manual-order.js";
import { isMobileOs } from "./platform.js";

const slideMs = 180;
const edgeZone = 72;
const edgeSpeed = 14;
/* Schlüssel einer Gruppe im Arbeitsbereich beginnen so (src/ui/groups.js) */
const groupPrefix = "g:";

/* Der laufende Zug: { source, list, kind, startNext } — sonst null. */
let session = null;

const wrapOf = (row) => row.closest(".swipe");
const kindOf = (wrap) => (wrap.dataset.workspace ? "w" : "e");
const idOf = (wrap) => wrap.dataset.workspace || wrap.dataset.entry;

/** Lässt sich diese Zeile (das Ziel des langen Drückens) verschieben? */
export function isReorderRow(row) {
  const wrap = row && wrapOf(row);
  return Boolean(wrap && isMobileOs("android") && wrap.parentElement?.matches("[data-reorder]"));
}

/** Zug beginnen: merkt sich den alten Platz, falls der Zug abgebrochen wird. */
export function beginReorder(row) {
  const source = wrapOf(row);
  session = { source, list: source.parentElement, kind: kindOf(source), startNext: source.nextElementSibling };
  source.classList.add("is-reorder-slot");
}

/* Die Zeilen der Liste, die mit der gezogenen tauschen dürfen. */
function peersOf({ source, list, kind }) {
  return [...list.children].filter((el) => el !== source && el.classList.contains("swipe") && kindOf(el) === kind);
}

/* Die Seite rollt mit, wenn der Finger am oberen oder unteren Rand steht. */
function edgeScroll(y) {
  const box = dom.content.getBoundingClientRect();
  const top = box.top + edgeZone - y;
  const bottom = y - (box.bottom - edgeZone);
  const push = top > 0 ? -Math.min(1, top / edgeZone) : bottom > 0 ? Math.min(1, bottom / edgeZone) : 0;
  if (!push) return false;
  const before = dom.content.scrollTop;
  dom.content.scrollTop += push * edgeSpeed;
  return dom.content.scrollTop !== before;
}

/* Die übrigen Zeilen gleiten vom alten zum neuen Platz (FLIP): erst messen,
   dann umsetzen, dann von der alten Lage her ablaufen lassen. */
function slide(peers, move) {
  const before = new Map(peers.map((el) => [el, el.getBoundingClientRect().top]));
  move();
  peers.forEach((el) => {
    const delta = before.get(el) - el.getBoundingClientRect().top;
    if (Math.abs(delta) < 1) return;
    el.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], {
      duration: slideMs,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    });
  });
}

/**
 * Der Finger steht bei `y`: Platz der Zeile nachführen.
 * @returns true, solange die Seite am Rand weiterrollt — dann soll das nächste Bild wieder rufen.
 */
export function updateReorder(y) {
  if (!session) return false;
  const peers = peersOf(session);
  const above = peers.find((el) => {
    const rect = el.getBoundingClientRect();
    return y < rect.top + rect.height / 2;
  });
  /* Vor die erste Zeile unter dem Finger, sonst hinter die letzte */
  const next = above || (peers.length ? peers[peers.length - 1].nextElementSibling : null);
  if (peers.length && session.source.nextElementSibling !== next) {
    slide(peers, () => session.list.insertBefore(session.source, next));
  }
  return edgeScroll(y);
}

/* Die Ids aller Zeilen dieses Schlüssels, von oben nach unten (auch über mehrere Listen). */
function shownKeys(scope) {
  const lists = document.querySelectorAll(`[data-reorder="${scope}"]`);
  return [...lists].flatMap((list) =>
    [...list.children].filter((el) => el.classList.contains("swipe")).map((wrap) => rowKey(kindOf(wrap), idOf(wrap)))
  );
}

/* Merken und die Seite neu zeichnen lassen. */
function persist(scope) {
  const keys = shownKeys(scope);
  if (scope.startsWith(groupPrefix)) {
    saveManualOrder(scope, keys);
    emit(events.dataChanged);
    return;
  }
  /* Steht die Sammlung schon auf „Eigene Reihenfolge“, aber umgekehrt, wird
     rückwärts gemerkt — gezeigt wird dann wieder rückwärts, also wie gesehen. */
  const current = collectionSort(scope);
  const reversed = current.sort === manualId && !current.asc;
  saveManualOrder(scope, reversed ? [...keys].reverse() : keys);
  setCollectionSort(scope, manualId, !reversed);
}

/**
 * Zug beenden.
 * @param commit true: neuen Platz merken; false: Zeile zurück an ihren alten Platz.
 */
export function finishReorder(commit) {
  const current = session;
  session = null;
  if (!current) return;
  current.source.classList.remove("is-reorder-slot");
  const moved = current.source.nextElementSibling !== current.startNext;
  if (!moved) return;
  if (!commit) {
    current.list.insertBefore(current.source, current.startNext);
    return;
  }
  persist(current.list.dataset.reorder);
}
