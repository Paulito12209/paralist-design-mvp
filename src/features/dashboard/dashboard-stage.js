/*
 * Die Bühne der Übersicht am Desktop — gebaut wie der Kopf von Apple Arcade:
 * groß die zuletzt erstellten, zuletzt geöffneten oder favorisierten Seiten,
 * eine nach der anderen; welche, wählt der Schalter darüber (gemerkt in
 * state.prefs.dashboard.stage). Links Art der
 * Seite, Titel, ein Satz und „Öffnen“, rechts ihr Cover im Farbton der Seite
 * mit leuchtender Umlaufbahn. Darunter die Punkte zum Blättern und eine Reihe
 * Kacheln mit dem, was mit der gezeigten Seite verknüpft ist — bei
 * Arbeitsbereichen und Projekten ihr Inhalt.
 * Pfad: src/features/dashboard/dashboard-stage.js
 *
 * Blättern: Punkte, die Pfeile rechts daneben, die Pfeiltasten (solange die
 * Bühne den Fokus hat) und waagerechtes Wischen auf dem Trackpad. Die Bühne
 * blättert nie von selbst — die Kacheln darunter gehören zur gezeigten Seite
 * und sollen nicht unter der Maus wegspringen.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * slideLimit    -> wie viele Seiten die Bühne höchstens zeigt
 * tileLimit     -> wie viele Kacheln unter der Bühne höchstens stehen (danach „+ n“)
 * swipeDistance -> wie weit man auf dem Trackpad waagerecht wischen muss, bis die Seite wechselt (Pixel)
 * swipePause    -> Ruhe nach einem Wechsel per Wischen, damit ein Schwung nicht mehrere Seiten weiterblättert (ms)
 * enterOrder    -> Platz von Bühne und Punkten beim Auftauchen, nach den vier Zahlen (0–3)
 * welcomes      -> was die Bühne je Modus zeigt, solange sie leer ist: Art, Titel, Satz,
 *                  Icon im Cover und die Pille darunter (ohne `action` keine Pille)
 * stampLabels   -> das Wort vor der Zeit im Satz unter dem Titel („geöffnet 14:20“)
 * satellites    -> die Kugeln rund ums Cover der Willkommensseite: welche Kategorie (Icon und Farbe),
 *                  wo sie sitzt (x/y in Prozent der Fläche), wie groß (size in Pixel) und wann sie
 *                  im Schweben beginnt (delay in Sekunden)
 *
 * Aussehen, Größen und Bewegung: styles/dashboard-stage.css.
 */

import { emit, events } from "../../core/bus.js";
import { formatNumber, shortOpenTime } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { stageModes, typeIcon, typeSingular, xpItems } from "../../data/config.js";
import { stagePages } from "../../data/insights.js";
import { canLink } from "../../data/links.js";
import { entryColor, findEntry, workspaceColor, workspaceIcon, workspaceLabel } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";
import { openLinkSheet } from "../../ui/link-sheet.js";
import { openEntry, openEntryOrFile, openTarget } from "../../ui/router.js";

const slideLimit = 6;
const tileLimit = 7;
const swipeDistance = 60;
const swipePause = 600;
const enterOrder = 4;

/* Die leere Bühne je Modus: eine Einladung statt einer leeren Fläche. */
const welcomes = {
  created: {
    kicker: "Willkommen",
    title: "Hier erscheint, was du neu anlegst",
    text: "Leg eine Seite an — die neueste steht hier vorn, samt allem, was mit ihr verknüpft ist.",
    art: "layers",
    action: "Neu anlegen",
  },
  opened: {
    kicker: "Willkommen",
    title: "Hier erscheint, woran du arbeitest",
    text: "Öffne eine Seite — sie landet hier, samt allem, was mit ihr verknüpft ist.",
    art: "layers",
    action: "Neu anlegen",
  },
  favorites: {
    kicker: "Favoriten",
    title: "Hier stehen deine Favoriten",
    text: "Markiere eine Seite mit dem Stern — sie bleibt hier griffbereit.",
    art: "star-outline",
  },
};

/* Favoriten nennen, wann man sie zuletzt geöffnet hat; nie geöffnete nur ihren Inhalt. */
const stampLabels = { created: "erstellt", opened: "geöffnet", favorites: "geöffnet" };

/*
 * Die Kategorien, die um das Cover der Willkommensseite kreisen — verschieden
 * groß, damit es wie ein Schwarm wirkt. `type` nimmt Icon und Farbe der
 * Eintragsart aus src/data/config.js; `icon` ohne `type` ist eine der festen
 * Sammlungen der Seitenleiste (dann ohne Farbe, im Ton der Seite).
 */
