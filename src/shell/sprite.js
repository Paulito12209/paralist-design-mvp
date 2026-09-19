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
 * retryDelays -> Wartezeiten in Millisekunden vor dem zweiten, dritten, … Versuch,
 *                falls eine Sammlung beim Start nicht ankommt
 *
 * Die Icons selbst stehen in assets/icons/sprite.svg und assets/icons/sprite-2.svg.
 */

const spritePaths = ["assets/icons/sprite.svg", "assets/icons/sprite-2.svg"];
const retryDelays = [300, 800, 2000];

/* Den Text einer Sammlung holen; `null`, wenn es nicht geklappt hat. */
async function fetchSprite(path) {
  try {
    const response = await fetch(path);
    return response.ok ? await response.text() : null;
  } catch (error) {
    return null;
  }
}

/*
 * Eine Sammlung holen, notfalls mehrmals mit wachsenden Pausen. Der einfache
 * Entwicklungsserver lässt unter den rund hundert gleichzeitigen Anfragen
 * beim Start gelegentlich eine fallen — auch die sofortige Wiederholung, weil
 * er dann noch beschäftigt ist. Erst mit etwas Abstand kommt sie sicher an;
 * sonst fehlten die Icons dieser Sammlung bis zum nächsten Neuladen.
 */
async function fetchWithRetries(path, started) {
  let markup = await started;
  for (const delay of retryDelays) {
    if (markup) return markup;
    await new Promise((resolve) => setTimeout(resolve, delay));
    markup = await fetchSprite(path);
  }
  return markup;
}

/** Alle Sammlungen in die Seite hängen. Ein zweiter Aufruf tut nichts. */
export async function mountSprite() {
  if (document.getElementById("icon-sprite")) return;

  const holder = document.createElement("div");
  holder.id = "icon-sprite";
  /* hidden: ohne das wäre die Sammlung sichtbar und würde Platz belegen */
  holder.hidden = true;
  document.body.insertBefore(holder, document.body.firstChild);

  /* index.html hat den Ladevorgang bereits gestartet und hier abgelegt. Jede
     Sammlung hängt sich ein, sobald sie da ist — die andere muss nicht warten.
     Bleibt eine trotz aller Versuche aus, bleiben nur ihre Icons leer; die
     App bleibt bedienbar. */
  const started = window.__paralistSprites || spritePaths.map(() => Promise.resolve(null));
  await Promise.all(
    spritePaths.map(async (path, index) => {
      const markup = await fetchWithRetries(path, started[index]);
      if (markup) holder.insertAdjacentHTML("beforeend", markup);
    })
  );
}
