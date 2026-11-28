/*
 * Die Listenseiten der „OG Version“ (Projekte, Eingang, Favoriten, Ressourcen,
 * Arbeitsbereiche — Nachbau von ScopedPageList in Organi7er): die Zeilen
 * bekommen nachträglich Art unter dem Titel, Zielscheiben-Symbol bei Projekten
 * und bei Aufgaben die runde Checkbox. Das Aussehen als Glaskarte steht in
 * styles/og-list-page.css; die Zeilen selbst zeichnet src/ui/rows.js für alle
 * Fassungen, die Auszeichnung gemeinsam mit den Abschnitten der geöffneten
 * Seite in src/ui/og-rows.js.
 * Pfad: src/features/overview/page-og-list.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/og-list-page.css und
 * styles/tokens-og-detail.css.
 */

import { dom } from "../../core/dom.js";
import { bindOgCheck, isOgVersion, tagOgRows, watchOgRows } from "../../ui/og-rows.js";

/** Beobachter für die Zeilen der Seite anmelden — einmal beim Start, nur in der OG Version. */
export function initPageOgList() {
  if (!isOgVersion()) return;
  watchOgRows(dom.pageBody);
  bindOgCheck(dom.pageBody);
  tagOgRows(dom.pageBody);
}
