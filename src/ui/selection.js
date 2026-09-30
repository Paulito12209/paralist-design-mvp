/*
 * Der Auswahlmodus einer Liste — einmal gebaut, genutzt von der
 * Aufgaben-Seite (Liste und Board, src/features/tasks/tasks-select.js) und
 * von allen Sammlungen (src/features/overview/page-select.js). Jede Seite
 * legt mit createSelection ihre eigene Auswahl an; hier steht, was überall
 * gleich ist:
 *
 * - Zeilen tragen data-pick-row="<Schlüssel>", ihr Kreis data-pick; ein
 *   Kreis im Kopf einer Gruppe (data-pick-group) wählt alle Zeilen in
 *   seinem Bereich (data-pick-scope).
 * - An: enter() — aus dem Menü einer Zeile („Auswählen“) oder mit Cmd- bzw.
 *   Strg-Klick. Der Modus bekommt einen eigenen Verlaufsschritt wie ein
 *   Blatt, damit Browser-Zurück ihn beendet statt die Seite zu verlassen.
 * - Im Modus: ein Tipp wählt an oder ab, Shift-Klick die Strecke seit dem
 *   letzten Tipp, Ziehen über die Kreise die ganze Strecke, Cmd-A bzw.
 *   Strg-A alles, was zu sehen ist. Die Klasse is-selecting am body blendet
 *   Navigation und Karte „Ansicht“ aus (styles/tasks-select.css).
 * - Aus: ✕, Escape, Browser-Zurück, ein Wechsel der Seite — oder settle(),
 *   wenn nach einer Aktion keine gewählte Zeile mehr zu sehen ist.
 *
 * Ein einzelner Tipp zeichnet nichts neu, er setzt nur Klassen (sync).
 * Pfad: src/ui/selection.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * groupLabel -> Vorlesetext des Kreises im Kopf einer Gruppe
 *
 * Aussehen: styles/tasks-select.css (Kreise, getönte Zeilen, Leisten).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { addPopGuard } from "./router-restore.js";
import { isViewActive } from "./views.js";

const groupLabel = "Ganzen Abschnitt wählen";

/**
 * Eine Auswahl anlegen.
 * @param host     liefert den Behälter der Zeilen (z.B. dom.tasksBody)
 * @param view     Name der Ansicht, auf der die Auswahl lebt ("tasks", "page")
 * @param leaveOn  bei welcher neu geöffneten Ansicht die Auswahl endet
 */
