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
 * railCards     -> welche Ansicht am Desktop eigene Karten in der rechten Spalte hat
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
import { loadPhoto, renderProfileButton, savedPhoto } from "./features/profile/avatar.js";
import { initOverview, renderOverview } from "./features/overview/overview.js";
import { initPage } from "./features/overview/page.js";
import { openProjectViewMenu } from "./features/overview/project-views.js";
import { initProjects, renderProjectSection } from "./features/overview/projects.js";
import { beginRenameTab, initTabs, openTabMenu } from "./features/overview/tabs.js";
import { initWorkspacePage } from "./features/overview/workspace-page.js";
import { commitWorkspaceName, initWorkspaces, openWorkspaceMenu } from "./features/overview/workspaces.js";
import { initKeyboardInset } from "./shell/keyboard-inset.js";
import { initLevelGauge } from "./shell/level-gauge.js";
import { initLifecycle } from "./shell/lifecycle.js";
import { initNavBar } from "./shell/nav-bar.js";
import { initAndroidArchive } from "./shell/android-archive.js";
import { initAndroidBars } from "./shell/android-bars.js";
import { initAndroidFab } from "./shell/android-fab.js";
import { initAndroidViewBtn } from "./shell/android-view-btn.js";
import { initAndroidLinkBtn } from "./shell/android-link-btn.js";
import { initIosAdd } from "./shell/ios-add.js";
import { initIosBars } from "./shell/ios-bars.js";
import { checkReminders, initReminderBanner } from "./shell/reminder-banner.js";
import { initSearchBar } from "./shell/search-bar.js";
import { checkForUpdate, initUpdatePrompt } from "./shell/update-prompt.js";
import { mountSprite } from "./shell/sprite.js";
import { initWeekFill } from "./shell/week-fill.js";
import { initWriting } from "./shell/writing.js";
import { closeCtxMenu, initCtxMenu } from "./ui/ctx-menu.js";
import { isDesk, onDeskChange } from "./ui/desk-mode.js";
import { openEntryCtxMenu } from "./ui/entry-menu.js";
import { initListClicks } from "./ui/list-clicks.js";
import { setLongPressMenus } from "./ui/long-press.js";
import { initPageTools, openCopyChoice } from "./ui/page-tools.js";
import { initHeadTitle } from "./ui/head-title.js";
import { initModalPull } from "./ui/modal-pull.js";
import { initModalTop } from "./ui/modal-top.js";
import { initPillTapReveal } from "./ui/pill-swipe.js";
import { initPullSearch } from "./ui/pull-search.js";
import { initHistoryRestore } from "./ui/router-restore.js";
import { initSheet } from "./ui/sheet.js";
import { initRowLift } from "./ui/row-lift.js";
import { hasRowMore } from "./ui/rows.js";
import { initSwipe } from "./ui/swipe.js";

/* Was erst beim ersten Öffnen geholt wird. Nur diese Datei kennt die Pfade. */
const lazyModules = {
  calendar: () => import("./features/calendar/calendar.js"),
  tasks: () => import("./features/tasks/tasks.js"),
  media: () => import("./features/media/media.js"),
  viewer: () => import("./features/media/viewer.js"),
  search: () => import("./features/search/search.js"),
  resources: () => import("./features/resources/resources.js"),
  bookmarks: () => import("./features/bookmarks/bookmarks.js"),
  progress: () => import("./features/progress/progress.js"),
  profile: () => import("./features/profile/profile.js"),
  drawing: () => import("./features/drawing/drawing.js"),
  video: () => import("./ui/video-player.js"),
  files: () => import("./data/files.js"),
  desk: () => import("./shell/desk.js"),
  dashboard: () => import("./features/dashboard/dashboard.js"),
};

/*
 * Eigene Karten der Ansichten für die rechte Spalte am Desktop
 * (src/shell/desk-rail.js). Sie laden erst, wenn die Ansicht bei breitem
 * Fenster offen ist; alle übrigen Seiten zeigen die Karten der Übersicht.
 */
const railCards = {
  calendar: () => import("./features/calendar/calendar-rail.js"),
  tasks: () => import("./features/tasks/tasks-rail.js"),
  media: () => import("./features/media/media-rail.js"),
  search: () => import("./features/search/search-rail.js"),
  entry: () => import("./features/entry/entry-rail.js"),
  page: () => import("./features/overview/workspace-rail.js"),
};

/* Von den nachladbaren Bereichen sind das die, die eine eigene Ansicht haben. */
const lazyViews = ["calendar", "tasks", "media", "search"];

/* Reihenfolge des Vorladens: was man am ehesten als Nächstes braucht, zuerst. */
const prefetchOrder = ["search", "tasks", "calendar", "media", "viewer", "progress", "profile", "resources", "bookmarks", "files", "drawing", "video"];

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
  initHistoryRestore();
  initModalPull();
  initModalTop();
  initPullSearch();
  initPillTapReveal();
  /* Eine Zeile mit drei Punkten (Android) öffnet ihr Menü nur dort; gedrückt Halten hebt sie zum Verschieben an (src/ui/swipe.js) */
  const unlessRowMore = (open) => (row) => {
    if (!hasRowMore(row)) open(row);
  };
  setLongPressMenus({
    tab: openTabMenu,
    workspace: unlessRowMore(openWorkspaceMenu),
    entry: unlessRowMore(openEntryCtxMenu),
    copy: openCopyChoice,
  });
  initSwipe();
  initRowLift();
  initPageTools();
  initHeadTitle();
  initListClicks({ openTabMenu, openWorkspaceMenu, beginRenameTab, finishWorkspaceName: commitWorkspaceName });

  initLevelGauge();
  initSearchBar();
  initNavBar();
  initAndroidBars();
  initAndroidFab();
  initAndroidArchive();
  initAndroidViewBtn();
  initAndroidLinkBtn();
  initIosBars();
  initIosAdd();
  initKeyboardInset();
  initWriting();
  initWeekFill();
}

/* Alle Bereiche anmelden, die von Anfang an da sein müssen. */
function initFeatures() {
  initOverview();
  initProjects();
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
    load("desk").then((module) => module.initDesk({ openProjectViewMenu, profilePhoto: savedPhoto, railCards }));
    load("dashboard").then((module) => module.initDashboard());
  };
  mount();
  onDeskChange(mount);
}

/* Die Startseite aufbauen und die Adresse setzen. */
function showStartPage() {
  renderOverview();
  renderProjectSection();
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
  /* Zurück in der App: nach einem Update und nach verpassten Erinnerungen schauen */
  initLifecycle({
    onShow: () => {
      checkForUpdate();
      checkReminders();
    },
  });
  initUpdatePrompt();
  initReminderBanner();
  /* Die Icons kommen nach, das Gerüst steht schon. */
  mountSprite();
  prefetchWhenIdle(prefetchOrder);
}

start();
