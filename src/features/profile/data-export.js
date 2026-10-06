/*
 * Die Seite „Daten exportieren“ unter Einstellungen › Daten: drei Stufen als
 * Zeilen — Nur Text (Markdown), Paralist-Datei (JSON) und Vollständig (ZIP
 * mit allen Mediendateien). Ein Tipp auf eine Zeile öffnet das Blatt mit dem
 * Umfang und den Wegen: Kopieren (nur Text), Datei speichern und — wo der
 * Browser diesen Dateityp teilen kann — Teilen, damit Bluetooth, Nearby Share
 * oder ein Messenger direkt aufgehen.
 *
 * Fürs Handy gebaut: Solange die Datei entsteht, bleibt das Blatt offen und
 * zeigt eine Fortschrittszeile (Material 3) mit „Abbrechen“; die Arbeit läuft
 * in Stücken, damit die Seite bedienbar bleibt (src/core/zip.js). Teilen und
 * Speichern braucht der Browser in einer Fingergeste — dauert das Packen
 * länger, als die Geste gilt, zeigt das Blatt die fertige Datei mit Größe und
 * die Knöpfe „Datei speichern“ und „Teilen“ für den zweiten Tipp. Android
 * Chrome teilt nur bestimmte Dateitypen: Text- und Paralist-Datei gehen dann
 * als .txt (die App erkennt das Format am Inhalt), fürs ZIP bleibt Speichern
 * und Teilen aus der Dateien-App.
 * Die Dateien baut src/data/transfer-export.js; das lädt beim Öffnen des Blatts
 * (Bereich „transfer“ in src/main.js). Rückmeldungen stehen in einer
 * Statuszeile auf der Seite selbst: die Meldung unten (src/ui/toast.js) läge
 * hinter dem Einstellungs-Blatt.
 * Pfad: src/features/profile/data-export.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * stages[*].label / note -> Name und Erklärung der drei Stufen
 * texts                  -> Beschriftung der Wege und Sätze im Blatt und in der Statuszeile
 * QUICK_MS               -> wie lange nach dem Tipp noch ohne zweiten Tipp geteilt oder
 *                           gespeichert wird, wenn der Browser die Geste nicht selbst meldet
 *
 * Aussehen in styles/data-transfer.css, die Fortschrittszeile in styles/sheet-progress.css.
 */

import { copyText } from "../../core/clipboard.js";
import { dom } from "../../core/dom.js";
import { formatBytes } from "../../core/format.js";
import { escapeHtml } from "../../core/html.js";
import { downloadBlob } from "../../core/image-export.js";
import { load, loadedModule } from "../../core/lazy.js";
import { state } from "../../data/state.js";
import { closeSheet, openSheet, setSheetProgress } from "../../ui/sheet.js";
import { sectionMarkup } from "./profile-cards.js";

const stages = [
  {
    id: "md",
    icon: "text",
    label: "Nur Text",
    note: "Markdown mit Notizen, Aufgaben, Terminen, Projekten, Dokumenten und Lesezeichen — ohne Zeichnungen und Medien. Zum Lesen, Kopieren und Weitergeben; die App liest es auch wieder ein.",
    ext: "md",
    mime: "text/markdown",
    /* Lässt sich die Datei nicht teilen, geht sie als .txt — der Inhalt bleibt gleich */
    textFallback: true,
  },
  {
    id: "json",
    icon: "doc",
    label: "Paralist-Datei",
    note: "Alles außer den Mediendateien: Einträge, Arbeitsbereiche, Ansichten, Einstellungen, Zeichnungen und Vorschaubilder. Klein — als Sicherung.",
    ext: "json",
    mime: "application/json",
    textFallback: true,
  },
  {
    id: "zip",
    icon: "archive",
    label: "Vollständig",
    note: "Die Paralist-Datei samt allen Fotos, Videos, Aufnahmen und Dateien als ZIP — für denselben Stand auf einem anderen Gerät.",
    ext: "zip",
    mime: "application/zip",
    textFallback: false,
  },
];

const texts = {
  copy: "Text kopieren",
  save: "Datei speichern",
  share: "Teilen …",
  cancel: "Abbrechen",
  scope: "Umfang",
  ready: "Fertig",
  preparing: "Wird vorbereitet …",
  packing: (done, total) => `Wird gepackt … ${done} von ${total} Dateien`,
  noShare: "Teilen ist für diesen Dateityp in diesem Browser nicht möglich — speichere die Datei und teile sie aus der Dateien-App.",
  copied: (count) => `Text kopiert — ${count} Einträge als Markdown.`,
  copyFailed: "Kopieren ist in diesem Browser nicht möglich; speichere stattdessen die Datei.",
  saved: (file) => `Datei gespeichert: ${file.name} (${formatBytes(file.size)}).`,
  shared: (file) => `${file.name} (${formatBytes(file.size)}) geteilt.`,
  cancelled: "Export abgebrochen.",
  failed: (error) => `Export fehlgeschlagen${error?.message ? `: ${error.message}` : ""}`,
};
const QUICK_MS = 4000;

