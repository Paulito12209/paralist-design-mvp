/*
 * „OG Version“: das Anlege-Zubehör über der Reiterkapsel und die Lupe rechts
 * neben ihr, nach BottomComposerBar.swift und ContentView.swift (Organi7er).
 * Links steht die gewählte Art als Kachel mit Namen und Pfeil, ein Tipp
 * öffnet die vorhandene Typwahl (src/shell/ios-add.js); rechts das Plus, das
 * diese Art anlegt, und der Wellen-Knopf, der dasselbe mit Diktat tut. Die
 * Lupe öffnet die Suche. Gezeigt wird alles nur in der OG Version
 * (styles/og-accessory.css), in den anderen Fassungen bleibt es unsichtbar.
 * Pfad: src/shell/og-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * startKind  -> welche Art das Plus anlegt, bevor man eine andere gewählt hat
 * kindTints  -> Farbe der Kachel je Art (Name der Farbe in styles/tokens-og.css);
 *               Dokument, Zeichnung und Medium zählen wie in der App zu den Ressourcen
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { typeIcon, typeLabel } from "../data/config.js";
import { isMobileOs } from "../ui/platform.js";
import { showSearch } from "../ui/router.js";
import { createFromMenu } from "./create-menu.js";
import { expandTabBar } from "./ios-bars.js";
import { openTypePicker } from "./ios-add.js";

const startKind = "aufgabe";

const kindTints = {
  aufgabe: "task",
  termin: "event",
  notiz: "note",
  projekt: "project",
  arbeitsbereich: "area",
  dokument: "resource",
  zeichnung: "resource",
  lesezeichen: "bookmark",
  medien: "resource",
};

/* Der Arbeitsbereich hat keinen Typ in der Konfiguration und bringt sein Icon selbst mit */
const workspaceKind = "arbeitsbereich";

let kind = startKind;
let pill = null;

function kindIcon(type) {
  return type === workspaceKind ? "layers" : typeIcon(type);
}

function kindLabel(type) {
  return type === workspaceKind ? "Arbeitsbereich" : typeLabel(type);
}

function buildAccessory() {
  const bar = document.createElement("div");
  bar.className = "og-accessory";
  bar.innerHTML = `
    <button class="og-kind" type="button" aria-haspopup="menu" aria-label="Art wählen"></button>
    <button class="og-add" type="button" aria-label="Neu anlegen">${icon("plus")}</button>
    <button class="og-dictate" type="button" aria-label="Mit Diktat anlegen">${icon("wave")}</button>`;
  return bar;
}

/* Die Kachel, der Name und der Pfeil der Pille nach der gewählten Art neu setzen */
function renderKind() {
  pill.innerHTML = `
    <span class="og-kind-tile og-tint-${kindTints[kind] || "task"}">${icon(kindIcon(kind))}</span>
    <span class="og-kind-name">${escapeHtml(kindLabel(kind))}</span>
    <span class="og-kind-caret">${icon("chevron")}</span>`;
}

function create(withDictation) {
  expandTabBar();
  createFromMenu(kind);
  /* Das Eingabefeld hat sein eigenes Mikrofon; es ist erst im nächsten Bild bedienbar */
  if (withDictation) requestAnimationFrame(() => document.getElementById("composer-mic")?.click());
}

function buildSearchButton() {
  const button = document.createElement("button");
  button.className = "og-search";
  button.type = "button";
  button.setAttribute("aria-label", "Suchen");
  button.innerHTML = icon("search");
  button.addEventListener("click", () => showSearch());
  return button;
}

/** Zubehör und Lupe einhängen. */
export function initOgBar() {
  const accessory = buildAccessory();
  pill = accessory.querySelector(".og-kind");
  renderKind();
  /* Über der Kapsel, im selben Container: er rückt mit ihr und tritt beim Schreiben zurück */
  dom.navShell.before(accessory);
  dom.bottomBar.append(buildSearchButton());

  pill.addEventListener("click", () => {
    if (!isMobileOs("ios")) return;
    openTypePicker(pill, (picked) => {
      kind = picked;
      renderKind();
    });
  });
  accessory.querySelector(".og-add").addEventListener("click", () => create(false));
  accessory.querySelector(".og-dictate").addEventListener("click", () => create(true));
}
