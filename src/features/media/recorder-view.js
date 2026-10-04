/*
 * Das Aussehen der Audio-Aufnahme: das Overlay selbst, die Wellen, die Zeit
 * und welche Knöpfe in welchem Zustand stehen. Die Aufnahme selbst (Mikrofon,
 * Mitschrift, Speichern) steht in src/features/media/recorder.js.
 * Aufbau wie die Suche: oben die Kopfzeile mit ←, dem Namen der Aufnahme
 * und rechts ⚙ („Mitschrift einrichten“), darunter verschwommen die Seite,
 * unten Gehäuse und „Abbrechen“. Über der Mitschrift steht die
 * Zwischenüberschrift mit „Kopieren“ und „Umwandeln“. Die Knöpfe
 * unten tragen dieselben Klassen wie die Medien-Leiste (styles/media-bar.css)
 * und „Abbrechen“ der Suche (styles/search.css) — so sehen sie gleich aus.
 * Pfad: src/features/media/recorder-view.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * barCount       -> wie viele Striche die Welle hat (mehr = feiner, aber mehr zu zeichnen)
 * minLevel       -> wie hoch ein Strich bei Stille noch ist (0 bis 1)
 * stateTexts     -> was unter der Zeit steht, je Zustand (Aufnahme)
 * textStateTexts -> dasselbe im Modus „Nur Mitschrift“
 * hints          -> Hinweis unter der Zeit, solange der Browser nach dem Mikrofon fragt
 * micNotes       -> Satz in der Mitte, wenn das Mikrofon nicht aufging, je Grund
 * textProblems   -> Satz statt der Mitschrift, wenn sie gerade nicht geht, je Grund
 * labels         -> Beschriftung der Knöpfe und Platzhalter
 *
 * Farben und Maße stehen in styles/recorder.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { pad2 } from "../../core/dates.js";

const barCount = 40;
const minLevel = 0.06;

const stateTexts = {
  starting: "Mikrofon wird geöffnet …",
  recording: "Aufnahme läuft",
  paused: "Pausiert",
  stopped: "Aufnahme beendet",
  error: "Kein Zugriff aufs Mikrofon",
};

/* Im Modus „Nur Mitschrift“ gibt es keine Aufnahme, nur Text */
const textStateTexts = {
  ...stateTexts,
  starting: "Mitschrift wird gestartet …",
  recording: "Mitschrift läuft",
  stopped: "Mitschrift beendet",
};

const hints = {
  asking: "Bitte das Mikrofon erlauben …",
};

/* Warum das Mikrofon nicht aufging (Gründe aus recorder-mic.js) */
const micNotes = {
  blocked: "Das Mikrofon ist für diese Seite gesperrt. Oben rechts auf ⚙ tippen: dort stehen die Schritte zum Erlauben und „Erneut anfragen“.",
  missing: "Es wurde kein Mikrofon gefunden.",
  busy: "Das Mikrofon ist gerade belegt — eine andere App benutzt es. Nochmal versuchen, wenn sie fertig ist.",
  failed: "Das Mikrofon geht gerade nicht auf. Erneut versuchen oder oben rechts auf ⚙ tippen.",
  speech: "Die Mitschrift geht gerade nicht. Oben rechts auf ⚙ tippen: dort steht der Grund.",
};

/* Warum die Mitschrift gerade nicht geht (Gründe aus recorder-speech.js); "starved" bekommt dazu den Knopf „Nur Mitschrift“ */
const textProblems = {
  starved: "Dein Gerät gibt das Mikrofon nur an die Aufnahme, die Mitschrift bekommt keinen Ton. Text gibt es hier nur ohne Aufnahme:",
  failed: "Mitschreiben geht hier gerade nicht — die Aufnahme läuft trotzdem. Oben rechts auf ⚙ tippen, um es einzurichten.",
};

const labels = {
  title: "Neue Aufnahme",
  save: "Speichern",
  cancel: "Abbrechen",
  textHead: "Mitschrift",
  textEmpty: "Was du sagst, erscheint hier.",
  textOnly: "Nur Mitschrift",
  setup: "Mitschrift einrichten",
  copy: "Mitschrift kopieren",
  convert: "In Notiz oder Dokument umwandeln",
};

