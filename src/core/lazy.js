/*
 * Nachladen der großen Bereiche. Beim Start lädt nur, was die Startseite
 * braucht; Kalender, Medien, Suche, Fortschritt, Profil und Zeichnung kommen
 * erst beim ersten Öffnen dazu. Damit ist die App sofort bedienbar.
 * Pfad: src/core/lazy.js
 *
 * Keine anpassbaren visuellen Werte.
 */

/* Was sich nachladen lässt. Der Schlüssel ist der Name, den der Rest der App benutzt. */
const loaders = {
  calendar: () => import("../features/calendar/calendar.js"),
  media: () => import("../features/media/media.js"),
  search: () => import("../features/search/search.js"),
  resources: () => import("../features/resources/resources.js"),
  progress: () => import("../features/progress/progress.js"),
  profile: () => import("../features/profile/profile.js"),
  drawing: () => import("../features/drawing/drawing.js"),
  files: () => import("../data/files.js"),
};

const pending = new Map();
const ready = new Map();

/**
 * Lädt einen Bereich und gibt sein Modul zurück. Ein zweiter Aufruf nutzt das
 * schon geladene Modul, es wird also nie doppelt geholt.
 */
export function load(name) {
  if (ready.has(name)) return Promise.resolve(ready.get(name));
  if (!pending.has(name)) {
    const task = loaders[name]()
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
  }
  return pending.get(name);
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
      /* Nachladen kann fehlschlagen (z.B. offline); beim echten Öffnen wird es erneut versucht */
    });
    schedule();
  };
  const schedule = () => {
    if (!queue.length) return;
    if (window.requestIdleCallback) window.requestIdleCallback(step, { timeout: 3000 });
    else setTimeout(step, 300);
  };
  schedule();
}
