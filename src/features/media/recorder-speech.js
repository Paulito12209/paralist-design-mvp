/*
 * Die Mitschrift einer Audio-Aufnahme: was man sagt, erscheint während der
 * Aufnahme als Text. Im Browser übernimmt das die eingebaute Spracherkennung
 * (Web Speech API); gibt es sie nicht, läuft die Aufnahme ohne Text. In der
 * späteren Android-App tritt der SpeechRecognizer des Geräts an diese Stelle.
 *
 * Gehört wird in Anläufen, genau wie beim Mikrofon der Suche
 * (src/shell/search-voice.js), das auf jedem Gerät geht: Hört der Browser von
 * selbst auf (Sprechpause, ein Satz fertig, kleiner Fehler), beginnt sofort
 * der nächste Anlauf — solange aufgenommen wird. Auf Android hört Chrome je
 * Anlauf nur einen Satz zu: „continuous“ wäre dort der Diktiermodus des
 * Geräts, der Zwischenstände als endgültig meldet (Wörter kämen doppelt) und
 * nach dem ersten Ergebnis ohnehin aufhört. Am Computer und auf dem iPhone
 * hört ein Anlauf durchgehend zu.
 * Der Text eines Anlaufs wird bei jedem Ergebnis aus der ganzen Liste des
 * Browsers neu gebaut statt angehängt — so entsteht nichts doppelt.
 * Ein Fehler zählt erst, wenn mehrere Anläufe hintereinander scheitern, ohne
 * ein Wort zu hören: Android meldet zum Beispiel „not-allowed“, wenn die
 * Erkennung nur gerade noch beschäftigt ist.
 * Benutzt von src/features/media/recorder.js.
 * Pfad: src/features/media/recorder-speech.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * speechLang    -> Sprache, auf die die Mitschrift eingestellt ist
 * heardMs       -> wie lange nach einem erkannten Wort die Welle noch ausschlägt (nur ohne Mikrofon-Pegel)
 * retryAfterMs  -> wie lange nach einem Fehler (oder einem sofort beendeten Anlauf)
 *                  gewartet wird, bevor der nächste Anlauf beginnt
 * shortRunMs    -> ein Anlauf, der schneller als das endet, ohne etwas gehört zu haben,
 *                  gilt als sofort beendet (sonst liefe eine enge Schleife)
 * maxFailedRuns -> so viele Anläufe hintereinander dürfen ohne ein gehörtes Wort scheitern,
 *                  bevor der Fehler als Grund gilt und die Mitschrift aufhört
 *
 * Wie der Text aussieht, steht in styles/recorder.css (.recorder-text).
 */

import { deviceKind } from "./recorder-setup.js";

const speechLang = "de-DE";
const heardMs = 700;
const retryAfterMs = 400;
const shortRunMs = 500;
const maxFailedRuns = 3;

/* Fehler, nach denen einfach weitergehört wird (Sprechpause, nichts verstanden, abgebrochen) */
const harmlessErrors = ["no-speech", "no-match", "aborted"];

/**
 * Gründe, die heißen: Aufnahme und Mitschrift können sich das Mikrofon nicht
 * teilen (Android gibt es nur an eine App). "starved": die Aufnahme hört Ton,
 * die Erkennung nichts; "audio-capture": die Erkennung kam gar nicht ans Mikrofon.
 */
export const conflictProblems = ["starved", "audio-capture"];

/* Die Spracherkennung heißt je nach Browser anders; ohne beide gibt es sie nicht. */
function speechApi() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/** Kann dieser Browser überhaupt mitschreiben? */
export function speechAvailable() {
  return Boolean(speechApi());
}

/* Auf Android je Anlauf ein Satz (siehe Kopf), sonst durchgehend */
function oneSentencePerRun() {
  return deviceKind() === "android";
}

