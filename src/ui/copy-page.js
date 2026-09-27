/*
 * Eine Seite kopieren — ganz als Markdown oder nur den Titel — und kurz
 * melden, was in der Zwischenablage liegt. Benutzt vom Kopier-Knopf neben
 * den Pillen (Eintrag und Arbeitsbereich, src/ui/page-tools.js) und vom
 * Aktionsmenü eines Eintrags. Kopiert wird alles mit { title, body, type }.
 * Eine Zeichnung ist keine Textseite: dort kopiert „Seite“ das Bild selbst
 * (src/ui/drawing-export.js), sodass man es in jeden Chat einfügen kann.
 * Pfad: src/ui/copy-page.js
 *
 * Keine anpassbaren visuellen Werte: die Meldung sieht aus wie in
 * styles/toast.css beschrieben.
 *
 * Für die Android-App: ab Android 13 bestätigt das System das Kopieren
 * selbst. Dort entfällt die eigene Meldung, sonst stünden zwei da.
 */

import { copyText } from "../core/clipboard.js";
import { hasPageBody, pageMarkdown, titleText } from "../data/page-text.js";
import { copyDrawing } from "./drawing-export.js";
import { showToast } from "./toast.js";

/**
 * Kopieren und melden. Liefert true bei Erfolg.
 * @param what "page" (Titel und Text) oder "title" (nur der Titel)
 */
export async function copyEntry(entry, what = "page") {
  /* Vor jedem await: das Bild muss noch im selben Tipp in die Zwischenablage */
  if (what === "page" && entry.type === "zeichnung") return copyDrawing(entry);
  const text = what === "title" ? titleText(entry) : pageMarkdown(entry);
  if (!text) {
    showToast({ icon: "info", title: "Nichts zum Kopieren", accent: "var(--muted)" });
    return false;
  }
  if (!(await copyText(text))) {
    showToast({ icon: "info", title: "Kopieren nicht möglich", accent: "var(--danger)" });
    return false;
  }
  /* Die Meldung sagt, was wirklich drin ist: ohne Text ist die „Seite“ nur der Titel. */
  const page = what === "page" && hasPageBody(entry);
  showToast({ icon: "copy", title: page ? "Seite kopiert" : "Titel kopiert" });
  return true;
}

/** Die beiden Kopier-Aktionen, wie sie Menü und Auswahl-Blatt zeigen. */
export function copyOptions(entry) {
  return [
    { label: entry.type === "zeichnung" ? "Bild kopieren" : "Seite kopieren", icon: "copy", onSelect: () => copyEntry(entry, "page") },
    { label: "Titel kopieren", icon: "copy", onSelect: () => copyEntry(entry, "title") },
  ];
}
