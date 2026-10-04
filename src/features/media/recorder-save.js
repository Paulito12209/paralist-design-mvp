/*
 * Die Aufnahme speichern: als Audio-Datei, die wie jede andere Datei ein
 * Medien-Eintrag im Eingang wird (src/features/media/media-import.js).
 * Läuft die Aufnahme noch, wird sie vorher beendet.
 * Dazu der Name: der getippte oder ein vorgeschlagener mit Datum und Uhrzeit.
 * Pfad: src/features/media/recorder-save.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * namePrefix -> wie eine Aufnahme ohne eigenen Namen heißt („Sprachmemo 04.10.2026 14:03“)
 */

import { pad2 } from "../../core/dates.js";
import { showToast } from "../../ui/toast.js";
import { addMediaFiles } from "./media-import.js";
import { leaveRecorder } from "./recorder-discard.js";
import { micFile } from "./recorder-mic.js";
import { finishSession } from "./recorder-session.js";
import { rec } from "./recorder-state.js";

const namePrefix = "Sprachmemo";

/** Der vorgeschlagene Name, steht als Platzhalter im Namensfeld. */
export function defaultName() {
  const now = new Date();
  return `${namePrefix} ${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

/** Der getippte Name, sonst der vorgeschlagene („Sprachmemo 04.10.2026 14:03“). */
function recordingName() {
  const input = rec.layer.querySelector(".recorder-name");
  return input.value.trim() || input.placeholder;
}

export async function saveRecording() {
  if (rec.state === "recording" || rec.state === "paused") await finishSession();
  if (!rec.recorded) return;
  const name = recordingName();
  const file = micFile(rec.recorded.blob, name);
  const extra = { duration: rec.recorded.duration };
  /* Erst schließen (das verwirft den Zwischenstand), die Datei ist schon gepackt */
  leaveRecorder();
  await addMediaFiles([file], "audio", extra);
  showToast({ icon: "mic", title: "Aufnahme gespeichert", note: name });
}
