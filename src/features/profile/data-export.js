/*
 * Die Seite „Daten exportieren“ unter Einstellungen › Daten: drei Stufen als
 * Zeilen — Nur Text (Markdown), Paralist-Datei (JSON) und Vollständig (ZIP
 * mit allen Mediendateien). Ein Tipp auf eine Zeile öffnet das Blatt mit den
 * Wegen: Kopieren (nur Text), Datei speichern und — wo der Browser Dateien
 * teilen kann, etwa auf Android — Teilen, damit Bluetooth oder Nearby Share
 * direkt aufgehen. Die Dateien baut src/data/transfer-export.js; das lädt
 * erst beim ersten Export (Bereich „transfer“ in src/main.js).
 * Rückmeldungen stehen in einer Statuszeile auf der Seite selbst: die
 * Meldung unten (src/ui/toast.js) läge hinter dem Einstellungs-Blatt.
 * Pfad: src/features/profile/data-export.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * stages[*].label / note -> Name und Erklärung der drei Stufen
 * ways                   -> Beschriftung der Wege im Blatt (Kopieren, Speichern, Teilen)
 * packing                -> was in der Statuszeile steht, solange das ZIP entsteht
 *
 * Aussehen in styles/data-transfer.css.
 */

import { copyText } from "../../core/clipboard.js";
import { dom } from "../../core/dom.js";
import { formatBytes } from "../../core/format.js";
import { escapeHtml } from "../../core/html.js";
import { downloadBlob } from "../../core/image-export.js";
import { load, loadedModule } from "../../core/lazy.js";
import { state } from "../../data/state.js";
import { openSheet } from "../../ui/sheet.js";
import { sectionMarkup } from "./profile-cards.js";

const stages = [
  {
    id: "md",
    icon: "text",
    label: "Nur Text",
    note: "Markdown mit Notizen, Aufgaben, Terminen, Projekten, Dokumenten und Lesezeichen — ohne Zeichnungen und Medien. Zum Lesen, Kopieren und Weitergeben; die App liest es auch wieder ein.",
    ext: "md",
    mime: "text/markdown",
  },
  {
    id: "json",
    icon: "doc",
    label: "Paralist-Datei",
    note: "Alles außer den Mediendateien: Einträge, Arbeitsbereiche, Ansichten, Einstellungen, Zeichnungen und Vorschaubilder. Klein — als Sicherung.",
    ext: "json",
    mime: "application/json",
  },
  {
    id: "zip",
    icon: "archive",
    label: "Vollständig",
    note: "Die Paralist-Datei samt allen Fotos, Videos, Aufnahmen und Dateien als ZIP — für denselben Stand auf einem anderen Gerät.",
    ext: "zip",
    mime: "application/zip",
  },
];

const ways = { copy: "Text kopieren", save: "Datei speichern", share: "Teilen …" };
const packing = "Wird gepackt …";

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

/* Wie viele Einträge in welche Stufe kämen, als grauer Wert rechts */
function stageValue(stage) {
  const entries = state.entries;
  if (stage.id === "md") return `${entries.filter((entry) => entry.type !== "zeichnung" && entry.type !== "medien").length} Einträge`;
  if (stage.id === "json") return `${entries.length} Einträge`;
  const media = entries.filter((entry) => entry.type === "medien").length;
  return media ? `${entries.length} Einträge, ${media} Medien` : `${entries.length} Einträge`;
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

/* Kann dieser Browser Dateien teilen (Android: Bluetooth, Nearby Share, Messenger)? */
function canShareFiles() {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File(["x"], "x.txt", { type: "text/plain" })] });
  } catch (error) {
    return false;
  }
}

/* Die Datei einer Stufe bauen; eine offene Zeichnung wird vorher gesichert */
async function buildFile(stage) {
  const transfer = await load("transfer");
  loadedModule("drawing")?.saveDrawing();
  let blob;
  if (stage.id === "md") blob = new Blob([transfer.markdownExport().text], { type: stage.mime });
  else if (stage.id === "json") blob = transfer.jsonExport();
  else blob = await transfer.zipExport();
  return new File([blob], transfer.exportFileName(stage.ext), { type: stage.mime });
}

function failed(error) {
  setStatus(`Export fehlgeschlagen${error?.message ? `: ${error.message}` : ""}`, true);
}

async function copyMarkdown() {
  try {
    const transfer = await load("transfer");
    loadedModule("drawing")?.saveDrawing();
    const { text, count } = transfer.markdownExport();
    if (await copyText(text)) setStatus(`Text kopiert — ${count} Einträge als Markdown.`);
    else setStatus("Kopieren ist in diesem Browser nicht möglich; speichere stattdessen die Datei.", true);
  } catch (error) {
    failed(error);
  }
}

async function saveFile(stage) {
  if (stage.id === "zip") setStatus(packing);
  try {
    const file = await buildFile(stage);
    downloadBlob(file, file.name);
    setStatus(`Datei gespeichert: ${file.name} (${formatBytes(file.size)}).`);
  } catch (error) {
    failed(error);
  }
}

async function shareFile(stage) {
  if (stage.id === "zip") setStatus(packing);
  try {
    const file = await buildFile(stage);
    setStatus(`${file.name} (${formatBytes(file.size)}) wird geteilt.`);
    await navigator.share({ files: [file], title: file.name });
  } catch (error) {
    /* Abbrechen im Teilen-Fenster ist kein Fehler */
    if (error?.name === "AbortError") setStatus("");
    else failed(error);
  }
}

/* Das Blatt einer Stufe: die Wege, die es hier gibt */
function openStage(stage) {
  const options = [{ note: true, label: stage.note }];
  if (stage.id === "md") options.push({ label: ways.copy, icon: "copy", onSelect: copyMarkdown });
  options.push({ label: ways.save, icon: "import", onSelect: () => saveFile(stage) });
  if (canShareFiles()) options.push({ label: ways.share, icon: "share", onSelect: () => shareFile(stage) });
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
