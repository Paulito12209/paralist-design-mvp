/*
 * Fassung „Android (Xool-DB)“, Navigationsleiste: das Plus in der Mitte der
 * Leiste öffnet das Anlege-Menü (dasselbe wie der Knopf „Neu“ in „Android“,
 * src/shell/android-fab.js), und der Reiter „Menü“ ganz rechts öffnet ein
 * Blatt von unten mit den Zielen, die in der Leiste keinen Platz mehr haben.
 * In allen anderen Fassungen tut dieser Bereich nichts.
 * Pfad: src/shell/android-xool-nav.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * menuOptions  -> was das Blatt „Menü“ anbietet: Name, Icon und Ziel jeder Zeile
 * fontHref     -> die Schrift der Xool-App (DM Sans), nur in dieser Fassung nachgeladen
 * searchLabel  -> Platzhalter der Suchleiste wie in der Xool-App
 */

import { dom } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { openSheet } from "../ui/sheet.js";
import { isMobileVariant } from "../ui/platform.js";
import { openArchive, showTab } from "../ui/router.js";
import { toggleFabMenu } from "./android-fab.js";

const fontHref = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap";
const searchLabel = "Suche in Paralist";

const menuOptions = [
  { label: "Medien", icon: "photos", onSelect: () => showTab("media") },
  { label: "Archiv", icon: "archive", onSelect: () => openArchive() },
  { label: "Einstellungen", icon: "settings", onSelect: () => load("profile").then((module) => module.open()) },
];

/* Schrift und Platzhalter der Xool-App: nur wer diese Fassung sieht, lädt die Schrift */
function applyXoolLook() {
  if (!isMobileVariant("xool")) return;
  if (!document.querySelector("link[data-xool-font]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    link.dataset.xoolFont = "1";
    document.head.append(link);
  }
  dom.searchInput.placeholder = searchLabel;
}

/** Plus und Menü in der Leiste anmelden, Schrift und Suche der Xool-App setzen. */
export function initAndroidXoolNav() {
  applyXoolLook();
  const plus = document.getElementById("tab-add");

  /* Capture am Elternteil: Das Eingabefeld der iOS-Fassung hängt am selben Knopf
     und soll hier nicht aufgehen. */
  dom.tabBar.addEventListener(
    "click",
    (event) => {
      if (!isMobileVariant("xool") || !event.target.closest(".tab-add")) return;
      event.stopPropagation();
      toggleFabMenu(plus);
    },
    true
  );

  document.getElementById("tab-menu").addEventListener("click", () => {
    if (!isMobileVariant("xool")) return;
    openSheet("Menü", menuOptions);
  });
}
