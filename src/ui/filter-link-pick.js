/*
 * „Eintrag wählen“ im Blatt „Filtern“: ein Auswahl-Blatt (src/ui/sheet.js)
 * mit Pillen — „Arbeitsbereiche“ und je Typ eine — und einem Haken je
 * Eintrag. Es bleibt nach jedem Tipp offen, damit man mehrere nacheinander
 * wählen kann, und behält dabei seine Rolllage; das Filter-Blatt dahinter
 * zeichnet sich bei jeder Wahl neu (der Aufrufer in `onToggle`).
 * Pfad: src/ui/filter-link-pick.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pickTitle -> Überschrift des Blatts
 * emptyText -> Satz, solange es nichts auszuwählen gibt
 *
 * Aussehen: styles/overlays.css und styles/sheet-tabs.css, in der
 * Android-Fassung styles/android-bottom-sheet.css.
 */

import { dom } from "../core/dom.js";
import { linkPickTabs } from "../data/link-filter-options.js";
import { openSheet } from "./sheet.js";

const pickTitle = "Verknüpft mit";
const emptyText = "Noch nichts da, womit sich etwas verknüpfen ließe.";

/*
 * Blatt zeichnen. `keepScroll`: nach einem Haken bleibt die Liste, wo sie war —
 * sonst spränge sie bei jedem Haken nach oben.
 */
function show({ scope, getRefs, onToggle }, tab, keepScroll) {
  const tabs = linkPickTabs(scope);
  const current = tabs.find((item) => item.id === tab) || tabs[0];
  const scrolled = keepScroll && !dom.sheet.hidden ? dom.sheetOptions.scrollTop : 0;
  const refs = getRefs();
  const rerender = () => show({ scope, getRefs, onToggle }, current.id, true);
  const options = current
    ? current.items.map((item) => ({
        label: item.label,
        icon: item.icon,
        active: refs.includes(item.ref),
        stay: true,
        onSelect: () => {
          onToggle(item.ref);
          rerender();
        },
      }))
    : [{ note: true, label: emptyText }];
  openSheet(pickTitle, options, {
    tabs: tabs.length ? tabs.map((item) => ({ id: item.id, label: item.label })) : undefined,
    tab: current ? current.id : undefined,
    onTab: (id) => show({ scope, getRefs, onToggle }, id, false),
  });
  if (scrolled) dom.sheetOptions.scrollTop = scrolled;
}

/**
 * Das Blatt öffnen.
 * @param scope    "task" oder "project" — was die Liste anbietet
 * @param getRefs  liefert die gerade gewählten Verweise (immer frisch)
 * @param onToggle bekommt den Verweis, der an- oder abgewählt wurde
 */
export function openLinkPick({ scope, getRefs, onToggle }) {
  show({ scope, getRefs, onToggle }, undefined, false);
}
