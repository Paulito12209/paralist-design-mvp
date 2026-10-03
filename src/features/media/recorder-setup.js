/*
 * „Mitschrift einrichten“: das Zahnrad oben rechts in der Audio-Aufnahme.
 * Das Blatt zeigt, ob Mikrofon und Spracherkennung erlaubt sind, warum die
 * Mitschrift gerade nicht läuft und wo man es am eigenen Gerät erlaubt.
 * „Erneut anfragen“ fragt Mikrofon und Spracherkennung noch einmal — hat man
 * sie nur noch nicht erlaubt, zeigt der Browser dann seine Frage.
 * Eine Webseite darf die Einstellungen von Telefon oder Browser nicht selbst
 * öffnen; deshalb stehen hier die Schritte. In der Android-App tritt an ihre
 * Stelle ein Knopf „Einstellungen öffnen“
 * (Settings.ACTION_APPLICATION_DETAILS_SETTINGS), der direkt zu den
 * Berechtigungen der App springt.
 * Benutzt von src/features/media/recorder.js.
 * Pfad: src/features/media/recorder-setup.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * micTexts     -> was beim Mikrofon steht, je Antwort des Browsers
 * problemTexts -> was bei der Mitschrift steht, je Fehler der Spracherkennung
 * steps        -> die Schritte zum Erlauben, je Gerät (iPhone, Android, Computer)
 *
 * Aussehen des Blatts: styles/overlays.css (.sheet-detail, .sheet-note).
 */

import { openSheet } from "../../ui/sheet.js";

const labels = {
  title: "Mitschrift einrichten",
  mic: "Mikrofon",
  speech: "Mitschrift",
  stepsHead: "So erlaubst du es",
  retry: "Erneut anfragen",
};

/* Antwort von navigator.permissions; "unknown", wenn der Browser es nicht verrät */
const micTexts = {
  granted: "Erlaubt",
  denied: "Gesperrt",
  prompt: "Noch nicht gefragt",
  unknown: "Unbekannt",
};

/* Fehlernamen der Web Speech API, in Alltagssprache */
const problemTexts = {
  "": "Läuft",
  missing: "Dieser Browser kann nicht mitschreiben",
  "not-allowed": "Nicht erlaubt",
  "service-not-allowed": "Vom Gerät gesperrt",
  "audio-capture": "Mikrofon ist belegt",
  network: "Keine Verbindung zur Spracherkennung",
  "language-not-supported": "Deutsch ist hier nicht verfügbar",
  failed: "Klappt gerade nicht",
};

/* Was je Gerät zu tun ist — erst die Seite, dann das Gerät. */
const steps = {
  ios: [
    "Safari: in der Adressleiste auf „aA“ › Website-Einstellungen › Mikrofon › Erlauben.",
    "iPhone: Einstellungen › Apps › Safari › Mikrofon › Erlauben.",
    "Die Mitschrift läuft über die Diktierfunktion: Einstellungen › Allgemein › Tastatur › „Diktierfunktion“ einschalten.",
    "Klappt es als App vom Home-Bildschirm nicht, die Seite einmal in Safari öffnen.",
  ],
  android: [
    "Chrome: links in der Adressleiste auf das Regler-Symbol › Berechtigungen › Mikrofon › Erlauben.",
    "Android: Einstellungen › Apps › Chrome › Berechtigungen › Mikrofon › „Nur während der Nutzung“.",
    "Die Mitschrift läuft über die Google-Spracherkennung: die App „Google“ muss das Mikrofon dürfen, und es braucht Internet.",
  ],
  desktop: [
    "Im Browser links in der Adressleiste auf das Symbol der Seite › Mikrofon › Erlauben, dann neu laden.",
    "Mitschreiben können Chrome, Edge und Safari; Firefox kann es nicht.",
  ],
};

/* Zusätzlicher Hinweis, wenn genau dieser Fehler auftritt */
const problemHints = {
  "audio-capture": "Manche Android-Geräte geben das Mikrofon nur an Aufnahme oder Mitschrift. Dann bleibt der Text leer, die Aufnahme läuft trotzdem.",
  "service-not-allowed": "Das Gerät lässt die Spracherkennung nicht zu. Die Schritte unten zeigen, wo man sie einschaltet.",
};

/* Welches Gerät das ist — nicht die Fassung aus den Einstellungen, sondern das echte Telefon. */
function deviceKind() {
  const agent = navigator.userAgent;
  /* iPads melden sich als Mac, haben aber einen Touchscreen */
  if (/iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(agent)) return "android";
  return "desktop";
}

/* Darf die Seite das Mikrofon benutzen? Nicht jeder Browser beantwortet die Frage. */
async function micPermission() {
  try {
    const status = await navigator.permissions.query({ name: "microphone" });
    return status.state;
  } catch (error) {
    return "unknown";
  }
}

/**
 * Das Blatt öffnen.
 * @param speechProblem Fehler der Mitschrift ("" = läuft, siehe problemTexts)
 * @param micBlocked    ob das Mikrofon für die Aufnahme nicht aufging
 * @param retry         fragt Mikrofon und Mitschrift noch einmal an
 */
export async function openRecorderSetup({ speechProblem, micBlocked, retry }) {
  let mic = await micPermission();
  /* Ging das Mikrofon nicht auf, ist es gesperrt — auch wenn der Browser die Frage nicht beantwortet */
  if (micBlocked && mic !== "granted") mic = "denied";
  const hint = problemHints[speechProblem];
  const options = [
    { detail: true, label: labels.mic, value: micTexts[mic] || micTexts.unknown },
    { detail: true, label: labels.speech, value: problemTexts[speechProblem] ?? problemTexts.failed },
    ...(hint ? [{ note: true, label: hint }] : []),
    { heading: true, label: labels.stepsHead },
    ...steps[deviceKind()].map((step) => ({ note: true, label: step })),
    { label: labels.retry, icon: "mic", split: true, onSelect: retry },
  ];
  openSheet(labels.title, options, { icon: "settings" });
}
