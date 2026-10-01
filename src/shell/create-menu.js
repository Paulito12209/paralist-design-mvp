/*
 * Was die Plus-Menüs der Android- und der iOS-Fassung anbieten, und was ein
 * Tipp darauf tut. Beide stapeln die Einträge von unten nach oben, der erste
 * Eintrag steht dem Knopf am nächsten. Ein Eintrag öffnet das Eingabefeld mit
 * dieser Art — der Arbeitsbereich entsteht wie auf seiner Seite gleich mit
 * Namensfeld.
 * Pfad: src/shell/create-menu.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * menuItems -> was die Menüs anbieten, vom Knopf aus gezählt: Art, Name und
 *              (beim Arbeitsbereich) eigenes Icon; sonst kommt das Icon der Art
 *              aus src/data/config.js
 */

import { emit, events } from "../core/bus.js";
import { typeIcon } from "../data/config.js";
import { addWorkspace } from "../data/mutations.js";
import { openWorkspacesPage } from "../ui/router.js";

/* Die Arbeitsbereiche sind keine Einträge und haben darum keinen Typ — sie
   bekommen ihr Icon hier. */
const workspaceItem = "arbeitsbereich";

const menuItems = [
  { type: "termin", label: "Termin" },
  { type: "aufgabe", label: "Aufgabe" },
  { type: "notiz", label: "Notiz" },
  { type: "projekt", label: "Projekt" },
  { type: workspaceItem, label: "Arbeitsbereich", icon: "layers" },
  { type: "dokument", label: "Dokument" },
  { type: "zeichnung", label: "Zeichnung" },
  { type: "lesezeichen", label: "Lesezeichen" },
  { type: "medien", label: "Medium" },
];

/** Die Einträge mit Icon, vom Knopf aus gezählt (`index` 0 steht ihm am nächsten). */
export function createMenuItems() {
  return menuItems.map((item, index) => ({ ...item, icon: item.icon || typeIcon(item.type), index }));
}

/** Einen Eintrag ausführen: Arbeitsbereich direkt auf seiner Seite, sonst das Eingabefeld. */
export function createFromMenu(type) {
  if (type === workspaceItem) {
    openWorkspacesPage();
    addWorkspace();
    return;
  }
  emit(events.createRequested, type);
}
