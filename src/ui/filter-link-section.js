/*
 * Der Abschnitt „Verknüpft mit“ des Blatts „Filtern“ — für die Aufgaben-Seite
 * und die Projekte gleich. Er filtert nach dem, womit ein Eintrag verbunden
 * ist (Ablageorte, Verknüpfungen, bei einem Projekt sein Inhalt), auf drei
 * Ebenen: irgendeine Verbindung, eine Kategorie (Medien, Projekte …) oder ein
 * bestimmter Eintrag. Mehrere Werte gelten als ODER; nichts gewählt heißt
 * nicht gefiltert. Das Segment „enthält | enthält nicht“ dreht das Ergebnis
 * um, die Haken bleiben stehen. Was durchkommt: src/data/link-filter.js.
 *
 * Im Blatt stehen die Sammel-Werte als Chips, die gewählten Einträge als
 * Eingabe-Chips mit ✕ und dahinter „Eintrag wählen“ (src/ui/filter-link-pick.js).
 * Die Werte tragen ihre Kennung: „kind:medien“, „ref:e:17“ und „pick“.
 * Pfad: src/ui/filter-link-section.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sectionLabel -> Name und Icon des Abschnitts
 * pickLabel    -> Aufschrift des Chips, der die Auswahl öffnet
 * modeLabels   -> Wortlaut der beiden Segment-Knöpfe
 * allLabel / notLabel -> Zusammenfassung in der Übersicht: „Alle“, „nicht …“
 * notes        -> die Sätze unter den Chips
 */

import { linkFilterOn } from "../data/link-filter-fields.js";
import { linkKindOptions, linkRefInfo } from "../data/link-filter-options.js";
import { openLinkPick } from "./filter-link-pick.js";

const sectionLabel = { label: "Verknüpft mit", icon: "link" };
const pickLabel = "Eintrag wählen";
const modeLabels = { is: "enthält", not: "enthält nicht" };
const allLabel = "Alle";
const notLabel = "nicht";
const notes = {
  with: (noun, names) => `Zeigt ${noun} mit Verknüpfung zu: ${names}.`,
  without: (noun, names) => `Zeigt ${noun} ohne Verknüpfung zu: ${names}.`,
  all: (noun) => `Zeigt alle ${noun}.`,
};

/* Alles Gewählte mit Namen: erst die Kategorien, dann die einzelnen Einträge */
function chosen(view, scope) {
  const kinds = linkKindOptions(scope, view).filter((kind) => view.linkKinds.includes(kind.id));
  const refs = view.linkRefs.map((ref) => ({ ref, info: linkRefInfo(ref) })).filter((item) => item.info);
  return { kinds, refs, names: [...kinds.map((kind) => kind.label), ...refs.map((item) => item.info.label)] };
}

/* „Medien, Notizen oder Umzug“ — der Satz klingt so, wie man es sagen würde */
function listNames(names) {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} oder ${names[names.length - 1]}`;
}

/**
 * Der Abschnitt, wie ihn das Blatt braucht.
 * @param view    die Ansicht
 * @param scope   "task" oder "project"
 * @param noun    Mehrzahl für den Satz („Aufgaben“, „Projekte“)
 * @param getView liefert die Ansicht frisch (die Auswahl bleibt offen und liest immer neu)
 * @param change  speichert Änderungen an der Ansicht und zeichnet das Blatt neu
 */
export function linkSection(view, scope, noun, getView, change) {
  const picked = chosen(view, scope);
  const on = linkFilterOn(view) && picked.names.length > 0;
  const text = listNames(picked.names);
  const toggleRef = (ref) => {
    const refs = getView().linkRefs;
    change({ linkRefs: refs.includes(ref) ? refs.filter((item) => item !== ref) : [...refs, ref] });
  };
  const items = [
    ...linkKindOptions(scope, view).map((kind) => ({ id: `kind:${kind.id}`, label: kind.label, icon: kind.icon, active: view.linkKinds.includes(kind.id) })),
    ...picked.refs.map((item) => ({ id: `ref:${item.ref}`, label: item.info.label, icon: item.info.icon, active: true, entry: true })),
    { id: "pick", label: pickLabel, icon: "plus", active: false, action: true },
  ];
  return {
    id: "links",
    ...sectionLabel,
    summary: !on ? allLabel : view.linkNot ? `${notLabel} ${picked.names.join(", ")}` : picked.names.join(", "),
    active: on,
    mode: view.linkNot ? "not" : "is",
    modeLabels,
    chipIcons: true,
    items,
    note: !on ? notes.all(noun) : view.linkNot ? notes.without(noun, text) : notes.with(noun, text),
    onMode: (mode) => change({ linkNot: mode === "not" }),
    onToggle: (id) => {
      if (id === "pick") {
        openLinkPick({ scope, getRefs: () => getView().linkRefs, onToggle: toggleRef });
        return;
      }
      if (id.startsWith("ref:")) {
        toggleRef(id.slice(4));
        return;
      }
      const kind = id.slice(5);
      const kinds = getView().linkKinds;
      change({ linkKinds: kinds.includes(kind) ? kinds.filter((item) => item !== kind) : [...kinds, kind] });
    },
  };
}

/** Der Chip in der Karte „Ansicht“: die Zahl der gewählten Werte; leer, wenn nicht gefiltert. */
export function linkChip(view) {
  return { page: "links", ...sectionLabel, count: view.linkKinds.length + view.linkRefs.length, not: view.linkNot };
}
