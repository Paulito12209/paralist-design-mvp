/*
 * Die Level-Anzeige oben links: ein runder Knopf mit einer Strich-Skala, die
 * den Fortschritt bis zur nächsten Stufe zeigt. Ein Tipp öffnet das
 * Fortschritt-Blatt.
 * Pfad: src/shell/level-gauge.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tickCount    -> wie viele Striche die Skala hat
 * arcDegrees   -> über wie viele Grad sich die Skala zieht (Lücke unten)
 * arcStart     -> bei welchem Winkel sie beginnt
 * innerRadius / outerRadius -> Anfang und Ende eines Strichs
 *
 * Farben stehen in styles/top-bar.css (--level-color, --level-dim, --level-glow).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { formatNumber } from "../core/format.js";
import { load } from "../core/lazy.js";
import { levelInfo, totalXp } from "../data/xp.js";
import { showToast } from "../ui/toast.js";

/*
 * Welche Stufe zuletzt zu sehen war. Steigt sie, gibt es dafür eine kurze
 * Meldung — sonst bliebe ein Stufenaufstieg ganz unbemerkt, die Anzeige oben
 * links springt ja nur um eine Zahl weiter. Beim ersten Zeichnen steht hier
 * noch `null`: der Start der App ist kein Aufstieg.
 */
let shownLevel = null;

const tickCount = 36;
const arcDegrees = 270;
const arcStart = 135;
const center = 24;
const innerRadius = 18.5;
const outerRadius = 22.5;

/** Die Skala neu zeichnen. */
export function renderLevel() {
  const xp = totalXp();
  const info = levelInfo(xp);
  const lit = Math.round(info.progress * tickCount);

  let ticks = "";
  for (let n = 0; n < tickCount; n += 1) {
    const angle = ((arcStart + (arcDegrees / (tickCount - 1)) * n) * Math.PI) / 180;
    const x1 = center + Math.cos(angle) * innerRadius;
    const y1 = center + Math.sin(angle) * innerRadius;
    const x2 = center + Math.cos(angle) * outerRadius;
    const y2 = center + Math.sin(angle) * outerRadius;
    ticks += `<line class="level-tick${n < lit ? " is-on" : ""}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" />`;
  }

  dom.levelGauge.innerHTML = `${ticks}
    <text class="level-num" x="24" y="27.5" text-anchor="middle">${info.level}</text>
    <text class="level-label" x="24" y="42.5" text-anchor="middle">Lv.</text>`;

  dom.levelBtn.setAttribute(
    "aria-label",
    `Stufe ${info.level}, ${formatNumber(xp)} XP. Fortschritt öffnen`
  );

  if (shownLevel !== null && info.level > shownLevel) {
    showToast({
      icon: "star",
      accent: "var(--star-color)",
      title: `Stufe ${info.level} erreicht`,
      /* Keine Punktzahl daneben: dort steht sonst der Gesamtstand in der Farbe,
         die beim Anlegen einen Zugewinn meint — „300 XP“ läse sich wie „+300“.
         Wer es genau wissen will, tippt auf „Fortschritt“. */
      action: { label: "Fortschritt", onSelect: () => load("progress").then((module) => module.open()) },
    });
  }
  shownLevel = info.level;
}

/** Den Knopf anmelden; das Fortschritt-Blatt wird beim ersten Tippen nachgeladen. */
export function initLevelGauge() {
  dom.levelBtn.addEventListener("click", () => {
    load("progress").then((module) => module.open());
  });
  on(events.xpChanged, renderLevel);
  renderLevel();
}