export function createSelection({ host, view, leaveOn = (name) => name !== view }) {
  const picked = new Set();
  let active = false;
  let anchor = null;
  let paint = null;
  let paintedClick = false;
  let ownPop = false;
  let hooks = { redraw: () => {}, onSync: () => {} };

  const rows = () => [...host().querySelectorAll("[data-pick-row]")];
  const keyOf = (row) => row.dataset.pickRow;
  const scopeRows = (mark) => [...(mark.closest("[data-pick-scope]") || host()).querySelectorAll("[data-pick-row]")];

  const api = {
    isOn: () => active,
    isPicked: (key) => picked.has(String(key)),
    count: () => picked.size,
    keys: () => [...picked],

    /** Eine Zeile wählen (`on`) oder abwählen. */
    set(key, on) {
      if (on) picked.add(String(key));
      else picked.delete(String(key));
    },

    /** Der Kreis vor einer Zeile — nur im Modus, sonst nichts. */
    mark(key) {
      if (!active) return "";
      return `<span class="task-pick${api.isPicked(key) ? " is-on" : ""}" data-pick="${key}" aria-hidden="true">${icon("check", "task-pick-icon")}</span>`;
    },

    /** Der Kreis im Kopf einer Gruppe: leer, halb (ein Teil gewählt) oder voll. */
    groupMark(keys) {
      if (!active || !keys.length) return "";
      const count = keys.filter(api.isPicked).length;
      const state = count === keys.length ? " is-on" : count ? " is-part" : "";
      return `<span class="task-pick task-pick-group${state}" data-pick-group role="button" aria-label="${groupLabel}">${icon("check", "task-pick-icon")}</span>`;
    },

    /** Sind alle gezeichneten Zeilen gewählt? Dann heißt der Knopf „Keine“ statt „Alle“. */
    allRowsPicked() {
      const list = rows();
      return list.length > 0 && list.every((row) => api.isPicked(keyOf(row)));
    },

    /** Kreise, Zeilen, Gruppenköpfe und Leisten auf den Stand bringen — ohne neu zu zeichnen. */
    sync() {
      rows().forEach((row) => {
        const on = active && api.isPicked(keyOf(row));
        row.toggleAttribute("data-picked", on);
        row.querySelector(".task-pick")?.classList.toggle("is-on", on);
      });
      host()
        .querySelectorAll("[data-pick-group]")
        .forEach((mark) => {
          const group = scopeRows(mark);
          const count = group.filter((row) => api.isPicked(keyOf(row))).length;
          mark.classList.toggle("is-on", count > 0 && count === group.length);
          mark.classList.toggle("is-part", count > 0 && count < group.length);
        });
      hooks.onSync(active);
    },

    /** Nach jedem Zeichnen: nur behalten, was noch zu sehen ist. */
    afterRender() {
      host().toggleAttribute("data-selecting", active);
      if (active) {
        const shown = new Set(rows().map(keyOf));
        api.keys().forEach((key) => {
          if (!shown.has(key)) picked.delete(key);
        });
      }
      api.sync();
    },

    /** Den Modus einschalten, optional gleich mit einer gewählten Zeile. */
    enter(key = null) {
      if (!active) {
        active = true;
        document.body.classList.add("is-selecting");
        history.pushState({ ...(history.state || { view }), select: true }, "");
      }
      if (key != null) {
        api.set(key, true);
        anchor = String(key);
      }
      hooks.redraw();
    },

    /**
     * Den Modus beenden. `fromHistory`: der Verlaufsschritt ist schon weg
     * (Browser-Zurück); sonst wird er hier still verbraucht.
     */
    exit({ fromHistory = false } = {}) {
      if (!active) return;
      active = false;
      picked.clear();
      anchor = null;
      paint = null;
      document.body.classList.remove("is-selecting");
      if (!fromHistory && history.state?.select) {
        ownPop = true;
        history.back();
      }
      if (isViewActive(view)) hooks.redraw();
      else api.afterRender();
    },

    /**
     * Nach einer Aktion, die Zeilen stehen lässt: ist danach keine gewählte
     * mehr zu sehen, endet die Auswahl. Geprüft wird erst nach dem Neuzeichnen
     * — manche Sammlungen zeichnen einen Takt später (nachgeladene Module).
     */
    settle() {
      api.sync();
      setTimeout(() => {
        if (active && !picked.size) api.exit();
      }, 0);
    },

    /** „Alle“ bzw. „Keine“. */
    toggleAll() {
      const all = api.allRowsPicked();
      rows().forEach((row) => api.set(keyOf(row), !all));
      api.sync();
    },

    /**
     * Klicks im Behälter, bevor die Liste sie bekommt. Gibt `true` zurück,
     * wenn der Klick zur Auswahl gehörte — dann tut er sonst nichts.
     */
    handleClick(event) {
      const row = event.target.closest("[data-pick-row]");
      if (!active) {
        if (!row || !(event.metaKey || event.ctrlKey) || event.target.closest("[data-grip]")) return false;
        event.preventDefault();
        event.stopImmediatePropagation();
        api.enter(keyOf(row));
        return true;
      }
      /* stopImmediatePropagation: auch die übrigen Zuhörer am selben Behälter
         (Pillen, Video-Vorschau) bekommen den Tipp nicht */
      event.preventDefault();
      event.stopImmediatePropagation();
      if (paintedClick) {
        paintedClick = false;
        return true;
      }
      const group = event.target.closest("[data-pick-group]");
      if (group) {
        const list = scopeRows(group);
        const all = list.every((item) => api.isPicked(keyOf(item)));
        list.forEach((item) => api.set(keyOf(item), !all));
      } else if (row && !event.target.closest("[data-grip]")) {
        const key = keyOf(row);
        const order = rows().map(keyOf);
        if (event.shiftKey && anchor && order.includes(anchor)) {
          const [from, to] = [order.indexOf(anchor), order.indexOf(key)].sort((a, b) => a - b);
          order.slice(from, to + 1).forEach((item) => api.set(item, true));
        } else api.set(key, !api.isPicked(key));
        anchor = key;
      }
      api.sync();
      return true;
    },

    /**
     * Zuhörer anmelden — einmal je Auswahl.
     * @param redraw zeichnet die ganze Seite neu
     * @param onSync frischt nach jedem Tipp Zählzeile und Leiste auf (bekommt `active`)
     */
    listen(next) {
      hooks = { ...hooks, ...next };
      host().addEventListener("contextmenu", (event) => {
        if (!active) return;
        event.preventDefault();
        event.stopPropagation();
      });
      /* Über die Kreise ziehen: die erste Zeile legt fest, ob gewählt oder abgewählt wird */
      host().addEventListener("pointerdown", (event) => {
        paintedClick = false;
        const mark = active && event.target.closest("[data-pick]");
        if (!mark || !event.isPrimary) return;
        paint = { on: !api.isPicked(mark.dataset.pick), last: mark.dataset.pick, moved: false, pointerId: event.pointerId };
      });
      window.addEventListener("pointermove", (event) => {
        if (!paint || event.pointerId !== paint.pointerId) return;
        const row = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-pick-row]");
        if (!row || !host().contains(row) || keyOf(row) === paint.last) return;
        if (!paint.moved) api.set(paint.last, paint.on);
        paint.moved = true;
        paint.last = keyOf(row);
        api.set(paint.last, paint.on);
        api.sync();
      });
      const endPaint = () => {
        if (paint?.moved) paintedClick = true;
        paint = null;
      };
      window.addEventListener("pointerup", endPaint);
      window.addEventListener("pointercancel", endPaint);
      /* Aufnahmephase: läuft vor dem Ziehen im Board, das die Klasse is-dragging-task gleich wegnimmt */
      window.addEventListener(
        "keydown",
        (event) => {
          if (!active || !isViewActive(view)) return;
          if (!dom.sheet.hidden || !dom.ctxMenu.hidden) return;
          if (document.body.classList.contains("is-dragging-task")) return;
          if (event.target.closest?.("input, textarea, [contenteditable]")) return;
          if (event.key === "Escape") {
            event.preventDefault();
            api.exit();
          } else if (event.key.toLowerCase() === "a" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            rows().forEach((row) => api.set(keyOf(row), true));
            api.sync();
          }
        },
        true
      );
      /* Den eigenen Schritt zurück nicht als Seitenwechsel behandeln — sonst
         schlösse er die Meldung mit „Rückgängig“ gleich wieder */
      addPopGuard(() => {
        if (!ownPop) return false;
        ownPop = false;
        return true;
      });
      window.addEventListener("popstate", (event) => {
        if (active && !event.state?.select) api.exit({ fromHistory: true });
      });
      on(events.viewOpened, (name) => {
        if (active && leaveOn(name)) api.exit({ fromHistory: true });
      });
    },
  };
  return api;
}
