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

const pages = {
  overview: {
    1: { title: "Inbox", items: 6, icon: "inbox", kind: "inbox" },
    2: { title: "Übersicht 2", items: 4 },
    3: { title: "Übersicht 3", items: 5 },
    4: { title: "Übersicht 4", items: 3 },
  },
  aufgaben: { title: "Aufgaben", items: 5 },
  notizen: { title: "Notizen", items: 4 },
  termine: { title: "Termine", items: 4 },
};

const storageKey = "paralist-mvp";

let workspaces = [{ id: 1, name: "Platzhalter 1" }];
let entries = [];
let nextEntryId = 1;
let sourceView = "home";
let currentPage = null;
let currentEntryId = null;
let composerType = types[0].id;
let composerParent = null;
let sheetActions = [];

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

/* Speichern im Browser, damit Einträge einen Neuladen der Seite überleben.
   In privaten Fenstern kann der Zugriff fehlschlagen, darum abgesichert. */
function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ workspaces, entries, nextEntryId }));
  } catch (error) {
    /* ohne Speicher läuft die App weiter, nur ohne Merken */
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return;
    if (Array.isArray(saved.workspaces) && saved.workspaces.length) workspaces = saved.workspaces;
    if (Array.isArray(saved.entries)) entries = saved.entries;
    if (Number(saved.nextEntryId)) nextEntryId = Number(saved.nextEntryId);
  } catch (error) {
    /* kaputte oder fehlende Daten werden ignoriert */
  }
}

function workspaceName(id) {
  const workspace = workspaces.find((item) => String(item.id) === String(id));
  return workspace ? workspace.name : "Inbox";
}

function entriesOf(parent) {
  return entries.filter((entry) => !entry.archived && String(entry.parent ?? "") === String(parent ?? ""));
}

function inboxCount() {
  return entriesOf(null).length;
}

function hideAllViews() {
  Object.values(views).forEach((view) => {
    view.hidden = true;
    view.classList.remove("is-active");
  });
}

