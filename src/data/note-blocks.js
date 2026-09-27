/*
 * Der Inhalt eines Eintrags als Bausteine — und zurück als Text.
 * Pfad: src/data/note-blocks.js
 *
 * Gespeichert wird weiter ein einfacher Text (entry.body): so finden Suche,
 * Kopieren und Typwechsel alles wie bisher, und alte Notizen bleiben lesbar.
 * Jede Zeile ist ein Baustein, erkannt an ihrem Anfang:
 *
 *   - Einkauf            -> Stichpunkt
 *   1. Erster Schritt    -> nummerierte Liste (die Zahl zählt beim Speichern neu)
 *   - [ ] Offen          -> runde Checkbox, „- [x]“ ist abgehakt
 *   ---                  -> Trennlinie
 *   ::ort URL | Name     -> Standort-Karte (Google Maps)
 *   ::video URL | Titel  -> Video-Karte (YouTube)
 *   ::link URL | Name | #farbe -> Web-Lesezeichen; die Farbe stammt aus dem
 *                           Favicon und wird mitgespeichert, damit sie nicht
 *                           bei jedem Öffnen neu berechnet werden muss
 *   alles andere         -> gewöhnlicher Text
 *
 * Keine anpassbaren visuellen Werte: das Aussehen der Bausteine steht in
 * styles/blocks.css und styles/embeds.css.
 */

/* Karten-Arten: Kürzel in der gespeicherten Zeile -> Art des Bausteins. */
const embedTags = { ort: "place", video: "video", link: "link" };
const tagOfKind = { place: "ort", video: "video", link: "link" };

/** Bausteine, die eine Karte mit Link sind. */
export const embedKinds = ["place", "video", "link"];

/** Bausteine mit eigener Textzeile (alles außer Trennlinie und Karten). */
export function isTextKind(kind) {
  return kind === "text" || kind === "bullet" || kind === "number" || kind === "check";
}

/** Ein neuer, leerer Baustein. */
export function makeBlock(kind = "text", fields = {}) {
  return { kind, text: "", done: false, url: "", name: "", color: "", ...fields };
}

/* Eine Karten-Zeile zerlegen: „::ort URL | Name | #farbe“. */
function parseEmbed(line) {
  const match = /^::(ort|video|link)\s+(\S+)(.*)$/.exec(line);
  if (!match) return null;
  const parts = match[3].split(" | ").map((part) => part.trim());
  /* parts[0] ist der Rest direkt hinter der URL — leer, wenn ein Name folgt */
  const name = parts[1] || "";
  const color = /^#[0-9a-f]{3,8}$/i.test(parts[2] || "") ? parts[2] : "";
  return makeBlock(embedTags[match[1]], { url: match[2], name, color });
}

/** Eine gespeicherte Zeile als Baustein lesen. */
export function parseLine(line) {
  const embed = line.startsWith("::") && parseEmbed(line);
  if (embed) return embed;
  if (/^\s*(-{3,}|—{2,})\s*$/.test(line)) return makeBlock("divider");
  let match = /^[-*•] \[( |x|X)\] ?(.*)$/.exec(line);
  if (match) return makeBlock("check", { done: match[1] !== " ", text: match[2] });
  match = /^[-*•] (.*)$/.exec(line);
  if (match) return makeBlock("bullet", { text: match[1] });
  match = /^\d{1,3}[.)] (.*)$/.exec(line);
  if (match) return makeBlock("number", { text: match[1] });
  return makeBlock("text", { text: line });
}

/** Den gespeicherten Text in Bausteine zerlegen; leerer Text = ein leerer Absatz. */
export function parseBlocks(body) {
  const lines = (body || "").replace(/\r\n?/g, "\n").split("\n");
  return lines.map(parseLine);
}

/** Welche Zahl steht vor dem Baustein an Stelle `index`? Zählt die Reihe direkt davor. */
export function numberAt(blocks, index) {
  let count = 1;
  for (let i = index - 1; i >= 0 && blocks[i].kind === "number"; i -= 1) count += 1;
  return count;
}

/* Eine Karte als Zeile: Name und Farbe nur, wenn es sie gibt. */
function embedLine(block) {
  /* Ein „|“ im Namen würde die Zeile beim Lesen falsch zerteilen */
  const name = (block.name || "").replace(/\s*\|\s*/g, " / ").replace(/\n/g, " ").trim();
  const parts = [`::${tagOfKind[block.kind]} ${block.url}`];
  if (name || block.color) parts.push(name);
  if (block.color) parts.push(block.color);
  return parts.join(" | ");
}

/** Einen Baustein als gespeicherte Zeile schreiben. */
export function blockLine(block, number = 1) {
  const text = (block.text || "").replace(/\n/g, " ");
  switch (block.kind) {
    case "bullet":
      return `- ${text}`;
    case "number":
      return `${number}. ${text}`;
    case "check":
      return `- [${block.done ? "x" : " "}] ${text}`;
    case "divider":
      return "---";
    case "place":
    case "video":
    case "link":
      /* Eine Karte ohne Link (noch im Eingabefeld) wird nicht gespeichert */
      return block.url ? embedLine(block) : null;
    default:
      return text;
  }
}

/** Alle Bausteine als gespeicherter Text; leere Absätze am Ende fallen weg. */
export function serializeBlocks(blocks) {
  const lines = [];
  blocks.forEach((block, index) => {
    const line = blockLine(block, block.kind === "number" ? numberAt(blocks, index) : 1);
    if (line !== null) lines.push(line);
  });
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

/**
 * Tippt man den Anfang einer Liste von Hand („- “, „1. “, „[] “, „---“),
 * wird aus dem Absatz der passende Baustein — wie in Notion.
 * head ist der Text vor dem Cursor; liefert { kind, done } oder null.
 */
export function shortcutFor(head) {
  if (/^(---|—-)$/.test(head)) return { kind: "divider", done: false };
  const check = /^(?:[-*] )?\[( |x)?\] $/.exec(head);
  if (check) return { kind: "check", done: check[1] === "x" };
  if (/^[-*•] $/.test(head)) return { kind: "bullet", done: false };
  if (/^1[.)] $/.test(head)) return { kind: "number", done: false };
  return null;
}

/** Der Inhalt zum Kopieren: Karten als Markdown-Link, sonst wie gespeichert. */
export function readableBody(body) {
  return parseBlocks(body)
    .map((block, index, blocks) => {
      if (embedKinds.includes(block.kind)) return block.name ? `[${block.name}](${block.url})` : block.url;
      return blockLine(block, block.kind === "number" ? numberAt(blocks, index) : 1);
    })
    .join("\n");
}
