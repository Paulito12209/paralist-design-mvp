/*
 * Die untere Navigationsleiste und der Profil-Knopf oben rechts.
 * Pfad: src/shell/nav-bar.js
 *
 * Keine anpassbaren visuellen Werte: Höhe und Rundung stehen in
 * styles/navigation.css (--nav-height, --nav-radius, --tab-add-size).
 */

import { dom } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { showTab } from "../ui/router.js";

/** Die vier Seiten-Knöpfe und den Profil-Knopf anmelden. */
export function initNavBar() {
  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  dom.profileBtn.addEventListener("click", () => {
    load("profile").then((module) => module.open());
  });
}
