/*
 * Diktat für das Eingabefeld über die Web Speech API, wo der Browser sie hat.
 * Das Gesprochene landet hinter dem Getippten; ein zweiter Tipp beendet die
 * Aufnahme.
 * Pfad: src/features/composer/dictation.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * language -> Sprache der Erkennung
 *
 * Der rote Kreis beim Aufnehmen steht in styles/composer.css (.composer-mic.is-recording).
 */

import { dom } from "../../core/dom.js";
import { openSheet } from "../../ui/sheet.js";

const language = "de-DE";

/* webkitSpeechRecognition: manche Browser kennen die Schnittstelle nur unter diesem Namen */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let session = null;

/** Laufendes Diktat beenden. */
export function stopDictation() {
  if (session) session.stop();
}

/* Alles Gesprochene aneinanderhängen; die Erkennung schickt es stückweise. */
function transcriptOf(event) {
  return Array.from(event.results)
    .map((result) => result[0].transcript)
    .join("")
    .trim();
}

function start(onChange) {
  const typed = dom.composerInput.value.trim();
  session = new SpeechRecognition();
  session.lang = language;
  session.interimResults = true;

  session.onresult = (event) => {
    const spoken = transcriptOf(event);
    dom.composerInput.value = typed && spoken ? `${typed} ${spoken}` : typed || spoken;
    if (onChange) onChange();
  };
  session.onend = () => {
    session = null;
    dom.composerMic.classList.remove("is-recording");
    dom.composerInput.focus();
  };

  dom.composerMic.classList.add("is-recording");
  session.start();
}

/** Den Diktat-Knopf anmelden. `onChange` frischt den Anlegen-Knopf auf. */
export function initDictation(onChange) {
  dom.composerMic.addEventListener("click", () => {
    if (!SpeechRecognition) {
      openSheet("Diktieren", [
        {
          label: "In diesem Browser nicht verfügbar",
          icon: "mic",
          onSelect: () => dom.composerInput.focus(),
        },
      ]);
      return;
    }
    if (session) {
      session.stop();
      return;
    }
    start(onChange);
  });
}
