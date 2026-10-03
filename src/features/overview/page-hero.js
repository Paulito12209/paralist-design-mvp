/*
 * Der große Kopf einer Sammlung (Eingang, Favoriten, Projekte, Ressourcen,
 * Archiv, Arbeitsbereiche, Lesezeichen): oben mittig ein großes Icon in der
 * Farbe der Sammlung, darunter der Titel und ein Satz von höchstens drei
 * Zeilen — wie auf einer iOS-Infoseite, aber ohne Farbverlauf. Von Haus aus
 * an; ausgeschaltet wird er je Sammlung im Menü oben rechts oder unter
 * Einstellungen › App › Design, und die Wahl bleibt gespeichert
 * (src/data/page-heads.js).
 * Pfad: src/features/overview/page-hero.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * Icon, Farbe und Satz je Sammlung: src/data/collections.js (collectionHeads).
 * HEAD_CHOICES -> die beiden Zeilen im Menü: Name und Icon
 * Größen: styles/page-hero.css.
 */

import { el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { collectionHeads } from "../../data/collections.js";
import { headOn, setHeadOn } from "../../data/page-heads.js";

const HEAD_CHOICES = {
  plain: { label: "Einfacher Titel", icon: "text" },
  hero: { label: "Mit Icon und Beschreibung", icon: "image" },
};

/** Schlüssel des Kopfes einer Seite; ein Arbeitsbereich hat keinen (er hat sein Cover). */
function headKey(page) {
  if (!page || page.isWorkspace) return "";
  const key = page.kind || "inbox";
  return collectionHeads[key] ? key : "";
}

/** Icon und Satz um den Titel zeigen oder verstecken — je nach Wahl der Sammlung. */
export function renderPageHero(page) {
  const key = headKey(page);
  const on = headOn(key);
  const head = collectionHeads[key];
  const glyph = el("page-hero-icon");
  const intro = el("page-intro");
  glyph.hidden = !on;
  intro.hidden = !on;
  el("view-page").classList.toggle("has-hero", on);
  if (!on) return;
  glyph.style.setProperty("--hero-color", head.color);
  glyph.innerHTML = icon(head.icon);
  intro.innerHTML = escapeHtml(head.intro);
}

/** Die Menü-Zeilen zum Umschalten; leer, wenn die Seite keinen Kopf kennt. */
export function pageHeroOptions(page, refresh) {
  const key = headKey(page);
  if (!key) return [];
  const choose = (on) => {
    setHeadOn(key, on);
    refresh();
  };
  const on = headOn(key);
  return [
    { ...HEAD_CHOICES.plain, active: !on, onSelect: () => choose(false) },
    { ...HEAD_CHOICES.hero, active: on, onSelect: () => choose(true) },
  ];
}
