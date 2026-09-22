/*
 * Ein unsichtbares Formular, das Chromes Eingabe-Verlauf abschaltet.
 * Pfad: src/core/no-history.js
 *
 * Chrome merkt sich, was man in ein Feld mit id getippt hat, und bietet es
 * beim nächsten Mal als Vorschläge über der Tastatur an. Übernimmt man einen,
 * färbt Chrome das Feld blau. Für die Namen und Titel der App ist das nur im
 * Weg.
 *
 * autocomplete="off" direkt am Feld schaltet den Verlauf zwar ab, auf Android
 * aber auch Gboards Wortvorschläge beim Tippen. Steht "off" stattdessen an dem
 * Formular, zu dem das Feld gehört, erbt Chrome es für den Verlauf — die
 * Tastatur liest aber nur das Feld selbst und schlägt weiter Wörter vor.
 * Die Felder hängen sich mit form="no-history" an dieses Formular; sie
 * müssen dafür nicht darin stehen.
 *
 * Wichtig: am Formular nie autocorrect, autocapitalize oder spellcheck setzen —
 * die Felder würden es erben und Gboard verlöre die Autokorrektur. Und kein
 * Feld mit form="no-history" darf ein eigenes autocomplete tragen: "off"
 * schaltet wieder die Wortvorschläge ab, jeder andere Wert den Verlauf ein.
 * Einen festen enterkeyhint brauchen Felder, deren Enter etwas anlegt: sonst
 * kann die Taste zu „Weiter“ werden und springt ins nächste Feld des Formulars.
 *
 * Nicht in WebKit (Safari und jeder Browser auf dem iPhone): WebKit setzt alle
 * Felder eines Formulars mit autocomplete="off" still auf ihren Anfangswert
 * zurück, wenn man mit der Zurück-Taste auf die Seite zurückkommt — ohne
 * input-Ereignis. Der nächste Tastendruck würde den geleerten Titel über den
 * Eintrag speichern. Einen Feld-Verlauf, den das Formular abschalten müsste,
 * hat WebKit nicht. Ohne Formular zeigt form="no-history" auf nichts, und die
 * Felder verhalten sich wie gewöhnliche Felder ohne Formular.
 * Zweite Sicherung für andere Browser mit demselben Verhalten (Firefox für
 * Android bis Version 146): src/shell/lifecycle.js nimmt beim Verlassen der
 * Seite das "off" ab (pauseNoHistoryForm) und setzt es beim Zurückkommen
 * wieder (resumeNoHistoryForm). Zurückgesetzt wird nur, was beim Weglegen
 * der Seite "off" trägt.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * noHistoryForm -> id des Formulars; steht auch als form="no-history" an den
 *                  Feldern in index.html, src/ui/rows.js und
 *                  src/features/overview/tabs.js
 * webkitVendor  -> woran WebKit zu erkennen ist (navigator.vendor)
 */

export const noHistoryForm = "no-history";

/* WebKit meldet hier immer diesen Text, auch Chrome und Firefox auf dem
   iPhone (beide laufen dort auf WebKit). Chromium meldet "Google Inc.",
   Firefox einen leeren Text. */
const webkitVendor = "Apple Computer, Inc.";

let form = null;

/**
 * Das Formular einmal anlegen. Es darf auch nach den Feldern entstehen: der
 * Browser ordnet Felder mit passendem form="" neu zu, sobald die id auftaucht.
 */
export function mountNoHistoryForm() {
  if (form || navigator.vendor === webkitVendor) return;
  form = document.createElement("form");
  form.id = noHistoryForm;
  form.setAttribute("autocomplete", "off");
  form.hidden = true;
  /* Keine Prüfung der Felder beim Abschicken: sonst könnte ein einzelnes Feld
     beim Drücken von Enter eine Browser-Fehlerblase zeigen. */
  form.noValidate = true;
  /* Enter in einem Feld dieses Formulars würde es „abschicken“ und die Seite
     neu laden. Die Felder regeln Enter selbst, das Abschicken bleibt aus. */
  form.addEventListener("submit", (event) => event.preventDefault());
  document.body.append(form);
}

/** Die Seite wird weggelegt (pagehide): "off" abnehmen, damit nichts zurückgesetzt wird. */
export function pauseNoHistoryForm() {
  if (form) form.removeAttribute("autocomplete");
}

/** Die Seite ist wieder da (pageshow): den Verlauf wieder abschalten. */
export function resumeNoHistoryForm() {
  if (form) form.setAttribute("autocomplete", "off");
}
