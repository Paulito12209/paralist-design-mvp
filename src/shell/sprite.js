/*
 * Die Icons liegen gesammelt in assets/icons/sprite.svg. Der Ladevorgang
 * startet schon in index.html, damit die Icons ohne Verzögerung da sind;
 * hier wird die Sammlung in die Seite gehängt, sodass `<use href="#icon-…">`
 * sie findet.
 * Pfad: src/shell/sprite.js
 *
 * Keine anpassbaren visuellen Werte: die Icons selbst stehen in
 * assets/icons/sprite.svg.
 */

/** Die Sammlung in die Seite hängen. Ein zweiter Aufruf tut nichts. */
export async function mountSprite() {
  if (document.getElementById("icon-sprite")) return;

  /* index.html hat den Ladevorgang bereits gestartet und hier abgelegt. */
  const pending = window.__paralistSprite || fetch("assets/icons/sprite.svg").then((response) => response.text());

  try {
    const markup = await pending;
    const holder = document.createElement("div");
    holder.id = "icon-sprite";
    /* Ohne Grafik-Sicht wäre die Sammlung sichtbar und würde Platz belegen. */
    holder.hidden = true;
    holder.innerHTML = markup;
    document.body.insertBefore(holder, document.body.firstChild);
  } catch (error) {
    /* Ohne Sammlung bleiben die Flächen der Icons leer; die App bleibt bedienbar. */
  }
}
