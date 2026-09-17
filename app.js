const homeView = document.getElementById("view-home");
const pageView = document.getElementById("view-page");
const pageTitle = document.getElementById("page-title");
const pageBody = document.getElementById("page-body");
const workspaceList = document.getElementById("workspace-list");

const pages = {
  overview: {
    1: { title: "Übersicht 1", items: 6 },
    2: { title: "Übersicht 2", items: 4 },
    3: { title: "Übersicht 3", items: 5 },
    4: { title: "Übersicht 4", items: 3 },
  },
  aufgaben: { title: "Aufgaben", items: 5 },
  notizen: { title: "Notizen", items: 4 },
  termine: { title: "Termine", items: 4 },
};

let workspaces = [{ id: 1, name: "Platzhalter 1", items: 4 }];

function icon(name, className = "") {
  return `<svg class="icon${className ? ` ${className}` : ""}"><use href="#icon-${name}"></use></svg>`;
}

function renderOverview() {
  const grid = document.getElementById("overview-grid");
  grid.innerHTML = Object.entries(pages.overview)
    .map(
      ([id, page]) => `
        <button class="overview-card" type="button" data-open="overview" data-id="${id}" onclick="openTarget('overview', '${id}')">
          ${icon("placeholder", "card-icon")}
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
      <button class="entry-row" type="button">
        <span class="entry-icon">${icon("placeholder")}</span>
        <span class="entry-copy">
          <strong>Eintrag ${n}</strong>
          <small>Platzhalter</small>
        </span>
        ${icon("chevron", "chevron")}
      </button>
    `;
  }).join("");

  return `<div class="entry-list">${rows}</div>`;
}

function showHome() {
  pageView.hidden = true;
  homeView.hidden = false;
  homeView.classList.add("is-active");
  pageView.classList.remove("is-active");
  history.replaceState({ view: "home" }, "", "#/");
}

function showPage(title, itemCount) {
  pageTitle.textContent = title;
  pageBody.innerHTML = renderEntryList(itemCount);
  homeView.hidden = true;
  pageView.hidden = false;
  homeView.classList.remove("is-active");
  pageView.classList.add("is-active");
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
    history.pushState({ view: "overview", id }, "", `#/uebersicht/${id}`);
    return;
  }

  if (open === "workspace") {
    if (!openWorkspace(id)) return;
    history.pushState({ view: "workspace", id }, "", `#/arbeitsbereich/${id}`);
    return;
  }

  const page = pages[open];
  if (!page) return;
  showPage(page.title, page.items);
  history.pushState({ view: open }, "", `#/${open}`);
}

document.getElementById("back-btn").addEventListener("click", (event) => {
  event.preventDefault();
  showHome();
});

window.addEventListener("popstate", (event) => {
  const state = event.state;
  if (!state || state.view === "home") {
    showHome();
    return;
  }
  if (state.view === "overview") {
    const page = pages.overview[state.id];
    if (page) showPage(page.title, page.items);
    return;
  }
  if (state.view === "workspace") {
    openWorkspace(state.id);
    return;
  }
  const page = pages[state.view];
  if (page) showPage(page.title, page.items);
});

renderOverview();
renderWorkspaces();
history.replaceState({ view: "home" }, "", "#/");
