/*
 * Die untere Navigationsleiste und der Knopf oben rechts, der das
 * Einstellungs-Blatt öffnet. Ob die Namen unter den Icons zusätzlich zu sehen
 * sind, wird im Einstellungs-Blatt gewählt (src/features/profile/nav-labels.js)
 * und hier sofort übernommen, ohne dass die Seite neu lädt. Ebenso der
 * Verlauf hinter Leiste und Eingabefeld (Einstellungen › Design,
 * src/data/design-prefs.js, Vorgabe aus).
 * Pfad: src/shell/nav-bar.js
 *
 * Keine anpassbaren visuellen Werte: Höhe und Rundung stehen in
 * styles/navigation.css (--nav-height, --nav-radius, --tab-add-size,
 * --tab-icon-grow).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { navGlowOn } from "../data/design-prefs.js";
import { navLabelsOn } from "../data/nav-labels.js";
import { showTab } from "../ui/router.js";

/** Die Leiste zeigt (oder verbirgt) die Namen unter den Icons entsprechend `on`. */
function applyNavLabels(on) {
  dom.tabBar.classList.toggle("show-labels", on);
}

/** Den Verlauf hinter der Leiste zeigen (styles/navigation.css, .has-nav-glow) oder nicht. */
function applyNavGlow(on) {
  dom.device.classList.toggle("has-nav-glow", on);
}

/** Die vier Seiten-Knöpfe und den Knopf oben rechts anmelden. */
export function initNavBar() {
  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  dom.profileBtn.addEventListener("click", () => {
    load("profile").then((module) => module.open());
  });

  applyNavLabels(navLabelsOn());
  on(events.navLabelsChanged, applyNavLabels);

  applyNavGlow(navGlowOn());
  on(events.navGlowChanged, applyNavGlow);
}
