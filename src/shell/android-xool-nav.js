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
 * menuOptions -> was das Blatt „Menü“ anbietet: Name, Icon und Ziel jeder Zeile
 */

import { dom } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { openSheet } from "../ui/sheet.js";
import { isMobileVariant } from "../ui/platform.js";
import { openArchive, showTab } from "../ui/router.js";
import { toggleFabMenu } from "./android-fab.js";

const menuOptions = [
  { label: "Medien", icon: "photos", onSelect: () => showTab("media") },
  { label: "Archiv", icon: "archive", onSelect: () => openArchive() },
  { label: "Einstellungen", icon: "settings", onSelect: () => load("profile").then((module) => module.open()) },
];

/** Plus und Menü in der Leiste anmelden. */
export function initAndroidXoolNav() {
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
