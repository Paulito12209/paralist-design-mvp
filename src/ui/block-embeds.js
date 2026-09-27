/*
 * Die Karten im Baustein-Editor: Link übernehmen und im Netz nachschlagen
 * (Name des Ortes, Titel des Videos, Name und Farbe der Website), Karte
 * antippen öffnet den Link — eine YouTube-Karte stattdessen den Player in
 * der App, wenn der Aufrufer onVideo hereingibt —, das Drei-Punkte-Menü bietet Öffnen, Umbenennen,
 * Namen kopieren, Link kopieren und Entfernen. „Kopieren“ unter dem Namen
 * kopiert nur den Namen („Good Aroma“). Dazu die runden Checkboxen.
 * Pfad: src/ui/block-embeds.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * COPIED_MS -> so lange steht unter dem Namen „Kopiert“ mit Haken
 *
 * Aussehen der Karten in styles/embeds.css.
 */

import { selectAll } from "../core/caret.js";
import { copyText } from "../core/clipboard.js";
import { faviconColor, pagePreview, videoPreview } from "../core/link-preview.js";
import { guessName, hostOf, isShortMapsLink, normalizeUrl, placeFromUrl, youtubeId } from "../data/link-kinds.js";
import { embedKinds, isTextKind, makeBlock } from "../data/note-blocks.js";
import { icon } from "../core/html.js";
import { cardName } from "./block-markup.js";
import { openSheet } from "./sheet.js";
import { showToast } from "./toast.js";

const COPIED_MS = 1500;

/* Links, deren Farbe schon gesucht wurde — nicht bei jedem Öffnen erneut fragen. */
const colorTried = new Set();

/* Einen Baustein ändern, falls es ihn noch gibt (die Antwort aus dem Netz
   kann kommen, nachdem die Notiz gewechselt oder die Karte entfernt wurde). */
function patch(ed, block, changes) {
  const index = ed.blocks.indexOf(block);
  if (index < 0) return;
  ed.replace(index, 1, { ...block, ...changes });
}

/* Was nur das Netz weiß, nachtragen. Scheitert es, bleibt der erste Name. */
async function enrich(ed, block) {
  const { url, kind } = block;
  let changes = null;
  if (kind === "video" && youtubeId(url)) {
    const video = await videoPreview(url);
    if (video) changes = { name: video.name };
  } else if (kind === "place" && (isShortMapsLink(url) || !block.name)) {
    /* Ein Kurzlink verrät den Ort erst am Ziel der Weiterleitung */
    const page = await pagePreview(url, { place: true });
    if (page) {
      const place = placeFromUrl(page.url);
      const longUrl = place.name || place.lat ? page.url : url;
      changes = { url: longUrl, name: place.name || page.name || block.name };
    }
  } else if (kind === "link") {
    const host = hostOf(url);
    colorTried.add(url);
    const [page, color] = await Promise.all([pagePreview(url), faviconColor(host)]);
    changes = { name: page?.name || block.name, color: color || page?.color || "" };
  }
  if (changes) patch(ed, block, changes);
}

/**
 * Den Link aus dem Feld einer neuen Karte übernehmen. Danach steht der
 * Cursor in der Zeile unter der Karte (keepFocus: Fokus nicht anfassen).
 */
export function commitUrl(ed, index, input, { keepFocus = false } = {}) {
  const block = ed.blocks[index];
  const url = normalizeUrl(input.value);
  if (!block || !url) {
    input.classList.add("is-invalid");
    return;
  }
  const card = makeBlock(block.kind, { url, name: guessName(block.kind, url) });
  const after = ed.blocks[index + 1];
  const extra = after && isTextKind(after.kind) ? [] : [makeBlock()];
  ed.replace(index, 1, card, ...extra);
  if (!keepFocus) ed.focusBlock(index + 1, 0);
  enrich(ed, card);
}

/** Website-Karten ohne gespeicherte Farbe bekommen sie nachträglich. */
export function fillMissingColors(ed) {
  ed.blocks
    .filter((block) => block.kind === "link" && block.url && !block.color && !colorTried.has(block.url))
    .forEach((block) => {
      colorTried.add(block.url);
      faviconColor(hostOf(block.url)).then((color) => color && patch(ed, block, { color }));
    });
}

