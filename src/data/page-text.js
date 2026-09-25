/*
 * Ein Eintrag als Text zum Kopieren: nur der Titel oder die ganze Seite im
 * Markdown-Format („# Titel“, Leerzeile, dann der Text). So lässt sich eine
 * Seite in jede andere App einfügen und behält ihre Überschrift.
 * Pfad: src/data/page-text.js
 *
 * Keine anpassbaren visuellen Werte. Zeichnung und Medien kommen nicht mit:
 * sie lassen sich nicht als Text darstellen.
 */

/** Der Titel ohne doppelte Leerzeichen; leer, wenn keiner vergeben ist. */
export function titleText(entry) {
  return (entry.title || "").replace(/\s+/g, " ").trim();
}

/** Die ganze Seite als Markdown. Ohne Titel bleibt nur der Text, ohne Text nur die Überschrift. */
export function pageMarkdown(entry) {
  const title = titleText(entry);
  const body = entry.type === "zeichnung" ? "" : (entry.body || "").trim();
  return [title && `# ${title}`, body].filter(Boolean).join("\n\n");
}

/** Hat die Seite außer dem Titel noch Text? Entscheidet, ob „Seite“ oder „Titel kopiert“ gemeldet wird. */
export function hasPageBody(entry) {
  return entry.type !== "zeichnung" && Boolean((entry.body || "").trim());
}
