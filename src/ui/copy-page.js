/*
 * Einen Eintrag kopieren — ganze Seite als Markdown oder nur den Titel —
 * und kurz melden, was in der Zwischenablage liegt. Benutzt vom Kopier-Knopf
 * auf der Eintragsseite und vom Aktionsmenü eines Eintrags.
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
import { showToast } from "./toast.js";

/**
 * Kopieren und melden. Liefert true bei Erfolg.
 * @param what "page" (Titel und Text) oder "title" (nur der Titel)
 */
export async function copyEntry(entry, what = "page") {
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
    { label: "Seite kopieren", icon: "copy", onSelect: () => copyEntry(entry, "page") },
    { label: "Titel kopieren", icon: "copy", onSelect: () => copyEntry(entry, "title") },
  ];
}