const satellites = [
  { type: "aufgabe", x: 27, y: 21, size: 46, delay: 0 },
  { type: "termin", x: 85, y: 38, size: 52, delay: 1.2 },
  { type: "projekt", x: 75, y: 79, size: 42, delay: 2.4 },
  { type: "dokument", x: 21, y: 74, size: 38, delay: 0.6 },
  { type: "notiz", x: 71, y: 14, size: 32, delay: 1.8 },
  { type: "zeichnung", x: 9, y: 46, size: 28, delay: 3 },
  { type: "lesezeichen", x: 40, y: 8, size: 24, delay: 2.1 },
  { type: "medien", x: 58, y: 92, size: 28, delay: 0.9 },
  { icon: "star-outline", x: 92, y: 13, size: 22, delay: 2.7 },
  { icon: "inbox", x: 93, y: 74, size: 22, delay: 1.5 },
  { icon: "cube", x: 40, y: 93, size: 24, delay: 3.3 },
];

let modes = null;
let stage = null;
let mode = "opened";
let shelf = null;
let pages = [];
let index = 0;
let swipeSum = 0;
let swipeLockUntil = 0;

/*
 * Das Emblem eines Eintrags: sein eigenes Icon oder das seines Typs — nie ein
 * Vorschaubild. Eine Skizze oder ein Foto im Cover wirkte wie ein Fremdkörper
 * zwischen den ruhigen Icons; die Vorschau gibt es auf der Seite selbst.
 */
function emblem(entry) {
  return icon(entry.icon || typeIcon(entry.type));
}

/* „1 verknüpfter Eintrag“ / „3 Einträge darin“ — der Satz unter dem Titel. */
function relatedSentence(page) {
  const count = page.related.length;
  if (page.linked) {
    if (!count) return "Noch nichts verknüpft";
    return `${formatNumber(count)} ${count === 1 ? "verknüpfter Eintrag" : "verknüpfte Einträge"}`;
  }
  if (!count) return "Noch leer";
  return `${formatNumber(count)} ${count === 1 ? "Eintrag" : "Einträge"} darin`;
}

/* Was eine Seite auf der Bühne braucht, gleich für Eintrag und Arbeitsbereich. */
function describe(page) {
  if (page.kind === "workspace") {
    const workspace = page.item;
    return {
      key: `workspace:${workspace.id}`,
      kicker: "Arbeitsbereich",
      title: escapeHtml(workspaceLabel(workspace)),
      color: workspaceColor(),
      art: icon(workspaceIcon(workspace)),
    };
  }
  const entry = page.item;
  return {
    key: `entry:${entry.id}`,
    kicker: escapeHtml(typeSingular(entry.type)),
    title: escapeHtml(entry.title || "Ohne Titel"),
    color: entryColor(entry),
    art: emblem(entry),
  };
}

/* Eine Kategorie-Kugel: Icon im Ton ihrer Eintragsart, Platz und Größe aus `satellites`. */
function satelliteMarkup(item) {
  const color = item.type ? xpItems[item.type].color : "var(--showcase-accent)";
  const glyph = icon(item.type ? typeIcon(item.type) : item.icon);
  return `<span class="showcase-sat" style="--sat-x: ${item.x}%; --sat-y: ${item.y}%; --sat-size: ${item.size}px; --sat-color: ${color}; --sat-delay: ${item.delay}s">${glyph}</span>`;
}

/* Die Kunst rechts: drei Bahnen, die um das Cover kreisen, und das Cover selbst. */
function artMarkup(art, swarm = "") {
  return `
    <div class="showcase-art" aria-hidden="true">
      <span class="showcase-glow"></span>
      <span class="showcase-orbit"><span></span><span></span><span></span></span>
      ${swarm}
      <span class="showcase-cover">${art}</span>
    </div>`;
}

/* „3 Einträge darin · erstellt 14:20“ — ohne Zeitpunkt nur der erste Teil. */
function slideText(page) {
  const stamp = page.ts ? ` · ${stampLabels[mode]} ${shortOpenTime(page.ts)}` : "";
  return `${relatedSentence(page)}${stamp}`;
}

function slideMarkup(page, position, count) {
  const info = describe(page);
  return `
    <article class="showcase-slide" role="group" aria-roledescription="Seite" aria-label="${position + 1} von ${count}: ${info.title}" style="--showcase-accent: ${info.color}" data-showcase-key="${info.key}">
      <div class="showcase-copy">
        <p class="showcase-kicker">${info.kicker}</p>
        <h2 class="showcase-title">${info.title}</h2>
        <p class="showcase-text">${slideText(page)}</p>
        <button class="showcase-open" type="button" data-showcase-open="${position}">Öffnen</button>
      </div>
      ${artMarkup(info.art)}
    </article>`;
}

