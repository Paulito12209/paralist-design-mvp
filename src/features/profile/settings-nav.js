/*
 * Das Untermenü der Profilseite am Desktop: links die Punkte Konto,
 * Darstellung, Navigation, Suche, Design, Analyse, Feedback, Kurzbefehle,
 * Hilfe; rechts
 * steht der Inhalt des gewählten Punkts — dieselben Karten, die am Handy
 * untereinander im Einstellungs-Blatt stehen. Am Handy gibt es kein
 * Untermenü; dort zeichnet src/features/profile/profile.js die ganze Liste.
 * Pfad: src/features/profile/settings-nav.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * panes       -> die Punkte des Untermenüs: Name, Icon und was rechts steht
 * defaultPane -> womit die Seite aufgeht (⌘, und das Konto unten links)
 *
 * Aussehen in styles/desk-settings.css.
 */

import { icon } from "../../core/html.js";
import { designCard, navigationCard, searchCard } from "./app-settings.js";
import { enterFeedback, feedbackCard } from "./feedback.js";
import { closingMarkup, identityCard, listSection } from "./profile-cards.js";
import { insightsSection } from "./settings-cards.js";
import { shortcutsMarkup } from "./shortcuts.js";
import { themeListMarkup } from "./theme.js";

export const defaultPane = "konto";

/* `render` baut den Inhalt rechts, `enter` macht den Bereich vor dem ersten Zeigen frisch. */
const panes = [
  { id: "konto", label: "Konto", icon: "person", render: () => identityCard() + listSection("Konto") + closingMarkup() },
  { id: "darstellung", label: "Darstellung", icon: "display", render: () => `<p class="psection">Darstellung</p>${themeListMarkup()}` },
  { id: "navigation", label: "Navigation", icon: "sidebar", render: () => navigationCard("Navigation") },
  { id: "suche", label: "Suche", icon: "search", render: () => searchCard("Suche") },
  { id: "design", label: "Design", icon: "image", render: () => designCard("Design") },
  { id: "analyse", label: "Analyse", icon: "trend", render: insightsSection },
  { id: "feedback", label: "Feedback", icon: "note", render: feedbackCard, enter: enterFeedback },
  { id: "kurzbefehle", label: "Kurzbefehle", icon: "sliders", render: shortcutsMarkup },
  { id: "hilfe", label: "Hilfe", icon: "help", render: () => listSection("Support") + listSection("Mehr") },
];

function paneOf(id) {
  return panes.find((pane) => pane.id === id) || panes.find((pane) => pane.id === defaultPane);
}

/** Gibt es diesen Punkt? Sonst gilt `defaultPane`. */
export function isPane(id) {
  return panes.some((pane) => pane.id === id);
}

/** Vor dem Zeigen eines Punkts: sein Bereich darf sich frisch machen (Feedback-Formular). */
export function enterPane(id) {
  paneOf(id).enter?.();
}

/** Der Inhalt rechts zum gewählten Punkt. */
export function paneMarkup(id) {
  return paneOf(id).render();
}

/** Das Untermenü; der gewählte Punkt ist markiert. */
export function settingsNavMarkup(current) {
  return panes
    .map((pane) => {
      const chosen = pane.id === paneOf(current).id;
      return `
        <button class="settings-nav-item${chosen ? " is-active" : ""}" type="button" data-settings-pane="${pane.id}"${chosen ? ' aria-current="page"' : ""}>
          ${icon(pane.icon)}<span>${pane.label}</span>
        </button>`;
    })
    .join("");
}
