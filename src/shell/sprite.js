/*
 * Die Icons liegen gesammelt in assets/icons/sprite.svg und assets/icons/sprite-2.svg
 * (auf zwei Dateien verteilt, weil eine Datei nicht mehr als 400 Zeilen haben
 * darf — beide gehören zusammen und werden immer gemeinsam geladen). Der
 * Ladevorgang startet schon in index.html, damit die Icons ohne Verzögerung
 * da sind; hier werden die Sammlungen in die Seite gehängt, sodass
 * `<use href="#icon-…">` sie findet.
 * Pfad: src/shell/sprite.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * spritePaths -> wo die Icon-Sammlungen liegen (müssen zu index.html passen)
 *
 * Die Icons selbst stehen in assets/icons/sprite.svg und assets/icons/sprite-2.svg.
 */

const spritePaths = ["assets/icons/sprite.svg", "assets/icons/sprite-2.svg"];

/* Den Text einer Sammlung holen; `null`, wenn es nicht geklappt hat. */
async function fetchSprite(path) {
  try {
    const response = await fetch(path);
    return response.ok ? await response.text() : null;
  } catch (error) {
    return null;
  }
}

/** Alle Sammlungen in die Seite hängen. Ein zweiter Aufruf tut nichts. */
export async function mountSprite() {
  if (document.getElementById("icon-sprite")) return;

  /* index.html hat den Ladevorgang bereits gestartet und hier abgelegt.
     Ist eine Sammlung fehlgeschlagen, wird sie einmal erneut geholt — der
     Entwicklungsserver lässt unter vielen gleichzeitigen Anfragen
     gelegentlich eine fallen. */
  const started = window.__paralistSprites || spritePaths.map(() => Promise.resolve(null));
  const markups = await Promise.all(
    started.map((promise, index) => promise.then((markup) => markup || fetchSprite(spritePaths[index])))
  );
  /* Ohne Sammlung bleiben die Flächen der jeweiligen Icons leer; die App bleibt bedienbar. */
  const combined = markups.filter(Boolean).join("");
  if (!combined) return;

  const holder = document.createElement("div");
  holder.id = "icon-sprite";
  /* hidden: ohne das wäre die Sammlung sichtbar und würde Platz belegen */
  holder.hidden = true;
  holder.innerHTML = combined;
  document.body.insertBefore(holder, document.body.firstChild);
}
