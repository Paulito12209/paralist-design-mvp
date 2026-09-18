const homeView = document.getElementById("view-home");
const pageView = document.getElementById("view-page");
const entryView = document.getElementById("view-entry");
const searchView = document.getElementById("view-search");
const calendarView = document.getElementById("view-calendar");
const mediaView = document.getElementById("view-media");
const settingsView = document.getElementById("view-settings");
const pageTitle = document.getElementById("page-title");
const pageBody = document.getElementById("page-body");
const pageMenuBtn = document.getElementById("page-menu");
const workspaceList = document.getElementById("workspace-list");
const workspaceTabs = document.getElementById("workspace-tabs");
const searchInput = document.getElementById("search-input");
const tabButtons = document.querySelectorAll(".tab-btn");
const content = document.querySelector(".content");

const navShell = document.getElementById("nav-shell");
const tabBar = document.getElementById("tab-bar");
const composer = document.getElementById("composer");
const composerInput = document.getElementById("composer-input");
const composerTypes = document.getElementById("composer-types");
const composerLinkLabel = document.getElementById("composer-link-label");

const entryTitle = document.getElementById("entry-title");
const entryBody = document.getElementById("entry-body");
const entryCrumb = document.getElementById("entry-crumb");

const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetOptions = document.getElementById("sheet-options");
const ctxMenu = document.getElementById("ctx-menu");
const ctxCard = document.getElementById("ctx-card");
const levelGauge = document.getElementById("level-gauge");
const progressModal = document.getElementById("progress");
const progressBody = document.getElementById("progress-body");
const profileModal = document.getElementById("profile");
const profileBody = document.getElementById("profile-body");
const themeOptions = document.getElementById("theme-options");

const views = {
  home: homeView,
  page: pageView,
  entry: entryView,
  search: searchView,
  calendar: calendarView,
  media: mediaView,
  settings: settingsView,
};

// Eintragstypen: bestimmen das Icon vor dem Titel in den Listen
const types = [
  { id: "aufgabe", label: "Aufgabe", icon: "task" },
  { id: "notiz", label: "Notiz", icon: "note" },
  { id: "termin", label: "Termin", icon: "calendar" },
  { id: "medien", label: "Medien", icon: "photos" },
];

/* Jede Übersichtskarte ist ein Ablageort: „parent“ verbindet sie mit den
   Einträgen, „seed“ legt beim allerersten Start Beispieleinträge an.
   Favoriten sammelt nur markierte Einträge und Arbeitsbereiche. */
const overviewPages = {
  1: { title: "Inbox", icon: "inbox", parent: null },
  2: { title: "Favoriten", icon: "star-outline", kind: "favorites" },
  3: { title: "Projekte", icon: "rocket", parent: "o3", seed: 5 },
  4: { title: "Ressourcen", icon: "cube", parent: "o4", seed: 3 },
};

const presetIcons = [
  { id: "smile", label: "Privat" },
  { id: "briefcase", label: "Arbeit" },
  { id: "academic", label: "Schule / Uni" },
];

const storageKey = "paralist-mvp";
const themeKey = "paralist-theme";
const usageKey = "paralist-usage";

/* XP-Arten: bestimmen Farbe, Icon und Punkte je Ereignis */
const xpKinds = {
  created: { label: "Angelegt", icon: "plus-circle", color: "var(--xp-created)", amount: 1 },
  done: { label: "Erledigt", icon: "check-circle", color: "var(--xp-done)", amount: 2 },
};

/* Was angelegt wurde: Icon und Farbe für die Historie */
const xpItems = {
  aufgabe: { label: "Aufgabe", icon: "task", color: "#0a84ff" },
  notiz: { label: "Notiz", icon: "note", color: "#ffd60a" },
  termin: { label: "Termin", icon: "calendar", color: "#5ac8fa" },
  medien: { label: "Medien", icon: "photos", color: "#30d158" },
  arbeitsbereich: { label: "Arbeitsbereich", icon: "layers", color: "#ff9f0a" },
  tab: { label: "Tab", icon: "tag", color: "#bf5af2" },
};

const themes = [
  { id: "system", label: "System", icon: "display" },
  { id: "light", label: "Hell", icon: "sun" },
  { id: "dark", label: "Dunkel", icon: "moon" },
];

let tabs = [{ id: 1, name: "Privat", icon: "smile" }];
let activeTabId = 1;
let editingTabId = null;
let editingWorkspaceId = null;
let workspaces = [{ id: 1, name: "Platzhalter 1", tab: 1, favorite: false }];
let entries = [];
let nextEntryId = 1;
let sourceView = "home";
let currentPage = null;
let currentEntryId = null;
let composerType = types[0].id;
let composerParent = null;
let sheetActions = [];
let ctxActions = [];
let skipClick = false;
let hold = null;
let xpLog = [];
let nextXpId = 1;
let progressRange = 30;
let historyLimit = 20;
let usage = {}; /* Nutzungszeit je Tag in Sekunden: { "2026-09-18": 2400 } */
let usageRange = 30;
let usageTickAt = Date.now();

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
}

function icon(name, className = "") {
  return `<svg class="icon${className ? ` ${className}` : ""}"><use href="#icon-${name}"></use></svg>`;
}

function typeIcon(id) {
  const type = types.find((item) => item.id === id);
  return type ? type.icon : "placeholder";
}

function sameParent(a, b) {
  return String(a ?? "") === String(b ?? "");
}

/* Speichern im Browser, damit Einträge einen Neuladen der Seite überleben.
   In privaten Fenstern kann der Zugriff fehlschlagen, darum abgesichert. */
function saveState() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ tabs, activeTabId, workspaces, entries, nextEntryId, xpLog, nextXpId, calendar: calPrefs, media: mediaPrefs, mediaSeeded: true })
    );
  } catch (error) {
    /* ohne Speicher läuft die App weiter, nur ohne Merken */
  }
  pruneThumbs();
}

function seedEntries() {
  Object.values(overviewPages).forEach((page) => {
    if (!page.seed) return;
    for (let n = 1; n <= page.seed; n += 1) {
      entries.push({
        id: nextEntryId++,
        type: types[(n - 1) % types.length].id,
        title: `Eintrag ${n}`,
        body: "",
        parent: page.parent,
        archived: false,
        favorite: false,
        createdAt: Date.now(),
      });
      logXp("created", types[(n - 1) % types.length].id, `Eintrag ${n}`);
    }
  });
}

/* Ältere Speicherstände kennen noch kein XP-Protokoll: alles Vorhandene
   wird als ein Sammelposten ohne Zeitpunkte nachgetragen. */
function seedXpFromExisting() {
  const count = entries.length + workspaces.length + tabs.length;
  if (!count) return;
  xpLog.push({
    id: nextXpId++,
    ts: null,
    kind: "created",
    item: "sammel",
    title: "",
    amount: count * xpKinds.created.amount,
    count,
  });
}

function loadState() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey));
  } catch (error) {
    /* kaputte Daten werden ignoriert */
  }

  if (!saved) {
    seedEntries();
    seedMedia();
    saveState();
    return;
  }

  if (Array.isArray(saved.tabs) && saved.tabs.length) tabs = saved.tabs;
  if (Number(saved.activeTabId)) activeTabId = Number(saved.activeTabId);
  if (Array.isArray(saved.workspaces)) workspaces = saved.workspaces;
  if (Array.isArray(saved.entries)) entries = saved.entries;
  if (Number(saved.nextEntryId)) nextEntryId = Number(saved.nextEntryId);
  if (Number(saved.nextXpId)) nextXpId = Number(saved.nextXpId);
  if (!tabs.some((tab) => tab.id === activeTabId)) activeTabId = tabs[0].id;
  if (saved.calendar && typeof saved.calendar === "object") calPrefs = { ...calPrefs, ...saved.calendar };
  if (Array.isArray(saved.xpLog)) xpLog = saved.xpLog;
  else {
    seedXpFromExisting();
    saveState();
  }

  if (saved.media && typeof saved.media === "object") mediaPrefs = { ...mediaPrefs, ...saved.media };
  if (!mediaFilterList.some((filter) => filter.id === mediaPrefs.filter)) mediaPrefs.filter = "recent";
  /* Ältere Speicherstände haben noch keine Beispielmedien: einmalig nachlegen */
  if (!saved.mediaSeeded) {
    seedMedia();
    saveState();
  }

  tabs.forEach((tab) => {
    if (!tab.icon && tab.name === "Privat") tab.icon = "smile";
    if (typeof tab.awarded !== "boolean") tab.awarded = true;
  });
  workspaces.forEach((workspace) => {
    if (typeof workspace.favorite !== "boolean") workspace.favorite = false;
  });
  entries.forEach((entry) => {
    if (typeof entry.favorite !== "boolean") entry.favorite = false;
  });
}

function workspaceName(id) {
  const workspace = workspaces.find((item) => String(item.id) === String(id));
  return workspace ? workspace.name : "Inbox";
}

function parentName(parent) {
  if (!parent) return "Inbox";
  const page = Object.values(overviewPages).find((item) => sameParent(item.parent, parent));
  if (page) return page.title;
  return workspaceName(parent);
}

function entriesOf(parent) {
  return entries.filter((entry) => !entry.archived && sameParent(entry.parent, parent));
}

function tabWorkspaces() {
  return workspaces.filter((workspace) => String(workspace.tab) === String(activeTabId));
}

function favoriteCount() {
  return (
    workspaces.filter((workspace) => workspace.favorite).length +
    entries.filter((entry) => entry.favorite && !entry.archived).length
  );
}

function pageCount(page) {
  if (page.kind === "favorites") return favoriteCount();
  return entriesOf(page.parent).length;
}

function workspaceIcon(workspace) {
  return workspace.icon || "folder";
}

function hideAllViews() {
  Object.values(views).forEach((view) => {
    view.hidden = true;
    view.classList.remove("is-active");
  });
}

function showView(name) {
  closeComposer();
  closeCtxMenu();
  hideAllViews();
  const view = views[name];
  view.hidden = false;
  view.classList.add("is-active");
  if (name === "calendar") renderCalendar(true);
  document.body.classList.toggle("is-media", name === "media");
  if (name === "media") renderMedia();
}

