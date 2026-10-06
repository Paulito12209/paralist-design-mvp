/*
 * Die Seite „Daten importieren“ unter Einstellungen › Daten: eine Datei
 * wählen (ZIP, Paralist-Datei oder Markdown) oder Text einfügen. Die App
 * erkennt das Format am Inhalt und fragt vor dem Übernehmen mit einer
 * Vorschau nach: HINZUFÜGEN legt alles neu an und lässt Vorhandenes in Ruhe,
 * ERSETZEN übernimmt den Stand der Datei genau — der alte Stand wird vorher
 * gesichert und steht hier als „Letzten Import rückgängig“, bis der nächste
 * Import ihn ablöst. Nach Ersetzen und Rückgängig lädt die Seite neu, damit
 * alles aus dem frischen Speicher kommt. Lesen und Übernehmen macht
 * src/data/transfer-import.js (Bereich „transfer“ in src/main.js).
 *
 * Die Klicks beider Daten-Seiten hängen von hier aus direkt am Blattkörper
 * (siehe unten) — src/features/profile/profile.js steht an der Zeilengrenze
 * und bleibt unverändert. Rückmeldungen stehen in der Statuszeile der Seite
 * (setStatus aus data-export.js): die Meldung unten läge hinter dem Blatt.
 * Pfad: src/features/profile/data-import.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * acceptTypes -> welche Dateien der Auswahl-Dialog anbietet
 * texts       -> alle Sätze der Seite und der Rückfragen
 *
 * Aussehen in styles/data-transfer.css.
 */

import { dom } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { load } from "../../core/lazy.js";
import { noHistoryForm } from "../../core/no-history.js";
import { importBackupTime } from "../../data/transfer-snapshot.js";
import { openConfirmSheet } from "../../ui/confirm-sheet.js";
import { openSheet } from "../../ui/sheet.js";
import { onExportClick, setStatus, statusMarkup } from "./data-export.js";
import { sectionMarkup } from "./profile-cards.js";

const acceptTypes = ".zip,.json,.md,.txt,application/zip,application/json,text/markdown,text/plain";

const texts = {
  intro: "Lies einen Export von Paralist ein — von diesem oder einem anderen Gerät — oder füge Text mit Überschriften ein: jede „## Überschrift“ wird ein Eintrag.",
  pick: "Datei wählen",
  pickValue: "ZIP, JSON, MD",
  pasteHeading: "Oder Text einfügen",
  pastePlaceholder: "## Einkaufsliste\n- [ ] Hafermilch\n\n## Nächste Woche\nAnruf bei …",
  pasteButton: "Text prüfen",
  undoRow: "Import rückgängig",
  modes: "Hinzufügen legt alles aus der Datei neu an und lässt Vorhandenes unberührt; Verknüpfungen innerhalb der Datei bleiben erhalten. Ersetzen übernimmt den Stand der Datei genau — samt Ansichten und Einstellungen — und sichert den alten Stand vorher.",
  reading: "Datei wird gelesen …",
  reviewTitle: "Import prüfen",
  add: "Hinzufügen",
  replace: "Ersetzen",
  replaceOnly: "Ersetzen geht nur mit einer Paralist-Datei oder einem ZIP — eingefügter Text kennt weder Ansichten noch Einstellungen.",
  replaceAsk: "Stand ersetzen?",
  replaceText: "Alle jetzigen Einträge, Arbeitsbereiche, Ansichten und Einstellungen werden durch die aus der Datei ersetzt. Der alte Stand wird gesichert und lässt sich unter „Daten importieren“ zurückholen.",
  undoAsk: "Letzten Import rückgängig?",
  undoText: "Der Stand von vor dem letzten Ersetzen kommt zurück; was seitdem dazukam, geht verloren.",
  undoGo: "Zurückholen",
  tooBig: "Der Speicher dieses Browsers fasst den Stand aus der Datei nicht.",
  empty: "Erst Text einfügen.",
};

let fileInput = null;

/* „06.10., 14:02“ aus dem gespeicherten Zeitpunkt der Sicherung — kurz, damit die Zeile nicht umbricht */
function backupLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Die Seite: Datei wählen, Text einfügen, Rückgängig (wenn es eine Sicherung gibt), Erklärung. */
export function importCard() {
  const backupAt = importBackupTime();
  const undo = backupAt === null ? "" : sectionMarkup("", [{ icon: "undo", label: texts.undoRow, trail: "chevron", action: "transfer:undo", value: backupLabel(backupAt) }]);
  return `
    <p class="settings-note">${escapeHtml(texts.intro)}</p>
    ${sectionMarkup("", [{ icon: "import", label: texts.pick, trail: "chevron", action: "transfer:pick", value: texts.pickValue }])}
    <p class="psection">${escapeHtml(texts.pasteHeading)}</p>
    <textarea class="transfer-paste" data-transfer-paste form="${noHistoryForm}" rows="6" placeholder="${escapeHtml(texts.pastePlaceholder)}" aria-label="${escapeHtml(texts.pasteHeading)}"></textarea>
    <button class="account-button" type="button" data-settings-action="transfer:paste">${escapeHtml(texts.pasteButton)}</button>
    ${statusMarkup()}
    ${undo}
    <p class="settings-note">${escapeHtml(texts.modes)}</p>`;
}