/* Der laufende Export: { id, controller, started } — oder null */
let current = null;
let jobCount = 0;

/** Die Statuszeile einer Daten-Seite — ein leerer Text macht sie unsichtbar. */
export function statusMarkup() {
  return `<p class="transfer-status" data-transfer-status aria-live="polite"></p>`;
}

/** Einen Satz in die Statuszeile der offenen Seite schreiben; `danger` färbt ihn rot. */
export function setStatus(text, danger = false) {
  const line = dom.profileBody.querySelector("[data-transfer-status]");
  if (!line) return;
  line.textContent = text;
  line.classList.toggle("is-danger", danger);
}

/* Ist die Export-Seite noch zu sehen? Sonst gehört ein fertiges Ergebnis nirgends hin */
function exportPageOpen() {
  return Boolean(dom.profileBody.querySelector("[data-settings-action^='transfer:']"));
}

/* Zahlen zur Stufe: Einträge, Medien und deren Größe */
function scopeOf(stage) {
  const entries = state.entries;
  if (stage.id === "md") return { entries: entries.filter((entry) => entry.type !== "zeichnung" && entry.type !== "medien").length, media: 0, bytes: 0 };
  const media = entries.filter((entry) => entry.type === "medien");
  const bytes = stage.id === "zip" ? media.reduce((sum, entry) => sum + (entry.media?.size || 0), 0) : 0;
  return { entries: entries.length, media: stage.id === "zip" ? media.length : 0, bytes };
}

/* Kurzer Wert rechts in der Zeile: er muss neben die Beschriftung passen */
function stageValue(stage) {
  const scope = scopeOf(stage);
  if (stage.id === "zip" && scope.media) return `${scope.media} Medien · ${formatBytes(scope.bytes)}`;
  return `${scope.entries} Einträge`;
}

/* Der ganze Umfang als Satz im Blatt */
function scopeText(stage) {
  const scope = scopeOf(stage);
  const parts = [`${scope.entries} Einträge`];
  if (scope.media) parts.push(`${scope.media} Medien`, `etwa ${formatBytes(scope.bytes)}`);
  return parts.join(", ");
}

/** Die Seite: Zeilen der drei Stufen, darunter zu jeder ein Satz. */
export function exportCard() {
  const rows = stages.map((stage) => ({ icon: stage.icon, label: stage.label, trail: "chevron", action: `transfer:${stage.id}`, value: stageValue(stage) }));
  const notes = stages.map((stage) => `<p><b>${escapeHtml(stage.label)}</b> — ${escapeHtml(stage.note)}</p>`).join("");
  return `
    <p class="settings-note">Deine Daten liegen nur auf diesem Gerät. Ein Export macht daraus eine Datei, die du aufheben oder auf einem anderen Gerät importieren kannst.</p>
    ${sectionMarkup("Was soll in die Datei?", rows)}
    ${statusMarkup()}
    <div class="transfer-notes">${notes}</div>`;
}

/* Kann der Browser eine Datei dieser Art teilen? */
function canShare(ext, mime) {
  try {
    return navigator.canShare({ files: [new File(["x"], `x.${ext}`, { type: mime })] });
  } catch (error) {
    return false;
  }
}

/* Womit diese Stufe geteilt wird: ihr eigener Typ, ersatzweise .txt — oder null */
function shareTarget(stage) {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return null;
  if (canShare(stage.ext, stage.mime)) return { ext: stage.ext, mime: stage.mime };
  if (stage.textFallback && canShare("txt", "text/plain")) return { ext: "txt", mime: "text/plain" };
  return null;
}

/* Die Datei so umbenennen, wie der Browser sie teilen darf */
function shareFile(file, target) {
  if (file.name.endsWith(`.${target.ext}`)) return file;
  return new File([file], file.name.replace(/\.[a-z0-9]+$/i, `.${target.ext}`), { type: target.mime });
}

/* Gilt die Fingergeste noch, mit der der Export begann? Sonst braucht es einen zweiten Tipp */
function gestureStillActive(job) {
  if (navigator.userActivation) return navigator.userActivation.isActive;
  return performance.now() - job.started < QUICK_MS;
}