function setActiveTab(tab) {
  tabButtons.forEach((btn) => {
    const on = btn.dataset.tab === tab;
    btn.classList.toggle("is-active", on);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
}

function renderOverview() {
  const grid = document.getElementById("overview-grid");
  grid.innerHTML = Object.entries(overviewPages)
    .map(([id, page]) => {
      const iconClass =
        page.icon === "star-outline" || page.icon === "star"
          ? "card-icon card-icon-star"
          : page.icon === "inbox"
            ? "card-icon card-icon-inbox"
            : page.icon === "rocket"
              ? "card-icon card-icon-rocket"
              : page.icon === "cube"
                ? "card-icon card-icon-cube"
                : "card-icon";
      return `
        <button class="overview-card" type="button" data-open="overview" data-id="${id}" onclick="openTarget('overview', '${id}')">
          ${icon(page.icon || "placeholder", iconClass)}
          <span class="card-label">
            ${page.title}
            <span class="card-count">${pageCount(page)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

/* Tab-Pillen: der aktive Tab ist gefüllt, ein neuer Tab startet im Eingabefeld */
function renderTabs() {
  const pills = tabs
    .map((tab) => {
      const mark = tab.id === activeTabId ? " is-active" : "";
      const glyph = tab.icon ? icon(tab.icon, "tab-pill-icon") : "";
      if (tab.id === editingTabId) {
        return `
          <div class="tab-pill is-active">
            ${glyph}
            <input class="tab-pill-input" id="tab-name-input" type="text" value="${escapeHtml(tab.name)}" placeholder="${escapeHtml(tab.placeholder || "")}" aria-label="Tab benennen" />
          </div>
        `;
      }
      const label = tab.name || tab.placeholder || "Tab";
      return `
        <button class="tab-pill${mark}" type="button" data-tab-id="${tab.id}">
          ${glyph}${escapeHtml(label)}
        </button>
      `;
    })
    .join("");

  workspaceTabs.innerHTML = `${pills}
    <button class="tab-pill-add" type="button" data-tab-add="1" aria-label="Tab hinzufügen">
      ${icon("plus")}
    </button>`;

  const input = document.getElementById("tab-name-input");
  if (input) {
    input.focus();
    input.select();
  }
}

/* Eine Zeile mit Wisch-Knöpfen; die Knöpfe liegen hinter der Zeile */
function swipeRow(dataAttr, actionsLeft, actionsRight, rowHtml) {
  const side = (position, actions) =>
    actions.length
      ? `<div class="swipe-actions swipe-actions-${position}">${actions.join("")}</div>`
      : "";

  return `
    <div class="swipe" ${dataAttr}>
      ${side("left", actionsLeft)}
      ${side("right", actionsRight)}
      <div class="swipe-body">${rowHtml}</div>
    </div>
  `;
}

/* „action“ sagt, was passiert, „tone“ nur, welche Farbe der Kreis hat */
function swipeAction(action, label, iconName, tone = action) {
  return `
    <button class="swipe-action swipe-action-${tone}" type="button" data-swipe="${action}" aria-label="${label}">
      ${icon(iconName)}
    </button>
  `;
}

function entryRow(entry, prefix = "") {
  return swipeRow(
    `data-entry="${entry.id}"`,
    [
      swipeAction("favorite", "Favorit", entry.favorite ? "star" : "star-outline", "favorite"),
      swipeAction("archive", "Archivieren", "archive"),
      swipeAction("link", "Verknüpfen", "link"),
    ],
    [swipeAction("delete", "Löschen", "trash")],
    `
      <button class="workspace-row entry-row" type="button" data-open-entry="${entry.id}">
        ${icon(typeIcon(entry.type), "entry-type")}
        ${prefix}
        <span>${escapeHtml(entry.title)}</span>
        ${icon("chevron", "chevron")}
      </button>
    `
  );
}

function workspaceRow(workspace, canEdit = false) {
  if (canEdit && workspace.id === editingWorkspaceId) {
    return `
      <div class="workspace-row">
        ${icon(workspaceIcon(workspace))}
        <input class="workspace-name-input" id="workspace-name-input" type="text" value="${escapeHtml(workspace.name)}" aria-label="Arbeitsbereich benennen" />
      </div>
    `;
  }

  return swipeRow(
    `data-workspace="${workspace.id}"`,
    [],
    [swipeAction("delete-workspace", "Löschen", "trash", "delete")],
    `
      <button class="workspace-row" type="button" data-open-workspace="${workspace.id}">
        ${icon(workspaceIcon(workspace))}
        <span>${escapeHtml(workspace.name)}</span>
        ${icon("chevron", "chevron")}
      </button>
    `
  );
}

function focusWorkspaceName() {
  const input = document.getElementById("workspace-name-input");
  if (input) {
    input.focus();
    input.select();
  }
}

function renderWorkspaces() {
  const canEdit = homeView.classList.contains("is-active");
  const rows = tabWorkspaces()
    .map((workspace) => workspaceRow(workspace, canEdit))
    .join("");

  workspaceList.innerHTML =
    rows +
    `
      <button class="workspace-row workspace-add" type="button" data-action="add-workspace" onclick="addWorkspace()">
        ${icon("folder-plus")}
        <span>Add Workspace</span>
      </button>
    `;

  if (canEdit) focusWorkspaceName();
}

function renderPageBody() {
  if (!currentPage) return;

  if (currentPage.kind === "favorites") {
    const favSpaces = workspaces.filter((workspace) => workspace.favorite);
    const favEntries = entries.filter((entry) => entry.favorite && !entry.archived);
    pageBody.innerHTML =
      favSpaces.length || favEntries.length
        ? `<div class="workspace-list">${favSpaces.map((workspace) => workspaceRow(workspace, pageView.classList.contains("is-active"))).join("")}${favEntries.map(entryRow).join("")}</div>`
        : `<p class="empty-note">Noch keine Favoriten.</p>`;
    if (pageView.classList.contains("is-active")) focusWorkspaceName();
    return;
  }

  const list = entriesOf(currentPage.parent);
  pageBody.innerHTML = list.length
    ? `<div class="workspace-list">${list.map(entryRow).join("")}</div>`
    : `<p class="empty-note">Noch keine Einträge.</p>`;
}

function showPage(page) {
  currentPage = page;
  pageTitle.textContent = page.title;
  showView("page");
  renderPageBody();
}

function showHome(replace = true) {
  showView("home");
  setActiveTab("home");
  sourceView = "home";
  renderOverview();
  renderTabs();
  renderWorkspaces();
  const url = "#/";
  if (replace) history.replaceState({ view: "home" }, "", url);
  else history.pushState({ view: "home" }, "", url);
}

function showTab(tab, replace = false) {
  searchInput.blur();
  const url = tab === "home" ? "#/" : `#/${tab}`;
  if (!replace && location.hash === url) {
    if (tab === "home") {
      showHome(true);
    } else {
      showView(tab);
      setActiveTab(tab);
      sourceView = tab;
    }
    return;
  }

  if (tab === "home") {
    showHome(replace);
    return;
  }

  showView(tab);
  setActiveTab(tab);
  sourceView = tab;
  if (replace) history.replaceState({ view: tab }, "", url);
  else history.pushState({ view: tab }, "", url);
}

function showSearch(replace = false) {
  showView("search");
  setActiveTab("");
  sourceView = "search";
  const url = "#/suchen";
  if (replace || location.hash === url) history.replaceState({ view: "search" }, "", url);
  else history.pushState({ view: "search" }, "", url);
}

function addWorkspace() {
  const id = workspaces.reduce((max, workspace) => Math.max(max, workspace.id), 0) + 1;
  workspaces.push({ id, name: `Platzhalter ${id}`, tab: activeTabId, favorite: false });
  awardXp("created", "arbeitsbereich", `Platzhalter ${id}`);
  renderWorkspaces();
}

function addTab() {
  const id = tabs.reduce((max, tab) => Math.max(max, tab.id), 0) + 1;
  tabs.push({ id, name: "", placeholder: `Tab ${tabs.length + 1}` });
  activeTabId = id;
  editingTabId = id;
  renderTabs();
  renderWorkspaces();
}

function commitTabName() {
  const input = document.getElementById("tab-name-input");
  if (!input) return;
  const tab = tabs.find((item) => item.id === editingTabId);
  editingTabId = null;
  if (tab) tab.name = input.value.trim() || tab.placeholder || "Tab";
  if (tab && !tab.awarded) {
    tab.awarded = true;
    awardXp("created", "tab", tab.name);
  }
  saveState();
  renderTabs();
}

function commitWorkspaceName() {
  const input = document.getElementById("workspace-name-input");
  if (!input) return;
  const workspace = workspaces.find((item) => item.id === editingWorkspaceId);
  editingWorkspaceId = null;
  if (workspace) workspace.name = input.value.trim() || workspace.name || "Arbeitsbereich";
  saveState();
  renderWorkspaces();
  renderPageBody();
}

function deleteWorkspace(id) {
  workspaces = workspaces.filter((workspace) => String(workspace.id) !== String(id));
  entries.forEach((entry) => {
    if (sameParent(entry.parent, id)) entry.parent = null;
  });
  saveState();
  refreshLists();
}

function deleteTab(id) {
  if (tabs.length < 2) return;
  workspaces
    .filter((workspace) => String(workspace.tab) === String(id))
    .forEach((workspace) => {
      entries.forEach((entry) => {
        if (sameParent(entry.parent, workspace.id)) entry.parent = null;
      });
    });
  workspaces = workspaces.filter((workspace) => String(workspace.tab) !== String(id));
  tabs = tabs.filter((tab) => tab.id !== id);
  if (activeTabId === id) activeTabId = tabs[0].id;
  saveState();
  renderTabs();
  renderWorkspaces();
  renderOverview();
}

function toggleFavorite(item) {
  item.favorite = !item.favorite;
  saveState();
  refreshLists();
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  const field = document.createElement("input");
  field.value = text;
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

function beginRenameTab(id) {
  const tab = tabs.find((item) => item.id === id);
  editingTabId = id;
  if (tab && !tab.placeholder) tab.placeholder = tab.name;
  renderTabs();
}

function beginRenameWorkspace(id) {
  editingWorkspaceId = id;
  renderWorkspaces();
  renderPageBody();
}

function openTarget(open, id) {
  if (open === "overview") {
    const page = overviewPages[id];
    if (!page) return;
    showPage({ title: page.title, parent: page.parent, kind: page.kind });
    history.pushState({ view: "overview", id, from: sourceView }, "", `#/uebersicht/${id}`);
    return;
  }

  const workspace = workspaces.find((item) => String(item.id) === String(id));
  if (!workspace) return;
  showPage({ title: workspace.name, parent: workspace.id, isWorkspace: true });
  history.pushState({ view: "workspace", id, from: sourceView }, "", `#/arbeitsbereich/${id}`);
}

function openEntry(id, push = true) {
  const entry = entries.find((item) => String(item.id) === String(id));
  if (!entry) return;
  currentEntryId = entry.id;
  entryTitle.value = entry.title;
  entryBody.value = entry.body || "";
  entryCrumb.textContent = parentName(entry.parent);
  showView("entry");
  if (push) history.pushState({ view: "entry", id: entry.id, from: sourceView }, "", `#/eintrag/${entry.id}`);
}

function restoreFrom(from) {
  if (from === "search") {
    showSearch(true);
    return;
  }
  if (from && from !== "home" && views[from]) {
    showTab(from, true);
    return;
  }
  showHome(true);
}

/* ---------- Eingabefeld ---------- */

function renderComposerTypes() {
  composerTypes.innerHTML = types
    .map(
      (type) => `
        <button class="composer-type${type.id === composerType ? " is-active" : ""}" type="button" data-type="${type.id}" aria-label="${type.label}">
          ${icon(type.icon)}
        </button>
      `
    )
    .join("");
}

function renderComposerLink() {
  composerLinkLabel.textContent = parentName(composerParent);
}

function openComposer() {
  closeCtxMenu();
  navShell.classList.add("is-composing");
  tabBar.hidden = true;
  composer.hidden = false;
  mediaActions.hidden = true;
  renderComposerTypes();
  renderComposerLink();
  composerInput.focus();
}

function closeComposer() {
  if (composer.hidden) return;
  navShell.classList.remove("is-composing");
  composer.hidden = true;
  tabBar.hidden = false;
  mediaActions.hidden = false;
  composerInput.value = "";
  calSlot = null;
}

function createEntry() {
  const title = composerInput.value.trim();
  if (!title) return;
  const entry = {
    id: nextEntryId++,
    type: composerType,
    title,
    body: "",
    parent: composerParent,
    archived: false,
    favorite: false,
    createdAt: Date.now(),
  };
  if (calendarView.classList.contains("is-active")) {
    entry.date = calSelected;
    if (composerType === "termin") {
      entry.time = calSlot ? calSlot.time : calSelected === dayKey(new Date()) ? timeKey(Date.now()) : "09:00";
    }
  }
  entries.push(entry);
  awardXp("created", composerType, title);
  composerInput.value = "";
  closeComposer();
  renderOverview();
  renderPageBody();
  renderCalendar();
}

/* ---------- Auswahl-Blatt ---------- */

function openSheet(title, options) {
  closeCtxMenu();
  sheetTitle.textContent = title;
  sheetOptions.innerHTML = options
    .map(
      (option, index) => `
        <button class="sheet-option${option.active ? " is-active" : ""}${option.danger ? " is-danger" : ""}" type="button" data-sheet="${index}">
          ${icon(option.icon)}
          <span>${escapeHtml(option.label)}</span>
        </button>
      `
    )
    .join("");
  sheetActions = options.map((option) => option.onSelect);
  sheet.hidden = false;
}

function closeSheet() {
  sheet.hidden = true;
  sheetActions = [];
}

function closeCtxMenu() {
  ctxMenu.hidden = true;
  ctxActions = [];
}

function openCtxMenu(anchor, options) {
  closeSheet();
  ctxCard.innerHTML = options
    .map(
      (option, index) => `
        <button class="ctx-item${option.danger ? " is-danger" : ""}" type="button" data-ctx="${index}">
          ${icon(option.icon)}
          <span>${escapeHtml(option.label)}</span>
        </button>
      `
    )
    .join("");
  ctxActions = options.map((option) => option.onSelect);
  ctxMenu.hidden = false;

  const device = document.querySelector(".device");
  const deviceRect = device.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  const cardRect = ctxCard.getBoundingClientRect();
  let top = anchorRect.bottom - deviceRect.top + 6;
  let left = anchorRect.left - deviceRect.left;
  if (left + cardRect.width > deviceRect.width - 12) {
    left = Math.max(12, deviceRect.width - cardRect.width - 12);
  }
  if (left < 12) left = 12;
  if (top + cardRect.height > deviceRect.height - 12) {
    top = Math.max(12, anchorRect.top - deviceRect.top - cardRect.height - 6);
  }
  ctxCard.style.top = `${top}px`;
  ctxCard.style.left = `${left}px`;
}

function openIconPicker(current, onPick) {
  openSheet(
    "Icon wählen",
    presetIcons.map((item) => ({
      label: item.label,
      icon: item.id,
      active: current === item.id,
      onSelect: () => onPick(item.id),
    }))
  );
}

function openTabMenu(pill) {
  const id = Number(pill.dataset.tabId);
  const tab = tabs.find((item) => item.id === id);
  if (!tab) return;
  const options = [
    { label: "Umbenennen", icon: "pencil", onSelect: () => beginRenameTab(id) },
    {
      label: "Icon bearbeiten",
      icon: "smile",
      onSelect: () =>
        openIconPicker(tab.icon, (name) => {
          tab.icon = name;
          saveState();
          renderTabs();
        }),
    },
    {
      label: "Link kopieren",
      icon: "chain",
      onSelect: () => copyText(`${location.origin}${location.pathname}${location.search}#/tab/${id}`),
    },
  ];
  if (tabs.length > 1) {
    options.push({
      label: "Löschen",
      icon: "trash",
      danger: true,
      onSelect: () => deleteTab(id),
    });
  }
  openCtxMenu(pill, options);
}

function openWorkspaceMenu(button) {
  const id = button.dataset.openWorkspace;
  const workspace = workspaces.find((item) => String(item.id) === String(id));
  if (!workspace) return;
  openCtxMenu(button, [
    { label: "Umbenennen", icon: "pencil", onSelect: () => beginRenameWorkspace(workspace.id) },
    {
      label: "Icon bearbeiten",
      icon: "smile",
      onSelect: () =>
        openIconPicker(workspace.icon, (name) => {
          workspace.icon = name;
          saveState();
          refreshLists();
        }),
    },
    {
      label: workspace.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: workspace.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(workspace),
    },
    {
      label: "Löschen",
      icon: "trash",
      danger: true,
      onSelect: () => deleteWorkspace(id),
    },
  ]);
}

function cancelHold() {
  if (!hold) return;
  clearTimeout(hold.timer);
  hold = null;
}

function startHold(event, target, kind) {
  cancelHold();
  hold = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    target,
    kind,
    fired: false,
    timer: setTimeout(() => {
      if (hold) hold.fired = true;
    }, 480),
  };
}

function finishHold() {
  if (!hold) return false;
  const fired = hold.fired;
  const target = hold.target;
  const kind = hold.kind;
  cancelHold();
  if (!fired) return false;
  skipClick = true;
  setTimeout(() => {
    skipClick = false;
  }, 400);
  if (kind === "tab") openTabMenu(target);
  else openWorkspaceMenu(target);
  return true;
}

function openParentPicker(title, current, onPick) {
  openSheet(title, [
    ...Object.values(overviewPages)
      .filter((page) => page.kind !== "favorites")
      .map((page) => ({
      label: page.title,
      icon: page.icon || "placeholder",
      active: sameParent(current, page.parent),
      onSelect: () => onPick(page.parent),
    })),
    ...workspaces.map((workspace) => ({
      label: workspace.name,
      icon: workspaceIcon(workspace),
      active: sameParent(current, workspace.id),
      onSelect: () => onPick(workspace.id),
    })),
  ]);
}

/* ---------- Fortschritt: XP, Stufen, Level-Anzeige ---------- */

function logXp(kind, item, title, count = 1) {
  xpLog.push({
    id: nextXpId++,
    ts: Date.now(),
    kind,
    item,
    title: title || "",
    amount: xpKinds[kind].amount * count,
  });
}

function awardXp(kind, item, title, count = 1) {
  logXp(kind, item, title, count);
  saveState();
  renderLevel();
}

/* Archivierte Aufgaben zählen als erledigt; andere Typen nur als weggeräumt */
function archiveEntry(entry) {
  entry.archived = true;
  if (entry.type === "aufgabe") awardXp("done", "aufgabe", entry.title);
  else saveState();
}

function xpTotals() {
  const totals = { created: 0, done: 0 };
  xpLog.forEach((row) => {
    if (!(row.kind in totals)) return; /* unbekannte Arten aus älteren Ständen überspringen */
    totals[row.kind] += row.amount;
  });
  return totals;
}

function totalXp() {
  return xpLog.reduce((sum, row) => sum + row.amount, 0);
}

/* Stufe 2 ab 300 XP, 3 ab 600, 4 ab 1000; danach wächst der Abstand um je 100 */
function levelThreshold(level) {
  const fixed = [0, 0, 300, 600, 1000];
  if (level < fixed.length) return fixed[level];
  let prev = 1000;
  let step = 400;
  for (let n = 5; n <= level; n += 1) {
    step += 100;
    prev += step;
  }
  return prev;
}

function levelInfo(xp) {
  let level = 1;
  while (xp >= levelThreshold(level + 1)) level += 1;
  const from = levelThreshold(level);
  const to = levelThreshold(level + 1);
  return { level, from, to, progress: Math.max(0, Math.min(1, (xp - from) / (to - from))) };
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE").format(value);
}

/* Runde Strich-Skala: 300 Grad, Lücke unten, erreichte Striche in Silberblau */
function renderLevel() {
  const info = levelInfo(totalXp());
  const ticks = 40;
  const lit = Math.round(info.progress * ticks);
  const cx = 24;
  const cy = 24;
  const inner = 18.5;
  const outer = 22.5;
  let lines = "";
  for (let n = 0; n < ticks; n += 1) {
    const angle = ((120 + (300 / (ticks - 1)) * n) * Math.PI) / 180;
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = cy + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = cy + Math.sin(angle) * outer;
    lines += `<line class="level-tick${n < lit ? " is-on" : ""}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" />`;
  }
  levelGauge.innerHTML = `${lines}
    <text class="level-num" x="24" y="27.5" text-anchor="middle">${info.level}</text>
    <text class="level-label" x="24" y="42.5" text-anchor="middle">Lv.</text>`;
  document.getElementById("level-btn").setAttribute(
    "aria-label",
    `Stufe ${info.level}, ${formatNumber(totalXp())} XP. Fortschritt öffnen`
  );
}

/* ---------- Fortschritt-Blatt ---------- */

function startOfDay(ts) {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function dayHeading(ts) {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  if (day === today) return "Heute";
  if (day === today - 86400000) return "Gestern";
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "long" })
    .format(new Date(ts))
    .replace(",", "");
}

function xpItemStyle(item) {
  return xpItems[item] || { label: item, icon: "placeholder", color: "var(--muted)" };
}

function renderDonutCard() {
  const totals = xpTotals();
  const total = totalXp();
  const order = ["created", "done"];
  const r = 80;
  const circ = 2 * Math.PI * r;
  const gap = total ? 4 : 0;
  let offset = 0;
  const segments = order
    .filter((kind) => totals[kind] > 0)
    .map((kind) => {
      const share = totals[kind] / total;
      const length = Math.max(0, share * circ - gap);
      const seg = `<circle class="donut-seg" cx="105" cy="105" r="${r}" stroke="${xpKinds[kind].color}" stroke-dasharray="${length.toFixed(2)} ${(circ - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 105 105)" />`;
      offset += share * circ;
      return seg;
    })
    .join("");
  const ring = total
    ? segments
    : `<circle class="donut-seg" cx="105" cy="105" r="${r}" stroke="var(--line)" />`;

  const rows = order
    .map((kind) => {
      const pct = total ? Math.round((totals[kind] / total) * 100) : 0;
      return `
        <div class="xp-row">
          <span style="color:${xpKinds[kind].color}">${icon(xpKinds[kind].icon)}</span>
          <span class="xp-row-label">${xpKinds[kind].label}</span>
          <span class="xp-row-pct">${pct} %</span>
          <span class="xp-row-xp">${formatNumber(totals[kind])} XP</span>
        </div>
      `;
    })
    .join("");

  return `
    <section class="pcard">
      <div class="donut-wrap">
        <svg class="donut" viewBox="0 0 210 210" aria-hidden="true">
          ${ring}
          <text class="donut-total" x="105" y="102" text-anchor="middle">${formatNumber(total)} XP</text>
          <text class="donut-sub" x="105" y="122" text-anchor="middle">insgesamt</text>
        </svg>
      </div>
      ${rows}
    </section>
  `;
}

function niceStep(max) {
  const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
  return steps.find((step) => max / step <= 5) || steps[steps.length - 1];
}

function renderHistoryCard() {
  const days = progressRange;
  const today = startOfDay(Date.now());
  const start = today - (days - 1) * 86400000;
  let base = 0;
  const perDay = new Array(days).fill(0);
  let inRange = 0;
  xpLog.forEach((row) => {
    if (row.ts == null || row.ts < start) {
      base += row.amount;
      return;
    }
    const index = Math.min(days - 1, Math.floor((startOfDay(row.ts) - start) / 86400000));
    perDay[index] += row.amount;
    inRange += row.amount;
  });
  const values = [];
  let running = base;
  perDay.forEach((amount) => {
    running += amount;
    values.push(running);
  });

  const width = 326;
  const height = 200;
  const plotLeft = 0;
  const plotRight = 282;
  const plotTop = 10;
  const plotBottom = 160;
  const max = Math.max(...values, 1);
  const step = niceStep(max);
  const yMax = Math.max(step, Math.ceil((max * 1.15) / step) * step); /* etwas Luft über der Kurve */
  const x = (i) => plotLeft + (i / Math.max(1, days - 1)) * (plotRight - plotLeft);
  const y = (v) => plotBottom - (v / yMax) * (plotBottom - plotTop);

  let grid = "";
  for (let v = 0; v <= yMax; v += step) {
    grid += `<line class="chart-axis" x1="${plotLeft}" x2="${plotRight}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" />
      <text class="chart-label" x="${width}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${formatNumber(v)}</text>`;
  }

  const labelStep = days <= 7 ? 1 : days <= 30 ? 7 : 21;
  const labelFormat =
    days <= 7
      ? new Intl.DateTimeFormat("de-DE", { weekday: "short" })
      : new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" });
  let labels = "";
  /* Bei 30 und 90 Tagen beginnt die erste Beschriftung erst nach dem ersten Schritt, sonst überlappt sie */
  for (let i = days <= 7 ? 0 : labelStep; i < days; i += labelStep) {
    const ts = start + i * 86400000;
    const xi = x(i).toFixed(1);
    labels += `<line class="chart-grid" x1="${xi}" x2="${xi}" y1="${plotTop}" y2="${plotBottom}" />
      <text class="chart-label" x="${xi}" y="${plotBottom + 22}" text-anchor="${i === 0 ? "start" : "middle"}">${labelFormat.format(new Date(ts))}</text>`;
  }

  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = points.join(" ");
  const area = `${x(0).toFixed(1)},${plotBottom} ${line} ${x(days - 1).toFixed(1)},${plotBottom}`;

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("trend")}<span>Verlauf</span></div>
      <div class="seg" id="progress-range">
        ${[7, 30, 90]
          .map(
            (n) =>
              `<button type="button" data-range="${n}" class="${n === days ? "is-active" : ""}">${n} Tage</button>`
          )
          .join("")}
      </div>
      <svg class="chart" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        ${grid}
        ${labels}
        <polygon class="chart-area" points="${area}" />
        <polyline class="chart-line" points="${line}" />
      </svg>
      <p class="chart-note">${formatNumber(inRange)} XP in diesem Zeitraum</p>
    </section>
  `;
}

function renderLevelsCard() {
  const info = levelInfo(totalXp());
  const rows = [1, 2, 3]
    .map((n) => {
      const level = info.level + n;
      return `<div class="level-row"><b>Stufe ${level}</b><span>${formatNumber(levelThreshold(level))} XP</span></div>`;
    })
    .join("");
  return `
    <section class="pcard">
      <div class="pcard-head">${icon("stairs")}<span>Nächste Stufen</span></div>
      ${rows}
    </section>
  `;
}

function renderLogCard() {
  const bulk = xpLog.filter((row) => row.ts == null);
  const timed = xpLog.filter((row) => row.ts != null).sort((a, b) => b.ts - a.ts);

  const bulkRows = bulk
    .map(
      (row) => `
        <div class="hist-row hist-bulk">
          <span style="color:${xpKinds[row.kind].color}">${icon(xpKinds[row.kind].icon)}</span>
          <div class="hist-copy">
            <p class="hist-title">${xpKinds[row.kind].label}</p>
            <p class="hist-meta">${formatNumber(row.count)} Einträge · ohne Zeitpunkte</p>
          </div>
          <span class="hist-xp" style="color:${xpKinds[row.kind].color}">+${formatNumber(row.amount)}</span>
        </div>
      `
    )
    .join("");

  const shown = timed.slice(0, historyLimit);
  let html = "";
  let currentDay = null;
  shown.forEach((row) => {
    const day = startOfDay(row.ts);
    if (day !== currentDay) {
      currentDay = day;
      const dayTotal = timed
        .filter((item) => startOfDay(item.ts) === day)
        .reduce((sum, item) => sum + item.amount, 0);
      html += `<div class="hist-group"><span>${dayHeading(row.ts)}</span><span>+${formatNumber(dayTotal)}</span></div>`;
    }
    const style = xpItemStyle(row.item);
    html += `
      <div class="hist-row">
        <span style="color:${style.color}">${icon(style.icon)}</span>
        <div class="hist-copy">
          <p class="hist-title">${escapeHtml(row.title || style.label)}</p>
          <p class="hist-meta">${xpKinds[row.kind].label} · ${style.label}</p>
        </div>
        <span class="hist-xp" style="color:${style.color}">+${formatNumber(row.amount)}</span>
      </div>
    `;
  });

  if (!bulk.length && !timed.length) html = `<p class="empty-note">Noch keine Aktivität.</p>`;
  const more =
    timed.length > historyLimit
      ? `<button class="hist-more" type="button" id="history-more">Mehr anzeigen</button>`
      : "";

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("history")}<span>Historie</span></div>
      ${bulkRows}${html}${more}
    </section>
  `;
}

function renderProgress() {
  progressBody.innerHTML =
    renderDonutCard() + renderHistoryCard() + renderLevelsCard() + renderLogCard();
}

function openProgress(push = true) {
  closeSheet();
  closeCtxMenu();
  closeComposer();
  profileModal.hidden = true;
  historyLimit = 20;
  renderProgress();
  progressModal.hidden = false;
  progressBody.scrollTop = 0;
  if (push) history.pushState({ view: "progress", from: sourceView }, "", "#/fortschritt");
}

function closeProgress() {
  if (progressModal.hidden) return;
  if (history.state && history.state.view === "progress") {
    history.back();
    return;
  }
  progressModal.hidden = true;
}

document.getElementById("level-btn").addEventListener("click", () => openProgress());
document.getElementById("progress-close").addEventListener("click", closeProgress);
progressModal.addEventListener("click", (event) => {
  if (event.target === progressModal) closeProgress();
});

progressBody.addEventListener("click", (event) => {
  const range = event.target.closest("[data-range]");
  if (range) {
    progressRange = Number(range.dataset.range);
    const scroll = progressBody.scrollTop;
    renderProgress();
    progressBody.scrollTop = scroll;
    return;
  }
  if (event.target.closest("#history-more")) {
    historyLimit += 20;
    const scroll = progressBody.scrollTop;
    renderProgress();
    progressBody.scrollTop = scroll;
  }
});

/* ---------- Profil: Nutzungszeit und Serien ---------- */

/* Tagesschluessel „JJJJ-MM-TT“ wie im Kalender; dayKey und parseDay stehen dort */
function usageKeyOf(ts) {
  return dayKey(new Date(ts));
}

/* Verschiebt einen Tagesbeginn um ganze Tage; Sommerzeit bleibt dabei richtig */
function dayShift(ts, days) {
  const date = addDays(new Date(ts), days);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function saveUsage() {
  try {
    localStorage.setItem(usageKey, JSON.stringify(usage));
  } catch (error) {
    /* ohne Speicher zaehlt die Zeit nur bis zum Neuladen */
  }
}

/* Beispielwerte fuer den ersten Start, damit Verlauf und Raster nicht leer sind.
   Fester Startwert, damit bei jedem Geraet dieselbe Beispielkurve entsteht. */
function seedUsage() {
  let seed = 20250619;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const today = startOfDay(Date.now());
  for (let back = 250; back >= 0; back -= 1) {
    const ts = dayShift(today, -back);
    const weekday = new Date(ts).getDay();
    const chance = weekday === 0 || weekday === 6 ? 0.32 : 0.7;
    if (random() > chance) continue;
    usage[usageKeyOf(ts)] = Math.round((10 + random() * 75) * 60);
  }
  usage[usageKeyOf(Date.now())] = Math.max(usage[usageKeyOf(Date.now())] || 0, 14 * 60);
}

function loadUsage() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(usageKey));
  } catch (error) {
    /* kaputte Daten werden ignoriert */
  }
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    usage = saved;
    return;
  }
  seedUsage();
  saveUsage();
}

