/*
 * Wie ein Baustein im Inhalt einer Notiz aussieht: Absatz, Stichpunkt,
 * nummerierte Zeile, runde Checkbox, Trennlinie — und die Karten für
 * Standort, Video und Web-Lesezeichen (links die Kachel, rechts der Name).
 * Diese Datei baut nur Elemente; was beim Tippen passiert, steht in
 * src/ui/block-editor.js.
 * Pfad: src/ui/block-markup.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * MAP_ZOOM      -> wie nah die kleine Karte an den Ort heranzoomt (höher = näher)
 * kindLabels    -> Beschriftung in der grauen Leiste der Kachel (leer = Name der Website)
 * logoHosts     -> wessen Favicon dort als Logo steht (Website-Karten: ihr eigenes)
 * urlHints      -> Platzhalter im Eingabefeld, bevor ein Link eingefügt ist
 *
 * Aussehen (Größen, Farben, Rundungen): styles/blocks.css und styles/embeds.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { colorFromText, faviconUrl } from "../core/link-preview.js";
import { hostOf, mapQuery, youtubeId, youtubeThumb } from "../data/link-kinds.js";

const MAP_ZOOM = 15;

const kindLabels = { place: "Google Maps", video: "YouTube", link: "" };
const kindIcons = { place: "pin", video: "video", link: "bookmark" };
/* Wessen Favicon in der grauen Leiste als Logo steht */
const logoHosts = { place: "maps.google.com", video: "youtube.com" };

const urlHints = {
  place: "Link von Google Maps einfügen …",
  video: "Link von YouTube einfügen …",
  link: "Link einer Website einfügen …",
};

/* Das Textfeld eines Bausteins. contenteditable statt textarea: jede Zeile
   ist ein eigener Block, damit Punkt, Zahl oder Checkbox davor stehen können. */
function editable(block, placeholder) {
  return `<div class="nb-edit" contenteditable="plaintext-only" spellcheck="true" data-ph="${escapeHtml(placeholder)}">${escapeHtml(block.text)}</div>`;
}

/* Kleine Karte als Bild: ein iframe von Google Maps, das ohne Schlüssel
   auskommt. Es nimmt keine Tipps an (styles/embeds.css), ein Tipp auf die
   Karte öffnet den Ort in Google Maps. */
function placeMedia(block) {
  const query = mapQuery(block.url, block.name);
  if (!query) return `<div class="embed-media embed-map is-blank">${icon("pin")}</div>`;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${MAP_ZOOM}&output=embed`;
  /* iframe: die einzige Art, eine echte Karte ohne eigenen Kartendienst zu zeigen */
  return `<div class="embed-media embed-map"><iframe src="${escapeHtml(src)}" loading="lazy" tabindex="-1" title="Karte: ${escapeHtml(block.name || query)}" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
}

function videoMedia(block) {
  const id = youtubeId(block.url);
  if (!id) return `<div class="embed-media embed-thumb is-blank">${icon("video")}</div>`;
  return `
    <div class="embed-media embed-thumb">
      <img src="${youtubeThumb(id)}" alt="" loading="lazy" decoding="async" />
      <span class="embed-play" aria-hidden="true"></span>
    </div>`;
}

/* Favicon auf einer Fläche in seiner eigenen Farbe (25 % deckend, siehe
   --embed-tint in styles/tokens-pages.css). Bis die Farbe feststeht, gilt eine
   aus dem Namen der Website abgeleitete. */
function linkMedia(block) {
  const host = hostOf(block.url);
  const color = block.color || colorFromText(host);
  return `
    <div class="embed-media embed-logo" style="--embed-color: ${escapeHtml(color)}">
      <img src="${faviconUrl(host)}" alt="" loading="lazy" decoding="async" />
    </div>`;
}

const mediaOf = { place: placeMedia, video: videoMedia, link: linkMedia };

/* Logo in der grauen Leiste: das Favicon des Dienstes. Das Icon darunter
   bleibt sichtbar, falls das Bild nicht lädt (offline). */
function barLogo(block) {
  const host = logoHosts[block.kind] || hostOf(block.url);
  return `<span class="embed-logo-mark">${icon(kindIcons[block.kind])}<img src="${faviconUrl(host)}" alt="" loading="lazy" decoding="async" /></span>`;
}

/* Karte: links eine Kachel so groß wie die auf der Übersicht — oben das Bild,
   unten eine graue Leiste mit Logo, Dienst und Drei-Punkte-Menü —, rechts
   daneben groß der Name und darunter dezent „Kopieren“ — kopiert nur den Namen. role=link statt a: in der Kachel steckt ein Knopf,
   und Knöpfe dürfen nicht in einem Link liegen. */
/** Der Name, der rechts neben der Kachel steht (und kopiert wird). */
export function cardName(block) {
  return block.name || (block.kind === "video" ? "Video" : hostOf(block.url)) || "Link";
}

function embedMarkup(block) {
  const host = hostOf(block.url);
  const label = kindLabels[block.kind] || host;
  const name = cardName(block);
  return `
    <div class="embed embed-${block.kind}" role="link" tabindex="0" data-open title="${escapeHtml(block.url)}">
      <div class="embed-tile">
        ${mediaOf[block.kind](block)}
        <div class="embed-bar">
          ${barLogo(block)}
          <span class="embed-label">${escapeHtml(label)}</span>
          <button class="embed-more" type="button" data-embed-menu aria-label="Optionen">${icon("dots")}</button>
        </div>
      </div>
      <div class="embed-side">
        <span class="embed-name">${escapeHtml(name)}</span>
        <button class="embed-copy" type="button" data-embed-copy aria-label="Namen kopieren">${icon("copy")}<span>Kopieren</span></button>
      </div>
    </div>`;
}

/* Noch kein Link: ein Eingabefeld an der Stelle der Karte. */
function urlInputMarkup(block) {
  return `
    <div class="embed-input">
      ${icon(kindIcons[block.kind])}
      <input class="nb-url" type="url" form="no-history" inputmode="url" enterkeyhint="done" autocomplete="off" placeholder="${urlHints[block.kind]}" aria-label="${urlHints[block.kind]}" />
    </div>`;
}

/**
 * Inneres eines Bausteins. number ist die Zahl vor einer nummerierten Zeile,
 * placeholder der graue Hinweis in einer leeren Zeile.
 */
export function blockInner(block, number, placeholder) {
  switch (block.kind) {
    case "bullet":
      return `<span class="nb-mark" aria-hidden="true"></span>${editable(block, "Liste")}`;
    case "number":
      return `<span class="nb-mark" aria-hidden="true">${number}.</span>${editable(block, "Liste")}`;
    case "check":
      return `<button class="nb-box" type="button" data-check data-write-keep aria-pressed="${block.done}" aria-label="Erledigt">${icon("check")}</button>${editable(block, "To-do")}`;
    case "divider":
      /* hr: die übliche Trennlinie, damit Vorleseprogramme sie als solche ansagen */
      return `<hr class="nb-rule" />`;
    case "place":
    case "video":
    case "link":
      return block.url ? embedMarkup(block) : urlInputMarkup(block);
    default:
      return editable(block, placeholder);
  }
}

/** Die Klasse des äußeren Elements: nach Art, abgehakt oder nicht. */
export function blockClass(block) {
  const kind = block.url ? "nb-embed" : `nb-${block.kind}`;
  return `nb ${kind}${block.kind === "check" && block.done ? " is-done" : ""}`;
}