/* Die Datei einer Stufe bauen; eine offene Zeichnung wird vorher gesichert */
async function buildFile(stage, job) {
  const transfer = await load("transfer");
  loadedModule("drawing")?.saveDrawing();
  let blob;
  if (stage.id === "md") blob = new Blob([transfer.markdownExport().text], { type: stage.mime });
  else if (stage.id === "json") blob = transfer.jsonExport();
  else {
    const onProgress = ({ done, total }) => {
      if (current === job) setSheetProgress(texts.packing(done, total), total ? done / total : undefined);
    };
    blob = await transfer.zipExport({ onProgress, signal: job.controller.signal });
  }
  return new File([blob], transfer.exportFileName(stage.ext), { type: stage.mime });
}

function failed(error) {
  setStatus(texts.failed(error), true);
}

async function copyMarkdown() {
  try {
    const transfer = await load("transfer");
    loadedModule("drawing")?.saveDrawing();
    const { text, count } = transfer.markdownExport();
    if (await copyText(text)) setStatus(texts.copied(count));
    else setStatus(texts.copyFailed, true);
  } catch (error) {
    failed(error);
  }
}

/* Speichern oder Teilen der fertigen Datei — innerhalb einer Fingergeste */
async function deliver(stage, file, way) {
  if (way === "save") {
    downloadBlob(file, file.name);
    setStatus(texts.saved(file));
    return;
  }
  const target = shareTarget(stage);
  if (!target) {
    setStatus(texts.noShare, true);
    return;
  }
  try {
    const shared = shareFile(file, target);
    await navigator.share({ files: [shared], title: shared.name });
    setStatus(texts.shared(shared));
  } catch (error) {
    /* Abbrechen im Teilen-Fenster ist kein Fehler */
    if (error?.name === "AbortError") setStatus("");
    else failed(error);
  }
}

/* Das Blatt, solange die Datei entsteht: Fortschritt und Abbrechen */
function showPacking(stage, job) {
  const cancel = () => {
    job.controller.abort();
    /* Das Blatt ist zu; ein später geöffnetes soll der alte Export nicht mehr schließen */
    current = null;
  };
  openSheet(
    stage.label,
    [
      { progress: true, label: texts.preparing },
      { label: texts.cancel, icon: "close", onSelect: cancel },
    ],
    { icon: stage.icon }
  );
}

/* Das Blatt mit der fertigen Datei: ein zweiter Tipp speichert oder teilt sie */
function showReady(stage, file) {
  const options = [
    { detail: true, label: texts.ready, value: `${file.name} · ${formatBytes(file.size)}` },
    { label: texts.save, icon: "import", onSelect: () => deliver(stage, file, "save") },
  ];
  if (shareTarget(stage)) options.push({ label: texts.share, icon: "share", onSelect: () => deliver(stage, file, "share") });
  openSheet(stage.label, options, { icon: stage.icon });
}

/* Export anstoßen: packen mit Fortschritt, dann gleich liefern oder zum zweiten Tipp anbieten */
async function startExport(stage, way) {
  jobCount += 1;
  const job = { id: jobCount, controller: new AbortController(), started: performance.now() };
  current = job;
  setStatus("");
  showPacking(stage, job);
  try {
    const file = await buildFile(stage, job);
    if (job.controller.signal.aborted) throw new DOMException("Export abgebrochen", "AbortError");
    if (current !== job) return;
    if (!exportPageOpen()) {
      closeSheet();
      return;
    }
    if (gestureStillActive(job)) {
      closeSheet();
      await deliver(stage, file, way);
    } else {
      showReady(stage, file);
    }
  } catch (error) {
    if (current === job) closeSheet();
    if (error?.name === "AbortError") setStatus(texts.cancelled);
    else failed(error);
  } finally {
    if (current === job) current = null;
  }
}

/* Das Blatt einer Stufe: Umfang und die Wege, die es hier gibt */
function openStage(stage) {
  /* Schon laden, während man liest — dann liegt Kopieren oder Teilen noch in der Geste */
  load("transfer").catch(() => {});
  const options = [
    { note: true, label: stage.note },
    { detail: true, label: texts.scope, value: scopeText(stage) },
  ];
  if (stage.id === "md") options.push({ label: texts.copy, icon: "copy", onSelect: copyMarkdown });
  options.push({ label: texts.save, icon: "import", stay: true, onSelect: () => startExport(stage, "save") });
  if (shareTarget(stage)) options.push({ label: texts.share, icon: "share", stay: true, onSelect: () => startExport(stage, "share") });
  else if (typeof navigator.share === "function") options.push({ note: true, label: texts.noShare });
  openSheet(stage.label, options, { icon: stage.icon });
}

/** Klick auf eine Export-Zeile erledigen. Gibt true zurück, wenn er hierher gehörte. */
export function onExportClick(event) {
  const row = event.target.closest("[data-settings-action^='transfer:']");
  if (!row) return false;
  const stage = stages.find((item) => `transfer:${item.id}` === row.dataset.settingsAction);
  if (!stage) return false;
  openStage(stage);
  return true;
}