/* Zaehlt nur die Zeit, in der die App sichtbar ist; lange Pausen zaehlen nicht mit */
function trackUsage() {
  const now = Date.now();
  const spent = Math.min(60, Math.round((now - usageTickAt) / 1000));
  usageTickAt = now;
  if (document.hidden || spent <= 0) return;
  const key = usageKeyOf(now);
  usage[key] = (usage[key] || 0) + spent;
  saveUsage();
}

function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} Std ${rest} Min` : `${hours} Std`;
}

/* Kurze Schrift fuer die Achse: volle Stunden als Stunden, sonst Minuten */
function shortDuration(minutes) {
  if (!minutes) return "0";
  if (minutes % 60 === 0) return `${minutes / 60} Std`;
  return `${minutes} Min`;
}

/* Serie: jeder Tag mit Nutzungszeit zaehlt. Laeuft heute noch nichts,
   beginnt die laufende Serie bei gestern, damit sie nicht vorzeitig reisst. */
function usageStreaks() {
  const active = new Set(Object.keys(usage).filter((key) => usage[key] > 0));
  const today = startOfDay(Date.now());
  let current = 0;
  let cursor = active.has(usageKeyOf(today)) ? today : dayShift(today, -1);
  while (active.has(usageKeyOf(cursor))) {
    current += 1;
    cursor = dayShift(cursor, -1);
  }

  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let previous = null;
  sorted.forEach((key) => {
    const ts = parseDay(key).getTime();
    run = previous !== null && Math.round((ts - previous) / 86400000) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = ts;
  });
  return { current, longest };
}

function renderProfileId() {
  return `
    <section class="profile-id">
      <div class="profile-avatar" aria-hidden="true">PA</div>
      <p class="profile-name">Paul Angeles</p>
      <p class="profile-mail">paul@paralist.app</p>
      <p class="profile-meta">Pro · Dabei seit Juni 2025</p>
    </section>
  `;
}

/* Balken je Tag: wie lange die App an diesem Tag offen war */
function renderUsageCard() {
  const days = usageRange;
  const today = startOfDay(Date.now());
  const rows = [];
  for (let back = days - 1; back >= 0; back -= 1) {
    const ts = dayShift(today, -back);
    rows.push({ ts, seconds: usage[usageKeyOf(ts)] || 0 });
  }
  const total = rows.reduce((sum, row) => sum + row.seconds, 0);
  const activeDays = rows.filter((row) => row.seconds > 0).length;

  const width = 326;
  const height = 200;
  const plotLeft = 0;
  const plotRight = 282;
  const plotTop = 10;
  const plotBottom = 160;
  const maxMinutes = Math.max(...rows.map((row) => row.seconds / 60), 1);
  const steps = [5, 10, 15, 30, 60, 90, 120, 180, 240, 360, 480];
  const step = steps.find((value) => maxMinutes / value <= 4) || 720;
  const yMax = Math.max(step, Math.ceil(maxMinutes / step) * step);
  const x = (index) => plotLeft + ((index + 0.5) / days) * (plotRight - plotLeft);
  const y = (minutes) => plotBottom - (minutes / yMax) * (plotBottom - plotTop);

  let grid = "";
  for (let value = 0; value <= yMax; value += step) {
    grid += `<line class="chart-axis" x1="${plotLeft}" x2="${plotRight}" y1="${y(value).toFixed(1)}" y2="${y(value).toFixed(1)}" />
      <text class="chart-label" x="${width}" y="${(y(value) + 4).toFixed(1)}" text-anchor="end">${shortDuration(value)}</text>`;
  }

  const labelStep = days <= 7 ? 1 : days <= 30 ? 7 : 21;
  const labelFormat =
    days <= 7
      ? new Intl.DateTimeFormat("de-DE", { weekday: "short" })
      : new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" });
  let labels = "";
  for (let index = days <= 7 ? 0 : labelStep; index < days; index += labelStep) {
    const xi = x(index).toFixed(1);
    labels += `<line class="chart-grid" x1="${xi}" x2="${xi}" y1="${plotTop}" y2="${plotBottom}" />
      <text class="chart-label" x="${xi}" y="${plotBottom + 22}" text-anchor="middle">${labelFormat.format(new Date(rows[index].ts))}</text>`;
  }

  const barWidth = Math.max(2, ((plotRight - plotLeft) / days) * 0.55);
  const bars = rows
    .map((row, index) => {
      const minutes = row.seconds / 60;
      if (!minutes) return "";
      const top = y(minutes);
      return `<rect class="usage-bar" x="${(x(index) - barWidth / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(1.5, plotBottom - top).toFixed(1)}" rx="${Math.min(2.5, barWidth / 2).toFixed(1)}" />`;
    })
    .join("");

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("clock")}<span>Nutzungszeit</span></div>
      <p class="stat-big">${formatDuration(total)}</p>
      <p class="stat-sub">an ${activeDays} von ${days} Tagen · ⌀ ${formatDuration(activeDays ? total / activeDays : 0)} je aktivem Tag</p>
      <div class="seg" id="usage-range">
        ${[7, 30, 90]
          .map(
            (value) =>
              `<button type="button" data-usage-range="${value}" class="${value === days ? "is-active" : ""}">${value} Tage</button>`
          )
          .join("")}
      </div>
      <svg class="chart" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        ${grid}
        ${labels}
        ${bars}
      </svg>
    </section>
  `;
}

