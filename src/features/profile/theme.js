/*
 * Darstellung: Hell, Dunkel oder wie das System. Die Liste steht im
 * Einstellungs-Blatt hinter dem Knopf oben rechts — geklickt wird sie dort
 * (src/features/profile/profile.js), hier entsteht nur ihr Markup. Die Wahl
 * wird gespeichert und in index.html schon vor dem ersten Bild angewendet,
 * damit beim Laden nichts aufblitzt.
 * Pfad: src/features/profile/theme.js
 *
 * Keine anpassbaren visuellen Werte: die beiden Farbsätze stehen in
 * styles/tokens.css, das Aussehen der Liste in styles/settings.css.
 */

import { clearCssCache } from "../../core/css-vars.js";
import { icon } from "../../core/html.js";
import { readText, storageKeys, writeText } from "../../core/storage.js";
import { themes } from "../../data/config.js";

/** Die gewählte Darstellung: "light", "dark" oder "system". */
export function currentTheme() {
  const saved = readText(storageKeys.theme);
  return saved === "light" || saved === "dark" ? saved : "system";
}

/** Die Darstellung anwenden. Ohne feste Wahl entscheidet das System. */
export function applyTheme(theme) {
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  clearCssCache();
}

/** Die drei Zeilen als HTML; der Haken steht bei der gewählten Darstellung. */
export function themeListMarkup() {
  const active = currentTheme();
  const rows = themes
    .map(
      (theme) => `
        <button class="settings-row${theme.id === active ? " is-active" : ""}" type="button" data-theme-option="${theme.id}">
          ${icon(theme.icon)}
          <span>${theme.label}</span>
          ${icon("check", "settings-check")}
        </button>
      `
    )
    .join("");
  return `<div class="settings-group">${rows}</div>`;
}

/** Eine Darstellung wählen und merken. Das Blatt zeichnet sich danach selbst neu. */
export function setTheme(theme) {
  /* "system" heißt: keine eigene Wahl gespeichert. */
  writeText(storageKeys.theme, theme === "system" ? "" : theme);
  applyTheme(theme);
}