function failed(error) {
  setStatus(`Import nicht möglich${error?.message ? `: ${error.message}` : ""}`, true);
}

/* Das Feld leeren, wenn der eingefügte Text übernommen wurde */
function clearPaste() {
  const field = dom.profileBody.querySelector("[data-transfer-paste]");
  if (field) field.value = "";
}

async function doMerge(transfer, parsed) {
  try {
    const added = await transfer.mergeImport(parsed);
    clearPaste();
    const parts = [`${added.entries} Einträge`];
    if (added.workspaces) parts.push(`${added.workspaces} Arbeitsbereiche`);
    setStatus(`Hinzugefügt: ${parts.join(", ")}.`);
  } catch (error) {
    failed(error);
  }
}

async function doReplace(transfer, parsed) {
  setStatus("Stand wird übernommen …");
  try {
    const result = await transfer.replaceImport(parsed);
    if (!result.ok) {
      failed(new Error(texts.tooBig));
      return;
    }
    /* Neu laden: Zustand, Vorschaubilder und Einstellungen kommen frisch aus dem Speicher */
    location.reload();
  } catch (error) {
    failed(error);
  }
}

/* Die Vorschau: was in der Datei steckt, dann Hinzufügen oder Ersetzen */
function review(transfer, parsed) {
  const summary = transfer.importSummary(parsed);
  const options = [
    { lead: true, label: parsed.name },
    { detail: true, label: "Einträge", value: String(summary.entries) },
    { detail: true, label: "Arbeitsbereiche", value: String(summary.workspaces) },
  ];
  if (summary.drawings) options.push({ detail: true, label: "Zeichnungen", value: String(summary.drawings) });
  if (summary.media) options.push({ detail: true, label: "Medien", value: summary.files ? `${summary.media} (${summary.files} Dateien)` : `${summary.media} ohne Dateien` });
  options.push({ note: true, label: summary.canReplace ? texts.modes : texts.replaceOnly });
  options.push({ label: texts.add, icon: "plus-circle", pair: true, onSelect: () => doMerge(transfer, parsed) });
  if (summary.canReplace) {
    options.push({
      label: texts.replace,
      icon: "swap-vert",
      pair: true,
      danger: true,
      onSelect: () =>
        openConfirmSheet({
          title: texts.replaceAsk,
          text: texts.replaceText,
          confirmLabel: texts.replace,
          confirmIcon: "swap-vert",
          onConfirm: () => doReplace(transfer, parsed),
        }),
    });
  }
  openSheet(texts.reviewTitle, options, { icon: "import" });
}

async function handleFile(file) {
  if (!file) return;
  setStatus(texts.reading);
  try {
    const transfer = await load("transfer");
    const parsed = await transfer.readImportFile(file);
    setStatus("");
    review(transfer, parsed);
  } catch (error) {
    failed(error);
  }
}

async function handlePaste() {
  const field = dom.profileBody.querySelector("[data-transfer-paste]");
  const text = field ? field.value.trim() : "";
  if (!text) {
    setStatus(texts.empty, true);
    return;
  }
  try {
    const transfer = await load("transfer");
    review(transfer, transfer.readImportText(text));
  } catch (error) {
    failed(error);
  }
}

/* Der unsichtbare Datei-Dialog entsteht beim ersten Gebrauch */
function pickFile() {
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = acceptTypes;
    fileInput.hidden = true;
    fileInput.addEventListener("change", () => {
      handleFile(fileInput.files && fileInput.files[0]);
      fileInput.value = "";
    });
    document.body.appendChild(fileInput);
  }
  fileInput.click();
}

function undoImport() {
  openConfirmSheet({
    title: texts.undoAsk,
    text: texts.undoText,
    confirmLabel: texts.undoGo,
    confirmIcon: "undo",
    onConfirm: async () => {
      const transfer = await load("transfer");
      if (transfer.restoreImportBackup()) location.reload();
      else failed(new Error(texts.tooBig));
    },
  });
}

/** Klick auf der Import-Seite erledigen. Gibt true zurück, wenn er hierher gehörte. */
export function onImportClick(event) {
  const row = event.target.closest("[data-settings-action^='transfer:']");
  if (!row) return false;
  const action = row.dataset.settingsAction;
  if (action === "transfer:pick") pickFile();
  else if (action === "transfer:paste") handlePaste();
  else if (action === "transfer:undo") undoImport();
  else return false;
  return true;
}

/* Einmal beim Laden: die Zeilen und Knöpfe beider Daten-Seiten reagieren im
   Blatt am Handy wie auf der Seite am Desktop — beide zeichnen in denselben Körper. */
dom.profileBody.addEventListener("click", (event) => {
  if (!onExportClick(event)) onImportClick(event);
});
