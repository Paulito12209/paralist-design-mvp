/*
 * Die Tab-Pillen auf der Seite Arbeitsbereiche: wählen, umbenennen, Icon
 * geben, löschen. Der aktive Tab ist gefüllt, ein neuer Tab startet gleich im
 * Eingabefeld. Gezeichnet wird die Zeile von
 * src/features/overview/workspace-collection.js, das Wischen meldet sie dort an.
 * Pfad: src/features/overview/tabs.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgröße und Hintergrund der Pillen
 * stehen in styles/overview.css (--tab-pill-size, --tab-pill-active-bg).
 */

import { emit, events } from "../../core/bus.js";
import { dom, el, focusAtEnd } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { sameId } from "../../core/ids.js";
import { noHistoryForm } from "../../core/no-history.js";
import { deleteTab } from "../../data/mutations.js";
import { tabLabel } from "../../data/queries.js";
import { saveState, state, ui } from "../../data/state.js";
import { setTabIconsOn } from "../../data/tab-icons.js";
import { awardXp } from "../../data/xp.js";
import { showTabMenu } from "../../ui/tab-menu.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { addPill } from "../../ui/pill-add.js";
import { fitPillInput } from "../../ui/pill-input.js";
import { revealActive } from "../../ui/pill-swipe.js";
import { tabGlyph } from "../../ui/tab-glyph.js";
import { currentView } from "../../ui/views.js";

function pillMarkup(tab) {
  const glyph = tabGlyph("workspaces", tab.icon);

  if (sameId(tab.id, ui.editingTabId)) {
    return `
      <div class="tab-pill is-active">
        ${glyph}
        <input class="tab-pill-input" id="tab-name-input" type="text" size="1" value="${escapeHtml(tab.name)}" placeholder="${escapeHtml(tab.placeholder || "")}" aria-label="Tab benennen" form="${noHistoryForm}" enterkeyhint="go" />
      </div>
    `;
  }

  const active = sameId(tab.id, state.activeTabId) ? " is-active" : "";
  const label = tabLabel(tab);
  return `
    <button class="tab-pill${active}" type="button" data-tab-id="${tab.id}">
      ${glyph}${escapeHtml(label)}
    </button>
  `;
}

/** Alle Tab-Pillen samt kleinem Plus — auf der Übersicht und der Seite Arbeitsbereiche. */
export function tabPillsMarkup() {
  return `${state.tabs.map(pillMarkup).join("")}
    ${addPill("data-tab-add=\"1\"", "Tab hinzufügen")}`;
}

/* Die Seite, auf der gerade getippt wird — dort soll die Pille ins Bild rollen. */
function activeViewSection() {
  return el(`view-${currentView()}`);
}

/* Das Namensfeld der sichtbaren Seite. Nur dort suchen: eine verborgene Seite
   kann noch ein altes Feld mit derselben id tragen, bis sie neu zeichnet. */
function tabNameInput() {
  return activeViewSection()?.querySelector("#tab-name-input") || null;
}

/** Nach dem Zeichnen: steht ein Namensfeld da, passt es sich an und bekommt den Fokus. */
export function afterTabsRender() {
  const input = tabNameInput();
  if (!input) return;
  fitPillInput(input);
  focusAtEnd(input);
}


/** Den eingegebenen Namen übernehmen. Ein leerer Name behält den Platzhalter. */
export function commitTabName() {
  const input = tabNameInput();
  if (!input) return;
  const tab = state.tabs.find((item) => sameId(item.id, ui.editingTabId));
  ui.editingTabId = null;
  if (tab) {
    tab.name = input.value.trim() || tab.placeholder || "Tab";
    /* Punkte gibt es erst, wenn ein neuer Tab wirklich einen Namen hat */
    if (!tab.awarded) {
      tab.awarded = true;
      awardXp("created", "tab", tab.name);
    }
  }
  saveState();
  /* Als Datenänderung melden statt nur die Pillen hier neu zu zeichnen: den
     Namen zeigt auch die Seitenleiste der Desktop-Fassung. Die Pillen zeichnet
     die Seite Arbeitsbereiche dabei selbst neu. */
  emit(events.dataChanged);
  /* Als fertige Pille ist der Tab breiter als das Eingabefeld: ganz ins Bild holen */
  revealActive(activeViewSection());
}

/** Umbenennen einer Pille starten. */
export function beginRenameTab(id) {
  const tab = state.tabs.find((item) => sameId(item.id, id));
  ui.editingTabId = id;
  if (tab && !tab.placeholder) tab.placeholder = tab.name;
  /* Als Datenänderung melden statt nur die Pillen zu zeichnen: die Seite
     Arbeitsbereiche zeichnet sich neu und setzt den Fokus ins Namensfeld. */
  emit(events.dataChanged);
}

/** Das Menü einer Pille (gedrückt halten oder Rechtsklick). */
export function openTabMenu(pill) {
  const id = Number(pill.dataset.tabId);
  const tab = state.tabs.find((item) => sameId(item.id, id));
  if (!tab) return;

  const options = [
    { label: "Umbenennen", icon: "pencil", onSelect: () => beginRenameTab(id) },
    iconPickerAction(tab.icon, (name) => {
      tab.icon = name;
      /* Ein gewähltes Icon soll man sehen — auch wenn die Tabs bisher nur Text zeigten */
      if (name) setTabIconsOn("workspaces", true);
      saveState();
      emit(events.dataChanged);
    }),
  ];
  /* Der letzte Tab lässt sich nicht löschen: es muss immer einer übrig bleiben. */
  if (state.tabs.length > 1) {
    options.push({ label: "Löschen", icon: "trash", danger: true, onSelect: () => deleteTab(id) });
  }
  showTabMenu(pill, options);
}

/* Tippen, Enter und Fokusverlust im Namensfeld eines Tabs. */
function bindTabNameInput(container) {
  container.addEventListener("input", (event) => {
    if (event.target.id !== "tab-name-input") return;
    fitPillInput(event.target);
    /* Der Tab wächst beim Tippen: sonst verschwände sein Ende unter Linie und Plus-Knopf */
    revealActive(activeViewSection());
  });

  container.addEventListener("keydown", (event) => {
    if (event.target.id !== "tab-name-input" || event.key !== "Enter") return;
    event.preventDefault();
    commitTabName();
  });

  /* blur in der Aufnahmephase: sonst erreicht das Ereignis den Zuhörer nicht */
  container.addEventListener(
    "blur",
    (event) => {
      if (event.target.id === "tab-name-input") commitTabName();
    },
    true
  );
}

/** Tastatur und Fokus im Umbenennen-Feld anmelden — das Feld steht in der Seite Arbeitsbereiche. */
export function initTabs() {
  bindTabNameInput(dom.pageBody);
}