/* Punkte-Raster: eine Spalte je Monat, eine Zeile je Wochentag.
   Je dunkler der Punkt, desto mehr Zeit lief an diesem Wochentag im Monat. */
function renderStreakCard() {
  const streak = usageStreaks();
  const year = new Date().getFullYear();
  const cells = Array.from({ length: 12 }, () => new Array(7).fill(0));
  Object.keys(usage).forEach((key) => {
    const date = parseDay(key);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return;
    cells[date.getMonth()][(date.getDay() + 6) % 7] += usage[key];
  });
  const max = Math.max(...cells.flat(), 1);

  const weekdays = ["M", "D", "M", "D", "F", "S", "S"];
  const weekdayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  const monthLetters = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];

  let grid = "";
  for (let row = 0; row < 7; row += 1) {
    grid += `<span class="dot-label">${weekdays[row]}</span>`;
    for (let month = 0; month < 12; month += 1) {
      const value = cells[month][row];
      const level = value ? Math.min(4, Math.ceil((value / max) * 4)) : 0;
      const title = value
        ? `${weekdayNames[row]} im ${monthNames[month]}: ${formatDuration(value)}`
        : `${weekdayNames[row]} im ${monthNames[month]}: keine Zeit`;
      grid += `<span class="dot is-l${level}" title="${title}"></span>`;
    }
  }
  grid += `<span class="dot-label"></span>`;
  grid += monthLetters.map((letter) => `<span class="dot-month">${letter}</span>`).join("");

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("flame")}<span>Serie</span></div>
      <div class="streak-row">
        <div class="streak-box">
          <p class="streak-label">Aktuelle Serie</p>
          <p class="streak-value">${streak.current} T</p>
        </div>
        <div class="streak-box">
          <p class="streak-label">Längste</p>
          <p class="streak-value">${streak.longest} T</p>
        </div>
      </div>
      <div class="dotgrid">${grid}</div>
      <p class="chart-note">Wochentage von Montag oben bis Sonntag unten · ${year}</p>
    </section>
  `;
}

function profileRows(rows) {
  return rows
    .map(
      (row) => `
        <button class="plist-row${row.danger ? " is-danger" : ""}" type="button">
          ${icon(row.icon)}
          <span>${row.label}</span>
          ${row.trail ? icon(row.trail, "plist-trail") : ""}
        </button>
      `
    )
    .join("");
}

function renderProfileLists() {
  return `
    <p class="psection">Plan</p>
    <section class="plist">
      ${profileRows([{ icon: "arrow-up-circle", label: "Plan verwalten", trail: "chevron" }])}
    </section>
    <p class="psection">Support</p>
    <section class="plist">
      ${profileRows([
        { icon: "help", label: "Hilfe", trail: "external" },
        { icon: "roadmap", label: "Roadmap", trail: "external" },
        { icon: "globe", label: "Produkt-Weltkarte", trail: "external" },
        { icon: "cube", label: "Danksagungen", trail: "chevron" },
      ])}
    </section>
    <p class="psection">Mehr</p>
    <section class="plist">
      ${profileRows([{ icon: "signout", label: "Abmelden" }])}
    </section>
    <p class="psection">Gefahrenzone</p>
    <section class="plist">
      ${profileRows([{ icon: "trash", label: "Konto löschen", danger: true }])}
    </section>
    <p class="profile-version">PARALIST 0.1.0 (MVP)</p>
  `;
}

function renderProfile() {
  profileBody.innerHTML =
    renderProfileId() + renderUsageCard() + renderStreakCard() + renderProfileLists();
}

function openProfile(push = true) {
  closeSheet();
  closeCtxMenu();
  closeComposer();
  progressModal.hidden = true;
  trackUsage();
  renderProfile();
  profileModal.hidden = false;
  profileBody.scrollTop = 0;
  if (push) history.pushState({ view: "profile", from: sourceView }, "", "#/profil");
}

function closeProfile() {
  if (profileModal.hidden) return;
  if (history.state && history.state.view === "profile") {
    history.back();
    return;
  }
  profileModal.hidden = true;
}

document.getElementById("profile-btn").addEventListener("click", () => openProfile());
document.getElementById("profile-close").addEventListener("click", closeProfile);
profileModal.addEventListener("click", (event) => {
  if (event.target === profileModal) closeProfile();
});

profileBody.addEventListener("click", (event) => {
  const range = event.target.closest("[data-usage-range]");
  if (!range) return;
  usageRange = Number(range.dataset.usageRange);
  const scroll = profileBody.scrollTop;
  renderProfile();
  profileBody.scrollTop = scroll;
});

setInterval(trackUsage, 15000);
document.addEventListener("visibilitychange", () => {
  trackUsage();
  usageTickAt = Date.now();
});
window.addEventListener("pagehide", trackUsage);

/* ---------- Darstellung (Hell / Dunkel / System) ---------- */

function currentTheme() {
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch (error) {
    /* ohne Speicher gilt System */
  }
  return "system";
}

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function setTheme(theme) {
  try {
    if (theme === "system") localStorage.removeItem(themeKey);
    else localStorage.setItem(themeKey, theme);
  } catch (error) {
    /* ohne Speicher gilt die Wahl nur bis zum Neuladen */
  }
  applyTheme(theme);
  renderThemeOptions();
}

function renderThemeOptions() {
  const active = currentTheme();
  themeOptions.innerHTML = themes
    .map(
      (theme) => `
        <button class="settings-row${theme.id === active ? " is-active" : ""}" type="button" data-theme-option="${theme.id}">
          ${icon(theme.icon)}
          <span>${theme.label}</span>
          ${icon("check", "settings-check")}
        </button>
      `
    )
    .join("");
}

themeOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme-option]");
  if (button) setTheme(button.dataset.themeOption);
});

/* ---------- Kalender ---------- */

const calMonthBtn = document.getElementById("cal-month");
const calMonthLabel = document.getElementById("cal-month-label");
const calStrip = document.getElementById("cal-strip");
const calWeeks = document.getElementById("cal-weeks");
const calModeBtn = document.getElementById("cal-mode");
const calModeIcon = document.getElementById("cal-mode-icon");
const calTodayBtn = document.getElementById("cal-today");
const calSpanBtn = document.getElementById("cal-span");
const calPanel = document.getElementById("cal-panel");

/* Zeitraum des Streifens (Wochen, 0 = ganzer Monat), Ansicht der Fläche (Raster oder Liste)
   und die gewählte Spalte der Liste. Wird mit dem übrigen Zustand gespeichert. */
let calPrefs = { span: 1, mode: "grid", seg: "termine" };
let calSelected = dayKey(new Date());
let calSlot = null;
let calDrag = null;
let calSwiped = false;
let calSnapping = false;
let calWheel = 0;

const calSpans = [
  { id: 1, label: "1 Woche", short: "1 W" },
  { id: 2, label: "2 Wochen", short: "2 W" },
  { id: 0, label: "1 Monat", short: "1 M" },
];

const calSegs = [
  { id: "aufgaben", label: "Aufgaben", empty: "Keine Aufgaben" },
  { id: "termine", label: "Termine", empty: "Nichts geplant" },
  { id: "projekte", label: "Projekte", empty: "Keine Projekte" },
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

/* Tage werden als „JJJJ-MM-TT“ gemerkt, damit Vergleiche ohne Zeitzonen-Ärger klappen */
function dayKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDay(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function isoWeek(date) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
}

function timeKey(ts) {
  const date = new Date(ts);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/* Einträge ohne eigenes Datum zählen zu dem Tag, an dem sie angelegt wurden;
   Termine ohne Uhrzeit bekommen die Uhrzeit des Anlegens. */
function entryDay(entry) {
  return entry.date || dayKey(new Date(entry.createdAt || Date.now()));
}

function entryTime(entry) {
  if (entry.time) return entry.time;
  if (entry.type === "termin" && entry.createdAt) return timeKey(entry.createdAt);
  return null;
}

function entryColor(entry) {
  return (xpItems[entry.type] || xpItems.notiz).color;
}

function calDayEntries(key) {
  return entries.filter((entry) => !entry.archived && entryDay(entry) === key);
}

function calLongDate(key) {
  return parseDay(key).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* Montage der sichtbaren Wochen: eine, zwei oder alle Wochen des Monats */
function calVisibleWeeks() {
  const selected = parseDay(calSelected);
  if (calPrefs.span === 0) {
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const last = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
    const weeks = [];
    for (let monday = startOfWeek(first); monday <= last; monday = addDays(monday, 7)) weeks.push(monday);
    return weeks;
  }
  const start = startOfWeek(selected);
  return Array.from({ length: calPrefs.span }, (_, index) => addDays(start, index * 7));
}

function calWeekHtml(monday, extra = "") {
  const todayKey = dayKey(new Date());
  const month = parseDay(calSelected).getMonth();
  let html = `<div class="cal-week${extra ? ` ${extra}` : ""}"><span class="cal-kw">${isoWeek(monday)}</span>`;
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(monday, offset);
    const key = dayKey(day);
    const items = calDayEntries(key);
    const classes = ["cal-day"];
    if (key === calSelected) classes.push("is-selected");
    if (key === todayKey) classes.push("is-today");
    if (items.length) classes.push("has-items");
    if (calPrefs.span === 0 && day.getMonth() !== month) classes.push("is-other");
    html += `
      <button class="${classes.join(" ")}" type="button" data-day="${key}" aria-label="${calLongDate(key)}">
        <span class="cal-day-num">${day.getDate()}</span>
        ${items.length ? `<span class="cal-day-dot" style="background:${entryColor(items.find((item) => item.type === "termin") || items[0])}"></span>` : ""}
      </button>`;
  }
  return `${html}</div>`;
}

function renderCalStrip() {
  const weeks = calVisibleWeeks();
  calMonthLabel.textContent = parseDay(calSelected).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  calWeeks.innerHTML =
    calWeekHtml(addDays(weeks[0], -7), "is-peek is-before") +
    weeks.map((monday) => calWeekHtml(monday)).join("") +
    calWeekHtml(addDays(weeks[weeks.length - 1], 7), "is-peek is-after");
  calTodayBtn.classList.toggle("is-on", calSelected === dayKey(new Date()));
  calSpanBtn.textContent = calSpans.find((span) => span.id === calPrefs.span).short;
  /* Der runde Knopf zeigt immer die Ansicht, zu der er wechselt */
  calModeIcon.setAttribute("href", calPrefs.mode === "grid" ? "#icon-list" : "#icon-timeline");
}

function calListEntries() {
  const seg = calPrefs.seg;
  return calDayEntries(calSelected)
    .filter((entry) => {
      if (seg === "aufgaben") return entry.type === "aufgabe";
      if (seg === "termine") return entry.type === "termin";
      return sameParent(entry.parent, overviewPages[3].parent);
    })
    .sort((a, b) => String(entryTime(a) || "").localeCompare(String(entryTime(b) || "")));
}

function renderCalList() {
  const list = calListEntries();
  const seg = calSegs.find((item) => item.id === calPrefs.seg);
  const tabsHtml = calSegs
    .map(
      (item) => `
        <button class="cal-seg-btn${item.id === calPrefs.seg ? " is-active" : ""}" type="button" data-seg="${item.id}">${item.label}</button>
      `
    )
    .join("");
  const bodyHtml = list.length
    ? `<div class="workspace-list">${list
        .map((entry) => entryRow(entry, entryTime(entry) ? `<span class="cal-time">${entryTime(entry)}</span>` : ""))
        .join("")}</div>`
    : `
      <div class="cal-empty">
        ${icon("calendar")}
        <b>${seg.empty}</b>
        <span>${calLongDate(calSelected)}</span>
      </div>`;
  return `<div class="cal-seg">${tabsHtml}</div>${bodyHtml}`;
}

function calHourHeight() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cal-hour-h")) || 56;
}

const calGridTop = 10; /* Abstand über der 00:00-Linie, gleich dem Innenabstand von .cal-hours */

function calNowY(hourHeight) {
  const now = new Date();
  return calGridTop + (now.getHours() + now.getMinutes() / 60) * hourHeight;
}

/* Im Raster liegen nur Termine; Aufgaben, Notizen und Medien gehören in die Liste */
function renderCalGrid() {
  const items = calDayEntries(calSelected).filter((entry) => entry.type === "termin");
  const timed = items.filter((entry) => entryTime(entry));
  const allDay = items.filter((entry) => !entryTime(entry));
  const hourHeight = calHourHeight();
  let html = "";

  if (allDay.length) {
    html += `<div class="cal-allday">${allDay
      .map(
        (entry) => `
          <button class="cal-allday-chip" type="button" data-open-entry="${entry.id}" style="--event-color:${entryColor(entry)}">
            ${icon(typeIcon(entry.type))}${escapeHtml(entry.title)}
          </button>`
      )
      .join("")}</div>`;
  }

  html += `<div class="cal-hours">`;
  for (let hour = 0; hour < 24; hour += 1) {
    html += `<div class="cal-hour" data-hour="${hour}"><span class="cal-hour-label">${pad2(hour)}:00</span><span class="cal-hour-line"></span></div>`;
  }

  /* Termine zur selben Uhrzeit werden leicht versetzt, damit keiner ganz verschwindet */
  const seen = {};
  timed.forEach((entry) => {
    const time = entryTime(entry);
    const [hour, minute] = time.split(":").map(Number);
    const shift = seen[time] || 0;
    seen[time] = shift + 1;
    const top = calGridTop + (hour + minute / 60) * hourHeight;
    html += `
      <button class="cal-event" type="button" data-open-entry="${entry.id}" style="top:${top}px;height:${hourHeight - 4}px;margin-left:${shift * 12}px;--event-color:${entryColor(entry)}">
        ${escapeHtml(entry.title)}<small>${time}</small>
      </button>`;
  });

  if (calSelected === dayKey(new Date())) {
    html += `
      <div class="cal-now" id="cal-now" style="top:${calNowY(hourHeight)}px">
        <span class="cal-now-time"><span id="cal-now-label">${timeKey(Date.now())}</span></span>
        <span class="cal-now-line"></span>
      </div>`;
  }
  return `${html}</div>`;
}

function calScrollToNow() {
  const target = document.getElementById("cal-now") || calPanel.querySelector('[data-hour="8"]');
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "center" }));
}

function renderCalendar(opened = false) {
  renderCalStrip();
  calPanel.innerHTML = calPrefs.mode === "grid" ? renderCalGrid() : renderCalList();
  if (opened && calPrefs.mode === "grid") calScrollToNow();
}

/* Die Jetzt-Linie wandert mit der Uhr weiter */
function calTick() {
  const now = document.getElementById("cal-now");
  if (!now) return;
  now.style.top = `${calNowY(calHourHeight())}px`;
  document.getElementById("cal-now-label").textContent = timeKey(Date.now());
}

function calShift(direction) {
  const selected = parseDay(calSelected);
  if (calPrefs.span === 0) {
    calShiftMonth(direction);
    return;
  }
  calSelected = dayKey(addDays(selected, direction * 7 * calPrefs.span));
  renderCalendar();
}

function calShiftMonth(direction) {
  const selected = parseDay(calSelected);
  const next = new Date(selected.getFullYear(), selected.getMonth() + direction, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(selected.getDate(), lastDay));
  calSelected = dayKey(next);
  renderCalendar();
}

function calGoToday() {
  calSelected = dayKey(new Date());
  renderCalendar(true);
}

function calSetSpan(span) {
  calPrefs.span = span;
  saveState();
  renderCalendar();
}

function calSetMode(mode) {
  calPrefs.mode = mode;
  saveState();
  renderCalendar(mode === "grid");
}

calMonthBtn.addEventListener("click", () => {
  openCtxMenu(calMonthBtn, [
    { icon: "back", label: "Vorheriger Monat", onSelect: () => calShiftMonth(-1) },
    { icon: "chevron", label: "Nächster Monat", onSelect: () => calShiftMonth(1) },
    { icon: "calendar", label: "Zu heute", onSelect: calGoToday },
  ]);
});

calModeBtn.addEventListener("click", () => calSetMode(calPrefs.mode === "grid" ? "list" : "grid"));
calTodayBtn.addEventListener("click", calGoToday);

calSpanBtn.addEventListener("click", () => {
  openSheet(
    "Zeitraum",
    calSpans.map((span) => ({
      icon: "calendar",
      label: span.label,
      active: span.id === calPrefs.span,
      onSelect: () => calSetSpan(span.id),
    }))
  );
});

/* Tag antippen wählt ihn aus. Senkrecht ziehen oder scrollen blättert eine Woche (im Monatslayout
   einen Monat), waagerecht wischen blättert den ganzen sichtbaren Zeitraum. */
calStrip.addEventListener("click", (event) => {
  if (calSwiped) return;
  const day = event.target.closest("[data-day]");
  if (!day) return;
  calSelected = day.dataset.day;
  renderCalendar();
});

function calRowHeight() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cal-row-h")) || 52;
}

/* Blättert um eine Zeile: der Block gleitet weg, danach wird neu gezeichnet */
function calSnapRows(direction) {
  if (calSnapping) return;
  calSnapping = true;
  calSwiped = true;
  const finish = () => {
    calWeeks.removeEventListener("transitionend", finish);
    calWeeks.style.transition = "none";
    calWeeks.style.transform = "";
    if (calPrefs.span === 0) calShiftMonth(direction);
    else {
      calSelected = dayKey(addDays(parseDay(calSelected), direction * 7));
      renderCalendar();
    }
    calSnapping = false;
    setTimeout(() => {
      calSwiped = false;
    }, 0);
  };
  calWeeks.addEventListener("transitionend", finish);
  calWeeks.style.transition = "transform 0.18s ease-out";
  calWeeks.style.transform = `translateY(${-direction * calRowHeight()}px)`;
  setTimeout(finish, 260); /* Fallback, falls kein transitionend kommt */
}

function calResetDrag() {
  calWeeks.style.transition = "transform 0.18s ease-out";
  calWeeks.style.transform = "";
}

calStrip.addEventListener("pointerdown", (event) => {
  if (calSnapping) return;
  calDrag = { x: event.clientX, y: event.clientY, axis: null, id: event.pointerId };
});

calStrip.addEventListener("pointermove", (event) => {
  if (!calDrag || calDrag.id !== event.pointerId) return;
  const dx = event.clientX - calDrag.x;
  const dy = event.clientY - calDrag.y;
  if (!calDrag.axis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    calDrag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (calDrag.axis === "y") calStrip.setPointerCapture(event.pointerId);
  }
  if (calDrag.axis !== "y") return;
  const limit = calRowHeight();
  calWeeks.style.transition = "none";
  calWeeks.style.transform = `translateY(${Math.max(-limit, Math.min(limit, dy))}px)`;
});

calStrip.addEventListener("pointerup", (event) => {
  if (!calDrag) return;
  const dx = event.clientX - calDrag.x;
  const dy = event.clientY - calDrag.y;
  const axis = calDrag.axis;
  calDrag = null;

  if (axis === "y") {
    if (Math.abs(dy) > calRowHeight() / 3) calSnapRows(dy < 0 ? 1 : -1);
    else calResetDrag();
    calSwiped = true;
    setTimeout(() => {
      calSwiped = false;
    }, 0);
    return;
  }

  if (axis !== "x" || Math.abs(dx) < 40) return;
  calSwiped = true;
  setTimeout(() => {
    calSwiped = false;
  }, 0);
  calShift(dx < 0 ? 1 : -1);
});

/* Mausrad und Trackpad über dem Streifen blättern die Wochen statt die Seite */
calStrip.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    calWheel += event.deltaY;
    if (Math.abs(calWheel) < 40 || calSnapping) return;
    const direction = calWheel > 0 ? 1 : -1;
    calWheel = 0;
    calSnapRows(direction);
  },
  { passive: false }
);

calStrip.addEventListener("pointercancel", () => {
  calDrag = null;
  calResetDrag();
});

/* In der Fläche: Spalte wechseln oder eine leere Stunde antippen, um dort einen Termin anzulegen */
calPanel.addEventListener("click", (event) => {
  const seg = event.target.closest("[data-seg]");
  if (seg) {
    calPrefs.seg = seg.dataset.seg;
    saveState();
    renderCalendar();
    return;
  }
  if (event.target.closest("[data-open-entry]")) return;
  const hour = event.target.closest("[data-hour]");
  if (!hour) return;
  calSlot = { date: calSelected, time: `${pad2(Number(hour.dataset.hour))}:00` };
  composerType = "termin";
  openComposer();
});

setInterval(calTick, 30000);

/* ---------- Wischen ---------- */

let drag = null;

/* Wie weit eine Zeile aufgeht, hängt davon ab, wie viele Knöpfe sie hat */
function swipeLimits(body) {
  const styles = getComputedStyle(document.documentElement);
  const size = parseInt(styles.getPropertyValue("--swipe-action-size"), 10) || 44;
  const gap = parseInt(styles.getPropertyValue("--swipe-action-gap"), 10) || 10;
  const wrap = body.closest(".swipe");
  const span = (position) => {
    const count = wrap.querySelectorAll(`.swipe-actions-${position} .swipe-action`).length;
    return count ? count * size + (count + 1) * gap : 0;
  };
  return { left: span("left"), right: span("right") };
}

function setSwipe(body, x) {
  body.dataset.x = String(x);
  body.style.transform = `translateX(${x}px)`;
}

function closeSwipes(except) {
  document.querySelectorAll(".swipe-body").forEach((body) => {
    if (body !== except && Number(body.dataset.x || 0) !== 0) setSwipe(body, 0);
  });
}

content.addEventListener("pointerdown", (event) => {
  const tabPill = event.target.closest("[data-tab-id]");
  const workspaceBtn = event.target.closest("[data-open-workspace]");
  if (tabPill) startHold(event, tabPill, "tab");
  else if (workspaceBtn) startHold(event, workspaceBtn, "workspace");

  const body = event.target.closest(".swipe-body");
  if (!body || event.target.closest(".swipe-action")) return;
  drag = {
    body,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    start: Number(body.dataset.x || 0),
    axis: null,
  };
});

content.addEventListener("pointermove", (event) => {
  if (hold && event.pointerId === hold.pointerId) {
    const moved = Math.hypot(event.clientX - hold.startX, event.clientY - hold.startY);
    if (moved > 8) cancelHold();
  }

  if (!drag || event.pointerId !== drag.pointerId) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;

  if (!drag.axis) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (drag.axis === "x") {
      cancelHold();
      drag.body.classList.add("is-sliding");
      closeSwipes(drag.body);
    }
  }
  if (drag.axis !== "x") return;

  const limits = swipeLimits(drag.body);
  setSwipe(drag.body, Math.max(-limits.right, Math.min(limits.left, drag.start + dx)));
});

function endDrag() {
  if (finishHold()) {
    if (drag) {
      const body = drag.body;
      drag = null;
      body.classList.remove("is-sliding");
      setSwipe(body, 0);
    }
    return;
  }

  if (!drag) return;
  const body = drag.body;
  drag = null;
  body.classList.remove("is-sliding");

  const limits = swipeLimits(body);
  const x = Number(body.dataset.x || 0);
  if (limits.right && x <= -limits.right / 2) setSwipe(body, -limits.right);
  else if (limits.left && x >= limits.left / 2) setSwipe(body, limits.left);
  else setSwipe(body, 0);
}

content.addEventListener("pointerup", endDrag);
content.addEventListener("pointercancel", endDrag);
window.addEventListener("pointerup", () => {
  if (hold || drag) endDrag();
});
window.addEventListener("pointercancel", () => {
  if (hold || drag) endDrag();
});

/* ---------- Medien ---------- */

const mediaFilters = document.getElementById("media-filters");
const mediaBody = document.getElementById("media-body");
const mediaActions = document.getElementById("media-actions");
const mediaKey = "paralist-media";
const thumbSize = 360; /* längste Kante der Vorschaubilder in Pixeln; kleiner = weniger Speicher, gröber */

/* Welche Pille oben gewählt ist; wird mit dem übrigen Zustand gespeichert */
let mediaPrefs = { filter: "recent" };

/* Vorschaubilder je Eintrag: { "12": "data:image/jpeg;base64,…" }.
   Liegen getrennt vom übrigen Zustand, weil sie viel Platz brauchen. */
let mediaThumbs = {};

/* Die Pillen oben: „Zuletzt erstellt“ zeigt alles, die anderen nur eine Art */
const mediaFilterList = [
  { id: "recent", label: "Zuletzt erstellt", icon: "history", empty: "Noch keine Medien." },
  { id: "image", label: "Bilder", icon: "image", empty: "Noch keine Bilder." },
  { id: "video", label: "Videos", icon: "video", empty: "Noch keine Videos." },
  { id: "audio", label: "Audio", icon: "mic", empty: "Noch keine Aufnahmen." },
  { id: "doc", label: "Dokumente", icon: "doc", empty: "Noch keine Dokumente." },
];

/* Beispielmedien für den ersten Start: „sample“ wählt eine Farbfläche aus styles.css,
   „days“ sagt, wie viele Tage der Eintrag zurückliegt (so entstehen mehrere Monatsblöcke) */
const sampleMedia = [
  { kind: "image", sample: 1, title: "Foto 1", days: 0 },
  { kind: "doc", title: "Lebenslauf", days: 0 },
  { kind: "image", sample: 2, title: "Foto 2", days: 0 },
  { kind: "video", sample: 8, title: "Video 1", days: 1, duration: 12 },
  { kind: "image", sample: 3, title: "Foto 3", days: 1 },
  { kind: "image", sample: 4, title: "Foto 4", days: 2 },
  { kind: "audio", title: "Sprachmemo", days: 3, duration: 38 },
  { kind: "image", sample: 5, title: "Foto 5", days: 5 },
  { kind: "doc", title: "Skript Statistik", days: 6 },
  { kind: "image", sample: 6, title: "Foto 6", days: 9 },
  { kind: "video", sample: 9, title: "Video 2", days: 24, duration: 47 },
  { kind: "image", sample: 7, title: "Foto 7", days: 26 },
  { kind: "doc", title: "Mietvertrag", days: 30 },
];

/* Beispielmedien landen in der Inbox und zählen nicht als „angelegt“, darum kein XP-Eintrag */
function seedMedia() {
  sampleMedia.forEach((sample, index) => {
    entries.push({
      id: nextEntryId++,
      type: "medien",
      title: sample.title,
      body: "",
      parent: null,
      archived: false,
      favorite: false,
      createdAt: Date.now() - sample.days * 86400000 - index * 60000,
      media: { kind: sample.kind, sample: sample.sample || 0, duration: sample.duration || 0 },
    });
  });
}

function loadThumbs() {
  try {
    mediaThumbs = JSON.parse(localStorage.getItem(mediaKey)) || {};
  } catch (error) {
    mediaThumbs = {};
  }
}

function saveThumbs() {
  try {
    localStorage.setItem(mediaKey, JSON.stringify(mediaThumbs));
  } catch (error) {
    /* Speicher voll: neue Vorschauen gelten nur bis zum Neuladen */
  }
}

/* Gelöschte Einträge nehmen ihr Vorschaubild mit */
function pruneThumbs() {
  let changed = false;
  Object.keys(mediaThumbs).forEach((id) => {
    if (entries.some((entry) => String(entry.id) === id)) return;
    delete mediaThumbs[id];
    changed = true;
  });
  if (changed) saveThumbs();
}

/* Einträge aus dem Eingabefeld haben keine Datei und zählen als Dokument */
function mediaKindOf(entry) {
  return (entry.media && entry.media.kind) || "doc";
}

function mediaEntries() {
  return entries
    .filter((entry) => entry.type === "medien" && !entry.archived)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function mediaFiltered(filter) {
  const all = mediaEntries();
  if (filter === "recent") return all;
  return all.filter((entry) => mediaKindOf(entry) === filter);
}

/* Überschrift je Monatsblock, z.B. „September 2026“ */
function monthHeading(ts) {
  if (!ts) return "Älter";
  return new Date(ts).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${pad2(total % 60)}`;
}

