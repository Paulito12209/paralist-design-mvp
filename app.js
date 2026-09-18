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

/* XP-Arten: „answered“ ist für Karteikarten reserviert, die später dazukommen */
const xpKinds = {
  answered: { label: "Richtig beantwortet", icon: "brain", color: "var(--xp-answered)", amount: 2 },
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
      JSON.stringify({ tabs, activeTabId, workspaces, entries, nextEntryId, xpLog, nextXpId })
    );
  } catch (error) {
    /* ohne Speicher läuft die App weiter, nur ohne Merken */
  }
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
  if (Array.isArray(saved.xpLog)) xpLog = saved.xpLog;
  else {
    seedXpFromExisting();
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

function entryRow(entry) {
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
  renderComposerTypes();
  renderComposerLink();
  composerInput.focus();
}

function closeComposer() {
  if (composer.hidden) return;
  navShell.classList.remove("is-composing");
  composer.hidden = true;
  tabBar.hidden = false;
  composerInput.value = "";
}

function createEntry() {
  const title = composerInput.value.trim();
  if (!title) return;
  entries.push({
    id: nextEntryId++,
    type: composerType,
    title,
    body: "",
    parent: composerParent,
    archived: false,
    favorite: false,
    createdAt: Date.now(),
  });
  awardXp("created", composerType, title);
  composerInput.value = "";
  closeComposer();
  renderOverview();
  renderPageBody();
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
  const totals = { answered: 0, created: 0, done: 0 };
  xpLog.forEach((row) => {
    totals[row.kind] = (totals[row.kind] || 0) + row.amount;
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
  const order = ["answered", "created", "done"];
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

/* ---------- Klicks in Listen ---------- */

function refreshLists() {
  renderOverview();
  renderWorkspaces();
  renderPageBody();
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

  if (state && state.view === "progress") {
    openProgress(false);
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

loadState();
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
