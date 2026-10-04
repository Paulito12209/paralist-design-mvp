/*
 * Die laufende Aufnahme: Zeit und Welle mitlaufen lassen, pausieren,
 * weitermachen, stoppen oder verwerfen — und den Mikrofon-Konflikt erkennen.
 * Android gibt das Mikrofon nur an eine App auf einmal: läuft die Aufnahme,
 * bekommt die Spracherkennung keinen Ton. Das merkt die Aufnahme selbst
 * (Ton da, aber nichts gehört) und bietet „Nur Mitschrift“ an.
 * Gestartet wird die Sitzung in src/features/media/recorder.js, weil dort
 * auch Erlaubnis und Fehler behandelt werden.
 * Pfad: src/features/media/recorder-session.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * levelEveryMs  -> wie oft ein neuer Strich in die Welle kommt (kleiner = schneller)
 * soundLevel    -> ab welchem Pegel (0 bis 1) die Aufnahme als „hört etwas“ zählt
 * starveAfterMs -> wie lange Ton ohne ein erkanntes Wort vergehen darf, bis die
 *                  Mitschrift als „bekommt keinen Ton“ gilt und „Nur Mitschrift“ erscheint
 */

import { discardMic, finishMic, micLevel, pauseMic, resumeMic } from "./recorder-mic.js";
import { rec, setState } from "./recorder-state.js";
import { showTime } from "./recorder-view.js";

const levelEveryMs = 70;
const soundLevel = 0.12;
const starveAfterMs = 3000;

/* Die Aufnahme hört Ton, die Mitschrift aber nichts: Android gibt das Mikrofon nur an eine App. */
function watchStarving(now, level) {
  const { session, speech } = rec;
  if (rec.mode !== "audio" || speech.problem() || speech.heardAnything()) return;
  if (level < soundLevel) return;
  session.soundMs += now - session.lastLevel;
  if (session.soundMs >= starveAfterMs) speech.starve();
}

/* ---------- Pegel und Zeit ---------- */

/* Lautstärke gerade jetzt, 0 bis 1. Ohne Mikrofon-Pegel schlägt die Welle aus, wenn die Mitschrift etwas hört. */
function level() {
  const { session, speech } = rec;
  const measured = session.mic ? micLevel(session.mic) : null;
  if (measured !== null) return measured;
  if (session.mic || speech.heard()) return 0.2 + Math.random() * 0.5;
  return 0;
}

/* Läuft nur während der Aufnahme: Zeit weiterzählen, neue Striche in die Welle. */
function tick() {
  const { session } = rec;
  session.frame = requestAnimationFrame(tick);
  const now = performance.now();
  showTime(rec.layer, session.elapsed + now - session.startedAt);
  if (now - session.lastLevel < levelEveryMs) return;
  const current = level();
  rec.wave.push(current);
  watchStarving(now, current);
  session.lastLevel = now;
}

/** Wie lang die Aufnahme bisher ist; danach richtet sich die Rückfrage beim Verwerfen. */
export function sessionLengthMs() {
  const { session, recorded } = rec;
  if (session) return session.elapsed + (rec.state === "recording" ? performance.now() - session.startedAt : 0);
  return recorded ? recorded.duration * 1000 : 0;
}

/* ---------- Aufnehmen ---------- */

/** Die Aufnahme läuft los (`mic` ist im Modus „text“ null): Zeit, Welle und Mitschrift starten. */
export function beginSession(mic) {
  rec.session = { mic, elapsed: 0, startedAt: performance.now(), lastLevel: performance.now(), frame: 0, soundMs: 0 };
  setState("recording");
  rec.speech.start();
  tick();
}

/** Die laufende Sitzung verwerfen: Mikrofon frei, Zeit steht. */
export function dropSession() {
  const { session } = rec;
  if (!session) return;
  cancelAnimationFrame(session.frame);
  if (session.mic) discardMic(session.mic);
  rec.session = null;
}

export function pauseSession() {
  const { session } = rec;
  if (!session || rec.state !== "recording") return;
  if (session.mic) pauseMic(session.mic);
  session.elapsed += performance.now() - session.startedAt;
  cancelAnimationFrame(session.frame);
  rec.speech.stop();
  setState("paused");
}

export function resumeSession() {
  const { session } = rec;
  if (!session || rec.state !== "paused") return;
  if (session.mic) resumeMic(session.mic);
  session.startedAt = performance.now();
  session.lastLevel = session.startedAt;
  setState("recording");
  rec.speech.start();
  tick();
}

/** Aufnahme beenden und als Datei bereitlegen; danach ist das Mikrofon frei. Gibt die Dauer in ms zurück. */
export async function finishSession() {
  if (!rec.session) return null;
  const current = rec.session;
  rec.session = null;
  if (rec.state === "recording") current.elapsed += performance.now() - current.startedAt;
  cancelAnimationFrame(current.frame);
  rec.speech.stop();
  if (current.mic) {
    const blob = await finishMic(current.mic);
    rec.recorded = blob ? { blob, duration: current.elapsed / 1000 } : null;
  }
  return current.elapsed;
}

/** „Stoppen“: danach lässt sich die Aufnahme anhören, neu beginnen oder speichern. */
export async function stopSession() {
  const elapsed = await finishSession();
  if (rec.layer.hidden || elapsed === null) return;
  setState("stopped");
  showTime(rec.layer, elapsed);
}
