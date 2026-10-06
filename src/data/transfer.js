/*
 * Sammelpunkt für Export und Import, den src/main.js als Bereich „transfer“
 * nachlädt (load("transfer")): die Seiten unter Einstellungen › Daten
 * (src/features/profile/data-export.js, data-import.js) holen alles von hier,
 * damit ZIP-Werkzeug, Markdown-Leser und Dateien-Zugriff erst laden, wenn
 * jemand wirklich exportiert oder importiert.
 * Pfad: src/data/transfer.js
 *
 * Keine anpassbaren Werte.
 */

export { exportFileName, jsonExport, markdownExport, zipExport } from "./transfer-export.js";
export { importSummary, mergeImport, readImportFile, readImportText, replaceImport } from "./transfer-import.js";
export { importBackupTime, restoreImportBackup } from "./transfer-snapshot.js";
