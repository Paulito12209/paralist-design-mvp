/*
 * Darstellung: Hell, Dunkel oder wie das System. Die Wahl wird gespeichert und
 * in index.html noch vor dem ersten Bild angewendet, damit nichts aufblitzt.
 * Pfad: src/features/settings/theme.js
 *
 * Keine anpassbaren visuellen Werte: die beiden Farbsätze stehen in
 * styles/tokens.css.
 */

import { clearCssCache } from "../../core/css-vars.js";
import { dom } from "../../core/dom.js";
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

/** Die Liste in den Einstellungen zeichnen. */
export function renderThemeOptions() {
  const active = currentTheme();
  dom.themeOptions.innerHTML = themes
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
}

/** Eine Darstellung wählen und merken. */
export function setTheme(theme) {
  /* "system" heißt: keine eigene Wahl gespeichert. */
  writeText(storageKeys.theme, theme === "system" ? "" : theme);
  applyTheme(theme);
  renderThemeOptions();
}

/** Die Einstellungsseite anmelden. */
export function initTheme() {
  dom.themeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-option]");
    if (button) setTheme(button.dataset.themeOption);
  });
  renderThemeOptions();
}
