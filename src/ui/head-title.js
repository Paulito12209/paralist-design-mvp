/*
 * Titel in der Kopfzeile: ist der große Titel einer Detailseite nach oben
 * weggescrollt, erscheint er klein neben dem Zurück-Pfeil — eine Zeile mit
 * „…“, darunter grau die Art der Seite („Arbeitsbereich“, „Notiz“, …).
 * Pfad: src/ui/head-title.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen steht in styles/details.css
 * (Klassen .head-title, .is-title-shown).
 */

import { dom } from "../core/dom.js";

/**
 * Den Kopfzeilen-Titel für eine Seite anmelden.
 * @param head     die Kopfzeile (.page-head)
 * @param bigTitle der große Titel darunter
 * @param isActive ob die Seite gerade offen ist
 */
export function bindHeadTitle(head, bigTitle, isActive) {
  const update = () => {
    if (!isActive()) return;
    /* Sichtbar, sobald der große Titel ganz hinter der Kopfzeile verschwunden ist */
    const shown = bigTitle.getBoundingClientRect().bottom <= head.getBoundingClientRect().bottom;
    head.classList.toggle("is-title-shown", shown);
  };
  dom.content.addEventListener("scroll", update, { passive: true });
  return update;
}

/** Text des Kopfzeilen-Titels setzen; ohne Titel bleibt er verborgen. */
export function setHeadTitle(head, title, sub) {
  const box = head.querySelector(".head-title");
  if (!box) return;
  box.hidden = !title;
  box.querySelector(".head-title-main").textContent = title || "";
  box.querySelector(".head-title-sub").textContent = sub || "";
  head.classList.remove("is-title-shown");
}