function showView(name) {
  closeComposer();
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
  grid.innerHTML = Object.entries(pages.overview)
    .map(([id, page]) => {
      const count = page.kind === "inbox" ? inboxCount() : page.items;
      return `
        <button class="overview-card" type="button" data-open="overview" data-id="${id}" onclick="openTarget('overview', '${id}')">
          ${icon(page.icon || "placeholder", "card-icon")}
          <span class="card-label">
            ${page.title}
            <span class="card-count">${count}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderWorkspaces() {
  const rows = workspaces
    .map(
      (workspace) => `
        <button class="workspace-row" type="button" data-open="workspace" data-id="${workspace.id}" onclick="openTarget('workspace', '${workspace.id}')">
          ${icon("folder")}
          <span>${escapeHtml(workspace.name)}</span>
          ${icon("chevron", "chevron")}
        </button>
      `
    )
    .join("");

  workspaceList.innerHTML =
    rows +
    `
      <button class="workspace-row workspace-add" type="button" data-action="add-workspace" onclick="addWorkspace()">
        ${icon("folder-plus")}
        <span>Add Workspace</span>
      </button>
    `;
}

/* Eine Zeile mit Wisch-Knöpfen: links Archivieren und Verknüpfen, rechts Löschen */
function entryRow(entry) {
  return `
    <div class="swipe" data-entry="${entry.id}">
      <div class="swipe-actions swipe-actions-left">
        <button class="swipe-action swipe-action-archive" type="button" data-swipe="archive" aria-label="Archivieren">
          ${icon("archive")}
        </button>
        <button class="swipe-action swipe-action-link" type="button" data-swipe="link" aria-label="Verknüpfen">
          ${icon("link")}
        </button>
      </div>
      <div class="swipe-actions swipe-actions-right">
        <button class="swipe-action swipe-action-delete" type="button" data-swipe="delete" aria-label="Löschen">
          ${icon("trash")}
        </button>
      </div>
      <div class="swipe-body">
        <button class="workspace-row entry-row" type="button" data-open-entry="${entry.id}">
          ${icon(typeIcon(entry.type), "entry-type")}
          <span>${escapeHtml(entry.title)}</span>
          ${icon("chevron", "chevron")}
        </button>
      </div>
    </div>
  `;
}

function renderPlaceholderList(count) {
  const rows = Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return `
      <button class="workspace-row" type="button">
        ${icon("placeholder")}
        <span>Eintrag ${n}</span>
        ${icon("chevron", "chevron")}
      </button>
    `;
  }).join("");

  return `<div class="workspace-list">${rows}</div>`;
}

function renderPageBody() {
  if (!currentPage) return;

  if (currentPage.kind === "static") {
    pageMenuBtn.hidden = true;
    pageBody.innerHTML = renderPlaceholderList(currentPage.items);
    return;
  }

  pageMenuBtn.hidden = false;
  const list = entriesOf(currentPage.kind === "inbox" ? null : currentPage.id);
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
  workspaces.push({ id, name: `Platzhalter ${id}` });
  saveState();
  renderWorkspaces();
}

function openTarget(open, id) {
  if (open === "overview") {
    const page = pages.overview[id];
    if (!page) return;
    showPage(
      page.kind === "inbox"
        ? { kind: "inbox", title: page.title }
        : { kind: "static", title: page.title, items: page.items }
    );
    history.pushState({ view: "overview", id, from: sourceView }, "", `#/uebersicht/${id}`);
    return;
  }

  if (open === "workspace") {
    const workspace = workspaces.find((item) => String(item.id) === String(id));
    if (!workspace) return;
    showPage({ kind: "workspace", id: workspace.id, title: workspace.name });
    history.pushState({ view: "workspace", id, from: sourceView }, "", `#/arbeitsbereich/${id}`);
    return;
  }

  const page = pages[open];
  if (!page) return;
  showPage({ kind: "static", title: page.title, items: page.items });
  history.pushState({ view: open, from: sourceView }, "", `#/${open}`);
}

function openEntry(id, push = true) {
  const entry = entries.find((item) => String(item.id) === String(id));
  if (!entry) return;
  currentEntryId = entry.id;
  entryTitle.value = entry.title;
  entryBody.value = entry.body || "";
  entryCrumb.textContent = entry.parent ? workspaceName(entry.parent) : "Inbox";
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
  composerLinkLabel.textContent = composerParent ? workspaceName(composerParent) : "Inbox";
}

function openComposer() {
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
  });
  saveState();
  composerInput.value = "";
  closeComposer();
  renderOverview();
  renderPageBody();
}

/* ---------- Auswahl-Blatt ---------- */

function openSheet(title, options) {
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

function openParentPicker(title, current, onPick) {
  openSheet(title, [
    { label: "Inbox", icon: "inbox", active: !current, onSelect: () => onPick(null) },
    ...workspaces.map((workspace) => ({
      label: workspace.name,
      icon: "folder",
      active: String(current) === String(workspace.id),
      onSelect: () => onPick(workspace.id),
    })),
  ]);
}

/* ---------- Wischen ---------- */

let drag = null;

/* Wie weit die Zeile aufgehen darf: ein Knopf rechts, zwei links,
   jeweils mit Abstand davor und dahinter */
function swipeLimits() {
  const styles = getComputedStyle(document.documentElement);
  const size = parseInt(styles.getPropertyValue("--swipe-action-size"), 10) || 44;
  const gap = parseInt(styles.getPropertyValue("--swipe-action-gap"), 10) || 10;
  return { right: size + gap * 2, left: size * 2 + gap * 3 };
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
  if (!drag || event.pointerId !== drag.pointerId) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;

  if (!drag.axis) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (drag.axis === "x") {
      drag.body.classList.add("is-sliding");
      closeSwipes(drag.body);
    }
  }
  if (drag.axis !== "x") return;

  const limits = swipeLimits();
  const next = Math.max(-limits.right, Math.min(limits.left, drag.start + dx));
  setSwipe(drag.body, next);
});