/* Nichts da im gewählten Modus: eine einladende Seite statt einer leeren Fläche. */
function welcomeMarkup() {
  const copy = welcomes[mode];
  const action = copy.action ? `<button class="showcase-open" type="button" data-showcase-new="1">${copy.action}</button>` : "";
  return `
    <article class="showcase-slide is-active" style="--showcase-accent: var(--avatar-btn-bg)">
      <div class="showcase-copy">
        <p class="showcase-kicker">${copy.kicker}</p>
        <h2 class="showcase-title">${copy.title}</h2>
        <p class="showcase-text">${copy.text}</p>
        ${action}
      </div>
      ${artMarkup(icon(copy.art), satellites.map(satelliteMarkup).join(""))}
    </article>`;
}

/* Die Knöpfe des Schalters über der Bühne — dieselbe Pille wie Liste | Board auf der Aufgaben-Seite. */
function modesMarkup() {
  return stageModes
    .map(
      (item) => `<button class="showcase-mode${item.id === mode ? " is-on" : ""}" type="button" data-showcase-mode="${item.id}" aria-pressed="${item.id === mode}">${escapeHtml(item.label)}</button>`
    )
    .join("");
}

/* Punkte zum Blättern und rechts daneben die beiden Pfeile. */
function pagerMarkup() {
  const dots = pages
    .map((page, position) => {
      const label = `${position + 1}: ${describe(page).title}`;
      return `<button class="showcase-dot" type="button" data-showcase-dot="${position}" aria-label="Seite ${label}"></button>`;
    })
    .join("");
  return `
    <div class="showcase-pager dash-enter" style="--i: ${enterOrder + 1}">
      <div class="showcase-dots">${dots}</div>
      <div class="showcase-steps">
        <button class="showcase-step" type="button" data-showcase-step="-1" aria-label="Vorige Seite">${icon("back")}</button>
        <button class="showcase-step" type="button" data-showcase-step="1" aria-label="Nächste Seite">${icon("chevron")}</button>
      </div>
    </div>`;
}

/* Eine Kachel wie ein App-Icon: getönte Fläche mit Icon oder Vorschaubild, darunter Titel und Art. */
function tileMarkup(entry) {
  const title = escapeHtml(entry.title || "Ohne Titel");
  return `
    <button class="showcase-tile" type="button" data-showcase-entry="${escapeHtml(entry.id)}" style="--tile-accent: ${entryColor(entry)}">
      <span class="showcase-tile-art">${emblem(entry)}</span>
      <span class="showcase-tile-title">${title}</span>
      <span class="showcase-tile-kind">${escapeHtml(typeSingular(entry.type))}</span>
    </button>`;
}

/* Die Reihe unter der Bühne — gehört zur gerade gezeigten Seite. */
function shelfMarkup(page) {
  const heading = page.linked ? "Verknüpfte Einträge" : "Inhalt";
  const shown = page.related.slice(0, tileLimit);
  const rest = page.related.length - shown.length;
  const more = rest
    ? `<button class="showcase-tile is-more" type="button" data-showcase-open="${index}"><span class="showcase-tile-art">+${formatNumber(rest)}</span><span class="showcase-tile-title">Alle ansehen</span></button>`
    : "";
  let body = `<div class="showcase-tiles">${shown.map(tileMarkup).join("")}${more}</div>`;
  if (!shown.length) {
    const linkable = page.kind === "entry" && page.linked && canLink(page.item);
    body = linkable
      ? `<button class="showcase-tile is-add" type="button" data-showcase-link="${escapeHtml(page.item.id)}" aria-label="Eintrag verknüpfen"><span class="showcase-tile-art">${icon("plus")}</span></button>`
      : '<p class="showcase-shelf-empty">Hier liegt noch nichts.</p>';
  }
  return `<h2 class="showcase-shelf-title">${heading}<span>${describe(page).title}</span></h2>${body}`;
}

