/*
 * Der Platzhalter für eine leere Liste oder Sammlung: ein farbiges Emblem aus
 * gestapelten Karten mit dem Icon des jeweiligen Themas, darunter eine
 * Überschrift, ein Satz Erklärung und eine Pille zum Anlegen. Statt einer
 * grauen Zeile „Noch keine Einträge“ sagt die Seite so, was hier hingehört.
 * Pfad: src/ui/empty-state.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ART_BOX       -> Zeichenfläche des Emblems (Seitenverhältnis der Grafik)
 * SHEET_TINT    -> wie kräftig die beiden hinteren Karten eingefärbt sind
 * WAVE_TINT     -> wie hell die Welle auf der vorderen Karte liegt
 * MARK_OPACITY  -> Deckkraft der gezeichneten Striche links und rechts oben
 *
 * Größe, Farben und Abstände stehen in styles/empty-state.css
 * (--empty-art-width, --empty-accent, --empty-badge-bg, --empty-badge-ink).
 */

import { escapeHtml, icon } from "../core/html.js";

/* Zeichenfläche der Grafik. Breite und Höhe bestimmen nur das Seitenverhältnis —
   wie groß das Emblem wirklich wird, sagt --empty-art-width in der CSS-Datei. */
const ART_BOX = { width: 140, height: 116 };

/* Deckkraft der beiden hinteren Karten: kleiner = blasser gestapelt. */
const SHEET_TINT = { back: 0.32, middle: 0.55 };

/* Deckkraft der hellen Welle auf der vorderen Karte. */
const WAVE_TINT = 0.22;

/* Deckkraft der beiden gezeichneten Striche (Pfeil links, Funken rechts). */
const MARK_OPACITY = 0.5;

/*
 * Das Emblem: zwei angedeutete Karten hinten, vorne ein Ordner in der Farbe des
 * Themas. Das Plus-Abzeichen oben rechts kommt nur dazu, wenn es hier auch
 * etwas anzulegen gibt — sonst verspricht das Bild etwas, was der Block nicht
 * hält. svg/path/rect/circle: reine Grafik, die es als HTML-Element nicht gibt.
 */
function emblemMarkup(withBadge) {
  return `
    <svg class="empty-emblem" viewBox="0 0 ${ART_BOX.width} ${ART_BOX.height}" aria-hidden="true">
      <rect x="40" y="10" width="76" height="44" rx="12" fill="var(--empty-accent)" fill-opacity="${SHEET_TINT.back}" />
      <rect x="28" y="22" width="88" height="46" rx="12" fill="var(--empty-accent)" fill-opacity="${SHEET_TINT.middle}" />
      <path
        d="M18 48a12 12 0 0 1 12-12h24l9 11h49a12 12 0 0 1 12 12v38a12 12 0 0 1-12 12H30a12 12 0 0 1-12-12Z"
        fill="var(--empty-accent)"
      />
      <path
        d="M18 84c13-9 25 4 38-1s26-9 38-3 19 3 30-3v20a12 12 0 0 1-12 12H30a12 12 0 0 1-12-12Z"
        fill="#ffffff"
        fill-opacity="${WAVE_TINT}"
      />
      ${
        withBadge
          ? `<circle cx="120" cy="44" r="14" fill="var(--empty-badge-bg)" />
             <path d="M120 37v14M113 44h14" stroke="var(--empty-badge-ink)" stroke-width="2.4" stroke-linecap="round" />`
          : ""
      }
      <g
        fill="none"
        stroke="var(--muted)"
        stroke-width="2"
        stroke-linecap="round"
        opacity="${MARK_OPACITY}"
      >
        <path d="M6 10c6 9 13 12 21 11" />
        <path d="M23 15l4 6-6 2" />
        <path d="M133 14l-5 6M137 25l-7 1M127 5l-1 7" />
      </g>
    </svg>
  `;
}

/*
 * Ein Platzhalter für eine leere Liste.
 *
 * @param options.icon    Name des Icons auf der vorderen Karte, z.B. "inbox".
 * @param options.accent  Farbe des Emblems, am besten eine Variable aus tokens.css.
 * @param options.title   Überschrift, kurz und in Alltagssprache.
 * @param options.text    Ein Satz darunter; ohne Text bleibt die Zeile weg.
 * @param options.action  { label, pick } für die Pille zum Anlegen; ohne Angabe keine Pille.
 *                        `pick` ist der Typ, den das Eingabefeld vorwählt ("aufgabe",
 *                        "projekt" …). Ohne `pick` bleibt es bei dem, was die Seite
 *                        ohnehin vorschlägt — die Pille ist dann reine Abkürzung.
 * @param options.data    Fertiges data-Attribut statt `action.pick`, wenn ein
 *                        Bereich den Knopf selbst behandelt (Medien: Datei wählen).
 * @param options.compact Kleineres Emblem ohne Erklärtext — für Platzhalter
 *                        innerhalb einer Karte oder eines Abschnitts.
 * @param options.art     Auf false weglassen: nur Titel (und Text), ohne Emblem —
 *                        für Platzhalter, die dicht neben anderen Abschnitten stehen
 *                        (Übersicht der allgemeinen Suche).
 */
export function emptyState({
  icon: iconName,
  accent,
  title,
  text = "",
  action = null,
  data = "",
  compact = false,
  art = true,
}) {
  const pill = action
    ? `<button class="empty-add" type="button" ${data || `data-empty-add="${action.pick || ""}"`}>
        ${icon("plus", "empty-add-icon")}<span>${escapeHtml(action.label)}</span>
      </button>`
    : "";

  return `
    <div class="empty-state${compact ? " is-compact" : ""}${art ? "" : " is-bare"}" style="--empty-accent:${accent}">
      ${
        art
          ? `<div class="empty-art">
        ${emblemMarkup(Boolean(action))}
        ${icon(iconName, "empty-emblem-icon")}
      </div>`
          : ""
      }
      <p class="empty-title">${escapeHtml(title)}</p>
      ${text && !compact ? `<p class="empty-text">${escapeHtml(text)}</p>` : ""}
      ${pill}
    </div>
  `;
}
