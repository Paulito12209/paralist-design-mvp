/*
 * Die Danksagungs-Seite hinter „Support → Danksagungen“ im Einstellungs-Blatt.
 * Eine ruhige Seite ohne Bedienelemente: oben ein kurzer Film, darunter der
 * Dank, zwei Absätze, die Namen, um die es geht, und ein Schlusssatz.
 * Pfad: src/features/profile/credits.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * credits.lead   -> die große Zeile ganz oben
 * credits.body   -> die Absätze darüber, wem gedankt wird (ein Eintrag = ein Absatz)
 * credits.people -> die Namen, die jeweils als eigene Zeile erscheinen
 * credits.close  -> der Satz unter den Namen
 * clip.src       -> der Film ganz oben auf der Seite
 * clip.poster    -> das Standbild davor und nachher
 * clip.speed     -> Tempo des Films (1 = normal, 0.8 = etwas langsamer)
 *
 * Farben, Rundungen und Abstände stehen in styles/support.css.
 */

import { escapeHtml } from "../../core/html.js";

const credits = {
  lead: "Danke.",
  body: [
    "An meine Mutter und an meine Freunde — dafür, dass ihr da wart, als das hier noch nichts als eine Idee war.",
    "Und vor allem an meine folgenden Familienangehörigen:",
  ],
  people: ["Katja", "David", "Marina", "Tavara"],
  close:
    "Ihr seid für mich die größte Motivation, am Ball zu bleiben und meine Energie dafür einzusetzen, eure Zukunft eines Tages ein Stück besser zu machen.",
};

const clip = {
  src: "assets/media/danke.mp4",
  poster: "assets/media/danke.jpg",
  speed: 0.8,
};

/** Die ganze Seite. */
export function creditsCard() {
  const body = credits.body.map((line) => `<p class="credits-body">${escapeHtml(line)}</p>`).join("");
  const people = credits.people.map((name) => `<li class="credits-person">${escapeHtml(name)}</li>`).join("");

  return `
    <section class="credits">
      ${clipMarkup()}
      <h2 class="credits-lead">${escapeHtml(credits.lead)}</h2>
      ${body}
      <ul class="credits-people">${people}</ul>
      <p class="credits-close">${escapeHtml(credits.close)}</p>
    </section>
  `;
}

/*
 * video: der Dank beginnt mit einem kurzen Film. muted + playsinline, damit er
 * auch am Handy von allein anläuft; ohne `controls` und ohne Mauszeiger
 * (styles/support.css) gibt es keinen Weg, den Ton einzuschalten. `poster`
 * steht davor und nach dem Ende wieder da — der Film läuft genau einmal.
 */
function clipMarkup() {
  return `<video class="credits-clip" src="${clip.src}" poster="${clip.poster}" muted playsinline preload="metadata"></video>`;
}

/**
 * Nach dem Zeichnen: den Film in seinem Tempo anwerfen. Das geht erst hier,
 * weil `playbackRate` ein Element braucht, das schon auf der Seite steht.
 */
export function startCreditsVideo() {
  const video = document.querySelector(".credits-clip");
  if (!video) return;
  video.muted = true;
  video.playbackRate = clip.speed;
  /* Zurück auf das Standbild, sobald der Film durch ist. */
  video.addEventListener("ended", () => video.load(), { once: true });
  /* play() wird abgewiesen, wenn der Browser noch keine Geste gesehen hat —
     dann bleibt eben das Standbild stehen, das ist kein Fehler. */
  video.play().catch(() => {});
}
