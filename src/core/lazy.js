/*
 * Nachladen der großen Bereiche. Beim Start lädt nur, was die Startseite
 * braucht; Kalender, Medien, Suche, Fortschritt, Profil und Zeichnung kommen
 * erst beim ersten Öffnen dazu. Damit ist die App sofort bedienbar.
 *
 * Diese Datei kennt die Bereiche absichtlich NICHT — sonst müsste die unterste
 * Schicht die oberste kennen. Welcher Name zu welcher Datei gehört, meldet
 * src/main.js beim Start über `registerLoader` an.
 * Pfad: src/core/lazy.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * idleTimeout    -> wie lange auf eine Ruhephase gewartet wird (Millisekunden)
 * fallbackDelay  -> Abstand, wenn der Browser keine Ruhephasen meldet (Millisekunden)
 */

const idleTimeout = 3000;
const fallbackDelay = 300;

const loaders = new Map();
const pending = new Map();
const ready = new Map();

/**
 * Einen nachladbaren Bereich anmelden.
 * @param name Name, unter dem der Rest der App ihn lädt, z.B. "calendar".
 * @param importFn Funktion, die das Modul holt — in src/main.js ein `() => import(...)`.
 */
export function registerLoader(name, importFn) {
  loaders.set(name, importFn);
}

/**
 * Lädt einen Bereich und gibt sein Modul zurück. Ein zweiter Aufruf nutzt das
 * schon geladene Modul, es wird also nie doppelt geholt.
 */
export function load(name) {
  if (ready.has(name)) return Promise.resolve(ready.get(name));
  if (pending.has(name)) return pending.get(name);

  const importFn = loaders.get(name);
  if (!importFn) return Promise.reject(new Error(`Unbekannter Bereich: ${name}`));

  const task = importFn()
    .then((module) => {
      ready.set(name, module);
      pending.delete(name);
      return module;
    })
    .catch((error) => {
      pending.delete(name);
      throw error;
    });
  pending.set(name, task);
  return task;
}

/** Schon geladenes Modul, sonst `null` — für Aufrufe, die nicht warten dürfen. */
export function loadedModule(name) {
  return ready.get(name) || null;
}

/**
 * Lädt die Bereiche in Ruhephasen vor, damit das erste Öffnen ohne Warten geht.
 * Die Reihenfolge entspricht der Wahrscheinlichkeit, dass man sie gleich braucht.
 */
export function prefetchWhenIdle(names) {
  const queue = [...names];

  const step = () => {
    const next = queue.shift();
    if (!next) return;
    load(next).catch(() => {
      /* Vorladen darf fehlschlagen (z.B. offline); beim echten Öffnen wird es erneut versucht */
    });
    schedule();
  };

  const schedule = () => {
    if (!queue.length) return;
    /* requestIdleCallback: lädt nur, wenn der Browser gerade nichts Wichtigeres tut */
    if (window.requestIdleCallback) window.requestIdleCallback(step, { timeout: idleTimeout });
    else setTimeout(step, fallbackDelay);
  };

  schedule();
}
