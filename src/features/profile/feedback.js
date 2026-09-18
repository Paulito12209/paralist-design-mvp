/*
 * Die Feedback-Seite hinter „Support → Feedback“ im Einstellungs-Blatt.
 * Man wählt zuerst die Art — Fehler, Verbesserung oder Wunsch —, tippt dann
 * einen kurzen Titel und die Beschreibung; die Mailadresse ist freiwillig.
 * Die Felder heißen genau wie die Spalten im Notion-Formular „Feedback“
 * (Art, Titel, Beschreibung, Kontakt), damit das Abschicken später ohne Umbau
 * dorthin geht. Im Entwurf landet die Meldung im Browser-Speicher, und der
 * Knopf am Ende führt zum Formular in Notion.
 * Pfad: src/features/profile/feedback.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * kinds       -> die drei Arten: Icon, Überschrift, Nebenzeile und Platzhalter
 * formUrl     -> wohin „Formular in Notion öffnen“ führt
 * titleMax    -> wie viele Zeichen der Titel höchstens hat
 * textMax     -> wie viele Zeichen die Beschreibung höchstens hat
 * keepReports -> wie viele abgeschickte Meldungen der Speicher behält
 * texts       -> alle Sätze der Seite an einer Stelle
 *
 * Farben, Rundungen und Höhen stehen in styles/support.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { readJson, storageKeys, writeJson } from "../../core/storage.js";
import { appVersion } from "./profile-cards.js";

/*
 * Die drei Arten. Der Schlüssel steht nur im Code, `notion` ist der Name der
 * Option in der Spalte „Art“ des Notion-Formulars — beides muss zusammenpassen.
 */
const kinds = {
  bug: {
    icon: "help",
    notion: "Fehler melden",
    label: "Fehler melden",
    hint: "Etwas geht nicht oder sieht falsch aus.",
    titleHint: "Was ist schiefgegangen?",
    textHint: "Was hast du getan, was ist stattdessen passiert?",
  },
  idea: {
    icon: "trend",
    notion: "Verbesserung vorschlagen",
    label: "Verbesserung vorschlagen",
    hint: "Etwas geht schon, könnte aber besser gehen.",
    titleHint: "Was soll besser werden?",
    textHint: "Was stört dich daran und wie stellst du es dir vor?",
  },
  wish: {
    icon: "star-outline",
    notion: "Neues Feature wünschen",
    label: "Neues Feature wünschen",
    hint: "Etwas fehlt dir ganz.",
    titleHint: "Was wünschst du dir?",
    textHint: "Wobei würde es dir helfen?",
  },
};

/* Das Notion-Formular, in das die Meldungen laufen sollen. */
const formUrl = "https://app.notion.com/p/3df30c14dde7802d9048f78c39ec32ad?v=3df30c14dde780929345000c0a9253ad";

const titleMax = 80;
const textMax = 1000;
const keepReports = 50;

/** Alle Sätze der Seite an einer Stelle, damit man sie ohne Suchen ändern kann. */
const texts = {
  title: "Feedback",
  intro: "Ein Satz reicht. Jede Meldung wird gelesen.",
  pickHead: "Worum geht es?",
  formHead: "Deine Meldung",
  mailHint: "Mailadresse für eine Antwort (freiwillig)",
  send: "Absenden",
  doneTitle: "Danke!",
  doneBody: "Deine Meldung ist gespeichert und wandert in die Roadmap.",
  again: "Noch etwas melden",
  openForm: "Formular in Notion öffnen",
};

/* Was gerade getippt ist. Bleibt stehen, während die Seite neu gezeichnet wird. */
const draft = { kind: "", title: "", text: "", mail: "" };

/* true, solange die Danke-Seite statt des Formulars zu sehen ist. */
let sent = false;

/** Beim Öffnen der Seite: die Danke-Seite von vorhin nicht wieder zeigen. */
export function enterFeedback() {
  sent = false;
}

/* Eine der drei Arten zum Antippen. */
function choiceMarkup(key) {
  const kind = kinds[key];
  const active = draft.kind === key;
  return `
    <button class="fb-choice${active ? " is-active" : ""}" type="button" data-feedback-kind="${key}" aria-pressed="${active}">
      ${icon(kind.icon, "fb-choice-icon")}
      <span class="fb-choice-text">
        <span class="fb-choice-label">${escapeHtml(kind.label)}</span>
        <span class="fb-choice-hint">${escapeHtml(kind.hint)}</span>
      </span>
      ${icon("check", "fb-choice-check")}
    </button>
  `;
}