/* Welche Knöpfe in welchem Zustand: links und das kleine Feld im Gehäuse. */
const sideButton = {
  starting: { action: "stop", icon: "stop", label: "Stoppen" },
  recording: { action: "stop", icon: "stop", label: "Stoppen" },
  paused: { action: "stop", icon: "stop", label: "Stoppen" },
  stopped: { action: "restart", icon: "mic", label: "Neu aufnehmen" },
  error: { action: "restart", icon: "mic", label: "Erneut versuchen" },
};

const comboButton = {
  starting: { action: "pause", icon: "pause", label: "Pausieren" },
  recording: { action: "pause", icon: "pause", label: "Pausieren" },
  paused: { action: "resume", icon: "mic", label: "Weiter aufnehmen" },
  stopped: { action: "play", icon: "play", label: "Anhören" },
  error: { action: "play", icon: "play", label: "Anhören" },
};

/** Das Overlay einmal bauen; es bleibt danach im Gerät und wird nur gezeigt oder versteckt. */
export function buildRecorder() {
  const layer = document.createElement("div");
  layer.className = "recorder";
  layer.hidden = true;
  layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-label", labels.title);
  const bars = Array.from({ length: barCount }, () => '<span class="recorder-bar"></span>').join("");
  layer.innerHTML = `
    <div class="recorder-head">
      <button class="recorder-back" type="button" data-rec="cancel" aria-label="Zurück">${icon("arrow-back")}</button>
      <input class="recorder-name" type="text" enterkeyhint="done" placeholder="${escapeHtml(labels.title)}" aria-label="Name der Aufnahme" />
      <button class="recorder-head-btn recorder-setup" type="button" data-rec="setup" aria-label="${escapeHtml(labels.setup)}">${icon("settings")}</button>
    </div>
    <div class="recorder-body">
      <div class="recorder-time">0:00</div>
      <div class="recorder-state"><span class="recorder-dot"></span><span class="recorder-state-text"></span></div>
      <div class="recorder-wave" aria-hidden="true">${bars}</div>
      <p class="recorder-note" hidden></p>
      <div class="recorder-text-head">
        <span>${escapeHtml(labels.textHead)}</span>
        <span class="recorder-text-tools">
          <button class="recorder-head-btn" type="button" data-rec="copy" aria-label="${escapeHtml(labels.copy)}" title="${escapeHtml(labels.copy)}" disabled>${icon("copy")}</button>
          <button class="recorder-head-btn" type="button" data-rec="convert" aria-label="${escapeHtml(labels.convert)}" title="${escapeHtml(labels.convert)}" disabled>${icon("convert")}</button>
        </span>
      </div>
      <p class="recorder-text"></p>
    </div>
    <div class="recorder-actions">
      <button class="media-side recorder-side" type="button"></button>
      <div class="media-combo">
        <button class="media-combo-btn recorder-small" type="button"></button>
        <button class="media-combo-btn is-active recorder-save" type="button" data-rec="save">${escapeHtml(labels.save)}</button>
      </div>
      <button class="search-cancel" type="button" data-rec="cancel">${escapeHtml(labels.cancel)}</button>
    </div>`;
  return layer;
}

/* Einen Knopf auf Aufgabe, Icon und Namen einstellen. */
function setButton(button, spec) {
  button.dataset.rec = spec.action;
  button.setAttribute("aria-label", spec.label);
  button.innerHTML = icon(spec.icon);
}

/**
 * Den Zustand zeigen: Text unter der Zeit, roter Punkt, Knöpfe.
 * @param state   "starting", "recording", "paused", "stopped" oder "error"
 * @param mode    "audio" (Aufnahme + Mitschrift) oder "text" (nur Mitschrift)
 * @param canSave ob es schon etwas zu speichern gibt
 * @param canPlay ob es nach dem Stoppen etwas anzuhören gibt
 */
