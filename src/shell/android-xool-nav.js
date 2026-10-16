/*
 * Fassung „Android (Xool-DB)“, Navigationsleiste: das Plus in der Mitte der
 * Leiste öffnet das Anlege-Blatt (src/shell/android-xool-create.js), und der
 * Reiter „Menü“ ganz rechts öffnet die Seitenleiste von rechts
 * (src/shell/android-xool-drawer.js).
 * In allen anderen Fassungen tut dieser Bereich nichts.
 * Pfad: src/shell/android-xool-nav.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * fontHref     -> die Schrift der Xool-App (DM Sans), nur in dieser Fassung nachgeladen
 * searchLabel  -> Platzhalter der Suchleiste wie in der Xool-App
 *
 * Der Regler (Icon „tune“) trägt in dieser Fassung überall das Zeichen „sliders“ (zwei Striche
 * mit Kreisen) — in Kalender, Aufgaben und Übersicht gleich (swapReglerIcon).
 */

import { dom } from "../core/dom.js";
import { isMobileVariant } from "../ui/platform.js";
import { initXoolCreate, toggleXoolCreate } from "./android-xool-create.js";
import { initXoolDrawer, openXoolDrawer } from "./android-xool-drawer.js";

const fontHref = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap";
const searchLabel = "Suche in Paralist";

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

/* Das Zeichen des Reglers tauschen: das Symbol „tune“ bekommt den Inhalt von „sliders“.
   Die Icon-Sammlung kommt nachgeladen (src/shell/sprite.js); bis sie da ist, wird gewartet. */
function swapReglerIcon() {
  /* Die Symbole liegen in der nachgeladenen Sammlung, nicht in index.html */
  const symbol = (name) => document.getElementById(`icon-${name}`);
  const swap = () => {
    const tune = symbol("tune");
    const sliders = symbol("sliders");
    if (!tune || !sliders) return false;
    tune.innerHTML = sliders.innerHTML;
    tune.setAttribute("fill", "none");
    return true;
  };
  if (swap()) return;
  const watcher = new MutationObserver(() => {
    if (swap()) watcher.disconnect();
  });
  watcher.observe(document.body, { childList: true, subtree: true });
}

/** Plus und Menü in der Leiste anmelden, Schrift und Suche der Xool-App setzen. */
export function initAndroidXoolNav() {
  applyXoolLook();
  if (isMobileVariant("xool")) swapReglerIcon();
  initXoolCreate();
  initXoolDrawer();
  /* Capture am Elternteil: Das Eingabefeld der iOS-Fassung hängt am selben Knopf
     und soll hier nicht aufgehen. */
  dom.tabBar.addEventListener(
    "click",
    (event) => {
      if (!isMobileVariant("xool") || !event.target.closest(".tab-add")) return;
      event.stopPropagation();
      toggleXoolCreate();
    },
    true
  );

  document.getElementById("tab-menu").addEventListener("click", () => {
    if (!isMobileVariant("xool")) return;
    openXoolDrawer();
  });
}
