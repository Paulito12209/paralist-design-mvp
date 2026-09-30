/*
 * Die Tab-Pillen über den Arbeitsbereichen: wählen, umbenennen, Icon geben,
 * löschen. Der aktive Tab ist gefüllt, ein neuer Tab startet gleich im
 * Eingabefeld. Waagerecht über die Übersicht wischen wechselt zum
 * nächsten oder vorigen Tab (src/ui/pill-swipe.js).
 * Pfad: src/features/overview/tabs.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgröße und Hintergrund der Pillen
 * stehen in styles/overview.css (--tab-pill-size, --tab-pill-active-bg).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el, focusAtEnd } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { sameId } from "../../core/ids.js";
import { noHistoryForm } from "../../core/no-history.js";
import { deleteTab, selectTab } from "../../data/mutations.js";
import { tabLabel } from "../../data/queries.js";
import { saveState, state, ui } from "../../data/state.js";
import { awardXp } from "../../data/xp.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { fitPillInput } from "../../ui/pill-input.js";
import { initPillSwipe, revealActive } from "../../ui/pill-swipe.js";
import { currentView, isViewActive } from "../../ui/views.js";

function pillMarkup(tab) {
  const glyph = tab.icon ? icon(tab.icon, "tab-pill-icon") : "";

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
    <button class="tab-pill-add" type="button" data-tab-add="1" aria-label="Tab hinzufügen">
      ${icon("plus")}
    </button>`;
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

/** Die Pillen neu zeichnen. Beim Umbenennen bekommt die Eingabe den Fokus. */
export function renderTabs() {
  dom.workspaceTabs.innerHTML = tabPillsMarkup();
  afterTabsRender();
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
     der Zuhörer in initTabs() neu — wie beim Umbenennen eines Arbeitsbereichs. */
  emit(events.dataChanged);
  /* Als fertige Pille ist der Tab breiter als das Eingabefeld: ganz ins Bild holen */
  revealActive(activeViewSection());
}

/** Umbenennen einer Pille starten. */
export function beginRenameTab(id) {
  const tab = state.tabs.find((item) => sameId(item.id, id));
  ui.editingTabId = id;
  if (tab && !tab.placeholder) tab.placeholder = tab.name;
  /* Als Datenänderung melden statt nur die Pillen zu zeichnen — wie beim
     Arbeitsbereich: kommt „Umbenennen“ aus der Seitenleiste am Desktop, wechselt
     sie dann zur Übersicht, wo das Namensfeld steht. Die Pillen zeichnet der
     Zuhörer in initTabs() neu. */
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
      saveState();
      emit(events.dataChanged);
    }),
  ];
  /* Der letzte Tab lässt sich nicht löschen: es muss immer einer übrig bleiben. */
  if (state.tabs.length > 1) {
    options.push({ label: "Löschen", icon: "trash", danger: true, onSelect: () => deleteTab(id) });
  }
  openCtxMenu(pill, options);
}

/* Tippen, Enter und Fokusverlust im Namensfeld eines Tabs. Das Feld steht je
   nach Seite in den Pillen der Übersicht oder der Seite Arbeitsbereiche. */
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

/** Tastatur und Fokus im Umbenennen-Feld, Wischen sowie das Auffrischen anmelden. */
export function initTabs() {
  bindTabNameInput(dom.workspaceTabs);
  bindTabNameInput(dom.pageBody);

  /* Nicht während ein Tab umbenannt wird: dann gehört das Wischen dem Textfeld. */
  initPillSwipe(el("view-home"), {
    order: () => state.tabs.map((tab) => tab.id),
    current: () => state.activeTabId,
    select: selectTab,
    enabled: () => ui.editingTabId == null,
  });

  on(events.dataChanged, () => {
    if (isViewActive("home")) renderTabs();
  });
  on(events.viewOpened, (name) => {
    if (name === "home") renderTabs();
  });
}
