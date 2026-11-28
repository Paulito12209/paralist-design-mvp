/*
 * Der Reiter „Inhalte“ der geöffneten Seite in der „OG Version“ (Nachbau von
 * PageKindDetailSections und PageLinkRow in Organi7er): je Art eine getönte
 * Abschnittskarte mit Titel, Pfeil-Knopf ↗ und gestricheltem „+ … hinzufügen“;
 * darin Zeilen ohne eigene Karte — eine Aufgabe mit runder Checkbox und den
 * Pillen für Dringlichkeit und Status, alles andere mit Symbol und Art darunter.
 *
 * Die Liste selbst zeichnet src/ui/groups.js für alle Fassungen. Hier wird sie
 * nur nachträglich ausgezeichnet (Abschnitte, Knöpfe; die Zeilen übernimmt
 * src/ui/og-rows.js), und nur in der OG Version; die Regeln dazu stehen in styles/og-detail-sections.css.
 * Pfad: src/features/entry/entry-og-sections.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * labels       -> Name des ↗-Knopfes für Vorlesehilfen und das Wort auf dem gestrichelten Knopf („hinzufügen“)
 * openTargets  -> wohin der Pfeil ↗ je Art führt (Reiter oder Liste)
 * pickTypes    -> für welche Arten das Eingabefeld beim „+ hinzufügen“ gleich die Art vorwählt
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon, escapeHtml } from "../../core/html.js";
import { typeSingular } from "../../data/config.js";
import { bindOgCheck, tagOgRows } from "../../ui/og-rows.js";
import { openBookmarks, openProjectsPage, openTarget, showTab } from "../../ui/router.js";

const labels = { open: "Alle öffnen", add: "hinzufügen" };
const pickTypes = ["notiz", "aufgabe", "termin", "projekt"];
const openTargets = {
  aufgabe: () => showTab("tasks"),
  termin: () => showTab("calendar"),
  medien: () => showTab("media"),
  projekt: () => openProjectsPage(),
  lesezeichen: () => openBookmarks(),
  /* Notizen, Dokumente und Zeichnungen sammelt die Übersicht „Ressourcen“ */
  notiz: () => openTarget("overview", 4),
  dokument: () => openTarget("overview", 4),
  zeichnung: () => openTarget("overview", 4),
};

/** Ein Abschnitt: Kategorie für die Tönung, Pfeil-Knopf neben der Überschrift, gestrichelter Anlege-Knopf am Fuß. */
function tagGroup(group) {
  if (group.dataset.ogType) return;
  const type = group.dataset.group.split("|")[1];
  group.dataset.ogType = type;
  const kind = escapeHtml(type);
  group.insertAdjacentHTML(
    "beforeend",
    `<button class="og-group-open" type="button" data-og-open="${kind}" aria-label="${labels.open}">${icon("arrow-up-right")}</button>
     <button class="og-group-add" type="button" data-og-add="${kind}">${icon("plus")}<span>${typeSingular(type)} ${labels.add}</span></button>`
  );
}

function tagAll() {
  dom.entryLinks.querySelectorAll(".group:not([data-og-type])").forEach(tagGroup);
  tagOgRows(dom.entryLinks);
}

/** Beobachter und Klicks anmelden — einmal beim Start, nur in der OG Version. */
export function initEntryOgSections() {
  /* Die Liste wird bei jeder Änderung neu gezeichnet: danach alles wieder auszeichnen */
  new MutationObserver(tagAll).observe(dom.entryLinks, { childList: true, subtree: true });
  bindOgCheck(dom.entryLinks);
  dom.entryLinks.addEventListener(
    "click",
    (event) => {
      const open = event.target.closest("[data-og-open]");
      if (open) {
        event.stopPropagation();
        openTargets[open.dataset.ogOpen]?.();
        return;
      }
      const add = event.target.closest("[data-og-add]");
      if (add) {
        event.stopPropagation();
        const type = add.dataset.ogAdd;
        emit(events.createRequested, pickTypes.includes(type) ? type : undefined);
      }
    },
    true
  );
}