/* Eine Seite zeigen: Klassen umschalten, Punkte nachziehen, die Reihe darunter neu setzen. */
function select(position) {
  if (!pages.length) return;
  index = (position + pages.length) % pages.length;
  stage.querySelectorAll(".showcase-slide").forEach((slide, slideIndex) => {
    const chosen = slideIndex === index;
    slide.classList.toggle("is-active", chosen);
    /* inert: verdeckte Seiten sind nicht per Tab erreichbar und werden nicht vorgelesen */
    slide.inert = !chosen;
  });
  stage.querySelectorAll(".showcase-dot").forEach((dot, dotIndex) => {
    if (dotIndex === index) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
  shelf.innerHTML = shelfMarkup(pages[index]);
}

/**
 * Bühne und Reihe neu aufbauen.
 * @param reset true beim Öffnen der Übersicht und beim Wechsel des Modus:
 *   die erste Seite des Modus steht vorn. Sonst bleibt die gezeigte Seite stehen, wo sie war.
 */
export function renderStage(reset) {
  if (!stage) return;
  const shownKey = !reset && pages[index] ? describe(pages[index]).key : null;
  mode = state.prefs.dashboard.stage;
  pages = stagePages(mode, slideLimit);
  stage.setAttribute("aria-label", stageModes.find((item) => item.id === mode).label);
  modes.innerHTML = modesMarkup();
  const kept = shownKey ? pages.findIndex((page) => describe(page).key === shownKey) : -1;
  stage.classList.toggle("is-single", pages.length < 2);
  shelf.hidden = !pages.length;
  if (!pages.length) {
    stage.innerHTML = `<div class="showcase-slides dash-enter" style="--i: ${enterOrder}">${welcomeMarkup()}</div>`;
    return;
  }
  const slides = pages.map((page, position) => slideMarkup(page, position, pages.length)).join("");
  stage.innerHTML = `<div class="showcase-slides dash-enter" style="--i: ${enterOrder}">${slides}</div>${pagerMarkup()}`;
  select(Math.max(0, kept));
}

/* Einen Modus wählen und merken; die Bühne beginnt dann wieder bei ihrer ersten Seite. */
function selectMode(id) {
  if (id === mode) return;
  state.prefs.dashboard.stage = id;
  saveState();
  renderStage(true);
}

function openPage(position) {
  const page = pages[position];
  if (!page) return;
  if (page.kind === "workspace") openTarget("workspace", page.item.id);
  else openEntry(page.item.id);
}

/* Ein Klick-Empfänger für Bühne und Reihe; das Merkmal am Knopf sagt, was passiert. */
function onClick(event) {
  const target = event.target.closest("[data-showcase-open], [data-showcase-dot], [data-showcase-step], [data-showcase-entry], [data-showcase-link], [data-showcase-new], [data-showcase-mode]");
  if (!target) return;
  const data = target.dataset;
  if (data.showcaseMode !== undefined) selectMode(data.showcaseMode);
  else if (data.showcaseOpen !== undefined) openPage(Number(data.showcaseOpen));
  else if (data.showcaseDot !== undefined) select(Number(data.showcaseDot));
  else if (data.showcaseStep !== undefined) select(index + Number(data.showcaseStep));
  else if (data.showcaseEntry !== undefined) openEntryOrFile(data.showcaseEntry);
  else if (data.showcaseLink !== undefined) {
    const entry = findEntry(data.showcaseLink);
    if (entry) openLinkSheet(entry);
  } else if (data.showcaseNew !== undefined) emit(events.createRequested);
}

function onKeyDown(event) {
  if (pages.length < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
  event.preventDefault();
  select(index + (event.key === "ArrowRight" ? 1 : -1));
}

/* Waagerechtes Wischen auf dem Trackpad blättert; senkrechtes rollt wie immer die Seite. */
function onWheel(event) {
  if (pages.length < 2 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  if (event.timeStamp < swipeLockUntil) return;
  swipeSum += event.deltaX;
  if (Math.abs(swipeSum) < swipeDistance) return;
  select(index + Math.sign(swipeSum));
  swipeSum = 0;
  swipeLockUntil = event.timeStamp + swipePause;
}

/**
 * Schalter, Bühne und Reihe ans Ende von `container` (dem Kopf der Übersicht)
 * hängen und die Zuhörer anmelden. Der Schalter bleibt stehen, wenn die Bühne
 * neu gezeichnet wird — so taucht beim Umschalten nur die Bühne neu auf. Einmal. Aufgetaucht wird mit dem Kopf: dessen
 * .is-entering lässt die neu gesetzten Teile mit .dash-enter aufsteigen.
 */
export function mountStage(container) {
  /* section: die Bühne ist ein eigener, benannter Bereich — Vorlesehilfen kündigen ihn als Karussell an */
  modes = document.createElement("div");
  modes.className = "showcase-modes dash-enter";
  modes.style.setProperty("--i", enterOrder);
  modes.setAttribute("role", "group");
  modes.setAttribute("aria-label", "Was die Bühne zeigt");
  stage = document.createElement("section");
  stage.className = "showcase";
  stage.setAttribute("aria-roledescription", "Karussell");
  shelf = document.createElement("section");
  shelf.className = "showcase-shelf";
  shelf.setAttribute("aria-live", "polite");
  container.append(modes, stage, shelf);
  modes.addEventListener("click", onClick);
  stage.addEventListener("click", onClick);
  shelf.addEventListener("click", onClick);
  stage.addEventListener("keydown", onKeyDown);
  /* passive: der Zuhörer hält das Rollen nie auf, der Browser muss nicht auf ihn warten */
  stage.addEventListener("wheel", onWheel, { passive: true });
}
