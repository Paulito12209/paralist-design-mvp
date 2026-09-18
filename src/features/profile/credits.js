/*
 * Die Danksagungs-Seite hinter „Support → Danksagungen“ im Einstellungs-Blatt.
 * Eine ruhige Seite ohne Bedienelemente: ein Dank, zwei Absätze, die Namen,
 * um die es geht, und ein Schlusssatz.
 * Pfad: src/features/profile/credits.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * credits.lead   -> die große Zeile ganz oben
 * credits.body   -> die Absätze darüber, wem gedankt wird (ein Eintrag = ein Absatz)
 * credits.people -> die Namen, die jeweils als eigene Zeile erscheinen
 * credits.close  -> der Satz unter den Namen
 *
 * Farben, Rundungen und Abstände stehen in styles/support.css.
 */

import { escapeHtml, icon } from "../../core/html.js";

const credits = {
  lead: "Danke.",
  body: [
    "An meine Mutter und an meine Freunde — dafür, dass ihr da wart, als das hier noch nichts als eine Idee war.",
    "Und vor allem an meine Familie:",
  ],
  people: ["Katja", "David", "Marina", "Tavara"],
  close:
    "Ihr seid für mich die größte Motivation, am Ball zu bleiben und meine Energie dafür einzusetzen, eure Zukunft eines Tages ein Stück besser zu machen.",
};

/** Die ganze Seite. */
export function creditsCard() {
  const body = credits.body.map((line) => `<p class="credits-body">${escapeHtml(line)}</p>`).join("");
  const people = credits.people.map((name) => `<li class="credits-person">${escapeHtml(name)}</li>`).join("");

  return `
    <section class="credits">
      <span class="credits-mark">${icon("smile")}</span>
      <h2 class="credits-lead">${escapeHtml(credits.lead)}</h2>
      ${body}
      <ul class="credits-people">${people}</ul>
      <p class="credits-close">${escapeHtml(credits.close)}</p>
    </section>
  `;
}