/* Nur den Namen kopieren. Am Knopf unter dem Namen bestätigt „Kopiert“,
   aus dem Blatt heraus (Knopf nicht zu sehen) eine kurze Meldung. */
async function copyName(block, button = null) {
  const name = cardName(block);
  if (!(await copyText(name))) return;
  if (!button) {
    showToast({ icon: "copy", title: "Name kopiert" });
    return;
  }
  button.innerHTML = `${icon("check")}<span>Kopiert</span>`;
  button.classList.add("is-done");
  clearTimeout(button.copiedTimer);
  button.copiedTimer = setTimeout(() => {
    button.innerHTML = `${icon("copy")}<span>Kopieren</span>`;
    button.classList.remove("is-done");
  }, COPIED_MS);
}

function openLink(url) {
  window.open(url, "_blank", "noopener");
}

/* Name der Karte direkt auf der Karte ändern; Enter oder Wegtippen übernimmt. */
function renameCard(ed, block) {
  const index = ed.blocks.indexOf(block);
  const name = index >= 0 && ed.nodeAt(index).querySelector(".embed-name");
  if (!name) return;
  name.contentEditable = "plaintext-only";
  name.focus();
  selectAll(name);
  const finish = () => {
    name.removeEventListener("keydown", onKey);
    name.removeAttribute("contenteditable");
    const text = name.textContent.replace(/\s+/g, " ").trim();
    if (text && text !== block.name) patch(ed, block, { name: text });
  };
  const onKey = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    name.blur();
  };
  name.addEventListener("keydown", onKey);
  name.addEventListener("blur", finish, { once: true });
}

function openCardMenu(ed, block) {
  const title = block.name || hostOf(block.url) || "Link";
  openSheet(title, [
    { label: "Link öffnen", icon: "external", onSelect: () => openLink(block.url) },
    { label: "Umbenennen", icon: "pencil", onSelect: () => renameCard(ed, block) },
    { label: "Namen kopieren", icon: "copy", onSelect: () => copyName(block) },
    { label: "Link kopieren", icon: "copy", onSelect: () => copyText(block.url) },
    {
      label: "Entfernen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        const index = ed.blocks.indexOf(block);
        if (index >= 0) ed.replace(index, 1);
      },
    },
  ]);
}

/* Checkbox umschalten: nur Klasse und Zustand, der Text bleibt, wie er ist. */
function toggleCheck(ed, button) {
  const block = ed.blocks[ed.indexOf(button)];
  if (!block) return;
  block.done = !block.done;
  button.setAttribute("aria-pressed", String(block.done));
  button.closest(".nb").classList.toggle("is-done", block.done);
  ed.commit();
}

/** Klicks auf Karten und Checkboxen anmelden (ein Zuhörer am Editor).
    onVideo(block, card) übernimmt YouTube-Karten (card ist das Element der
    Karte, an dessen Stelle der Player kommt), sonst öffnet jede Karte ihren Link. */
export function bindBlockEmbeds(ed, { onVideo = null } = {}) {
  const { root } = ed;
  const openCard = (block, card) => {
    if (onVideo && block.kind === "video" && youtubeId(block.url)) onVideo(block, card);
    else openLink(block.url);
  };

  /* Checkbox antippen, während geschrieben wird: der Cursor bleibt, wo er
     ist, und die Tastatur bleibt offen. */
  root.addEventListener("mousedown", (event) => {
    if (event.target.closest("[data-check]")) event.preventDefault();
  });

  root.addEventListener("click", (event) => {
    const check = event.target.closest("[data-check]");
    if (check) {
      toggleCheck(ed, check);
      return;
    }
    const card = event.target.closest(".embed");
    if (!card || event.target.isContentEditable) return;
    const block = ed.blocks[ed.indexOf(card)];
    if (!block || !embedKinds.includes(block.kind)) return;
    const copy = event.target.closest("[data-embed-copy]");
    if (copy) copyName(block, copy);
    else if (event.target.closest("[data-embed-menu]")) openCardMenu(ed, block);
    else openCard(block, card);
  });

  /* Mit der Tastatur: Enter auf einer Karte öffnet sie */
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !event.target.matches?.(".embed")) return;
    const block = ed.blocks[ed.indexOf(event.target)];
    if (block) openCard(block, event.target);
  });
}
