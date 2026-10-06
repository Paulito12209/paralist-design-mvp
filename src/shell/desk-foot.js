/*
 * Der Fuß der Seitenleiste am Desktop: eine schlanke Icon-Zeile wie in T3
 * Code — links Einstellungen (⌘,), die Stufen-Anzeige (öffnet Fortschritt
 * und Statistiken; derselbe Knopf wie am Handy, hierher umgesetzt) und der
 * Schalter Hell/Dunkel, gegenüber ganz rechts „Nach Updates suchen“.
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
import { dom } from "../core/dom.js";
import { formatNumber } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { load } from "../core/lazy.js";
import { levelInfo, totalXp } from "../data/xp.js";
import { spokenKeys, withCommand } from "../ui/desk-links.js";
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
      <span class="desk-foot-level" data-foot-slot="level"></span>
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
  else if (action === "theme") toggleTheme();
  else if (action === "update") checkUpdate();
}

/* Der Hinweis an der Stufe: welche Stufe und wie weit noch. */
function renderLevelHint() {
  const xp = totalXp();
  const info = levelInfo(xp);
  const text = `Stufe ${info.level} · noch ${formatNumber(Math.max(0, info.to - xp))} XP`;
  if (parts.levelHint.textContent !== text) parts.levelHint.textContent = text;
}

/**
 * Die Stufen-Anzeige (#level-btn, gezeichnet von src/shell/level-gauge.js)
 * steht am Desktop im Fuß, unter 1024px kehrt sie an den Anfang der
 * Kopfzeile des Handys zurück. Ein Knopf an zwei Orten statt zwei Knöpfen:
 * Skala, Stufen-Meldung und Klick bleiben eins.
 */
export function placeLevelButton(desk) {
  if (!foot) return;
  const button = dom.levelBtn;
  if (desk && button.parentElement !== parts.level) {
    parts.level.append(button);
    button.append(parts.levelHint);
  } else if (!desk && button.parentElement === parts.level) {
    parts.levelHint.remove();
    document.querySelector(".top-bar").prepend(button);
  }
}

/** Stufen-Hinweis und Hell/Dunkel auffrischen — nach Punkten und nach einer Wahl im Profil. */
export function renderDeskFoot() {
  if (!foot) return;
  renderLevelHint();
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
    level: foot.querySelector('[data-foot-slot="level"]'),
    levelHint: document.createElement("span"),
  };
  parts.levelHint.className = "desk-foot-hint desk-level-hint";
  parts.levelHint.setAttribute("aria-hidden", "true");
  foot.addEventListener("click", onClick);
  /* Wechselt das System zwischen Hell und Dunkel, zeigt der Schalter das Gegenteil —
     ebenso nach einer Wahl in Einstellungen › Darstellung (sie setzt data-theme) */
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderTheme);
  new MutationObserver(renderTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  renderDeskFoot();
}