function joinWords(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Eine Mitschrift für eine Aufnahme.
 * @param onChange (final, pending) — der sichere Text und was noch unsicher
 *   ist; `null` statt Text heißt: die Mitschrift geht hier nicht.
 * @param stillRecording sagt, ob nach einem Anlauf weitergehört werden soll.
 */
export function createSpeech(onChange, stillRecording) {
  const Api = speechApi();
  let recognition = null;
  /* Was aus abgeschlossenen Anläufen feststeht */
  let committed = "";
  /* Der laufende Anlauf: sicher erkannt und noch unsicher */
  let runFinal = "";
  let pending = "";
  /* Warum die Mitschrift nicht läuft: Fehlername des Browsers, "missing" ohne
     Spracherkennung, "starved" wenn sie keinen Ton bekommt, sonst "" */
  let problem = Api ? "" : "missing";
  /* Wann die Erkennung zuletzt etwas gehört hat (performance.now), 0 = noch nie */
  let lastHeard = 0;
  /* Anläufe hintereinander, die mit einem Fehler endeten, ohne ein Wort zu hören */
  let failedRuns = 0;
  let nextRun = 0;

  function finalText() {
    return joinWords(committed, runFinal);
  }

  function report() {
    onChange(finalText(), pending);
  }

  /* Den Text des Anlaufs aus der ganzen Liste neu bauen — nichts anhängen, dann gibt es keine Dubletten */
  function takeResults(results) {
    const sure = [];
    const open = [];
    for (let index = 0; index < results.length; index += 1) {
      const text = results[index][0] ? results[index][0].transcript.trim() : "";
      if (text) (results[index].isFinal ? sure : open).push(text);
    }
    runFinal = sure.join(" ");
    pending = open.join(" ");
  }

  /* Ein Anlauf ist zu Ende: was er sicher hatte und was noch unsicher war, steht jetzt fest */
  function closeRun() {
    committed = joinWords(committed, runFinal, pending);
    runFinal = "";
    pending = "";
  }

  function scheduleRun(afterMs) {
    clearTimeout(nextRun);
    nextRun = setTimeout(() => {
      if (!recognition && !problem && stillRecording()) listen();
    }, afterMs);
  }

  /* Zu oft hintereinander gescheitert: der Fehler ist der Grund, die Mitschrift hört auf */
  function giveUp(reason) {
    problem = reason;
    if (finalText()) report();
    else onChange(null);
  }

  function listen() {
    const current = new Api();
    current.lang = speechLang;
    current.continuous = !oneSentencePerRun();
    current.interimResults = true;
    let failure = "";
    let heardInRun = false;
    const startedAt = performance.now();
    current.onsoundstart = () => {
      lastHeard = performance.now();
    };
    current.onresult = (event) => {
      lastHeard = performance.now();
      heardInRun = true;
      failedRuns = 0;
      takeResults(event.results);
      report();
    };
    current.onerror = (event) => {
      if (harmlessErrors.includes(event.error)) return;
      failure = event.error || "failed";
    };
    /* Der Browser hört von selbst auf: Stand festhalten und, solange aufgenommen wird, weiterhören */
    current.onend = () => {
      if (recognition !== current) return;
      recognition = null;
      const hadOpenText = Boolean(pending);
      closeRun();
      if (hadOpenText) report();
      /* Nur Fehler direkt hintereinander zählen; ein stiller Anlauf ohne Fehler (Sprechpause) setzt die Zählung zurück */
      if (!failure) failedRuns = 0;
      else if (!heardInRun) {
        failedRuns += 1;
        if (failedRuns >= maxFailedRuns) {
          giveUp(failure);
          return;
        }
      }
      if (!stillRecording()) return;
      /* Nach einem Fehler oder einem sofort beendeten Anlauf kurz warten, sonst gleich weiter */
      const tooQuick = !heardInRun && performance.now() - startedAt < shortRunMs;
      scheduleRun(failure || tooQuick ? retryAfterMs : 0);
    };
    recognition = current;
    try {
      current.start();
    } catch (error) {
      /* Zum Beispiel noch beschäftigt — gleich noch einmal, wie nach einem Fehler */
      recognition = null;
      failedRuns += 1;
      if (failedRuns >= maxFailedRuns) giveUp("failed");
      else scheduleRun(retryAfterMs);
    }
  }

  return {
    /** Zuhören (wieder) beginnen. */
    start() {
      if (!problem && !recognition) listen();
    },
    /** Nach „Erneut anfragen“: den alten Fehler vergessen und, wenn aufgenommen wird, neu zuhören. */
    retry() {
      if (!Api) return;
      problem = "";
      failedRuns = 0;
      report();
      if (stillRecording()) this.start();
    },
    /** Warum gerade nicht mitgeschrieben wird ("" = alles gut). */
    problem() {
      return problem;
    },
    /** Hat die Erkennung bis jetzt irgendetwas gehört? */
    heardAnything() {
      return lastHeard > 0;
    },
    /** Hat sie gerade eben etwas gehört? Treibt die Welle, wenn kein Mikrofon-Pegel da ist. */
    heard() {
      return lastHeard > 0 && performance.now() - lastHeard < heardMs;
    },
    /** Die Aufnahme hat das Mikrofon für sich allein: die Mitschrift bekommt keinen Ton und hört auf. */
    starve() {
      if (problem) return;
      this.stop();
      giveUp("starved");
    },
    /** Zuhören beenden; was noch unsicher war, zählt jetzt als gesagt. */
    stop() {
      clearTimeout(nextRun);
      if (recognition) {
        const current = recognition;
        recognition = null;
        current.onresult = null;
        current.onerror = null;
        current.onend = null;
        current.stop();
      }
      closeRun();
      if (!problem) report();
    },
    /** Der ganze Text bis jetzt. */
    text() {
      return joinWords(finalText(), pending);
    },
  };
}
