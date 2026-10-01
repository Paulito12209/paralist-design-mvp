/*
 * Einstellungen › Tabs: ob die Pillen oben einer Sammlung ein Icon vor dem
 * Namen zeigen — je Sammlung einzeln. Reiner Zustand ohne Zugriff auf die
 * Seite; die Pillen fragen hier beim Zeichnen nach, geändert wird es auf der
 * Unterseite (tabsCard in src/features/profile/app-settings.js).
 * Pfad: src/data/tab-icons.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tabIconAreas -> die Sammlungen auf der Unterseite, von oben nach unten:
 *                 Name, Icon der Zeile und `fallback` — das Icon, das eine
 *                 Pille ohne eigenes Icon bekommt, solange Icons an sind
 * allIcon      -> Icon der festen Ansicht „Alle“ bei Projekten und Aufgaben
 *
 * Vorgabe: überall nur Text. Ausnahme sind Sammlungen, in denen schon jemand
 * einer Ansicht ein eigenes Icon gegeben hat — dort bleibt es sichtbar, bis
 * man es auf der Unterseite ausschaltet.
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";
import { state } from "./state.js";

export const tabIconAreas = [
  { id: "projects", label: "Projekte", icon: "rocket", fallback: "rocket" },
  { id: "workspaces", label: "Arbeitsbereiche", icon: "layers", fallback: "layers" },
  { id: "tasks", label: "Aufgaben", icon: "task", fallback: "task" },
  { id: "media", label: "Medien", icon: "photos", fallback: "photos" },
  { id: "resources", label: "Ressourcen", icon: "cube", fallback: "cube" },
  { id: "bookmarks", label: "Lesezeichen", icon: "bookmark", fallback: "bookmark" },
  { id: "archive", label: "Archiv", icon: "archive", fallback: "archive" },
];

const allIcon = "layers";

/* Wo Ansichten eigene Icons tragen können — dort entscheidet ohne Wahl der Bestand. */
const ownIcons = {
  projects: () => state.projectViews,
  workspaces: () => state.tabs,
  tasks: () => state.taskViews,
};

function saved() {
  const value = readJson(storageKeys.tabIcons, {});
  return value && typeof value === "object" ? value : {};
}

/** Zeigen die Pillen dieser Sammlung Icons? */
export function tabIconsOn(area) {
  const choice = saved()[area];
  if (typeof choice === "boolean") return choice;
  return Boolean(ownIcons[area]?.().some((item) => item.icon));
}

/** Die Wahl für eine Sammlung merken. */
export function setTabIconsOn(area, on) {
  writeJson(storageKeys.tabIcons, { ...saved(), [area]: Boolean(on) });
}

/**
 * Welches Icon eine Pille zeigt: leer, solange die Sammlung nur Text zeigt;
 * sonst das eigene, das vorgegebene der Pille oder das der Sammlung.
 * `fixed` steht für die Ansicht „Alle“.
 */
export function tabIconName(area, own, { fixed = false } = {}) {
  if (!tabIconsOn(area)) return "";
  if (own) return own;
  if (fixed) return allIcon;
  return tabIconAreas.find((item) => item.id === area)?.fallback || "";
}
