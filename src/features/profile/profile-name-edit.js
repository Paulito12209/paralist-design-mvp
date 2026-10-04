/*
 * Den Namen im Profilkopf direkt bearbeiten: ein Tipp auf den Namen macht ihn
 * zum Eingabefeld, der Cursor steht hinter dem letzten Buchstaben. Gespeichert
 * wird nach Material Design: Haken-Knopf rechts oder Enter bzw. Wegtippen
 * speichert, Kreuz-Knopf rechts oder Esc verwirft. Ein leerer Name oder der
 * Platzhalter bringt „Dein Name“ zurück. Die Zeile „Name“ unter „Persönliche
 * Daten“ (account-personal.js) schreibt in dieselbe Angabe.
 * Pfad: src/features/profile/profile-name-edit.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * Keine anpassbaren visuellen Werte hier — Größe der Knöpfe, Linie und Farbe
 * stehen in styles/profile-name-edit.css (Werte in styles/tokens-pages.css).
 * Platzhalter und längste Eingabe stehen in src/data/profile.js.
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import { noHistoryForm } from "../../core/no-history.js";
import { account } from "../../data/account.js";
import { defaultName, setProfileField, shownName } from "../../data/profile.js";

/* Die Knöpfe rechts neben dem Feld: Verwerfen links, Speichern ganz rechts, wie bei Material-Textfeldern. */
function actionsMarkup() {
  return `
    <button class="profile-name-btn" type="button" data-name-cancel="1" aria-label="Verwerfen">${icon("close")}</button>
    <button class="profile-name-btn is-save" type="button" data-name-save="1" aria-label="Speichern">${icon("check")}</button>`;
}

/* Den Namen wieder als Text zeigen und die Initialen im runden Bild nachziehen (sofern dort kein Foto steht). */
function showText(head) {
  head.classList.remove("is-editing");
  head.innerHTML = escapeHtml(shownName());
  document.querySelectorAll(".profile-avatar").forEach((avatar) => {
    if (!avatar.querySelector("img")) avatar.textContent = account.initials;
  });
}

/* Beenden: speichern oder verwerfen. `done` verhindert, dass Blur und Klick beide schreiben. */
function finish(head, input, save) {
  if (input.dataset.done) return;
  input.dataset.done = "1";
  if (save) {
    const value = input.value.trim();
    /* Der unveränderte Platzhalter bleibt „kein Name“, sonst stünde er als eigener Name im Speicher */
    setProfileField("name", value === defaultName ? "" : value);
    /* Seitenleiste am Desktop und alle anderen Stellen mit dem Namen zeichnen sich neu */
    emit(events.dataChanged);
  }
  showText(head);
}

function startEdit(head) {
  head.classList.add("is-editing");
  head.innerHTML = `
    <input class="profile-name-input" type="text" inputmode="text" form="${noHistoryForm}" enterkeyhint="done"
      value="${escapeHtml(shownName())}" placeholder="${escapeHtml(defaultName)}" aria-label="Name" />
    ${actionsMarkup()}`;
  const input = head.querySelector(".profile-name-input");
  /* pressing: ein Tipp auf die Knöpfe nimmt dem Feld zuerst den Fokus — das darf nicht schon speichern */
  const release = () => delete head.dataset.pressing;
  head.querySelectorAll(".profile-name-btn").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      head.dataset.pressing = "1";
      /* preventDefault: das Feld behält den Fokus, die Tastatur bleibt offen */
      event.preventDefault();
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
  });
  input.addEventListener("blur", () => {
    if (!head.dataset.pressing) finish(head, input, true);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finish(head, input, true);
    if (event.key === "Escape") finish(head, input, false);
  });
  input.focus();
  /* Cursor ans Ende: ein Tipp markiert sonst je nach Gerät alles oder setzt ihn an den Anfang */
  input.setSelectionRange(input.value.length, input.value.length);
}

/** Tipp auf den Namen oder auf einen seiner Knöpfe. Gibt true zurück, wenn er hierher gehörte. */
export function onNameClick(event) {
  const head = event.target.closest("[data-name-edit]");
  if (!head) return false;
  const input = head.querySelector(".profile-name-input");
  if (!input) {
    startEdit(head);
    return true;
  }
  if (event.target.closest("[data-name-save]")) finish(head, input, true);
  else if (event.target.closest("[data-name-cancel]")) finish(head, input, false);
  return true;
}