/* Eine Kachel: Bild oder Videovorschau, sonst Icon mit Name; Videos und Aufnahmen zeigen ihre Dauer */
function mediaCell(entry) {
  const media = entry.media || {};
  const kind = mediaKindOf(entry);
  const thumb = mediaThumbs[entry.id];
  const title = escapeHtml(entry.title || media.name || "Ohne Titel");
  const iconCell = (name) =>
    `<div class="media-doc">${icon(name, "media-doc-icon")}<span class="media-doc-name">${title}</span></div>`;
  let inner;

  if ((kind === "image" || kind === "video") && thumb) inner = `<img class="media-img" src="${thumb}" alt="" />`;
  else if ((kind === "image" || kind === "video") && media.sample) inner = `<div class="media-img media-sample-${media.sample}"></div>`;
  else if (kind === "image") inner = iconCell("image");
  else if (kind === "video") inner = iconCell("video");
  else if (kind === "audio") inner = iconCell("wave");
  else inner = iconCell("doc");

  if (kind === "video") {
    inner += `<span class="media-badge">${icon("video")}${media.duration ? formatDuration(media.duration) : ""}</span>`;
  } else if (kind === "audio" && media.duration) {
    inner += `<span class="media-badge">${formatDuration(media.duration)}</span>`;
  }

  return `<button class="media-cell" type="button" data-open-entry="${entry.id}" aria-label="${title}">${inner}</button>`;
}

