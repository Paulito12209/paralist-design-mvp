const homeView = document.getElementById("view-home");
const pageView = document.getElementById("view-page");
const searchView = document.getElementById("view-search");
const calendarView = document.getElementById("view-calendar");
const mediaView = document.getElementById("view-media");
const settingsView = document.getElementById("view-settings");
const pageTitle = document.getElementById("page-title");
const pageBody = document.getElementById("page-body");
const workspaceList = document.getElementById("workspace-list");
const searchInput = document.getElementById("search-input");
const tabButtons = document.querySelectorAll(".tab-btn");

const views = {
  home: homeView,
  page: pageView,
  search: searchView,
  calendar: calendarView,
  media: mediaView,
  settings: settingsView,
};

const pages = {
  overview: {
    1: { title: "Inbox", items: 6, icon: "inbox" },
    2: { title: "Übersicht 2", items: 4 },
    3: { title: "Übersicht 3", items: 5 },
    4: { title: "Übersicht 4", items: 3 },
  },
  aufgaben: { title: "Aufgaben", items: 5 },
  notizen: { title: "Notizen", items: 4 },
  termine: { title: "Termine", items: 4 },
};

let workspaces = [{ id: 1, name: "Platzhalter 1", items: 4 }];
let sourceView = "home";

function icon(name, className = "") {
  return `<svg class="icon${className ? ` ${className}` : ""}"><use href="#icon-${name}"></use></svg>`;
}

function hideAllViews() {
  Object.values(views).forEach((view) => {
    view.hidden = true;
    view.classList.remove("is-active");
  });
}

function showView(name) {
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
    .map(
      ([id, page]) => `
        <button class="overview-card" type="button" data-open="overview" data-id="${id}" onclick="openTarget('overview', '${id}')">
          ${icon(page.icon || "placeholder", "card-icon")}
          <span class="card-label">
            ${page.title}
            <span class="card-count">${page.items}</span>
          </span>
        </button>
      `
    )
    .join("");
}

function renderWorkspaces() {
  const rows = workspaces
    .map(
      (workspace) => `
        <button class="workspace-row" type="button" data-open="workspace" data-id="${workspace.id}" onclick="openTarget('workspace', '${workspace.id}')">
          ${icon("folder")}
          <span>${workspace.name}</span>
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

function renderEntryList(count) {
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

function showHome(replace = true) {
  showView("home");
  setActiveTab("home");
  sourceView = "home";
  const url = "#/";
  if (replace) history.replaceState({ view: "home" }, "", url);
  else history.pushState({ view: "home" }, "", url);
}

function showTab(tab, replace = false) {
  searchInput.blur();
  const url = tab === "home" ? "#/" : `#/${tab}`;
  if (!replace && location.hash === url) {
    if (tab === "home") {
      showView("home");
      setActiveTab("home");
      sourceView = "home";
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

function showPage(title, itemCount) {
  pageTitle.textContent = title;
  pageBody.innerHTML = renderEntryList(itemCount);
  showView("page");
}

function addWorkspace() {
  const id = workspaces.reduce((max, workspace) => Math.max(max, workspace.id), 0) + 1;
  workspaces.push({ id, name: `Platzhalter ${id}`, items: 3 });
  renderWorkspaces();
}

function openWorkspace(id) {
  const workspace = workspaces.find((item) => String(item.id) === String(id));
  if (!workspace) return false;
  showPage(workspace.name, workspace.items);
  return true;
}

function openTarget(open, id) {
  if (open === "overview") {
    const page = pages.overview[id];
    if (!page) return;
    showPage(page.title, page.items);
    history.pushState({ view: "overview", id, from: sourceView }, "", `#/uebersicht/${id}`);
    return;
  }

  if (open === "workspace") {
    if (!openWorkspace(id)) return;
    history.pushState({ view: "workspace", id, from: sourceView }, "", `#/arbeitsbereich/${id}`);
    return;
  }

  const page = pages[open];
  if (!page) return;
  showPage(page.title, page.items);
  history.pushState({ view: open, from: sourceView }, "", `#/${open}`);
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

document.getElementById("back-btn").addEventListener("click", (event) => {
  event.preventDefault();
  restoreFrom(sourceView);
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
  if (state.view === "overview") {
    const page = pages.overview[state.id];
    if (page) {
      sourceView = state.from || "home";
      showPage(page.title, page.items);
      setActiveTab(sourceView === "search" ? "" : sourceView === "home" ? "home" : sourceView);
    }
    return;
  }
  if (state.view === "workspace") {
    sourceView = state.from || "home";
    openWorkspace(state.id);
    return;
  }
  const page = pages[state.view];
  if (page) {
    sourceView = state.from || "home";
    showPage(page.title, page.items);
  }
});

renderOverview();
renderWorkspaces();
history.replaceState({ view: "home" }, "", "#/");
