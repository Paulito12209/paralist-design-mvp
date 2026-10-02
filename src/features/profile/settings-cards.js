/*
 * Die Abschnitte „Analyse“ (nur Desktop) und „Darstellung“ im Einstellungs-Blatt und die Angabe, welche
 * große Seite hinter welchem Schlüssel liegt — Navigation, Suche, Design und
 * Tabs unter „App“, die Kontoeinstellungen, die Feedback- und Danksagungs-Seite
 * und die Versionen unter „Mehr“, am Desktop auch Nutzungszeit und Serie. Am
 * Handy liegen diese beiden im Fortschritt (src/features/progress/progress.js).
 * Pfad: src/features/profile/settings-cards.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * details     -> welche große Seite hinter welcher Zeile steckt; `title` steht
 *                dort oben neben dem Pfeil
 *
 * Größen und Farben der Zeilen stehen in styles/settings.css.
 */

import { insightsSection as insightTiles } from "../../ui/insight-tiles.js";
import { streakCard, usageCard } from "../../ui/usage-pages.js";
import { accountCard } from "./account.js";
import { designCard, navigationCard, searchCard, tabsCard } from "./app-settings.js";
import { creditsCard, startCreditsVideo } from "./credits.js";
import { enterFeedback, feedbackCard } from "./feedback.js";
import { themeListMarkup } from "./theme.js";
import { versionsCard } from "./versions.js";

/** Der Abschnitt „Analyse“ (nur am Desktop; am Handy steht er im Fortschritt): die beiden Kacheln. */
export function insightsSection() {
  return insightTiles("data-settings-detail");
}

/** Der Abschnitt „Darstellung“: Überschrift und die drei Zeilen Hell, Dunkel, System. */
export function appearanceSection() {
  return `<p class="psection">Darstellung</p>${themeListMarkup()}`;
}

/*
 * Was hinter den Zeilen steckt: die volle Seite, das
 * Stück für die Adresse und — wenn nötig — was beim Öffnen zurückgesetzt wird.
 */
const details = {
  usage: { hash: "nutzungszeit", title: "Nutzungszeit", card: usageCard },
  streak: { hash: "serie", title: "Serie", card: streakCard },
  feedback: { hash: "feedback", title: "Feedback", card: feedbackCard, enter: enterFeedback },
  navigation: { hash: "navigation", title: "Navigation", card: () => navigationCard() },
  search: { hash: "suche", title: "Suche", card: () => searchCard() },
  design: { hash: "design", title: "Design", card: () => designCard() },
  tabs: { hash: "tabs", title: "Tabs", card: () => tabsCard() },
  account: { hash: "konto", title: "Kontoeinstellungen", card: accountCard },
  versions: { hash: "versionen", title: "Versionen", card: versionsCard },
  credits: { hash: "danksagungen", title: "Danksagungen", card: creditsCard, settle: startCreditsVideo },
};

/** Gibt es zu diesem Schlüssel eine große Ansicht? */
export function isDetail(key) {
  return Boolean(details[key]);
}

/** Beim Öffnen einer Seite: ihr Bereich darf sich vorher frisch machen. */
export function enterDetail(key) {
  details[key]?.enter?.();
}

/** Nach dem Zeichnen: was erst mit fertigen Elementen geht (der Film im Dank). */
export function settleDetail(key) {
  details[key]?.settle?.();
}

/** Der Name einer Unterseite — in der Android-Fassung steht er in der Kopfleiste. */
export function detailTitle(key) {
  return details[key] ? details[key].title : "";
}

/** Das Stück Adresse hinter „#/einstellungen/“. */
export function detailHash(key) {
  return details[key] ? details[key].hash : "";
}

/**
 * Die große Ansicht einer Kachel: mittig der Name der Seite, darunter die
 * volle Karte. Zurück geht es über den Pfeil oben im Blattkopf.
 */
export function detailMarkup(key) {
  const detail = details[key];
  if (!detail) return "";
  return `
    <h3 class="settings-detail-title">${detail.title}</h3>
    ${detail.card()}
  `;
}