function endDrag() {
  if (!drag) return;
  const body = drag.body;
  drag = null;
  body.classList.remove("is-sliding");

  const limits = swipeLimits();
  const x = Number(body.dataset.x || 0);
  if (x <= -limits.right / 2) setSwipe(body, -limits.right);
  else if (x >= limits.left / 2) setSwipe(body, limits.left);
  else setSwipe(body, 0);
}

content.addEventListener("pointerup", endDrag);
content.addEventListener("pointercancel", endDrag);

/* ---------- Klicks in Listen ---------- */

content.addEventListener("click", (event) => {
  const action = event.target.closest(".swipe-action");
  if (action) {
    const id = action.closest(".swipe").dataset.entry;
    const entry = entries.find((item) => String(item.id) === String(id));
    if (!entry) return;

    if (action.dataset.swipe === "delete") {
      entries = entries.filter((item) => item.id !== entry.id);
      saveState();
      renderOverview();
      renderPageBody();
      return;
    }
    if (action.dataset.swipe === "archive") {
      entry.archived = true;
      saveState();
      renderOverview();
      renderPageBody();
      return;
    }
    openParentPicker("Verknüpfen mit", entry.parent, (parent) => {
      entry.parent = parent;
      saveState();
      renderOverview();
      renderPageBody();
    });
    return;
  }

  const row = event.target.closest("[data-open-entry]");
  if (!row) return;
  const body = row.closest(".swipe-body");
  if (body && Number(body.dataset.x || 0) !== 0) {
    closeSwipes();
    return;
  }
  openEntry(row.dataset.openEntry);
});

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

pageMenuBtn.addEventListener("click", () => {
  if (!currentPage || currentPage.kind === "static") return;
  const options = [
    {
      label: "Alle Einträge löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        const parent = currentPage.kind === "inbox" ? null : currentPage.id;
        entries = entries.filter((entry) => String(entry.parent ?? "") !== String(parent ?? ""));
        saveState();
        renderOverview();
        renderPageBody();
      },
    },
  ];

  if (currentPage.kind === "workspace") {
    options.push({
      label: "Arbeitsbereich löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        const id = currentPage.id;
        workspaces = workspaces.filter((workspace) => String(workspace.id) !== String(id));
        entries.forEach((entry) => {
          if (String(entry.parent ?? "") === String(id)) entry.parent = null;
        });
        saveState();
        renderWorkspaces();
        renderOverview();
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
      label: "Verknüpfen",
      icon: "link",
      onSelect: () =>
        openParentPicker("Verknüpfen mit", entry.parent, (parent) => {
          entry.parent = parent;
          entryCrumb.textContent = parent ? workspaceName(parent) : "Inbox";
          saveState();
          renderOverview();
        }),
    },
    {
      label: "Archivieren",
      icon: "archive",
      onSelect: () => {
        entry.archived = true;
        saveState();
        renderOverview();
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
        renderOverview();
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
    const page = pages.overview[state.id];
    if (page) {
      sourceView = state.from || "home";
      showPage(
        page.kind === "inbox"
          ? { kind: "inbox", title: page.title }
          : { kind: "static", title: page.title, items: page.items }
      );
    }
    return;
  }
  if (state.view === "workspace") {
    sourceView = state.from || "home";
    const workspace = workspaces.find((item) => String(item.id) === String(state.id));
    if (workspace) showPage({ kind: "workspace", id: workspace.id, title: workspace.name });
    return;
  }
  const page = pages[state.view];
  if (page) {
    sourceView = state.from || "home";
    showPage({ kind: "static", title: page.title, items: page.items });
  }
});

loadState();
renderOverview();
renderWorkspaces();
renderComposerTypes();
history.replaceState({ view: "home" }, "", "#/");