function renderMediaFilters() {
  mediaFilters.innerHTML = mediaFilterList
    .map((filter) => {
      const count = mediaFiltered(filter.id).length;
      const mark = filter.id === mediaPrefs.filter ? " is-active" : "";
      return `
        <button class="tab-pill media-filter${mark}" type="button" data-media-filter="${filter.id}">
          ${icon(filter.icon, "tab-pill-icon")}${filter.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("");
}

/* Raster: neueste zuerst, nach Monat gruppiert */
function renderMediaGrid() {
  const list = mediaFiltered(mediaPrefs.filter);
  const filter = mediaFilterList.find((item) => item.id === mediaPrefs.filter) || mediaFilterList[0];
  if (!list.length) {
    mediaBody.innerHTML = `<p class="empty-note">${filter.empty}</p>`;
    return;
  }
  const groups = [];
  list.forEach((entry) => {
    const heading = monthHeading(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(entry);
    else groups.push({ heading, items: [entry] });
  });
  mediaBody.innerHTML = groups
    .map(
      (group) =>
        `<h2 class="media-month">${group.heading}</h2><div class="media-grid">${group.items.map(mediaCell).join("")}</div>`
    )
    .join("");
}

function renderMedia() {
  renderMediaFilters();
  renderMediaGrid();
}

mediaFilters.addEventListener("click", (event) => {
  const pill = event.target.closest("[data-media-filter]");
  if (!pill) return;
  mediaPrefs.filter = pill.dataset.mediaFilter;
  saveState();
  renderMedia();
});

/* --- Dateien hinzufügen --- */

function fileKind(file) {
  const mime = file.type || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "doc";
}

/* Aufnahmen heißen „Foto 18.09.2026 02:41“, importierte Dateien behalten ihren Namen ohne Endung */
function fileTitle(file, kind, source) {
  const now = new Date();
  const stamp = `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (source === "photo") return `Foto ${stamp}`;
  if (source === "video") return `Video ${stamp}`;
  const base = (file.name || "").replace(/\.[^.]+$/, "").trim();
  if (base) return base;
  const labels = { image: "Foto", video: "Video", audio: "Aufnahme", doc: "Datei" };
  return `${labels[kind]} ${stamp}`;
}

/* canvas: nötig, um ein Bild verkleinert als kleine Datei zu speichern */
function drawThumb(source, width, height) {
  const scale = Math.min(1, thumbSize / Math.max(width || 1, height || 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((width || 1) * scale));
  canvas.height = Math.max(1, Math.round((height || 1) * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

function imageThumb(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let thumb = null;
      try {
        thumb = drawThumb(img, img.naturalWidth, img.naturalHeight);
      } catch (error) {
        /* z.B. HEIC ohne Browser-Unterstützung: Kachel zeigt dann nur das Icon */
      }
      URL.revokeObjectURL(url);
      resolve(thumb);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/* Holt ein Standbild kurz nach dem Anfang des Videos und dessen Dauer */
function videoThumb(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let done = false;
    const finish = (thumb) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve({ thumb, duration: Number.isFinite(video.duration) ? video.duration : 0 });
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      let thumb = null;
      try {
        thumb = drawThumb(video, video.videoWidth, video.videoHeight);
      } catch (error) {
        /* ohne Standbild bleibt das Video-Icon */
      }
      finish(thumb);
    };
    video.onerror = () => finish(null);
    setTimeout(() => finish(null), 4000);
    video.src = url;
  });
}

function audioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => finish(0);
    setTimeout(() => finish(0), 4000);
    audio.src = url;
  });
}

/* Jede Datei wird ein Medien-Eintrag in der Inbox; Bilder und Videos bekommen eine Vorschau */
async function addMediaFiles(fileList, source) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  for (const file of files) {
    const kind = fileKind(file);
    const entry = {
      id: nextEntryId++,
      type: "medien",
      title: fileTitle(file, kind, source),
      body: "",
      parent: null,
      archived: false,
      favorite: false,
      createdAt: Date.now(),
      media: { kind, name: file.name || "", size: file.size || 0, mime: file.type || "", duration: 0 },
    };
    if (kind === "image") {
      const thumb = await imageThumb(file);
      if (thumb) mediaThumbs[entry.id] = thumb;
    } else if (kind === "video") {
      const result = await videoThumb(file);
      if (result.thumb) mediaThumbs[entry.id] = result.thumb;
      entry.media.duration = result.duration;
    } else if (kind === "audio") {
      entry.media.duration = await audioDuration(file);
    }
    entries.push(entry);
    logXp("created", "medien", entry.title);
  }
  saveThumbs();
  saveState();
  renderLevel();
  refreshLists();
}

