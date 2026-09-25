/*
 * Startpunkt der App. Hier — und nur hier — ist bekannt, welche Bereiche es
 * gibt: der gespeicherte Zustand wird geladen, jeder Bereich angemeldet und
 * die Startseite gezeichnet. Die unteren Schichten bekommen alles, was sie von
 * den Seiten brauchen, von hier hereingegeben.
 * Pfad: src/main.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * lazyModules   -> welche Bereiche erst beim Öffnen geladen werden;
 *                  „desk“ und „dashboard“ braucht nur die Desktop-Fassung, sie
 *                  laden erst, wenn das Fenster breit genug ist (src/ui/desk-mode.js)
 * lazyViews     -> welche Ansichten dabei eine eigene Seite sind
 * prefetchOrder -> in welcher Reihenfolge sie in Ruhephasen vorgeladen werden
 *                  (das erste Öffnen geht dann ohne Warten)
 */

import { events, on } from "./core/bus.js";
import { load, prefetchWhenIdle, registerLoader } from "./core/lazy.js";
import { mountNoHistoryForm } from "./core/no-history.js";
import { loadState } from "./data/state.js";
import { loadThumbs } from "./data/thumbs.js";
import { loadUsage } from "./data/usage.js";
import { initComposer, onComposerText } from "./features/composer/composer.js";
import { initDictation } from "./features/composer/dictation.js";
import { initEntry } from "./features/entry/entry.js";
import { loadPhoto, renderProfileButton } from "./features/profile/avatar.js";
import { initOverview, renderOverview } from "./features/overview/overview.js";
import { initPage } from "./features/overview/page.js";
import { beginRenameTab, initTabs, openTabMenu, renderTabs } from "./features/overview/tabs.js";
import { initWorkspacePage } from "./features/overview/workspace-page.js";
import { commitWorkspaceName, initWorkspaces, openWorkspaceMenu, renderWorkspaces } from "./features/overview/workspaces.js";
import { initKeyboardInset } from "./shell/keyboard-inset.js";
import { initLevelGauge } from "./shell/level-gauge.js";
import { initLifecycle } from "./shell/lifecycle.js";
import { initNavBar } from "./shell/nav-bar.js";
import { initSearchBar } from "./shell/search-bar.js";
import { checkForUpdate, initUpdatePrompt } from "./shell/update-prompt.js";
import { mountSprite } from "./shell/sprite.js";
import { initWriting } from "./shell/writing.js";
import { closeCtxMenu, initCtxMenu } from "./ui/ctx-menu.js";
import { isDesk, onDeskChange } from "./ui/desk-mode.js";
import { openEntryCtxMenu } from "./ui/entry-menu.js";
import { initListClicks } from "./ui/list-clicks.js";
import { setLongPressMenus } from "./ui/long-press.js";
import { initPageTools, openCopyChoice } from "./ui/page-tools.js";
import { initModalPull } from "./ui/modal-pull.js";
import { initModalTop } from "./ui/modal-top.js";
import { initPillTapReveal } from "./ui/pill-swipe.js";
import { initPullSearch } from "./ui/pull-search.js";
import { initSheet } from "./ui/sheet.js";
import { initSwipe } from "./ui/swipe.js";

/* Was erst beim ersten Öffnen geholt wird. Nur diese Datei kennt die Pfade. */
const lazyModules = {
  calendar: () => import("./features/calendar/calendar.js"),
  tasks: () => import("./features/tasks/tasks.js"),
  media: () => import("./features/media/media.js"),
  viewer: () => import("./features/media/viewer.js"),
  search: () => import("./features/search/search.js"),
  resources: () => import("./features/resources/resources.js"),
  progress: () => import("./features/progress/progress.js"),
  profile: () => import("./features/profile/profile.js"),
  drawing: () => import("./features/drawing/drawing.js"),
  files: () => import("./data/files.js"),
  desk: () => import("./shell/desk.js"),
  dashboard: () => import("./features/dashboard/dashboard.js"),
};

/* Von den nachladbaren Bereichen sind das die, die eine eigene Ansicht haben. */
const lazyViews = ["calendar", "tasks", "media", "search"];

/* Reihenfolge des Vorladens: was man am ehesten als Nächstes braucht, zuerst. */
const prefetchOrder = ["search", "tasks", "calendar", "media", "viewer", "progress", "profile", "resources", "files", "drawing"];

/* Gespeicherten Zustand einlesen, bevor irgendetwas gezeichnet wird. */
function loadEverything() {
  loadThumbs();
  loadState();
  loadUsage();
  /* Das Profilbild gehört in die Kopfzeile und wird deshalb nicht erst mit dem
     Profil-Blatt nachgeladen — sonst zeigte der Knopf oben rechts das
     Standard-Icon, obwohl ein Bild hinterlegt ist. */
  loadPhoto();
}

/* Alle gemeinsamen Bedienelemente anmelden. */
function initShell() {
  initSheet();
  initCtxMenu();
  initModalPull();
  initModalTop();
  initPullSearch();
  initPillTapReveal();
  setLongPressMenus({ tab: openTabMenu, workspace: openWorkspaceMenu, entry: openEntryCtxMenu, copy: openCopyChoice });
  initSwipe();
  initPageTools();
  initListClicks({ openTabMenu, openWorkspaceMenu, beginRenameTab, finishWorkspaceName: commitWorkspaceName });

  initLevelGauge();
  initSearchBar();
  initNavBar();
  initKeyboardInset();
  initWriting();
}

/* Alle Bereiche anmelden, die von Anfang an da sein müssen. */
function initFeatures() {
  initOverview();
  initTabs();
  initWorkspaces();
  initPage();
  initWorkspacePage();
  initEntry();
  initComposer();
  initDictation(onComposerText);
}

/* Eine nachzuladende Seite wurde geöffnet: ihr Modul holen. Es zeichnet sich selbst. */
function initLazyViews() {
  Object.entries(lazyModules).forEach(([name, importFn]) => registerLoader(name, importFn));

  on(events.viewOpened, (name) => {
    if (lazyViews.includes(name)) load(name);
  });
  /* Beim Wechsel der Ansicht schließt sich das Kontextmenü. */
  on(events.viewWillChange, closeCtxMenu);
}

/*
 * Desktop-Fassung einhängen, sobald das Fenster breit genug ist — beim Start
 * oder später beim Aufziehen. Am Handy wird davon nichts geladen. Beide
 * Module dürfen mehrmals angestoßen werden und hängen sich nur einmal ein.
 */
function initDeskWhenWide() {
  const mount = () => {
    if (!isDesk()) return;
    load("desk").then((module) => module.initDesk({ openWorkspaceMenu }));
    load("dashboard").then((module) => module.initDashboard());
  };
  mount();
  onDeskChange(mount);
}

/* Die Startseite aufbauen und die Adresse setzen. */
function showStartPage() {
  renderOverview();
  renderTabs();
  renderWorkspaces();
  renderProfileButton();
  history.replaceState({ view: "home" }, "", "#/");
}

function start() {
  /* Zuerst: ohne das Formular hätten die Felder wieder Chromes Eingabe-Verlauf. */
  mountNoHistoryForm();
  initLazyViews();
  loadEverything();
  initShell();
  initFeatures();
  showStartPage();
  initDeskWhenWide();
  initLifecycle({ onShow: checkForUpdate });
  initUpdatePrompt();
  /* Die Icons kommen nach, das Gerüst steht schon. */
  mountSprite();
  prefetchWhenIdle(prefetchOrder);
}

start();
