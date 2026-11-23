/*
 * Die Ablageort-Pille des Eingabefelds („Eingang ▾“): welcher Name darin
 * steht und das Blatt „Ablegen in“, das sie öffnet. Eigene Datei, damit
 * composer.js unter der Zeilengrenze bleibt.
 * Pfad: src/features/composer/composer-place.js
 *
 * Keine anpassbaren visuellen Werte: die Pille selbst steht in
 * styles/composer.css, im Android-Blatt in styles/android-composer.css und
 * in „Android (Xool-DB)“ in styles/android-xool-composer.css.
 */

import { dom } from "../../core/dom.js";
import { overviewPages, typeIcon, typeSingular } from "../../data/config.js";
import { findEntry, mainPlace, parentName } from "../../data/queries.js";
import { openPlacePicker } from "../../ui/pickers.js";
import { isComposerPreset, composer } from "./composer-state.js";
import { openOverComposer } from "./composer-sheet.js";
import { renderComposerTypes } from "./composer-types.js";
import { renderWorkspaceDraft } from "./composer-workspace.js";

/* Titel eines Eintrags für Pille und Blatt; ohne Titel sein Typ. */
function entryLabel(entry) {
  return entry.title || typeSingular(entry.type);
}

/*
 * Name in der Ablageort-Pille. Kommt man von der Seite eines Eintrags, steht
 * dort dieser Eintrag: das Neue — etwa ein Foto — gehört zu ihm und erscheint
 * unter seinen „Verknüpften Einträgen“. Ein Medium ohne gewählten Ort landet
 * sonst nicht im Eingang, sondern bei den Ressourcen — `inboxEntries` in
 * src/data/queries.js siebt Medien aus. Die Pille sagt dann auch das, statt
 * einen Ort zu versprechen, an dem der Eintrag nie auftaucht.
 */
function composerPlaceName() {
  const linked = composer.link ? findEntry(composer.link) : null;
  if (linked) return entryLabel(linked);
  if (!composer.place && composer.type === "medien") return overviewPages[4].title;
  return parentName(composer.place);
}

/*
 * Die Option ganz oben im Blatt „Ablegen in“: der Eintrag, von dessen Seite
 * aus das Eingabefeld aufging. Ihn wählen heißt: verknüpfen und an seinen Ort
 * legen — so wie beim Öffnen vorgeschlagen. Einen anderen Ort wählen hebt die
 * Verknüpfung auf; das Neue liegt dann nur dort.
 */
function originOption(refresh) {
  const origin = composer.origin ? findEntry(composer.origin) : null;
  if (!origin) return null;
  return {
    label: entryLabel(origin),
    icon: typeIcon(origin.type),
    active: composer.link === origin.id,
    onSelect: () => {
      composer.link = origin.id;
      composer.place = mainPlace(origin);
      refresh();
    },
  };
}

/** Die Pille mit dem Ablageort auffrischen. */
export function renderComposerLink() {
  dom.composerLinkLabel.textContent = composerPlaceName();
  /* Angedeutet, solange dort noch der Vorschlag der Seite steht — gefüllt,
     sobald man selbst einen anderen Ort gewählt hat. */
  dom.composerLink.classList.toggle("is-preset", isComposerPreset("place"));
  /* Ein Arbeitsbereich hat keinen Ablageort: der Ort-Chip weicht */
  renderWorkspaceDraft();
}

/**
 * Die Pille anmelden: ein Tipp öffnet das Blatt „Ablegen in“.
 * @param afterPick zeichnet nach einer Wahl alles nach, was am Ort hängt.
 */
export function initComposerPlace(afterPick) {
  dom.composerLink.addEventListener("click", () => {
    const refresh = () => {
      /* Der neue Ort kann den Projekt-Knopf sperren, darum beide neu zeichnen. */
      renderComposerTypes();
      renderComposerLink();
      afterPick();
      dom.composerInput.focus();
    };
    /* Der Typ des Entwurfs kommt mit: ein Projekt bekommt nur Arbeitsbereiche
       angeboten, nie ein anderes Projekt. */
    openOverComposer(() =>
      openPlacePicker(
        "Ablegen in",
        composer.place,
        (place) => {
          composer.place = place;
          composer.link = null;
          refresh();
        },
        composer.type,
        originOption(refresh)
      )
    );
  });
}
