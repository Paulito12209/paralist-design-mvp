/*
 * Das Mikrofon neben der Suchen-Pille: gesprochenes Wort landet im Suchfeld.
 * Im Browser übernimmt das die eingebaute Spracherkennung; kann der Browser
 * das nicht, sagt eine kurze Meldung Bescheid, statt dass nichts passiert.
 * In der späteren Android-App tritt an diese Stelle die Spracheingabe des
 * Geräts — die Knöpfe und der Ablauf bleiben dieselben.
 * Pfad: src/shell/search-voice.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * speechLang -> Sprache, auf die das Zuhören eingestellt ist
 *
 * Das Aussehen des Knopfes steht in styles/search.css (.search-combo-btn,
 * .search-combo-btn.is-listening).
 */

import { dom } from "../core/dom.js";
import { showToast } from "../ui/toast.js";

const speechLang = "de-DE";

/* Die Spracherkennung heißt je nach Browser anders; ohne beide gibt es sie nicht. */
function speechApi() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/* Das Gesagte ins Suchfeld schreiben, als hätte man es getippt. */
function fillInput(text) {
  dom.searchInput.value = text;
  dom.searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  dom.searchInput.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Das Mikrofon anmelden. Ein Tipp startet das Zuhören, der nächste beendet es.
 * @param button Der runde Knopf mit dem Mikrofon.
 */
export function initSearchVoice(button) {
  const Recognition = speechApi();
  let listening = null;

  button.addEventListener("click", () => {
    if (listening) {
      listening.stop();
      return;
    }

    if (!Recognition) {
      showToast({
        icon: "mic",
        title: "Sprechen geht hier nicht",
        note: "Dieser Browser kann noch nicht zuhören. Tipp die Suche bitte ein.",
      });
      return;
    }

    const recognition = new Recognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;

    recognition.addEventListener("result", (event) => {
      const said = event.results[0] && event.results[0][0] ? event.results[0][0].transcript.trim() : "";
      if (said) fillInput(said);
    });

    recognition.addEventListener("end", () => {
      listening = null;
      button.classList.remove("is-listening");
    });

    recognition.addEventListener("error", () => {
      showToast({
        icon: "mic",
        title: "Nichts verstanden",
        note: "Versuch es noch einmal oder tipp die Suche ein.",
      });
    });

    listening = recognition;
    button.classList.add("is-listening");
    recognition.start();
  });
}
