/*
 * Die Icons liegen gesammelt in assets/icons/sprite.svg. Der Ladevorgang
 * startet schon in index.html, damit die Icons ohne Verzögerung da sind;
 * hier wird die Sammlung in die Seite gehängt, sodass `<use href="#icon-…">`
 * sie findet.
 * Pfad: src/shell/sprite.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * spritePath -> wo die Icon-Sammlung liegt (muss zu index.html passen)
 *
 * Die Icons selbst stehen in assets/icons/sprite.svg.
 */

const spritePath = "assets/icons/sprite.svg";

/* Den Text der Sammlung holen; `null`, wenn es nicht geklappt hat. */
async function fetchSprite() {
  try {
    const response = await fetch(spritePath);
    return response.ok ? await response.text() : null;
  } catch (error) {
    return null;
  }
}

/** Die Sammlung in die Seite hängen. Ein zweiter Aufruf tut nichts. */
export async function mountSprite() {
  if (document.getElementById("icon-sprite")) return;

  /* index.html hat den Ladevorgang bereits gestartet und hier abgelegt.
     Ist er fehlgeschlagen, wird es einmal erneut versucht — der
     Entwicklungsserver lässt unter vielen gleichzeitigen Anfragen
     gelegentlich eine fallen. */
  let markup = await (window.__paralistSprite || Promise.resolve(null));
  if (!markup) markup = await fetchSprite();
  /* Ohne Sammlung bleiben die Flächen der Icons leer; die App bleibt bedienbar. */
  if (!markup) return;

  const holder = document.createElement("div");
  holder.id = "icon-sprite";
  /* hidden: ohne das wäre die Sammlung sichtbar und würde Platz belegen */
  holder.hidden = true;
  holder.innerHTML = markup;
  document.body.insertBefore(holder, document.body.firstChild);
}
