/*
 * Startpunkt der App. Hier — und nur hier — ist bekannt, welche Bereiche es
 * gibt: der gespeicherte Zustand wird geladen, jeder Bereich angemeldet und
 * die Startseite gezeichnet. Die unteren Schichten bekommen alles, was sie von
 * den Seiten brauchen, von hier hereingegeben.
 * Pfad: src/main.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * lazyModules   -> welche Bereiche erst beim Öffnen geladen werden
 * lazyViews     -> welche Ansichten dabei eine eigene Seite sind
 * prefetchOrder -> in welcher Reihenfolge sie in Ruhephasen vorgeladen werden
 *                  (das erste Öffnen geht dann ohne Warten)
 */

import { events, on } from "./core/bus.js";
import { load, prefetchWhenIdle, registerLoader } from "./core/lazy.js";
import { loadState } from "./data/state.js";
import { loadThumbs } from "./data/thumbs.js";
import { loadUsage } from "./data/usage.js";
import { initComposer, updateComposerSend } from "./features/composer/composer.js";
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
import { mountSprite } from "./shell/sprite.js";
import { closeCtxMenu, initCtxMenu } from "./ui/ctx-menu.js";
import { initListClicks } from "./ui/list-clicks.js";
import { setLongPressMenus } from "./ui/long-press.js";
import { initModalPull } from "./ui/modal-pull.js";
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
  setLongPressMenus({ tab: openTabMenu, workspace: openWorkspaceMenu });
  initSwipe();
  initListClicks({ openTabMenu, openWorkspaceMenu, beginRenameTab, finishWorkspaceName: commitWorkspaceName });

  initLevelGauge();
  initSearchBar();
  initNavBar();
  initKeyboardInset();
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
  initDictation(updateComposerSend);
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

/* Die Startseite aufbauen und die Adresse setzen. */
function showStartPage() {
  renderOverview();
  renderTabs();
  renderWorkspaces();
  renderProfileButton();
  history.replaceState({ view: "home" }, "", "#/");
}

function start() {
  initLazyViews();
  loadEverything();
  initShell();
  initFeatures();
  showStartPage();
  initLifecycle();
  /* Die Icons kommen nach, das Gerüst steht schon. */
  mountSprite();
  prefetchWhenIdle(prefetchOrder);
}

start();