/* Die runden Knöpfe öffnen das passende unsichtbare Dateifeld */
mediaActions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-media-pick]");
  if (!button) return;
  document.getElementById(`media-file-${button.dataset.mediaPick}`).click();
});

["photo", "video", "audio", "import"].forEach((source) => {
  const input = document.getElementById(`media-file-${source}`);
  input.addEventListener("change", () => {
    addMediaFiles(input.files, source);
    input.value = "";
  });
});

/* ---------- Klicks in Listen ---------- */

function refreshLists() {
  renderOverview();
  renderWorkspaces();
  renderPageBody();
  renderCalendar();
  if (mediaView.classList.contains("is-active")) renderMedia();
}

content.addEventListener(
  "click",
  (event) => {
    if (!skipClick) return;
    event.preventDefault();
    event.stopPropagation();
    skipClick = false;
  },
  true
);

content.addEventListener("contextmenu", (event) => {
  const tabPill = event.target.closest("[data-tab-id]");
  if (tabPill) {
    event.preventDefault();
    cancelHold();
    openTabMenu(tabPill);
    return;
  }
  const workspaceBtn = event.target.closest("[data-open-workspace]");
  if (workspaceBtn) {
    event.preventDefault();
    cancelHold();
    openWorkspaceMenu(workspaceBtn);
  }
});

