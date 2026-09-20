/*
 * Der runde Pfeil unten rechts in einem Blatt: hat man weit nach unten gerollt,
 * taucht er auf und bringt einen mit einer weichen Bewegung wieder ganz nach oben.
 * Gilt für jedes Blatt von unten (Einstellungen, Fortschritt, Profilbild).
 * Pfad: src/ui/modal-top.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * showFrom -> ab wie vielen gerollten Pixeln der Pfeil erscheint
 *
 * Aussehen und Größe des Knopfes: styles/modal-top.css
 */

const showFrom = 240;

/** Den Pfeil des Blatts holen; beim ersten Rollen entsteht er. */
function buttonFor(body) {
  const panel = body.closest(".modal");
  if (!panel) return null;
  const found = panel.querySelector(".modal-top");
  if (found) return found;

  const button = document.createElement("button");
  button.className = "modal-top";
  button.type = "button";
  button.setAttribute("aria-label", "Nach oben");
  /* svg/use: holt den Pfeil aus der gemeinsamen Icon-Sammlung assets/icons/sprite.svg */
  button.innerHTML = '<svg class="icon"><use href="#icon-back"></use></svg>';
  button.addEventListener("click", () => {
    /* behavior smooth: der Inhalt gleitet nach oben, statt zu springen */
    body.scrollTo({ top: 0, behavior: "smooth" });
  });
  panel.appendChild(button);
  return button;
}

function onScroll(event) {
  const body = event.target;
  if (!(body instanceof HTMLElement) || !body.classList.contains("modal-body")) return;
  const button = buttonFor(body);
  if (button) button.classList.toggle("is-visible", body.scrollTop > showFrom);
}

/** Den Pfeil für alle Blätter aktivieren. Wird einmal beim Start aufgerufen. */
export function initModalTop() {
  /* capture: Roll-Ereignisse steigen nicht auf, in der Erfassungsphase kommen sie trotzdem an */
  document.addEventListener("scroll", onScroll, true);
}
