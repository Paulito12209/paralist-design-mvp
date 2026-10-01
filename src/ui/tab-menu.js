/*
 * Das Menü beim Halten eines Reiters (Tabs der Arbeitsbereiche, Ansichten der
 * Aufgaben und der Projekte). In der Android-Fassung kommt es wie in Google
 * Tasks als Blatt von unten über die ganze Breite, ohne Titel (src/ui/sheet.js);
 * sonst als kleines Menü neben dem Reiter (src/ui/ctx-menu.js).
 * Pfad: src/ui/tab-menu.js
 *
 * Keine anpassbaren visuellen Werte: das Blatt steht in
 * styles/android-bottom-sheet.css, das kleine Menü in styles/overlays.css.
 */

import { openCtxMenu } from "./ctx-menu.js";
import { isMobileOs } from "./platform.js";
import { openSheet } from "./sheet.js";

/** Menü eines Reiters öffnen; `options` wie bei openCtxMenu und openSheet. */
export function showTabMenu(pill, options) {
  if (isMobileOs("android")) openSheet("", options);
  else openCtxMenu(pill, options);
}
