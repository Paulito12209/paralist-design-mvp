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
const composerTypePill = document.getElementById("composer-type-pill");
const composerTypeIcon = document.getElementById("composer-type-icon");
const composerTypeLabel = document.getElementById("composer-type-label");
const composerSend = document.getElementById("composer-send");

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
const avatarView = document.getElementById("avatar-view");
const avatarViewStage = document.getElementById("avatar-view-stage");
const profileSave = document.getElementById("profile-save");
const profileBtn = document.getElementById("profile-btn");
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

// Eintragstypen: bestimmen das Icon vor dem Titel in den Listen.
// „pick“ markiert die Knöpfe im Eingabefeld; ohne gewählten Knopf entsteht ein Dokument.
// Ressourcen-Knopf unten legt ein Dokument an; zur Zeichnung wechselt man oben über die Typ-Pille.
// Dokumente, Zeichnungen und Medien sind Ressourcen, egal wo sie abgelegt sind.
const types = [
  { id: "aufgabe", label: "Aufgabe", icon: "task", pick: true },
  { id: "notiz", label: "Notiz", icon: "note", pick: true },
  { id: "termin", label: "Termin", icon: "calendar", pick: true },
  { id: "projekt", label: "Projekte", icon: "rocket", pick: true },
  { id: "dokument", label: "Dokument", icon: "doc" },
  { id: "zeichnung", label: "Zeichnung", icon: "scribble" },
  { id: "medien", label: "Medien", icon: "photos" },
];
const defaultType = "dokument";
const resourceTypes = ["dokument", "zeichnung", "medien"];
/* Extra-Knopf neben den Typen: sieht aus wie die Ressourcen-Kachel, legt aber ein Dokument an */
const resourcePick = { id: "ressourcen", label: "Ressourcen", icon: "cube", typeId: "dokument" };

/* Jede Übersichtskarte ist ein Ablageort: „parent“ verbindet sie mit den
   Einträgen, „seed“ legt beim allerersten Start Beispieleinträge an.
   Favoriten sammelt nur markierte Einträge und Arbeitsbereiche,
   Ressourcen alle Dokumente, Zeichnungen und Medien. */
const overviewPages = {
  1: { title: "Inbox", icon: "inbox", parent: null },
  2: { title: "Favoriten", icon: "star-outline", kind: "favorites" },
  3: { title: "Projekte", icon: "rocket", parent: "o3", seed: 5 },
  4: { title: "Ressourcen", icon: "cube", kind: "resources" },
};

const presetIcons = [
  { id: "smile", label: "Privat" },
  { id: "briefcase", label: "Arbeit" },
  { id: "academic", label: "Schule / Uni" },
];

const storageKey = "paralist-mvp";
const themeKey = "paralist-theme";
const usageKey = "paralist-usage";
const avatarKey = "paralist-avatar";

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
  projekt: { label: "Projekte", icon: "rocket", color: "#af2d3a" },
  dokument: { label: "Dokument", icon: "doc", color: "#64d2ff" },
  zeichnung: { label: "Zeichnung", icon: "scribble", color: "#ff375f" },
  arbeitsbereich: { label: "Arbeitsbereich", icon: "layers", color: "#ff9f0a" },
  tab: { label: "Tab", icon: "tag", color: "#bf5af2" },
};

const themes = [
  { id: "system", label: "System", icon: "display" },
  { id: "light", label: "Hell", icon: "sun" },
  { id: "dark", label: "Dunkel", icon: "moon" },
];

let tabs = [{ id: 1, name: "Meine" }];
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
let composerPick = types[0].id;
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
let profilePhoto = ""; /* gespeichertes Profilbild als kleine JPEG-Datei im Text */
let profilePhotoDraft = null; /* null = nichts zu speichern, sonst Vorschau oder "" zum Entfernen */
let modalPull = null; /* laufende Ziehbewegung an einem Blatt */
let ignoreClicksUntil = 0;
let opens = []; /* Verlauf: was wurde wie oft und zuletzt wann geöffnet */
let recentSearches = []; /* zuletzt getippte Suchbegriffe */
let searchQuery = "";
let searchList = null; /* null = Übersicht, "searches" oder "most" = eigene Unterseite */

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
      JSON.stringify({ tabs, activeTabId, workspaces, entries, nextEntryId, xpLog, nextXpId, calendar: calPrefs, media: mediaPrefs, resources: resourcePrefs, opens, recentSearches, mediaSeeded: true })
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

  if (Array.isArray(saved.opens)) opens = saved.opens;
  if (Array.isArray(saved.recentSearches)) recentSearches = saved.recentSearches;

  if (saved.media && typeof saved.media === "object") mediaPrefs = { ...mediaPrefs, ...saved.media };
  if (!mediaFilterList.some((filter) => filter.id === mediaPrefs.filter)) mediaPrefs.filter = "recent";
  /* Ältere Speicherstände haben noch keine Beispielmedien: einmalig nachlegen */
  if (!saved.mediaSeeded) {
    seedMedia();
    saveState();
  }

  let renamedDefaultTab = false;
  tabs.forEach((tab) => {
    if (tab.name === "Privat") {
      tab.name = "Meine";
      renamedDefaultTab = true;
    }
    if (typeof tab.awarded !== "boolean") tab.awarded = true;
  });
  if (renamedDefaultTab) saveState();
  workspaces.forEach((workspace) => {
    if (typeof workspace.favorite !== "boolean") workspace.favorite = false;
  });
  entries.forEach((entry) => {
    if (typeof entry.favorite !== "boolean") entry.favorite = false;
  });

  if (saved.resources && typeof saved.resources === "object") resourcePrefs = { ...resourcePrefs, ...saved.resources };
  if (!resourceFilterList.some((filter) => filter.id === resourcePrefs.filter)) resourcePrefs.filter = "all";
  /* Ressourcen ist kein Ablageort mehr, sondern sammelt Dokumente und Medien:
     was dort abgelegt war, wandert in die Inbox */
  entries.forEach((entry) => {
    if (sameParent(entry.parent, "o4")) entry.parent = null;
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
  if (page.kind === "resources") return resourceEntries().length;
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
  document.body.classList.toggle("is-drawing", name === "entry" && isDrawingEntry(currentEntryId));
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
            <input class="tab-pill-input" id="tab-name-input" type="text" size="1" value="${escapeHtml(tab.name)}" placeholder="${escapeHtml(tab.placeholder || "")}" aria-label="Tab benennen" />
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
    fitTabNameInput(input);
    input.focus();
    input.select();
  }
}

