/*
 * Voller Speicher auf Zuruf: die Adresse „?demo=1“ ersetzt nach einer
 * Rückfrage den gespeicherten Stand durch Demo-Daten (src/data/demo-data.js),
 * „?demo=0“ holt den Stand von davor zurück. Gedacht zum Testen — ohne den
 * Zusatz in der Adresse passiert hier nichts.
 *
 * Nie still überschreiben: es wird immer gefragt. Vorhandene Daten werden vor
 * dem Ersetzen unter einem eigenen Schlüssel gesichert, aber nur, wenn noch
 * keine Sicherung da ist — sonst würde ein zweites „?demo=1“ die echten Daten
 * mit den Demo-Daten überschreiben.
 * Pfad: src/shell/demo-load.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * demoParam -> Name des Zusatzes in der Adresse („?demo=1“ lädt, „?demo=0“ stellt zurück)
 */

import { load } from "../core/lazy.js";
import { readJson, readText, storageKeys, writeJson, writeText } from "../core/storage.js";

const demoParam = "demo";

/* Den Zusatz aus der Adresse nehmen, damit ein Neuladen nicht erneut fragt */
function dropParam() {
  history.replaceState(history.state, "", location.pathname + location.hash);
}

/* Wie viel gerade gespeichert ist, als kurzer Satzteil für die Rückfrage */
function savedSummary(saved) {
  const entries = Array.isArray(saved.entries) ? saved.entries.length : 0;
  const workspaces = Array.isArray(saved.workspaces) ? saved.workspaces.length : 0;
  return `${entries} Einträge, ${workspaces} Arbeitsbereiche`;
}

function loadDemo() {
  const saved = readJson(storageKeys.state);
  const hasData = saved && ((saved.entries || []).length || (saved.workspaces || []).length);
  const hasBackup = Boolean(readText(storageKeys.demoBackup));
  const warning = !hasData
    ? "Der Speicher ist leer."
    : hasBackup
      ? `ACHTUNG: Die vorhandenen Daten (${savedSummary(saved)}) werden ERSETZT und nicht gesichert — es gibt schon eine ältere Sicherung, die erhalten bleibt.`
      : `ACHTUNG: Die vorhandenen Daten (${savedSummary(saved)}) werden ERSETZT. Sie werden vorher gesichert; zurück mit „?demo=0“.`;
  if (!window.confirm(`Demo-Daten laden?\n\n${warning}`)) return false;
  if (hasData && !hasBackup) writeText(storageKeys.demoBackup, JSON.stringify(saved));
  load("demo")
    .then((module) => {
      writeJson(storageKeys.state, module.buildDemoState());
      location.reload();
    })
    .catch(() => window.alert("Demo-Daten konnten nicht geladen werden."));
  return true;
}

function restoreBackup() {
  const backup = readText(storageKeys.demoBackup);
  if (!backup) {
    window.alert("Es gibt keine Sicherung von vor den Demo-Daten.");
    return false;
  }
  if (!window.confirm("Den Stand von vor den Demo-Daten zurückholen?\n\nDie jetzigen Daten werden dabei ersetzt.")) return false;
  writeText(storageKeys.state, backup);
  writeText(storageKeys.demoBackup, "");
  location.reload();
  return true;
}

/**
 * Vor dem Laden des Zustands rufen (src/main.js). Gibt `true` zurück, wenn
 * die Seite gleich neu lädt — dann soll die App nicht erst starten.
 */
export function takeDemoRequest() {
  const value = new URLSearchParams(location.search).get(demoParam);
  if (value === null) return false;
  dropParam();
  return value === "0" ? restoreBackup() : loadDemo();
}
