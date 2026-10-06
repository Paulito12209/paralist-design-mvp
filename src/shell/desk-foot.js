/*
 * Der Fuß der Seitenleiste am Desktop: eine schlanke Icon-Zeile wie in T3
 * Code — links Einstellungen (⌘,), die Hilfe (öffnet den Dialog aus
 * src/shell/desk-help.js) und der Schalter Hell/Dunkel, gegenüber ganz
 * rechts „Nach Updates suchen“. Die Stufe steht oben neben „Paralist“
 * (src/shell/desk-head.js).
 * Pfad: src/shell/desk-foot.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * STATUS_MS    -> wie lange der Update-Knopf nach dem Nachsehen sein Ergebnis zeigt
 * updateLabels -> was der Hinweis am Update-Knopf je nach Stand sagt
 *
 * Aussehen und Maße stehen in styles/desk-nav-foot.css.
 */

import { emit, events } from "../core/bus.js";
import { escapeHtml, icon } from "../core/html.js";
import { load } from "../core/lazy.js";
import { spokenKeys, withCommand } from "../ui/desk-links.js";
import { openDeskHelp } from "./desk-help.js";
import { keyCap } from "../ui/key-caps.js";

const STATUS_MS = 2500;

const updateLabels = {
  idle: "Nach Updates suchen",
  checking: "Wird gesucht …",
  loading: "Wird geladen …",
  current: "Du hast die neueste Fassung",
  offline: "Kein Netz",
};

let foot = null;
let parts = null;
/* Von src/main.js hereingegeben: { current(), set(theme) } aus src/features/profile/theme.js. */
let theme = null;
let statusTimer = 0;

/* Ein Icon-Knopf mit seinem Hinweis darüber. Kein title: sonst käme der Hinweis doppelt. */
function footButton(action, iconName, label, shortcut = "") {
  const keys = shortcut ? ` aria-keyshortcuts="${escapeHtml(spokenKeys(shortcut))}"` : "";
  const cap = shortcut ? keyCap(shortcut, " desk-kbd-inverse") : "";
  return `
    <button class="desk-foot-btn" type="button" data-foot="${action}" aria-label="${escapeHtml(label)}"${keys}>
      ${icon(iconName)}
      <span class="desk-foot-hint" aria-hidden="true"><span class="desk-foot-hint-text">${escapeHtml(label)}</span>${cap}</span>
    </button>`;
}

function footMarkup() {
  return `
    <div class="desk-foot-group">
      ${footButton("settings", "settings", "Einstellungen", withCommand(","))}
      ${footButton("help", "help", "Hilfe")}
      ${footButton("theme", "moon", "Dunkel einschalten")}
    </div>
    ${footButton("update", "refresh", updateLabels.idle)}`;
}

/* Wirkt gerade Dunkel — selbst gewählt oder vom System? */
function isDark() {
  const chosen = theme ? theme.current() : "system";
  if (chosen === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return chosen === "dark";
}

/* Der Schalter zeigt, wohin er wechselt: im Hellen der Mond, im Dunkeln die Sonne. */
function renderTheme() {
  const dark = isDark();
  const label = dark ? "Hell einschalten" : "Dunkel einschalten";
  parts.theme.querySelector(".icon use").setAttribute("href", `#icon-${dark ? "sun" : "moon"}`);
  parts.theme.setAttribute("aria-label", label);
  parts.theme.querySelector(".desk-foot-hint-text").textContent = label;
}

function toggleTheme() {
  if (!theme) return;
  theme.set(isDark() ? "light" : "dark");
  renderTheme();
}

/* Hinweis und Drehen am Update-Knopf; nach einer Weile wieder der Ausgangstext. */
function showUpdateState(key) {
  const busy = key === "checking" || key === "loading";
  parts.update.classList.toggle("is-busy", busy);
  parts.update.setAttribute("aria-label", updateLabels[key] || updateLabels.idle);
  parts.updateText.textContent = updateLabels[key] || updateLabels.idle;
  parts.update.classList.toggle("is-telling", !busy && key !== "idle");
  clearTimeout(statusTimer);
  if (!busy && key !== "idle") statusTimer = setTimeout(() => showUpdateState("idle"), STATUS_MS);
}

function checkUpdate() {
  if (parts.update.classList.contains("is-busy")) return;
  showUpdateState("checking");
  /* src/shell/update-prompt.js sieht nach; eine neuere Fassung lädt es gleich */
  emit(events.updateRequested, { report: showUpdateState });
}

function onClick(event) {
  const action = event.target.closest("[data-foot]")?.dataset.foot;
  if (action === "settings") load("profile").then((module) => module.openPane("konto"));
  else if (action === "help") openDeskHelp();
  else if (action === "theme") toggleTheme();
  else if (action === "update") checkUpdate();
}

/** Hell/Dunkel auffrischen — nach einer Wahl im Profil. */
export function renderDeskFoot() {
  if (!foot) return;
  renderTheme();
}

/**
 * Die Zeile einmal in den Fuß der Seitenleiste schreiben.
 * @param slot   der Fuß (src/shell/desk-nav-parts.js)
 * @param given  { current, set } für Hell/Dunkel, von src/main.js
 */
export function mountDeskFoot(slot, given = null) {
  if (foot || !slot) return;
  foot = slot;
  theme = given;
  foot.innerHTML = footMarkup();
  parts = {
    theme: foot.querySelector('[data-foot="theme"]'),
    update: foot.querySelector('[data-foot="update"]'),
    updateText: foot.querySelector('[data-foot="update"] .desk-foot-hint-text'),
  };
  foot.addEventListener("click", onClick);
  /* Wechselt das System zwischen Hell und Dunkel, zeigt der Schalter das Gegenteil —
     ebenso nach einer Wahl in Einstellungen › Darstellung (sie setzt data-theme) */
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderTheme);
  new MutationObserver(renderTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  renderDeskFoot();
}