content.addEventListener("click", (event) => {
  const action = event.target.closest(".swipe-action");
  if (action) {
    const kind = action.dataset.swipe;

    if (kind === "delete-workspace") {
      deleteWorkspace(action.closest(".swipe").dataset.workspace);
      return;
    }

    const id = action.closest(".swipe").dataset.entry;
    const entry = entries.find((item) => String(item.id) === String(id));
    if (!entry) return;

    if (kind === "delete") {
      entries = entries.filter((item) => item.id !== entry.id);
      saveState();
      refreshLists();
      return;
    }
    if (kind === "archive") {
      archiveEntry(entry);
      refreshLists();
      return;
    }
    if (kind === "favorite") {
      toggleFavorite(entry);
      return;
    }
    openParentPicker("Verknüpfen mit", entry.parent, (parent) => {
      entry.parent = parent;
      saveState();
      refreshLists();
    });
    return;
  }

  const tabPill = event.target.closest("[data-tab-id]");
  if (tabPill) {
    const id = Number(tabPill.dataset.tabId);
    if (id === activeTabId) {
      beginRenameTab(id);
      return;
    }
    activeTabId = id;
    saveState();
    renderTabs();
    renderWorkspaces();
    return;
  }

  if (event.target.closest("[data-tab-add]")) {
    addTab();
    return;
  }

  const row = event.target.closest("[data-open-entry], [data-open-workspace]");
  if (!row) return;
  const body = row.closest(".swipe-body");
  if (body && Number(body.dataset.x || 0) !== 0) {
    closeSwipes();
    return;
  }
  if (row.dataset.openEntry) openEntry(row.dataset.openEntry);
  else openTarget("workspace", row.dataset.openWorkspace);
});

workspaceTabs.addEventListener("keydown", (event) => {
  if (event.target.id !== "tab-name-input") return;
  if (event.key === "Enter") {
    event.preventDefault();
    commitTabName();
  }
});

workspaceTabs.addEventListener(
  "blur",
  (event) => {
    if (event.target.id === "tab-name-input") commitTabName();
  },
  true
);

workspaceList.addEventListener("keydown", (event) => {
  if (event.target.id !== "workspace-name-input") return;
  if (event.key === "Enter") {
    event.preventDefault();
    commitWorkspaceName();
  }
});

workspaceList.addEventListener(
  "blur",
  (event) => {
    if (event.target.id === "workspace-name-input") commitWorkspaceName();
  },
  true
);

pageBody.addEventListener("keydown", (event) => {
  if (event.target.id !== "workspace-name-input") return;
  if (event.key === "Enter") {
    event.preventDefault();
    commitWorkspaceName();
  }
});

pageBody.addEventListener(
  "blur",
  (event) => {
    if (event.target.id === "workspace-name-input") commitWorkspaceName();
  },
  true
);

/* ---------- Bedienelemente ---------- */

document.querySelector(".tab-add").addEventListener("click", () => {
  if (composer.hidden) openComposer();
  else closeComposer();
});

document.getElementById("composer-close").addEventListener("click", closeComposer);

document.getElementById("composer-link").addEventListener("click", () => {
  openParentPicker("Ablegen in", composerParent, (parent) => {
    composerParent = parent;
    renderComposerLink();
    composerInput.focus();
  });
});

composerTypes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-type]");
  if (!button) return;
  composerType = button.dataset.type;
  renderComposerTypes();
  composerInput.focus();
});

composerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    createEntry();
  }
});

sheet.addEventListener("click", (event) => {
  const option = event.target.closest("[data-sheet]");
  if (!option) {
    if (event.target === sheet) closeSheet();
    return;
  }
  const run = sheetActions[Number(option.dataset.sheet)];
  closeSheet();
  if (run) run();
});

ctxMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-ctx]");
  if (!option) {
    closeCtxMenu();
    return;
  }
  const run = ctxActions[Number(option.dataset.ctx)];
  closeCtxMenu();
  if (run) run();
});

pageMenuBtn.addEventListener("click", () => {
  if (!currentPage) return;

  if (currentPage.kind === "favorites") {
    openSheet(currentPage.title, [
      {
        label: "Alle Favoriten entfernen",
        icon: "star-outline",
        onSelect: () => {
          workspaces.forEach((workspace) => {
            workspace.favorite = false;
          });
          entries.forEach((entry) => {
            entry.favorite = false;
          });
          saveState();
          refreshLists();
        },
      },
    ]);
    return;
  }

  const options = [];

  if (currentPage.isWorkspace) {
    const workspace = workspaces.find((item) => sameParent(item.id, currentPage.parent));
    if (workspace) {
      options.push({
        label: workspace.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
        icon: workspace.favorite ? "star" : "star-outline",
        onSelect: () => toggleFavorite(workspace),
      });
      options.push({
        label: "Icon bearbeiten",
        icon: "smile",
        onSelect: () =>
          openIconPicker(workspace.icon, (name) => {
            workspace.icon = name;
            saveState();
            refreshLists();
          }),
      });
    }
  }

  options.push({
    label: "Alle Einträge löschen",
    icon: "trash",
    danger: true,
    onSelect: () => {
      entries = entries.filter((entry) => !sameParent(entry.parent, currentPage.parent));
      saveState();
      refreshLists();
    },
  });

  if (currentPage.isWorkspace) {
    options.push({
      label: "Arbeitsbereich löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        deleteWorkspace(currentPage.parent);
        restoreFrom(sourceView);
      },
    });
  }

  openSheet(currentPage.title, options);
});

document.getElementById("entry-menu").addEventListener("click", () => {
  const entry = entries.find((item) => item.id === currentEntryId);
  if (!entry) return;

  openSheet(entry.title || "Eintrag", [
    {
      label: entry.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: entry.favorite ? "star" : "star-outline",
      onSelect: () => {
        toggleFavorite(entry);
      },
    },
    {
      label: "Verknüpfen",
      icon: "link",
      onSelect: () =>
        openParentPicker("Verknüpfen mit", entry.parent, (parent) => {
          entry.parent = parent;
          entryCrumb.textContent = parentName(parent);
          saveState();
          renderOverview();
        }),
    },
    {
      label: "Archivieren",
      icon: "archive",
      onSelect: () => {
        archiveEntry(entry);
        restoreFrom(sourceView);
      },
    },
    {
      label: "Eintrag löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        entries = entries.filter((item) => item.id !== entry.id);
        saveState();
        restoreFrom(sourceView);
      },
    },
  ]);
});

entryTitle.addEventListener("input", () => {
  const entry = entries.find((item) => item.id === currentEntryId);
  if (!entry) return;
  entry.title = entryTitle.value;
  saveState();
});

entryBody.addEventListener("input", () => {
  const entry = entries.find((item) => item.id === currentEntryId);
  if (!entry) return;
  entry.body = entryBody.value;
  saveState();
});

document.getElementById("back-btn").addEventListener("click", (event) => {
  event.preventDefault();
  restoreFrom(sourceView);
});

document.getElementById("entry-back").addEventListener("click", (event) => {
  event.preventDefault();
  history.back();
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    showTab(btn.dataset.tab);
  });
});

document.getElementById("search-entry").addEventListener("click", () => {
  showSearch();
});

searchInput.addEventListener("focus", () => {
  showSearch();
});

window.addEventListener("popstate", (event) => {
  const state = event.state;
  closeSheet();
  closeCtxMenu();
  progressModal.hidden = true;
  profileModal.hidden = true;

  if (state && state.view === "progress") {
    openProgress(false);
    return;
  }
  if (state && state.view === "profile") {
    openProfile(false);
    return;
  }
  if (!state || state.view === "home") {
    showHome(true);
    return;
  }
  if (state.view === "search") {
    showSearch(true);
    return;
  }
  if (state.view === "calendar" || state.view === "media" || state.view === "settings") {
    showTab(state.view, true);
    return;
  }
  if (state.view === "entry") {
    sourceView = state.from || "home";
    openEntry(state.id, false);
    return;
  }
  if (state.view === "overview") {
    const page = overviewPages[state.id];
    if (page) {
      sourceView = state.from || "home";
      showPage({ title: page.title, parent: page.parent, kind: page.kind });
    }
    return;
  }
  if (state.view === "workspace") {
    sourceView = state.from || "home";
    const workspace = workspaces.find((item) => String(item.id) === String(state.id));
    if (workspace) showPage({ title: workspace.name, parent: workspace.id, isWorkspace: true });
  }
});

/* Bildschirmtastatur: Handy-Browser schieben die Seite nicht hoch, sondern
   verkleinern nur den sichtbaren Bereich. Ohne diese Zeilen laege die untere
   Leiste beim Tippen hinter der Tastatur. */
if (window.visualViewport) {
  const viewport = window.visualViewport;
  const applyKeyboardInset = () => {
    const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
  };
  viewport.addEventListener("resize", applyKeyboardInset);
  viewport.addEventListener("scroll", applyKeyboardInset);
  applyKeyboardInset();
}

loadThumbs();
loadState();
loadUsage();
const tabMatch = location.hash.match(/^#\/tab\/(\d+)/);
if (tabMatch) {
  const id = Number(tabMatch[1]);
  if (tabs.some((tab) => tab.id === id)) activeTabId = id;
}
renderOverview();
renderTabs();
renderWorkspaces();
renderComposerTypes();
renderLevel();
renderThemeOptions();
history.replaceState({ view: "home" }, "", "#/");
