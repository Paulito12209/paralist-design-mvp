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
   Einträgen, „seed“ legt beim allerersten Start Beispieleinträge an. */
const overviewPages = {
  1: { title: "Inbox", icon: "inbox", parent: null },
  2: { title: "Übersicht 2", parent: "o2", seed: 4 },
  3: { title: "Übersicht 3", parent: "o3", seed: 5 },
  4: { title: "Übersicht 4", parent: "o4", seed: 3 },
};

const storageKey = "paralist-mvp";

let tabs = [{ id: 1, name: "Privat" }];
let activeTabId = 1;
let editingTabId = null;
let workspaces = [{ id: 1, name: "Platzhalter 1", tab: 1 }];
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

function sameParent(a, b) {
  return String(a ?? "") === String(b ?? "");
}

/* Speichern im Browser, damit Einträge einen Neuladen der Seite überleben.
   In privaten Fenstern kann der Zugriff fehlschlagen, darum abgesichert. */
function saveState() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ tabs, activeTabId, workspaces, entries, nextEntryId })
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
      });
    }
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
  if (!tabs.some((tab) => tab.id === activeTabId)) activeTabId = tabs[0].id;
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
  grid.innerHTML = Object.entries(overviewPages)
    .map(
      ([id, page]) => `
        <button class="overview-card" type="button" data-open="overview" data-id="${id}" onclick="openTarget('overview', '${id}')">
          ${icon(page.icon || "placeholder", "card-icon")}
          <span class="card-label">
            ${page.title}
            <span class="card-count">${entriesOf(page.parent).length}</span>
          </span>
        </button>
      `
    )
    .join("");
}

/* Tab-Pillen: der aktive Tab ist gefüllt, ein neuer Tab startet im Eingabefeld */
function renderTabs() {
  const pills = tabs
    .map((tab) => {
      if (tab.id === editingTabId) {
        return `<input class="tab-pill tab-pill-input" id="tab-name-input" type="text" value="${escapeHtml(tab.name)}" placeholder="${escapeHtml(tab.placeholder || "")}" aria-label="Tab benennen" />`;
      }
      const label = tab.name || tab.placeholder || "Tab";
      return `
        <button class="tab-pill${tab.id === activeTabId ? " is-active" : ""}" type="button" data-tab-id="${tab.id}">
          ${escapeHtml(label)}
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
    [swipeAction("archive", "Archivieren", "archive"), swipeAction("link", "Verknüpfen", "link")],
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

function renderWorkspaces() {
  const rows = tabWorkspaces()
    .map((workspace) =>
      swipeRow(
        `data-workspace="${workspace.id}"`,
        [],
        [swipeAction("delete-workspace", "Löschen", "trash", "delete")],
        `
          <button class="workspace-row" type="button" data-open-workspace="${workspace.id}">
            ${icon("folder")}
            <span>${escapeHtml(workspace.name)}</span>
            ${icon("chevron", "chevron")}
          </button>
        `
      )
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

function renderPageBody() {
  if (!currentPage) return;
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
  workspaces.push({ id, name: `Platzhalter ${id}`, tab: activeTabId });
  saveState();
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
  saveState();
  renderTabs();
}

function openTarget(open, id) {
  if (open === "overview") {
    const page = overviewPages[id];
    if (!page) return;
    showPage({ title: page.title, parent: page.parent });
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
    ...Object.values(overviewPages).map((page) => ({
      label: page.title,
      icon: page.icon || "placeholder",
      active: sameParent(current, page.parent),
      onSelect: () => onPick(page.parent),
    })),
    ...workspaces.map((workspace) => ({
      label: workspace.name,
      icon: "folder",
      active: sameParent(current, workspace.id),
      onSelect: () => onPick(workspace.id),
    })),
  ]);
}

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

  const limits = swipeLimits(drag.body);
  setSwipe(drag.body, Math.max(-limits.right, Math.min(limits.left, drag.start + dx)));
});

function endDrag() {
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

/* ---------- Klicks in Listen ---------- */

function refreshLists() {
  renderOverview();
  renderWorkspaces();
  renderPageBody();
}

content.addEventListener("click", (event) => {
  const action = event.target.closest(".swipe-action");
  if (action) {
    const kind = action.dataset.swipe;

    if (kind === "delete-workspace") {
      const id = action.closest(".swipe").dataset.workspace;
      workspaces = workspaces.filter((workspace) => String(workspace.id) !== String(id));
      entries.forEach((entry) => {
        if (sameParent(entry.parent, id)) entry.parent = null;
      });
      saveState();
      refreshLists();
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
      entry.archived = true;
      saveState();
      refreshLists();
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
      const tab = tabs.find((item) => item.id === id);
      editingTabId = id;
      if (tab && !tab.placeholder) tab.placeholder = tab.name;
      renderTabs();
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
  true /* blur steigt nicht auf, darum in der Erfassungsphase lauschen */
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

pageMenuBtn.addEventListener("click", () => {
  if (!currentPage) return;
  const options = [
    {
      label: "Alle Einträge löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        entries = entries.filter((entry) => !sameParent(entry.parent, currentPage.parent));
        saveState();
        refreshLists();
      },
    },
  ];

  if (currentPage.isWorkspace) {
    options.push({
      label: "Arbeitsbereich löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        const id = currentPage.parent;
        workspaces = workspaces.filter((workspace) => String(workspace.id) !== String(id));
        entries.forEach((entry) => {
          if (sameParent(entry.parent, id)) entry.parent = null;
        });
        saveState();
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
          entryCrumb.textContent = parentName(parent);
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
      showPage({ title: page.title, parent: page.parent });
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
renderOverview();
renderTabs();
renderWorkspaces();
renderComposerTypes();
history.replaceState({ view: "home" }, "", "#/");