export function showState(layer, state, { mode, canSave, canPlay }) {
  layer.dataset.state = state;
  layer.dataset.mode = mode;
  layer.querySelector(".recorder-state-text").textContent = (mode === "text" ? textStateTexts : stateTexts)[state];
  layer.querySelector(".recorder-note").hidden = state !== "error";
  const side = layer.querySelector(".recorder-side");
  setButton(side, sideButton[state]);
  /* Solange das Mikrofon noch aufgeht, gibt es nichts zu stoppen */
  side.disabled = state === "starting";
  const small = layer.querySelector(".recorder-small");
  setButton(small, comboButton[state]);
  small.disabled = state === "error" || state === "starting" || (state === "stopped" && !canPlay);
  layer.querySelector(".recorder-save").disabled = !canSave;
}

/** Unter der Zeit steht, dass der Browser gerade nach dem Mikrofon fragt. */
export function showHint(layer, key) {
  layer.querySelector(".recorder-state-text").textContent = hints[key];
}

/** Der Satz in der Mitte, wenn das Mikrofon nicht aufging — mit dem Grund aus recorder-mic.js. */
export function showMicError(layer, reason) {
  layer.querySelector(".recorder-note").textContent = micNotes[reason] || micNotes.failed;
}

/** Beim Anhören: das kleine Feld wird zu Pause und zurück. */
export function showPlaying(layer, playing) {
  const small = layer.querySelector(".recorder-small");
  setButton(small, playing ? { action: "play", icon: "pause", label: "Anhören anhalten" } : comboButton.stopped);
}

/** Die Zeit als „0:12“ oder „1:04:09“. */
export function showTime(layer, ms) {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const text = hours ? `${hours}:${pad2(minutes)}:${pad2(total % 60)}` : `${minutes}:${pad2(total % 60)}`;
  layer.querySelector(".recorder-time").textContent = text;
}

/**
 * Die Mitschrift zeigen. `null` heißt: sie geht gerade nicht — `problem` sagt
 * warum (recorder-speech.js); bekommt sie keinen Ton („starved“), steht
 * dabei der Knopf „Nur Mitschrift“.
 * Was noch nicht sicher erkannt ist (`pending`), steht blasser dahinter.
 */
export function showText(layer, final, pending = "", problem = "") {
  const box = layer.querySelector(".recorder-text");
  /* Kopieren und Umwandeln gehen erst, wenn es Text gibt */
  const hasText = Boolean(final || pending);
  layer.querySelectorAll(".recorder-text-tools button").forEach((button) => {
    button.disabled = !hasText;
  });
  if (final === null) {
    const button =
      problem === "starved"
        ? ` <button class="recorder-text-btn" type="button" data-rec="textOnly">${icon("mic")}${escapeHtml(labels.textOnly)}</button>`
        : "";
    box.innerHTML = `${escapeHtml(textProblems[problem] || textProblems.failed)}${button}`;
    box.classList.add("is-empty");
    return;
  }
  const empty = !final && !pending;
  box.classList.toggle("is-empty", empty);
  box.innerHTML = empty
    ? escapeHtml(labels.textEmpty)
    : `${escapeHtml(final)}${pending ? ` <span class="recorder-pending">${escapeHtml(pending)}</span>` : ""}`;
  /* Neues Gesagtes steht unten; die Box rollt mit, damit man es sieht */
  box.scrollTop = box.scrollHeight;
}

/** Das Zahnrad oben bekommt einen Punkt, solange Mikrofon oder Mitschrift nicht gehen. */
export function showSetupAlert(layer, alert) {
  layer.querySelector(".recorder-setup").classList.toggle("is-alert", alert);
}

/**
 * Die Welle: jeder neue Pegel (0 bis 1) kommt rechts dazu, die alten rücken
 * nach links — so läuft die Aufnahme sichtbar durch. Bewegt wird nur über
 * transform, das muss der Browser nicht neu anordnen.
 */
export function createWave(layer) {
  const bars = [...layer.querySelectorAll(".recorder-bar")];
  const levels = new Array(bars.length).fill(minLevel);
  const draw = () => {
    bars.forEach((bar, index) => {
      bar.style.transform = `scaleY(${levels[index]})`;
    });
  };
  draw();
  return {
    push(level) {
      levels.shift();
      levels.push(Math.max(minLevel, Math.min(1, level)));
      draw();
    },
    reset() {
      levels.fill(minLevel);
      draw();
    },
  };
}
