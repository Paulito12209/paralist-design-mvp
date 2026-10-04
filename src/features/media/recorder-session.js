/*
 * Die laufende Aufnahme: Zeit und Welle mitlaufen lassen, pausieren,
 * weitermachen, stoppen oder verwerfen.
 * Gestartet wird die Sitzung in src/features/media/recorder.js, weil dort
 * auch Erlaubnis und Fehler behandelt werden.
 * Pfad: src/features/media/recorder-session.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * levelEveryMs -> wie oft ein neuer Strich in die Welle kommt (kleiner = schneller)
 */

import { discardMic, finishMic, micLevel, pauseMic, resumeMic } from "./recorder-mic.js";
import { rec, setState } from "./recorder-state.js";
import { showTime } from "./recorder-view.js";

const levelEveryMs = 70;

/* ---------- Pegel und Zeit ---------- */

/* Lautstärke gerade jetzt, 0 bis 1. Ohne Pegelmesser (kein Web Audio) schlägt die Welle zufällig aus, damit man sieht, dass aufgenommen wird. */
function level() {
  const measured = micLevel(rec.session.mic);
  return measured !== null ? measured : 0.2 + Math.random() * 0.5;
}

/* Läuft nur während der Aufnahme: Zeit weiterzählen, neue Striche in die Welle. */
function tick() {
  const { session } = rec;
  session.frame = requestAnimationFrame(tick);
  const now = performance.now();
  showTime(rec.layer, session.elapsed + now - session.startedAt);
  if (now - session.lastLevel < levelEveryMs) return;
  rec.wave.push(level());
  session.lastLevel = now;
}

/** Wie lang die Aufnahme bisher ist; danach richtet sich die Rückfrage beim Verwerfen. */
export function sessionLengthMs() {
  const { session, recorded } = rec;
  if (session) return session.elapsed + (rec.state === "recording" ? performance.now() - session.startedAt : 0);
  return recorded ? recorded.duration * 1000 : 0;
}

/* ---------- Aufnehmen ---------- */

/** Die Aufnahme läuft los: Zeit und Welle starten. */
export function beginSession(mic) {
  rec.session = { mic, elapsed: 0, startedAt: performance.now(), lastLevel: performance.now(), frame: 0 };
  setState("recording");
  tick();
}

/** Die laufende Sitzung verwerfen: Mikrofon frei, Zeit steht. */
export function dropSession() {
  const { session } = rec;
  if (!session) return;
  cancelAnimationFrame(session.frame);
  discardMic(session.mic);
  rec.session = null;
}

export function pauseSession() {
  const { session } = rec;
  if (!session || rec.state !== "recording") return;
  pauseMic(session.mic);
  session.elapsed += performance.now() - session.startedAt;
  cancelAnimationFrame(session.frame);
  setState("paused");
}

export function resumeSession() {
  const { session } = rec;
  if (!session || rec.state !== "paused") return;
  resumeMic(session.mic);
  session.startedAt = performance.now();
  session.lastLevel = session.startedAt;
  setState("recording");
  tick();
}

/** Aufnahme beenden und als Datei bereitlegen; danach ist das Mikrofon frei. Gibt die Dauer in ms zurück. */
export async function finishSession() {
  if (!rec.session) return null;
  const current = rec.session;
  rec.session = null;
  if (rec.state === "recording") current.elapsed += performance.now() - current.startedAt;
  cancelAnimationFrame(current.frame);
  const blob = await finishMic(current.mic);
  rec.recorded = blob ? { blob, duration: current.elapsed / 1000 } : null;
  return current.elapsed;
}

/** „Stoppen“: danach lässt sich die Aufnahme anhören, neu beginnen oder speichern. */
export async function stopSession() {
  const elapsed = await finishSession();
  if (rec.layer.hidden || elapsed === null) return;
  setState("stopped");
  showTime(rec.layer, elapsed);
}
