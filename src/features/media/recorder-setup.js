/*
 * „Mikrofon erlauben“: das Mikrofon-Symbol oben rechts in der Audio-Aufnahme.
 * Das Blatt erklärt nur: ob das Mikrofon erlaubt ist und wo man es am eigenen
 * Gerät erlaubt. Eine Webseite darf die Einstellungen von Telefon oder
 * Browser nicht selbst öffnen; deshalb stehen hier die Schritte. In der
 * Android-App tritt an ihre Stelle ein Knopf „Einstellungen öffnen“
 * (Settings.ACTION_APPLICATION_DETAILS_SETTINGS), der direkt zu den
 * Berechtigungen der App springt.
 * Benutzt von src/features/media/recorder.js.
 * Pfad: src/features/media/recorder-setup.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * micTexts -> was beim Mikrofon steht, je Antwort des Browsers
 * steps    -> die Schritte zum Erlauben, je Gerät (iPhone, Android, Computer)
 *
 * Aussehen des Blatts: styles/overlays.css (.sheet-detail, .sheet-note).
 */

import { openSheet } from "../../ui/sheet.js";

const labels = {
  title: "Mikrofon erlauben",
  mic: "Mikrofon",
  stepsHead: "So erlaubst du es",
};

/* Antwort von navigator.permissions; "unknown", wenn der Browser es nicht verrät */
const micTexts = {
  granted: "Erlaubt",
  denied: "Gesperrt",
  prompt: "Noch nicht gefragt",
  unknown: "Unbekannt",
};

/* Was je Gerät zu tun ist — erst die Seite, dann das Gerät. */
const steps = {
  ios: [
    "Safari: in der Adressleiste auf „aA“ › Website-Einstellungen › Mikrofon › Erlauben.",
    "iPhone: Einstellungen › Apps › Safari › Mikrofon › Erlauben.",
    "Klappt es als App vom Home-Bildschirm nicht, die Seite einmal in Safari öffnen.",
  ],
  android: [
    "Chrome: links in der Adressleiste auf das Regler-Symbol › Berechtigungen › Mikrofon › Erlauben.",
    "Als App vom Startbildschirm gilt die Berechtigung von Chrome: Android-Einstellungen › Apps › Chrome › Berechtigungen › Mikrofon › „Jedes Mal fragen“ oder „Nur während der Nutzung“. Danach unten links auf das Mikrofon tippen — Chrome stellt dann seine Frage.",
    "Hat Chrome die Seite blockiert: Chrome › ⋮ › Einstellungen › Website-Einstellungen › Mikrofon › die Seite aus „Blockiert“ entfernen.",
  ],
  desktop: ["Im Browser links in der Adressleiste auf das Symbol der Seite › Mikrofon › Erlauben, dann neu laden."],
};

/**
 * Welches Gerät das ist — nicht die Fassung aus den Einstellungen, sondern das
 * echte Telefon: "ios", "android" oder "desktop". Danach richten sich die Schritte.
 */
function deviceKind() {
  const agent = navigator.userAgent;
  const touch = navigator.maxTouchPoints > 1;
  /* iPads melden sich als Mac, haben aber einen Touchscreen */
  if (/iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && touch)) return "ios";
  /* Mit „Desktop-Website anfordern“ nennt sich Chrome für Android nur „Linux“ — dann verrät es
     der Touchscreen; die Plattform-Angabe der neueren Browser ist eindeutig */
  const platform = navigator.userAgentData ? navigator.userAgentData.platform : "";
  if (platform === "Android" || /Android/.test(agent) || (/Linux/.test(agent) && touch)) return "android";
  return "desktop";
}

/** Darf die Seite das Mikrofon benutzen? "granted", "denied", "prompt" — oder "unknown", wenn der Browser es nicht verrät. */
export async function micPermission() {
  try {
    const status = await navigator.permissions.query({ name: "microphone" });
    return status.state;
  } catch (error) {
    return "unknown";
  }
}

/**
 * Das Blatt öffnen.
 * @param micBlocked ob das Mikrofon für die Aufnahme nicht aufging
 */
export async function openRecorderSetup({ micBlocked }) {
  let mic = await micPermission();
  /* Ging das Mikrofon nicht auf, ist es gesperrt — auch wenn der Browser die Frage nicht beantwortet */
  if (micBlocked && mic !== "granted") mic = "denied";
  openSheet(labels.title, [
    { detail: true, label: labels.mic, value: micTexts[mic] || micTexts.unknown },
    { heading: true, label: labels.stepsHead },
    ...steps[deviceKind()].map((step) => ({ note: true, label: step })),
  ]);
}