/*
 * Die Felder erscheinen erst, wenn die Art steht — so sieht man beim Öffnen
 * nur eine Frage und nicht ein ganzes Formular.
 * `input type=email` blendet am Handy die Tastatur mit dem @-Zeichen ein.
 */
function fieldsMarkup(kind) {
  return `
    <p class="psection">${escapeHtml(texts.formHead)}</p>
    <div class="fb-fields">
      <input class="fb-input" type="text" data-feedback-field="title" maxlength="${titleMax}"
        placeholder="${escapeHtml(kind.titleHint)}" value="${escapeHtml(draft.title)}" aria-label="Titel">
      <textarea class="fb-text" data-feedback-field="text" maxlength="${textMax}"
        placeholder="${escapeHtml(kind.textHint)}" aria-label="Beschreibung">${escapeHtml(draft.text)}</textarea>
      <input class="fb-input" type="email" data-feedback-field="mail"
        placeholder="${escapeHtml(texts.mailHint)}" value="${escapeHtml(draft.mail)}" aria-label="Mailadresse">
    </div>
    <button class="fb-send" type="button" data-feedback-send="1"${draft.title.trim() ? "" : " disabled"}>
      ${escapeHtml(texts.send)}
    </button>
    <p class="fb-note">Mitgeschickt wird nur, was hier steht — dazu ${escapeHtml(appVersion())}.</p>
  `;
}

/*
 * Die Danke-Seite nach dem Absenden.
 * `a` statt `button`: der Weg nach Notion führt aus der App hinaus, und
 * `rel="noopener"` hält die fremde Seite von diesem Fenster fern.
 */
function sentMarkup() {
  return `
    <section class="fb fb-done">
      ${icon("check-circle", "fb-done-icon")}
      <h2 class="fb-title">${escapeHtml(texts.doneTitle)}</h2>
      <p class="fb-intro">${escapeHtml(texts.doneBody)}</p>
      <button class="fb-send" type="button" data-feedback-again="1">${escapeHtml(texts.again)}</button>
      <a class="fb-link" href="${formUrl}" target="_blank" rel="noopener noreferrer">
        ${icon("external")}<span>${escapeHtml(texts.openForm)}</span>
      </a>
    </section>
  `;
}

/** Die ganze Seite: Frage, die drei Arten und — sobald gewählt — die Felder. */
export function feedbackCard() {
  if (sent) return sentMarkup();
  const kind = kinds[draft.kind];
  return `
    <section class="fb">
      <h2 class="fb-title">${escapeHtml(texts.title)}</h2>
      <p class="fb-intro">${escapeHtml(texts.intro)}</p>
      <p class="psection">${escapeHtml(texts.pickHead)}</p>
      <div class="fb-choices">${Object.keys(kinds).map(choiceMarkup).join("")}</div>
      ${kind ? fieldsMarkup(kind) : ""}
    </section>
  `;
}

/* Die fertige Meldung ablegen und die Felder leeren. */
function submit() {
  const kind = kinds[draft.kind];
  if (!kind || !draft.title.trim()) return;

  const reports = readJson(storageKeys.feedback, []);
  reports.unshift({
    art: kind.notion,
    titel: draft.title.trim(),
    beschreibung: draft.text.trim(),
    kontakt: draft.mail.trim(),
    version: appVersion(),
    zeit: new Date().toISOString(),
  });
  writeJson(storageKeys.feedback, reports.slice(0, keepReports));

  draft.kind = "";
  draft.title = "";
  draft.text = "";
  draft.mail = "";
  sent = true;
}

/**
 * Tippen im Formular merken, ohne die Seite neu zu zeichnen — sonst spränge
 * die Schreibmarke bei jedem Buchstaben ans Ende.
 * @returns true, wenn das Ereignis zu einem Feedback-Feld gehörte.
 */
export function noteFeedbackInput(event) {
  const field = event.target.closest("[data-feedback-field]");
  if (!field) return false;
  draft[field.dataset.feedbackField] = field.value;
  /* Ohne Titel bleibt „Absenden“ grau: nur dieser eine Knopf ändert sich. */
  const send = field.closest(".fb").querySelector("[data-feedback-send]");
  if (send) send.disabled = !draft.title.trim();
  return true;
}

/**
 * Klicks auf der Feedback-Seite.
 * @returns true, wenn die Seite danach neu gezeichnet werden muss.
 */
export function onFeedbackClick(event) {
  const choice = event.target.closest("[data-feedback-kind]");
  if (choice) {
    draft.kind = choice.dataset.feedbackKind;
    return true;
  }
  if (event.target.closest("[data-feedback-send]")) {
    submit();
    return true;
  }
  if (event.target.closest("[data-feedback-again]")) {
    sent = false;
    return true;
  }
  return false;
}
