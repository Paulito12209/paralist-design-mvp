/*
 * Seitenfenster › Browser: eine Website neben der eigenen Seite. Oben die
 * Adresszeile (Adresse oder Suchwort, Enter öffnet), daneben Neu laden, im
 * eigenen Tab öffnen und „Als Lesezeichen speichern“ — das legt einen
 * Eintrag vom Typ Lesezeichen im Eingang an; unter Lesezeichen steht dann,
 * wann er gespeichert wurde. Manche Websites verbieten das Einbetten (viele
 * Anmeldeseiten, GitHub, Banken): dann bleibt die Fläche leer — der Hinweis
 * darunter bietet den eigenen Tab an.
 * Pfad: src/shell/desk-side-browser.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * SEARCH_URL    -> womit ein Suchwort gesucht wird (Google lässt sich mit
 *                  „igu=1“ einbetten, die meisten Suchmaschinen nicht)
 * FRAME_SANDBOX -> was die eingebettete Website darf (Skripte, Formulare,
 *                  Fenster öffnen — aber nicht die App selbst wegnavigieren);
 *                  eine Seite der App selbst bekommt kein „allow-same-origin“,
 *                  sonst könnte sie aus dem Sandkasten ausbrechen
 *
 * Aussehen steht in styles/desk-side-views.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { noHistoryForm } from "../core/no-history.js";
import { BOOKMARK_TYPE, ownBookmarkFor } from "../data/bookmarks.js";
import { hostOf, normalizeUrl } from "../data/link-kinds.js";
import { createEntryInline } from "../data/mutations-inline.js";
import { openBookmarks } from "../ui/router.js";
import { showToast } from "../ui/toast.js";

const SEARCH_URL = "https://www.google.com/search?igu=1&q=";
const FRAME_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

/* Adresse oder Suchwort: was wie eine Adresse aussieht, wird geöffnet, alles andere gesucht. */
function targetOf(text) {
  const typed = text.trim();
  if (!typed) return "";
  return normalizeUrl(typed) || `${SEARCH_URL}${encodeURIComponent(typed)}`;
}

function bookmarkButton(url) {
  const saved = Boolean(url && ownBookmarkFor(url));
  const label = saved ? "Unter Lesezeichen gespeichert — öffnen" : "Als Lesezeichen speichern";
  return `<button class="side-btn side-bookmark${saved ? " is-on" : ""}" type="button" data-browser="bookmark" aria-label="${label}" title="${label}"${url ? "" : " disabled"}>${icon("bookmark")}</button>`;
}

function frameMarkup(url) {
  if (!url) {
    return `
      <div class="side-empty">
        ${icon("globe", "side-empty-icon")}
        <p class="side-empty-title">Gib oben eine Adresse ein</p>
        <p class="side-empty-text">Oder ein Suchwort — gesucht wird bei Google. Gefällt dir eine Seite, speichere sie mit dem Lesezeichen oben als Lesezeichen.</p>
      </div>`;
  }
  const own = new URL(url).origin === location.origin;
  const sandbox = own ? FRAME_SANDBOX.replace(" allow-same-origin", "") : FRAME_SANDBOX;
  /* iframe: die Website läuft eingesperrt (sandbox) neben der App; title für Vorlesehilfen */
  return `<iframe class="side-frame" src="${escapeHtml(url)}" sandbox="${sandbox}" referrerpolicy="strict-origin-when-cross-origin" title="Website: ${escapeHtml(hostOf(url))}"></iframe>`;
}

function markup(state) {
  const url = state.url || "";
  return `
    <div class="side-address">
      ${icon("globe", "side-address-icon")}
      <input class="side-address-input" type="text" form="${noHistoryForm}" inputmode="url" enterkeyhint="go" spellcheck="false" placeholder="Adresse oder Suchbegriff" aria-label="Adresse oder Suchbegriff" value="${escapeHtml(url)}" />
      <button class="side-btn" type="button" data-browser="reload" aria-label="Neu laden" title="Neu laden"${url ? "" : " disabled"}>${icon("refresh")}</button>
      <button class="side-btn" type="button" data-browser="external" aria-label="Im eigenen Tab öffnen" title="Im eigenen Tab öffnen"${url ? "" : " disabled"}>${icon("external")}</button>
      ${bookmarkButton(url)}
    </div>
    <div class="side-frame-box">${frameMarkup(url)}</div>
    ${url ? `<p class="side-note">Bleibt die Seite leer? Manche Websites lassen sich nicht einbetten — <button class="side-link" type="button" data-browser="external">im eigenen Tab öffnen</button>.</p>` : ""}`;
}

/*
 * Speichern als Lesezeichen — oder, schon gespeichert, die Lesezeichen öffnen.
 * Nur der Knopf wird getauscht: neu zeichnen lüde die Website neu.
 */
function saveBookmark(url, button) {
  if (!url) return;
  if (ownBookmarkFor(url)) {
    openBookmarks();
    return;
  }
  /* Der Titel ist der Link: src/data/mutations-tasks.js macht daraus Karte und Namen */
  createEntryInline({ title: url, type: BOOKMARK_TYPE });
  button.outerHTML = bookmarkButton(url);
  showToast({ icon: "bookmark", accent: "var(--bookmark-color)", title: "Als Lesezeichen gespeichert", note: hostOf(url), action: { label: "Öffnen", onSelect: () => openBookmarks() } });
}

function go(input, ctx) {
  const url = targetOf(input.value);
  if (!url) return;
  ctx.show("browser", { url });
}

export const browserView = {
  title: () => "Browser",
  markup,
  /* Ohne Adresse gleich ins Feld tippen können */
  enter(body, ctx) {
    if (!ctx.state.url) body.querySelector(".side-address-input")?.focus({ preventScroll: true });
  },
  handle(event, ctx) {
    const url = ctx.state.url || "";
    if (event.type === "keydown" && event.key === "Enter" && event.target.matches(".side-address-input")) {
      event.preventDefault();
      go(event.target, ctx);
      return;
    }
    if (event.type !== "click") return;
    const action = event.target.closest("[data-browser]")?.dataset.browser;
    if (action === "reload") ctx.render();
    else if (action === "external" && url) window.open(url, "_blank", "noopener");
    else if (action === "bookmark") saveBookmark(url, event.target.closest("[data-browser]"));
  },
};
