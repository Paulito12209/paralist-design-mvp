/*
 * Die Lesezeichen-Seite hinter der Karte auf der Startseite. Aufgebaut wie
 * eine iOS-Infoseite: oben mittig ein großes Icon, darunter Titel und ein
 * Satz, dann Pillen wie auf der Medien-Seite (Web-Lesezeichen, Videos,
 * Standorte) und die Liste — links eine große Kachel, rechts Name, Website
 * und in welchem Eintrag das Lesezeichen steht. Bewusst ohne Farbverlauf
 * hinter dem Kopf. Waagerecht wischen wechselt die Pille. Wird erst beim
 * ersten Öffnen nachgeladen.
 * Pfad: src/features/bookmarks/bookmarks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyArt[*]  -> Icon und Texte des Platzhalters je Pille
 * EMPTY_ACTION -> Beschriftung der Pille, mit der man ein Lesezeichen anlegt
 *
 * Welche Pillen es gibt: src/data/bookmarks.js (bookmarkPills). Titel und
 * Satz im Kopf: src/data/collections.js (bookmarksPage). Größen und die
 * Lila-Farbe: styles/bookmarks.css und --bookmark-color in styles/tokens-pages.css.
 */

import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { colorFromText, faviconUrl } from "../../core/link-preview.js";
import { BOOKMARK_TYPE, bookmarkCounts, bookmarkItems, bookmarkPills, validBookmarkPill } from "../../data/bookmarks.js";
import { bookmarksPage } from "../../data/collections.js";
import { typeIcon, typeSingular } from "../../data/config.js";
import { hostOf, youtubeId, youtubeThumb } from "../../data/link-kinds.js";
import { placesLabel } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { setPagePill } from "../../ui/router.js";
import { isViewActive } from "../../ui/views.js";

/* Platzhalter je Pille; alle im Lila der Lesezeichen. */
const emptyArt = {
  web: { icon: "bookmark", title: "Noch keine Web-Lesezeichen", text: "Füg einen Link als Lesezeichen hinzu oder tippe im Inhalt eines Eintrags „/“ und wähle „Web-Lesezeichen“." },
  video: { icon: "video", title: "Noch keine Videos", text: "YouTube-Links aus deinen Einträgen sammeln sich hier." },
  place: { icon: "pin", title: "Noch keine Standorte", text: "Orte aus Google Maps, die du in Einträgen gespeichert hast, stehen hier." },
};

const EMPTY_ACTION = "Lesezeichen anlegen";

const isBookmarksOpen = () => isViewActive("page") && ui.currentPage?.kind === "bookmarks";

const activePill = () => validBookmarkPill(ui.currentPage?.pill);

/* Kopf wie auf einer iOS-Infoseite: großes Icon mittig, Titel und Satz linksbündig. */
function heroMarkup() {
  return `
    <header class="bookmark-hero">
      ${icon("bookmark", "bookmark-hero-icon")}
      <h1 class="bookmark-hero-title">${escapeHtml(bookmarksPage.title)}</h1>
      <p class="bookmark-hero-intro">${escapeHtml(bookmarksPage.intro)}</p>
    </header>`;
}

function pillsMarkup(active) {
  const counts = bookmarkCounts();
  return `<div class="tab-pills bookmark-pills">${bookmarkPills
    .map((pill) => {
      const mark = pill.id === active ? " is-active" : "";
      const count = counts[pill.id];
      return `
        <button class="tab-pill${mark}" type="button" data-bookmark-pill="${pill.id}">
          ${icon(pill.icon, "tab-pill-icon")}${pill.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("")}</div>`;
}

/* Die große Kachel links: Vorschaubild beim Video, Favicon auf seiner Farbe
   bei einer Website, eine Stecknadel beim Ort. */
function thumbMarkup(block) {
  const video = block.kind === "video" && youtubeId(block.url);
  if (video) {
    return `<span class="bookmark-thumb is-video"><img src="${youtubeThumb(video)}" alt="" loading="lazy" decoding="async" /><span class="embed-play" aria-hidden="true"></span></span>`;
  }
  if (block.kind === "link" && block.url) {
    const host = hostOf(block.url);
    const color = block.color || colorFromText(host);
    return `<span class="bookmark-thumb is-logo" style="--embed-color: ${escapeHtml(color)}"><img src="${faviconUrl(host)}" alt="" loading="lazy" decoding="async" /></span>`;
  }
  return `<span class="bookmark-thumb">${icon(block.kind === "place" ? "pin" : block.kind === "video" ? "video" : "bookmark")}</span>`;
}

/* Wo das Lesezeichen steht: ein eigener Eintrag nennt seinen Ablageort,
   eine Karte im Inhalt den Eintrag drumherum. */
function sourceLabel(entry) {
  if (entry.type === BOOKMARK_TYPE) return `Eigener Eintrag · ${placesLabel(entry)}`;
  return `In ${typeSingular(entry.type)} „${entry.title || typeSingular(entry.type)}“`;
}

function titleOf({ entry, block }) {
  if (!block.url) return entry.title;
  if (block.name) return block.name;
  /* Ein eigenes Lesezeichen ohne Kartennamen heißt wie sein Eintrag */
  if (entry.type === BOOKMARK_TYPE && entry.title) return entry.title;
  return block.kind === "video" ? "YouTube-Video" : hostOf(block.url);
}

function rowMarkup(item) {
  const { entry, block } = item;
  const site = block.url ? hostOf(block.url) : "Noch kein Link";
  return `
    <button class="bookmark-row" type="button" data-open-entry="${entry.id}">
      ${thumbMarkup(block)}
      <span class="bookmark-text">
        <span class="bookmark-title">${escapeHtml(titleOf(item))}</span>
        <span class="bookmark-site">${escapeHtml(site)}</span>
        <span class="bookmark-source">${icon(entry.icon || typeIcon(entry.type))}<span>${escapeHtml(sourceLabel(entry))}</span></span>
      </span>
      ${icon("chevron", "bookmark-chevron")}
    </button>`;
}

/** Kopf, Pillen und Liste in die Unterseite zeichnen. */
export function renderBookmarks() {
  if (!isBookmarksOpen()) return;
  const pill = activePill();
  const kind = bookmarkPills.find((item) => item.id === pill).kind;
  const items = bookmarkItems(kind);
  const list = items.length
    ? `<div class="bookmark-list">${items.map(rowMarkup).join("")}</div>`
    : emptyState({ ...emptyArt[pill], accent: "var(--bookmark-color)", action: { label: EMPTY_ACTION } });

  /* Die Leiste wird mit ersetzt: ihre Rollstellung mitnehmen */
  const scrolled = dom.pageBody.querySelector(".bookmark-pills")?.scrollLeft || 0;
  dom.pageBody.innerHTML = heroMarkup() + pillsMarkup(pill) + list;
  dom.pageBody.querySelector(".bookmark-pills").scrollLeft = scrolled;
}

function selectBookmarkPill(id) {
  if (!isBookmarksOpen()) return;
  setPagePill(id);
  renderBookmarks();
}

/* Beim Laden des Moduls einmal anmelden. Die Ansicht teilen sich alle
   Unterseiten der Übersicht: Tippen und Wischen gelten nur hier. */
dom.pageBody.addEventListener("click", (event) => {
  const pill = event.target.closest("[data-bookmark-pill]");
  if (pill && isBookmarksOpen()) selectBookmarkPill(pill.dataset.bookmarkPill);
});
initPillSwipe(el("view-page"), {
  order: bookmarkPills.map((pill) => pill.id),
  current: activePill,
  select: selectBookmarkPill,
  enabled: isBookmarksOpen,
});
