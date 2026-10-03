/*
 * Die Erklärung auf der Seite „Serie“: was gemessen wird, wann ein Tag zählt,
 * was „aktuell“ und „längste“ heißt, wofür die Serie da ist und wie man das
 * Punkte-Raster liest. Steht unter dem Raster in derselben Karte
 * (src/ui/usage-pages.js).
 * Pfad: src/ui/streak-legend.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * legendItems -> die Absätze: Überschrift und Text je Punkt (Wortlaut ändern
 *                heißt hier den Text ersetzen)
 * scaleLevels -> wie viele Beispielpunkte die Skala „wenig … viel“ zeigt
 *                (soll zu dotLevels in src/ui/usage-pages.js passen, plus der
 *                graue Punkt für „keine Nutzung“)
 *
 * Farben und Abstände: styles/streak-legend.css.
 */

import { dayMonth } from "../core/format.js";

const scaleLevels = [0, 1, 2, 3, 4];

const legendItems = [
  {
    term: "Was gemessen wird",
    text: "Wie viele Tage hintereinander du Paralist benutzt hast. Ein Tag zählt, sobald die App an ihm sichtbar geöffnet war – schon kurz reicht. Zeit im Hintergrund zählt nicht.",
  },
  {
    term: "Aktuelle Serie",
    text: "Die Tage in Folge bis heute. Hast du heute noch nicht geöffnet, läuft sie bis gestern weiter und reißt erst, wenn der Tag ohne Öffnen vorbei ist. Ein ausgelassener Tag setzt sie auf 0 zurück.",
  },
  {
    term: "Längste Serie",
    text: (since) => `Die längste Kette von Tagen in Folge, die du je geschafft hast – gezählt seit dem ${since}, ab da misst die App. Sie bleibt stehen, auch wenn die aktuelle Serie reißt.`,
  },
  {
    term: "Wofür das Ganze",
    text: "Die Serie zeigt Regelmäßigkeit, nicht Leistung. Wie lange du am Tag drin warst, spielt keine Rolle. Sie soll helfen, Paralist zur täglichen Gewohnheit zu machen.",
  },
];

/**
 * Der Erklärblock samt Skala für das Punkte-Raster.
 * @param since Beginn der Aufzeichnung (Zeitstempel).
 * @param year Jahr, das das Raster zeigt.
 */
export function streakLegend(since, year) {
  const items = legendItems
    .map((item) => {
      const text = typeof item.text === "function" ? item.text(dayMonth(since)) : item.text;
      return `<div class="streak-legend-item"><p class="streak-legend-term">${item.term}</p><p class="streak-legend-text">${text}</p></div>`;
    })
    .join("");
  const scale = scaleLevels.map((level) => `<span class="dot is-l${level}"></span>`).join("");
  return `
    <div class="streak-legend">
      ${items}
      <div class="streak-legend-item">
        <p class="streak-legend-term">So liest du das Raster</p>
        <p class="streak-legend-text">Jeder Punkt ist ein Wochentag in einem Monat von ${year}: Zeilen von Montag bis Sonntag, Spalten von Januar bis Dezember. Je kräftiger der Punkt, desto mehr Zeit warst du an diesen Tagen zusammen in der App – gemessen am stärksten Punkt des Jahres.</p>
        <div class="streak-scale"><span>keine</span>${scale}<span>viel</span></div>
      </div>
    </div>
  `;
}