/* Tab-Eingabe so schmal wie der Text, damit ein neuer Tab nicht extra groß wird */
function fitTabNameInput(input) {
  if (!input) return;
  const sample = input.value || input.placeholder || "";
  const style = getComputedStyle(input);
  const probe = document.createElement("span");
  probe.textContent = sample || " ";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "pre";
  probe.style.font = style.font;
  probe.style.fontSize = style.fontSize;
  probe.style.fontWeight = style.fontWeight;
  probe.style.fontFamily = style.fontFamily;
  probe.style.letterSpacing = style.letterSpacing;
  document.body.appendChild(probe);
  const width = Math.ceil(probe.getBoundingClientRect().width);
  probe.remove();
  input.style.width = `${Math.max(width, 1)}px`;
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

/* Vor dem Titel: kleine Vorschau bei Fotos, Videos und Zeichnungen, sonst das Typ-Icon;
   Medien zeigen ihre Art (Bild, Video, Aufnahme, Dokument) statt des allgemeinen Icons */
function entryGlyph(entry) {
  const thumb = mediaThumbs[entry.id];
  const kind = mediaKindOf(entry);
  const preview = entry.type === "zeichnung" || (entry.type === "medien" && (kind === "image" || kind === "video"));
  if (thumb && preview) return `<img class="entry-thumb" src="${thumb}" alt="" />`;
  if (entry.type === "medien") return icon({ image: "image", video: "video", audio: "wave", doc: "doc" }[kind] || "doc", "entry-type");
  return icon(typeIcon(entry.type), "entry-type");
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
        ${entryGlyph(entry)}
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

  if (currentPage.kind === "resources") {
    renderResources();
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
  pageMenuBtn.hidden = page.kind === "resources"; /* Ressourcen sind nur eine Sammlung: nichts zu löschen oder zu markieren */
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

/* „list“ öffnet statt der Übersicht eine der beiden vollen Listen als eigene Seite */
function showSearch(replace = false, list = null) {
  searchList = list;
  showView("search");
  searchQuery = searchInput.value.trim();
  renderSearch();
  setActiveTab("");
  sourceView = "search";
  const url = list === "searches" ? "#/suchen/gesucht" : list === "most" ? "#/suchen/haeufig" : "#/suchen";
  if (replace || location.hash === url) history.replaceState({ view: "search", list }, "", url);
  else history.pushState({ view: "search", list }, "", url);
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
    noteOpen("overview", id);
    showPage({ title: page.title, parent: page.parent, kind: page.kind });
    history.pushState({ view: "overview", id, from: sourceView }, "", `#/uebersicht/${id}`);
    return;
  }

  const workspace = workspaces.find((item) => String(item.id) === String(id));
  if (!workspace) return;
  noteOpen("workspace", workspace.id);
  showPage({ title: workspace.name, parent: workspace.id, isWorkspace: true });
  history.pushState({ view: "workspace", id, from: sourceView }, "", `#/arbeitsbereich/${id}`);
}

function openEntry(id, push = true) {
  const entry = entries.find((item) => String(item.id) === String(id));
  if (!entry) return;
  noteOpen("entry", entry.id);
  currentEntryId = entry.id;
  entryTitle.value = entry.title;
  entryBody.value = entry.body || "";
  entryCrumb.textContent = parentName(entry.parent);
  showView("entry");
  /* Zeichnungen zeigen statt des Textes die Zeichenfläche */
  const drawing = entry.type === "zeichnung";
  entryBody.hidden = drawing;
  drawPad.hidden = !drawing;
  if (drawing) openDrawing(entry);
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

function composerPickButtons() {
  return [
    ...types.filter((type) => type.pick).map((type) => ({
      id: type.id,
      label: type.label,
      icon: type.icon,
      typeId: type.id,
    })),
    resourcePick,
  ];
}

function chooseComposerType(typeId, pickId) {
  composerType = typeId;
  if (pickId !== undefined) composerPick = pickId;
  else if (typeId === defaultType || typeId === "zeichnung") composerPick = resourcePick.id;
  else composerPick = types.some((type) => type.pick && type.id === typeId) ? typeId : null;
  if (typeId === "projekt") composerParent = overviewPages[3].parent;
}

function renderComposerTypes() {
  composerTypes.innerHTML = composerPickButtons()
    .map(
      (pick) => `
        <button class="composer-type${pick.id === composerPick ? " is-active" : ""}" type="button" data-type="${pick.id}" aria-label="${pick.label}">
          ${icon(pick.icon)}
        </button>
      `
    )
    .join("");
  renderComposerTypePill();
}

/* Typ-Pille neben „Inbox“: zeigt den gewählten Knopf, ohne Auswahl „Dokument“ */
function renderComposerTypePill() {
  const type = types.find((item) => item.id === composerType) || types.find((item) => item.id === defaultType);
  composerTypeIcon.setAttribute("href", `#icon-${type.icon}`);
  composerTypeLabel.textContent = type.label;
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
  drawTools.hidden = true;
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
  drawTools.hidden = false;
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
  /* Eine neue Zeichnung öffnet sich gleich, damit man sofort loslegen kann */
  if (entry.type === "zeichnung") openEntry(entry.id);
}

/* ---------- Auswahl-Blatt ---------- */

function openSheet(title, options) {
  closeCtxMenu();
  sheetTitle.textContent = title;
  sheetOptions.innerHTML = options
    .map(
      (option, index) => `
        <button class="sheet-option${option.active ? " is-active" : ""}${option.danger ? " is-danger" : ""}${option.split ? " is-split" : ""}${option.gap ? " is-gap" : ""}" type="button" data-sheet="${index}">
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
  const options = presetIcons.map((item) => ({
    label: item.label,
    icon: item.id,
    active: current === item.id,
    onSelect: () => onPick(item.id),
  }));
  if (current) {
    options.push({
      label: "Icon entfernen",
      icon: "close",
      split: true,
      onSelect: () => onPick(""),
    });
  }
  openSheet("Icon wählen", options);
}

function iconPickerAction(current, apply) {
  return {
    label: current ? "Icon bearbeiten" : "Icon hinzufügen",
    icon: current || "smile",
    onSelect: () => openIconPicker(current, apply),
  };
}

function openTabMenu(pill) {
  const id = Number(pill.dataset.tabId);
  const tab = tabs.find((item) => item.id === id);
  if (!tab) return;
  const options = [
    { label: "Umbenennen", icon: "pencil", onSelect: () => beginRenameTab(id) },
    iconPickerAction(tab.icon, (name) => {
      tab.icon = name;
      saveState();
      renderTabs();
    }),
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
    iconPickerAction(workspace.icon, (name) => {
      workspace.icon = name;
      saveState();
      refreshLists();
    }),
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
      .filter((page) => !page.kind) /* Sammlungen wie Favoriten und Ressourcen sind kein Ablageort */
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

/* ---------- Blatt nach unten ziehen, um es zu schließen ---------- */

function dismissPullDistance() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--modal-dismiss-pull");
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

function modalPanelOf(backdrop) {
  return backdrop.querySelector(".modal") || backdrop.querySelector(".sheet");
}

function clearModalPullStyles(backdrop) {
  if (!backdrop) return;
  const panel = modalPanelOf(backdrop);
  if (panel) {
    panel.style.transform = "";
    panel.style.transition = "";
  }
  backdrop.style.removeProperty("--modal-dim");
  const body = backdrop.querySelector(".modal-body");
  if (body) body.style.overflow = "";
}

function bindModalPull(backdrop, closeFn) {
  backdrop.addEventListener("pointerdown", (event) => {
    if (backdrop.hidden || event.button) return;
    if (backdrop.dataset.dismissing === "1") return;
    if (!sheet.hidden && backdrop !== sheet) return;
    if (event.target.closest(".modal-close, .profile-save, .profile-avatar-edit")) return;
    if (event.target === backdrop) return;
    const body = backdrop.querySelector(".modal-body");
    const head = backdrop.querySelector(".modal-head");
    const inHead = Boolean(head && head.contains(event.target));
    const atTop = !body || body.scrollTop <= 0;
    if (!inHead && !atTop) return;
    modalPull = {
      backdrop,
      closeFn,
      pointerId: event.pointerId,
      startY: event.clientY,
      startX: event.clientX,
      fromHead: inHead,
      active: false,
      y: 0,
    };
  });
}

function onModalPullMove(event) {
  if (!modalPull || event.pointerId !== modalPull.pointerId) return;
  const { backdrop } = modalPull;
  if (backdrop.hidden) {
    modalPull = null;
    return;
  }
  const panel = modalPanelOf(backdrop);
  const body = backdrop.querySelector(".modal-body");
  const dy = event.clientY - modalPull.startY;
  const dx = event.clientX - modalPull.startX;
  if (!modalPull.active) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (dy <= 0 || Math.abs(dy) <= Math.abs(dx)) {
      modalPull = null;
      return;
    }
    if (!modalPull.fromHead && body && body.scrollTop > 0) {
      modalPull = null;
      return;
    }
    modalPull.active = true;
    ignoreClicksUntil = Date.now() + 500;
    if (panel) panel.style.transition = "none";
    if (body) body.style.overflow = "hidden";
    try {
      backdrop.setPointerCapture(event.pointerId);
    } catch (error) {
      /* ohne Capture folgt die Bewegung nur, solange der Finger auf dem Blatt bleibt */
    }
  }
  modalPull.y = Math.max(0, dy);
  if (panel) panel.style.transform = `translateY(${modalPull.y}px)`;
  backdrop.style.setProperty("--modal-dim", String(Math.max(0.15, 1 - modalPull.y / 420)));
  if (event.cancelable) event.preventDefault();
}

function onModalPullEnd(event) {
  if (!modalPull || (event && event.pointerId !== modalPull.pointerId)) return;
  const { backdrop, closeFn, active, y } = modalPull;
  const panel = modalPanelOf(backdrop);
  const body = backdrop.querySelector(".modal-body");
  if (body) body.style.overflow = "";
  modalPull = null;
  if (!active || backdrop.dataset.dismissing === "1") return;
  ignoreClicksUntil = Date.now() + 400;
  if (y >= dismissPullDistance()) {
    backdrop.dataset.dismissing = "1";
    if (panel) {
      panel.style.transition = "transform 0.2s ease";
      panel.style.transform = `translateY(${Math.max(panel.offsetHeight, y + 80)}px)`;
    }
    window.setTimeout(() => {
      closeFn();
      clearModalPullStyles(backdrop);
      delete backdrop.dataset.dismissing;
    }, 180);
  } else if (panel) {
    panel.style.transition = "transform 0.2s ease";
    panel.style.transform = "";
    backdrop.style.setProperty("--modal-dim", "1");
    window.setTimeout(() => {
      panel.style.transition = "";
      backdrop.style.removeProperty("--modal-dim");
    }, 200);
  }
}

window.addEventListener("pointermove", onModalPullMove, { passive: false });
window.addEventListener("pointerup", onModalPullEnd);
window.addEventListener("pointercancel", onModalPullEnd);
document.addEventListener(
  "click",
  (event) => {
    if (Date.now() < ignoreClicksUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  },
  true
);

function openProgress(push = true) {
  closeSheet();
  closeCtxMenu();
  closeComposer();
  hideProfile();
  historyLimit = 20;
  renderProgress();
  clearModalPullStyles(progressModal);
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
bindModalPull(progressModal, closeProgress);

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

function currentProfilePhoto() {
  return profilePhotoDraft === null ? profilePhoto : profilePhotoDraft;
}

function profileAvatarMarkup() {
  const photo = currentProfilePhoto();
  return photo ? `<img src="${photo}" alt="">` : "PA";
}

function renderProfileId() {
  return `
    <section class="profile-id">
      <div class="profile-avatar-wrap">
        <button class="profile-avatar" type="button" data-avatar-view="1" aria-label="Profilbild anzeigen">${profileAvatarMarkup()}</button>
        <button class="profile-avatar-edit" type="button" data-avatar-edit="1" aria-label="Profilbild ändern">${icon("pencil")}</button>
      </div>
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

function showProfileSave(on) {
  profileSave.hidden = !on;
}

function discardProfileDraft() {
  profilePhotoDraft = null;
  showProfileSave(false);
}

function hideProfile() {
  profileModal.hidden = true;
  avatarView.hidden = true;
  discardProfileDraft();
  clearModalPullStyles(profileModal);
  clearModalPullStyles(avatarView);
}

function renderProfileButton() {
  profileBtn.innerHTML = profilePhoto
    ? `<img class="avatar-photo" src="${profilePhoto}" alt="">`
    : `<svg class="icon"><use href="#icon-profile"></use></svg>`;
}

function persistProfilePhoto() {
  try {
    if (profilePhoto) localStorage.setItem(avatarKey, profilePhoto);
    else localStorage.removeItem(avatarKey);
  } catch (error) {
    /* ohne Speicher bleibt das Bild nur bis zum Neuladen */
  }
}

function loadProfilePhoto() {
  try {
    const saved = localStorage.getItem(avatarKey);
    if (saved && saved.startsWith("data:image/")) profilePhoto = saved;
  } catch (error) {
    /* ohne Speicher bleibt das Standard-Icon */
  }
}

/* canvas: nötig, um das Profilbild klein genug für den Gerätespeicher zu machen */
function fileToProfilePhoto(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let photo = null;
      try {
        const maxEdge = 512;
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
        canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        photo = canvas.toDataURL("image/jpeg", 0.86);
      } catch (error) {
        /* z.B. HEIC ohne Browser-Unterstützung */
      }
      URL.revokeObjectURL(url);
      resolve(photo);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function setProfileDraft(photo) {
  profilePhotoDraft = photo;
  const scroll = profileBody.scrollTop;
  renderProfile();
  profileBody.scrollTop = scroll;
  showProfileSave(true);
}

function openAvatarPicker() {
  const options = [
    {
      icon: "camera",
      label: "Foto aufnehmen",
      onSelect: () => document.getElementById("profile-file-photo").click(),
    },
    {
      icon: "photos",
      label: "Aus der Bibliothek",
      onSelect: () => document.getElementById("profile-file-library").click(),
    },
  ];
  if (currentProfilePhoto()) {
    options.push({
      icon: "trash",
      label: "Bild entfernen",
      danger: true,
      split: true,
      onSelect: () => setProfileDraft(""),
    });
  }
  openSheet("Profilbild", options);
}

function openAvatarView(push = true) {
  const photo = currentProfilePhoto();
  avatarViewStage.innerHTML = photo
    ? `<img src="${photo}" alt="Profilbild">`
    : `<div class="avatar-view-fallback">PA</div>`;
  clearModalPullStyles(avatarView);
  avatarView.hidden = false;
  if (push) history.pushState({ view: "avatar", from: "profile" }, "", "#/profil/bild");
}

function closeAvatarView() {
  if (avatarView.hidden) return;
  if (history.state && history.state.view === "avatar") {
    history.back();
    return;
  }
  avatarView.hidden = true;
  clearModalPullStyles(avatarView);
}

function openProfile(push = true) {
  closeSheet();
  closeCtxMenu();
  closeComposer();
  progressModal.hidden = true;
  trackUsage();
  if (profileModal.hidden) {
    renderProfile();
    profileBody.scrollTop = 0;
  }
  clearModalPullStyles(profileModal);
  profileModal.hidden = false;
  if (push) {
    avatarView.hidden = true;
    history.pushState({ view: "profile", from: sourceView }, "", "#/profil");
  }
}

function closeProfile() {
  if (profileModal.hidden) return;
  if (history.state && history.state.view === "profile") {
    history.back();
    return;
  }
  hideProfile();
}

profileBtn.addEventListener("click", () => openProfile());
document.getElementById("profile-close").addEventListener("click", closeProfile);
profileModal.addEventListener("click", (event) => {
  if (event.target === profileModal) closeProfile();
});
document.getElementById("avatar-view-close").addEventListener("click", closeAvatarView);
avatarView.addEventListener("click", (event) => {
  if (event.target === avatarView) closeAvatarView();
});
bindModalPull(profileModal, closeProfile);
bindModalPull(avatarView, closeAvatarView);
bindModalPull(sheet, closeSheet);

document.getElementById("profile-photo-cancel").addEventListener("click", () => {
  discardProfileDraft();
  const scroll = profileBody.scrollTop;
  renderProfile();
  profileBody.scrollTop = scroll;
});

document.getElementById("profile-photo-save").addEventListener("click", () => {
  profilePhoto = profilePhotoDraft || "";
  discardProfileDraft();
  persistProfilePhoto();
  renderProfileButton();
  const scroll = profileBody.scrollTop;
  renderProfile();
  profileBody.scrollTop = scroll;
});

["photo", "library"].forEach((source) => {
  const input = document.getElementById(`profile-file-${source}`);
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const photo = await fileToProfilePhoto(file);
    if (photo) setProfileDraft(photo);
  });
});

profileBody.addEventListener("click", (event) => {
  if (event.target.closest("[data-avatar-edit]")) {
    openAvatarPicker();
    return;
  }
  if (event.target.closest("[data-avatar-view]")) {
    openAvatarView();
    return;
  }
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
  composerPick = "termin";
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

/* Blöcke je Monat, in der Reihenfolge der Liste: [{ heading, items }] */
function groupByMonth(list) {
  const groups = [];
  list.forEach((entry) => {
    const heading = monthHeading(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(entry);
    else groups.push({ heading, items: [entry] });
  });
  return groups;
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
  mediaBody.innerHTML = groupByMonth(list)
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

/* ---------- Ressourcen ---------- */

/* Welche Pille auf der Ressourcen-Seite gewählt ist; wird mit dem übrigen Zustand gespeichert */
let resourcePrefs = { filter: "all" };

/* Die Pillen oben: „Alle“ zeigt alles, „Eigene“ nur Geschriebenes und Gezeichnetes,
   die übrigen je eine Medienart */
const resourceFilterList = [
  { id: "all", label: "Alle", icon: "cube", empty: "Noch keine Ressourcen." },
  { id: "own", label: "Eigene", icon: "pencil", empty: "Noch nichts Eigenes. Ein Eintrag ohne gewählten Typ wird zum Dokument." },
  { id: "image", label: "Bilder", icon: "image", empty: "Noch keine Bilder." },
  { id: "video", label: "Videos", icon: "video", empty: "Noch keine Videos." },
  { id: "audio", label: "Audio", icon: "mic", empty: "Noch keine Aufnahmen." },
  { id: "doc", label: "Dokumente", icon: "doc", empty: "Noch keine Dokumente." },
];

/* Ressourcen sind alles Eigene (Dokumente, Zeichnungen) und alle Medien, egal wo sie abgelegt sind */
function resourceEntries() {
  return entries
    .filter((entry) => resourceTypes.includes(entry.type) && !entry.archived)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function resourceFiltered(filter) {
  const all = resourceEntries();
  if (filter === "all") return all;
  if (filter === "own") return all.filter((entry) => entry.type !== "medien");
  return all.filter((entry) => entry.type === "medien" && mediaKindOf(entry) === filter);
}

/* Aufbau wie die Medien-Seite: Pillen oben, darunter Listen je Monat statt Kacheln */
function renderResources() {
  const pills = resourceFilterList
    .map((filter) => {
      const count = resourceFiltered(filter.id).length;
      const mark = filter.id === resourcePrefs.filter ? " is-active" : "";
      return `
        <button class="tab-pill${mark}" type="button" data-resource-filter="${filter.id}">
          ${icon(filter.icon, "tab-pill-icon")}${filter.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("");
  const list = resourceFiltered(resourcePrefs.filter);
  const filter = resourceFilterList.find((item) => item.id === resourcePrefs.filter) || resourceFilterList[0];
  const body = list.length
    ? groupByMonth(list)
        .map(
          (group) =>
            `<h2 class="media-month">${group.heading}</h2><div class="workspace-list">${group.items.map((entry) => entryRow(entry)).join("")}</div>`
        )
        .join("")
    : `<p class="empty-note">${filter.empty}</p>`;
  pageBody.innerHTML = `<div class="tab-pills resource-filters">${pills}</div>${body}`;
}

/* ---------- Zeichnung ---------- */

const drawPad = document.getElementById("draw-pad");
const drawCanvas = document.getElementById("draw-canvas");
const drawCtx = drawCanvas.getContext("2d");
const drawTools = document.getElementById("draw-tools");
const drawColors = document.getElementById("draw-colors");
const drawScale = Math.min(window.devicePixelRatio || 1, 2); /* Pixel je CSS-Pixel; mehr als 2 kostet nur Speicher */
const drawUndoLimit = 8; /* Schnappschüsse für Rückgängig; jeder braucht so viel Speicher wie die ganze Fläche */

/* Werkzeuge wie in Apples Stiftpalette: Stift dünn und deckend, Marker breit und durchscheinend,
   Radierer nimmt Farbe weg, statt Weiß aufzutragen */
const drawToolList = {
  pen: { width: 3, alpha: 1, erase: false },
  marker: { width: 16, alpha: 0.35, erase: false },
  eraser: { width: 22, alpha: 1, erase: true },
};
const drawColorList = ["#1c1c1e", "#007aff", "#ff3b30", "#ffcc00", "#34c759"];

let drawTool = "pen";
let drawColor = drawColorList[0];
let drawEntryId = null;
let drawStroke = null; /* laufender Strich: Punkte, Werkzeug und das Bild davor */
let drawUndo = []; /* Bilder vor den letzten Strichen */
let drawDirty = false; /* seit dem letzten Speichern gezeichnet */
let drawSaveTimer = null;

function isDrawingEntry(id) {
  const entry = entries.find((item) => item.id === id);
  return Boolean(entry && entry.type === "zeichnung");
}

/* Zeichnungen liegen wie die Vorschaubilder unter der Eintrags-ID, nur als PNG in voller Größe */
function saveDrawing() {
  clearTimeout(drawSaveTimer);
  drawSaveTimer = null;
  if (!drawEntryId || !drawDirty) return;
  drawDirty = false;
  mediaThumbs[drawEntryId] = drawCanvas.toDataURL("image/png");
  saveThumbs();
}

/* Speichern kurz nach dem letzten Strich, nicht bei jeder Bewegung */
function scheduleDrawSave() {
  drawDirty = true;
  clearTimeout(drawSaveTimer);
  drawSaveTimer = setTimeout(saveDrawing, 400);
}

function loadDrawing(id) {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  const data = mediaThumbs[id];
  if (!data) return;
  const img = new Image();
  img.onload = () => {
    if (drawEntryId !== id) return;
    /* Gespeichert wurde in Gerätepixeln: auf die heutige Breite skalieren, damit nichts verzerrt */
    const scale = drawCanvas.width / img.width;
    drawCtx.save();
    drawCtx.setTransform(1, 0, 0, 1, 0, 0);
    drawCtx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
    drawCtx.restore();
  };
  img.src = data;
}

/* Fläche auf den sichtbaren Platz bringen; das Bild wird vorher gesichert und danach neu geladen */
function fitDrawCanvas() {
  const width = Math.round(drawPad.clientWidth);
  const height = Math.round(drawPad.clientHeight);
  if (!width || !height) return;
  if (drawCanvas.style.width === `${width}px` && drawCanvas.style.height === `${height}px`) return;
  saveDrawing();
  drawCanvas.width = Math.round(width * drawScale);
  drawCanvas.height = Math.round(height * drawScale);
  drawCanvas.style.width = `${width}px`;
  drawCanvas.style.height = `${height}px`;
  /* Größe ändern leert den Kontext: Maßstab und runde Linienenden neu setzen */
  drawCtx.setTransform(drawScale, 0, 0, drawScale, 0, 0);
  drawCtx.lineCap = "round";
  drawCtx.lineJoin = "round";
  drawUndo = []; /* alte Schnappschüsse passen nicht mehr zur neuen Größe */
  if (drawEntryId) loadDrawing(drawEntryId);
}

function openDrawing(entry) {
  saveDrawing(); /* eine noch offene Zeichnung zuerst sichern */
  drawEntryId = entry.id;
  drawStroke = null;
  drawUndo = [];
  renderDrawTools();
  drawCanvas.style.width = "";
  drawCanvas.style.height = "";
  fitDrawCanvas();
}

function renderDrawTools() {
  drawTools.querySelectorAll("[data-draw-tool]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.drawTool === drawTool);
  });
  drawColors.innerHTML = drawColorList
    .map(
      (color) =>
        `<button class="draw-color${color === drawColor ? " is-active" : ""}" type="button" data-draw-color="${color}" style="--draw-color: ${color}" aria-label="Farbe ${color}"></button>`
    )
    .join("");
}

function drawPoint(event) {
  const rect = drawCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function pushDrawUndo() {
  drawUndo.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
  if (drawUndo.length > drawUndoLimit) drawUndo.shift();
}

/* Der ganze Strich wird bei jeder Bewegung neu auf das Bild davor gemalt: so bleibt der
   durchscheinende Marker gleichmäßig, statt an jedem Zwischenpunkt dunkler zu werden */
function paintStroke(stroke) {
  const tool = drawToolList[stroke.tool];
  drawCtx.putImageData(stroke.before, 0, 0);
  drawCtx.save();
  drawCtx.globalCompositeOperation = tool.erase ? "destination-out" : "source-over";
  drawCtx.globalAlpha = tool.alpha;
  drawCtx.strokeStyle = stroke.color;
  drawCtx.lineWidth = tool.width;
  drawCtx.beginPath();
  stroke.points.forEach((point, index) => (index ? drawCtx.lineTo(point.x, point.y) : drawCtx.moveTo(point.x, point.y)));
  if (stroke.points.length === 1) drawCtx.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y); /* Tipp ohne Bewegung: ein Punkt */
  drawCtx.stroke();
  drawCtx.restore();
}

function undoDraw() {
  const before = drawUndo.pop();
  if (!before) return;
  drawCtx.putImageData(before, 0, 0);
  scheduleDrawSave();
}

function clearDrawing() {
  pushDrawUndo();
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  scheduleDrawSave();
}

drawCanvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  drawCanvas.setPointerCapture(event.pointerId);
  pushDrawUndo();
  drawStroke = { tool: drawTool, color: drawColor, points: [drawPoint(event)], before: drawUndo[drawUndo.length - 1] };
  paintStroke(drawStroke);
});

drawCanvas.addEventListener("pointermove", (event) => {
  if (!drawStroke) return;
  /* getCoalescedEvents: liefert auch die Zwischenpunkte, die der Browser sonst zusammenfasst */
  const moves = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
  (moves.length ? moves : [event]).forEach((move) => drawStroke.points.push(drawPoint(move)));
  paintStroke(drawStroke);
});

["pointerup", "pointercancel"].forEach((name) => {
  drawCanvas.addEventListener(name, () => {
    if (!drawStroke) return;
    drawStroke = null;
    scheduleDrawSave();
  });
});

drawTools.addEventListener("click", (event) => {
  const tool = event.target.closest("[data-draw-tool]");
  if (tool) {
    drawTool = tool.dataset.drawTool;
    renderDrawTools();
    return;
  }
  const color = event.target.closest("[data-draw-color]");
  if (color) {
    drawColor = color.dataset.drawColor;
    if (drawTool === "eraser") drawTool = "pen"; /* eine Farbe wählen heißt wieder malen */
    renderDrawTools();
    return;
  }
  if (event.target.closest("[data-draw-undo]")) undoDraw();
});

/* Tastatur oder Drehung ändern den Platz: die Fläche folgt, das Bild bleibt */
if (window.ResizeObserver) {
  new ResizeObserver(() => {
    if (!drawPad.hidden && drawEntryId) fitDrawCanvas();
  }).observe(drawPad);
}

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

  const resourcePill = event.target.closest("[data-resource-filter]");
  if (resourcePill) {
    resourcePrefs.filter = resourcePill.dataset.resourceFilter;
    saveState();
    renderResources();
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

workspaceTabs.addEventListener("input", (event) => {
  if (event.target.id === "tab-name-input") fitTabNameInput(event.target);
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
  const pick = composerPickButtons().find((item) => item.id === button.dataset.type);
  if (!pick) return;
  /* Der aktive Knopf lässt sich abwählen: ohne Typ entsteht ein Dokument */
  if (composerPick === pick.id) {
    composerPick = null;
    composerType = defaultType;
  } else {
    chooseComposerType(pick.typeId, pick.id);
  }
  renderComposerTypes();
  renderComposerLink();
  composerInput.focus();
});

composerTypePill.addEventListener("click", () => {
  const sheetTypes = types.filter((type) => type.pick || type.id === "dokument" || type.id === "zeichnung");
  openSheet(
    "Typ wählen",
    sheetTypes.map((type) => ({
      label: type.label,
      icon: type.icon,
      active: type.id === composerType,
      gap: type.id === "termin" || type.id === "projekt",
      split: type.id === "dokument",
      onSelect: () => {
        chooseComposerType(type.id);
        renderComposerTypes();
        renderComposerLink();
        composerInput.focus();
      },
    }))
  );
});

composerSend.addEventListener("click", createEntry);

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
      options.push(
        iconPickerAction(workspace.icon, (name) => {
          workspace.icon = name;
          saveState();
          refreshLists();
        })
      );
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
    ...(entry.type === "zeichnung" ? [{ label: "Zeichnung leeren", icon: "eraser", onSelect: clearDrawing }] : []),
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

/* ---------- Suchen ----------
   Die Suchseite lebt von zwei Merklisten: „opens“ zaehlt, was wie oft und wann
   zuletzt geoeffnet wurde, „recentSearches“ merkt die getippten Begriffe.
   Ohne Eingabe zeigt die Seite diese Listen, mit Eingabe die Treffer. */

const searchResults = document.getElementById("search-results");

function noteOpen(kind, id) {
  const key = `${kind}:${id}`;
  const found = opens.find((item) => item.key === key);
  if (found) {
    found.count += 1;
    found.ts = Date.now();
  } else {
    opens.push({ key, kind, id: String(id), count: 1, ts: Date.now() });
  }
  saveState();
}

function noteSearch(query) {
  const text = query.trim();
  if (!text) return;
  recentSearches = [text, ...recentSearches.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, 8);
  saveState();
}

function typeLabelOf(id) {
  const type = types.find((item) => item.id === id);
  return type ? type.label : "Eintrag";
}

/* Aus einem Merkposten wird erst beim Anzeigen eine Zeile: Geloeschtes faellt so von allein raus */
function resolveOpen(open) {
  if (open.kind === "entry") {
    const entry = entries.find((item) => String(item.id) === open.id && !item.archived);
    return entry ? searchItemOfEntry(entry) : null;
  }
  if (open.kind === "workspace") {
    const workspace = workspaces.find((item) => String(item.id) === open.id);
    return workspace ? searchItemOfWorkspace(workspace) : null;
  }
  const page = overviewPages[open.id];
  return page ? { kind: "overview", id: open.id, title: page.title, icon: page.icon, label: "Übersicht" } : null;
}

function searchItemOfEntry(entry) {
  return {
    kind: "entry",
    id: entry.id,
    title: entry.title || "Ohne Titel",
    icon: typeIcon(entry.type),
    label: typeLabelOf(entry.type),
    note: parentName(entry.parent),
  };
}

function searchItemOfWorkspace(workspace) {
  return { kind: "workspace", id: workspace.id, title: workspace.name, icon: workspaceIcon(workspace), label: "Arbeitsbereich" };
}

function openCountOf(kind, id) {
  const found = opens.find((item) => item.key === `${kind}:${id}`);
  return found ? found.count : 0;
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/* Uhrzeit bei heute, sonst Datum: in der Zeile steht nur das Kurze */
function openTime(ts) {
  const date = new Date(ts);
  if (sameDay(ts, Date.now())) return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

/* Ueberschrift einer Tagesgruppe */
function dayHeading(ts) {
  const today = Date.now();
  if (sameDay(ts, today)) return "Heute";
  if (sameDay(ts, today - 86400000)) return "Gestern";
  return new Date(ts).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit" });
}

/* Treffer im Titel hervorheben, der Rest bleibt escaped */
function markHit(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const needle = escapeHtml(query);
  const at = safe.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return safe;
  return `${safe.slice(0, at)}<mark class="search-hit">${safe.slice(at, at + needle.length)}</mark>${safe.slice(at + needle.length)}`;
}

function searchRow(item, meta, query = "") {
  const attr =
    item.kind === "entry"
      ? `data-open-entry="${item.id}"`
      : item.kind === "workspace"
        ? `data-open-workspace="${item.id}"`
        : `data-open-overview="${item.id}"`;
  return `
    <button class="search-row" type="button" ${attr}>
      ${icon(item.icon)}
      <div class="search-copy">
        <p class="search-title">${markHit(item.title, query)}</p>
        <p class="search-meta">${escapeHtml(meta)}</p>
      </div>
      ${icon("chevron", "chevron")}
    </button>
  `;
}

/* Durchsucht werden Eintraege (Titel und Text), Arbeitsbereiche und die Übersichtskarten */
function searchPool() {
  return [
    ...entries
      .filter((entry) => !entry.archived)
      .map((entry) => ({ ...searchItemOfEntry(entry), text: `${entry.title} ${entry.body || ""}` })),
    ...workspaces.map((workspace) => ({ ...searchItemOfWorkspace(workspace), text: workspace.name })),
    ...Object.entries(overviewPages).map(([id, page]) => ({
      kind: "overview",
      id,
      title: page.title,
      icon: page.icon,
      label: "Übersicht",
      text: page.title,
    })),
  ];
}

function searchHits(query) {
  const needle = query.toLowerCase();
  return searchPool()
    .filter((item) => item.text.toLowerCase().includes(needle))
    .sort((a, b) => {
      const startA = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
      const startB = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
      if (startA !== startB) return startA - startB;
      return openCountOf(b.kind, b.id) - openCountOf(a.kind, a.id);
    })
    .slice(0, 30);
}

/* Eine Zeile je gemerktem Suchbegriff */
function searchQueryRow(query) {
  return `
    <button class="search-row search-row-query" type="button" data-search-query="${escapeHtml(query)}">
      ${icon("search")}
      <div class="search-copy"><p class="search-title">${escapeHtml(query)}</p></div>
    </button>
  `;
}

/* Alle Merkposten, die es noch gibt, als fertige Zeilen-Bausteine */
function knownOpens() {
  return opens.map((open) => ({ open, item: resolveOpen(open) })).filter((row) => row.item);
}

function mostOpened() {
  return [...knownOpens()].sort((a, b) => b.open.count - a.open.count || b.open.ts - a.open.ts);
}

/* Kopfzeile der Unterseiten: Zurück-Pfeil und Titel wie bei einem Arbeitsbereich */
function searchListHead(title) {
  return `
    <div class="page-head">
      <button class="back-btn" type="button" data-search-back aria-label="Zurück">${icon("back")}</button>
      <h1 class="screen-title page-title">${escapeHtml(title)}</h1>
    </div>
  `;
}

/* Eigene Seite: erst alles Gesuchte, dann alles Geöffnete */
function renderSearchList() {
  if (searchList === "searches") {
    searchResults.innerHTML =
      searchListHead("Zuletzt gesucht") +
      (recentSearches.length
        ? `<div class="workspace-list">${recentSearches.map(searchQueryRow).join("")}</div>`
        : `<p class="empty-note">Noch nichts gesucht.</p>`);
    return;
  }

  const rows = mostOpened();
  searchResults.innerHTML =
    searchListHead("Am häufigsten geöffnet") +
    (rows.length
      ? `<div class="workspace-list">${rows
          .map(({ open, item }) => searchRow(item, `${item.label} · ${open.count}× geöffnet`))
          .join("")}</div>`
      : `<p class="empty-note">Noch nichts geöffnet.</p>`);
}

function renderSearch() {
  if (!searchResults) return;

  if (searchQuery) {
    const hits = searchHits(searchQuery);
    searchResults.innerHTML =
      `<h1 class="screen-title">Suchen</h1>` +
      (hits.length
        ? `
          <div class="section-head"><h2>Ergebnisse</h2></div>
          <div class="workspace-list">${hits
            .map((item) => searchRow(item, item.note ? `${item.label} · ${item.note}` : item.label, searchQuery))
            .join("")}</div>
        `
        : `<p class="empty-note">Keine Treffer für „${escapeHtml(searchQuery)}“.</p>`);
    return;
  }

  if (searchList) {
    renderSearchList();
    return;
  }

  /* Übersicht zeigt nur die Spitze: der letzte Suchbegriff und die drei meistgeöffneten.
     Der Pfeil rechts führt jeweils auf die volle Liste. */
  const latestSearch = recentSearches[0];
  const most = mostOpened()
    .slice(0, 3)
    .map(({ open, item }) => searchRow(item, `${item.label} · ${open.count}× geöffnet`))
    .join("");

  /* Zuletzt geöffnet: nach Tagen gruppiert, damit „Heute“ und „Gestern“ getrennt stehen */
  const recent = [...knownOpens()].sort((a, b) => b.open.ts - a.open.ts).slice(0, 15);
  const groups = [];
  recent.forEach(({ open, item }) => {
    const heading = dayHeading(open.ts);
    const group = groups.find((entry) => entry.heading === heading);
    const row = searchRow(item, `${item.label} · ${openTime(open.ts)}`);
    if (group) group.rows.push(row);
    else groups.push({ heading, rows: [row] });
  });

  searchResults.innerHTML = `
    <h1 class="screen-title">Suchen</h1>
    <div class="section-head">
      <h2>Zuletzt gesucht</h2>
      <button class="section-more" type="button" data-search-list="searches" aria-label="Alle anzeigen">${icon("chevron", "chevron")}</button>
    </div>
    ${latestSearch ? `<div class="workspace-list">${searchQueryRow(latestSearch)}</div>` : `<p class="empty-note">Noch nichts gesucht.</p>`}
    <div class="section-head">
      <h2>Am häufigsten geöffnet</h2>
      <button class="section-more" type="button" data-search-list="most" aria-label="Alle anzeigen">${icon("chevron", "chevron")}</button>
    </div>
    ${most ? `<div class="workspace-list">${most}</div>` : `<p class="empty-note">Noch nichts geöffnet.</p>`}
    <div class="section-head"><h2>Zuletzt geöffnet</h2></div>
    ${
      groups.length
        ? groups
            .map(
              (group) =>
                `<h3 class="date-label">${escapeHtml(group.heading)}</h3><div class="workspace-list">${group.rows.join("")}</div>`
            )
            .join("")
        : `<p class="empty-note">Noch nichts geöffnet.</p>`
    }
  `;
}

document.getElementById("search-entry").addEventListener("click", () => {
  showSearch();
});

searchInput.addEventListener("focus", () => {
  showSearch();
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim();
  if (searchQuery) searchList = null;
  if (!searchView.classList.contains("is-active")) showSearch();
  else renderSearch();
});

/* change: Handy-Tastaturen schicken beim „Suchen“-Knopf kein Enter, aber immer ein change */
searchInput.addEventListener("change", () => {
  noteSearch(searchInput.value);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    noteSearch(searchQuery);
    searchInput.blur();
    renderSearch();
    return;
  }
  if (event.key === "Escape") {
    searchInput.value = "";
    searchQuery = "";
    renderSearch();
  }
});

searchView.addEventListener("click", (event) => {
  const more = event.target.closest("[data-search-list]");
  if (more) {
    showSearch(false, more.dataset.searchList);
    return;
  }

  if (event.target.closest("[data-search-back]")) {
    history.back();
    return;
  }

  const query = event.target.closest("[data-search-query]");
  if (query) {
    searchInput.value = query.dataset.searchQuery;
    searchQuery = searchInput.value;
    searchList = null;
    renderSearch();
    return;
  }

  /* Ein geoeffneter Treffer macht die Eingabe zu einer gemerkten Suche */
  if (event.target.closest("[data-open-entry], [data-open-workspace], [data-open-overview]")) noteSearch(searchQuery);

  const card = event.target.closest("[data-open-overview]");
  if (card) openTarget("overview", card.dataset.openOverview);
});

window.addEventListener("popstate", (event) => {
  const state = event.state;
  closeSheet();
  closeCtxMenu();
  progressModal.hidden = true;
  avatarView.hidden = true;

  if (state && state.view === "progress") {
    hideProfile();
    openProgress(false);
    return;
  }
  if (state && state.view === "avatar") {
    openProfile(false);
    openAvatarView(false);
    return;
  }
  if (state && state.view === "profile") {
    openProfile(false);
    return;
  }

  hideProfile();

  if (!state || state.view === "home") {
    showHome(true);
    return;
  }
  if (state.view === "search") {
    showSearch(true, state.list || null);
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
loadProfilePhoto();
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
renderProfileButton();
history.replaceState({ view: "home" }, "", "#/");
