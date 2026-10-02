/*
 * Feste Listen der App: Eintragstypen, Übersichtskarten, XP-Arten, Themes.
 * Hier steht nur, WAS es gibt — nicht, wie es aussieht oder was gespeichert ist.
 * Status, Dringlichkeit und die Bedien-Listen der Aufgaben-Seite stehen in
 * src/data/config-tasks.js.
 * Pfad: src/data/config.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * xpItems[*].color        -> Farbe des Typs in Verlauf, Kalenderpunkt und Eingabefeld
 * xpKinds[*].color        -> Farbe im Ring des Fortschritt-Blatts (verweist auf styles/tokens.css)
 * xpKinds[*].amount       -> wie viele XP ein Ereignis bringt
 * composerPlaceholders    -> Platzhaltertext im Eingabefeld je gewähltem Typ
 * mediaPlaceholders       -> Platzhalter eines Mediums, sobald eine Datei angehängt ist
 * sheetPlaceholders       -> kürzerer Platzhalter im Blatt „Neu“ der Android-Fassung („Neue Aufgabe“)
 * fileDraftTypes          -> welcher Typ von selbst entsteht, wenn eine Datei dranhängt
 * proposedType            -> Typ, den das Eingabefeld ohne nähere Angabe vorschlägt
 * typeSingulars           -> Einzahl der Typen, deren Name in der Mehrzahl steht
 * typeArticles            -> unbestimmter Artikel je Typ („Jetzt eine Aufgabe“)
 * resourceFilterTypes     -> welchen Typ jede Filter-Pille der Ressourcen-Seite anlegt
 * typeOrder               -> Reihenfolge der Gruppen unter „Verknüpfte Einträge“
 * linkableTypes           -> welche Typen sich mit einem Eintrag verknüpfen lassen
 * workspaceDefaultName    -> Vorgabename eines neuen Arbeitsbereichs
 * levelSteps / levelStep  -> ab wie vielen XP die nächste Stufe beginnt
 * calendarSegments[*].add -> Beschriftung der Pille am leeren Kalendertag
 * manualSort              -> „Eigene Reihenfolge“: Wortlaut der Sortierung, die beim Verschieben einer Zeile entsteht
 * projectSorts            -> wonach sich die Projekte sortieren lassen, samt Wortlaut beider Richtungen
 * projectViewDefaults     -> womit „Alle“ und jede neue Ansicht der Projekte startet
 * stageModes              -> die drei Modi der Bühne auf der Übersicht (Desktop): Icon im Schalter und
 *                            Beschriftung, die beim Überfahren erscheint
 */

/*
 * Eintragstypen: bestimmen das Icon vor dem Titel in den Listen.
 * `pick: true` heißt, dass es für den Typ einen eigenen Knopf im Eingabefeld gibt.
 * Ohne gewählten Knopf entsteht ein Dokument.
 */
export const types = [
  { id: "notiz", label: "Notiz", icon: "note", pick: true },
  { id: "aufgabe", label: "Aufgabe", icon: "task", pick: true },
  { id: "termin", label: "Termin", icon: "calendar", pick: true },
  { id: "projekt", label: "Projekte", icon: "rocket", pick: true },
  { id: "dokument", label: "Dokument", icon: "doc" },
  { id: "zeichnung", label: "Zeichnung", icon: "scribble" },
  { id: "medien", label: "Medien", icon: "photos" },
  { id: "lesezeichen", label: "Lesezeichen", icon: "bookmark" },
];

/** Typ eines Eintrags ohne ausdrückliche Wahl — kein Knopf gewählt heißt Dokument. */
export const defaultType = "dokument";

/*
 * Was das Eingabefeld von sich aus vorschlägt, wenn die offene Seite nichts
 * Näheres sagt. Bewusst die Notiz und nicht die Aufgabe: die meisten fangen
 * mit einem Gedanken an, und für Aufgaben gibt es einen eigenen Reiter.
 * Nicht mit `defaultType` verwechseln — der gilt, wenn gar kein Knopf leuchtet.
 */
export const proposedType = "notiz";

/**
 * Diese Typen sammelt die Ressourcen-Karte, egal wo sie abgelegt sind — auch
 * Medien: die haben zwar zusätzlich einen eigenen Reiter „Medien”, zählen auf
 * der Startseite aber zu Ressourcen und nie zum Eingang (siehe inboxEntries in
 * src/data/queries.js).
 */
export const resourceTypes = ["notiz", "dokument", "zeichnung", "medien"];

/* Extra-Knopf neben den Typen: sieht aus wie die Ressourcen-Kachel, legt aber ein Dokument an. */
export const resourcePick = { id: "ressourcen", label: "Ressourcen", icon: "cube", typeId: "dokument" };

/* Bitte „neu im Eingang“: wählt keinen Typ, sondern den Ort — der Plus-Knopf
   auf der Eingang-Kachel der Desktop-Fassung legt dort ab, wo er draufsteht,
   egal auf welcher Seite man gerade ist. */
export const inboxPick = "eingang";

/** Platzhalter im Eingabefeld je gewähltem Typ. */
export const composerPlaceholders = {
  aufgabe: "Neue Aufgabe einfügen …",
  notiz: "Neue Notiz einfügen …",
  termin: "Neuen Termin eintragen …",
  projekt: "Neues Projekt einfügen …",
  dokument: "Neue Ressource anlegen …",
  zeichnung: "Neue Zeichnung anlegen …",
  /* Ein Medium besteht aus seiner Datei — ohne sie lässt es sich nicht anlegen. */
  medien: "Über + eine Datei anhängen …",
  lesezeichen: "Link oder Name des Lesezeichens …",
};

/* Im Blatt „Neu“ der Android-Fassung steht nur, was entsteht — wie „New task“
   in Google Tasks. Fehlt ein Typ hier, gilt sein Text aus composerPlaceholders.
   Der Hinweis mediaPlaceholders.auto tippt sich dort nur ab und zu hinein
   (src/features/composer/composer-hint.js). */
export const sheetPlaceholders = {
  aufgabe: "Neue Aufgabe",
  notiz: "Neue Notiz",
  termin: "Neuer Termin",
  projekt: "Neues Projekt",
  dokument: "Neues Dokument",
  zeichnung: "Neue Zeichnung",
  lesezeichen: "Neues Lesezeichen",
  medien: "Neues Medium",
};

/*
 * Platzhalter eines Mediums, sobald die Datei da ist. `title`: „Medium“ ist
 * von Hand gewählt, Text wird sein Titel — ohne heißt es wie die Datei.
 * `auto`: das Eingabefeld hat von selbst umgestellt, Text macht ein Dokument daraus.
 */
export const mediaPlaceholders = {
  title: "Eigener Titel (optional) …",
  auto: "Mit Text wird es ein Dokument …",
};

/*
 * Welcher Typ von selbst entsteht, solange eine Datei dranhängt und man keinen
 * Typ selbst gewählt hat: ohne Text ist die Datei selbst der Eintrag
 * (`bare`), mit Text ein Dokument, an dem die Datei als Medium hängt
 * (`withText`). Beide leuchten unter dem Ressourcen-Knopf.
 */
export const fileDraftTypes = { bare: "medien", withText: "dokument" };

/*
 * Die vier Übersichtskarten. Nur der Eingang ist ein Ablageort (parent null =
 * „nirgends abgelegt“). Die anderen drei sind Sammlungen („kind“): Favoriten
 * zeigt Markiertes, Arbeitsbereiche alle Arbeitsbereiche je Tab (dort werden
 * sie auch angelegt), Ressourcen alle Dokumente, Zeichnungen und Medien —
 * egal, wo sie liegen. Die Projekte stehen unter den Karten auf der Übersicht
 * und auf ihrer eigenen Seite (projectsPage in src/data/collections.js).
 */
export const overviewPages = {
  1: { title: "Eingang", icon: "inbox", parent: null },
  2: { title: "Favoriten", icon: "star-outline", kind: "favorites" },
  3: { title: "Arbeitsbereiche", icon: "layers", kind: "workspaces" },
  4: { title: "Ressourcen", icon: "cube", kind: "resources" },
};

/*
 * Das Archiv ist keine Karte auf der Startseite, sondern hängt an der Pille
 * unter der Liste der Arbeitsbereiche. Es benutzt dieselbe Unterseite wie die
 * Karten, deshalb steht es hier neben ihnen.
 */
export const archivePage = { title: "Archiv", kind: "archive" };

/*
 * Die Ordnung der Dinge: Arbeitsbereiche ganz oben, darin Projekte, darin alles
 * andere. Nur diese Typen dürfen selbst Einträge aufnehmen. Ein Projekt kann
 * nicht in einem Projekt liegen — so kann nie ein Kreis entstehen.
 */
export const containerTypes = ["projekt"];

/*
 * Was sich mit einem Eintrag VERKNÜPFEN lässt — alles außer dem Projekt.
 * Verknüpfen und Ablegen sind zwei verschiedene Dinge: eine Verknüpfung gilt
 * in beide Richtungen und keiner der beiden steht über dem anderen, während
 * der Ablageort sagt, wo ein Eintrag liegt. Ein Projekt ist ein Ablageort und
 * steht darum im Fußpfad unter dem Titel, nicht in der Liste der verknüpften
 * Einträge. Arbeitsbereiche sind gar keine Einträge und darum ohnehin nur Ort.
 */
export const linkableTypes = types
  .map((type) => type.id)
  .filter((id) => !containerTypes.includes(id));

/** Reihenfolge der Gruppen unter „Verknüpfte Einträge“: Projekte zuerst. */
export const typeOrder = ["projekt", "aufgabe", "notiz", "termin", "dokument", "zeichnung", "medien", "lesezeichen"];

/** Mehrzahl je Typ für die Gruppenüberschriften. */
export const typePlurals = {
  projekt: "Projekte",
  aufgabe: "Aufgaben",
  notiz: "Notizen",
  termin: "Termine",
  dokument: "Dokumente",
  zeichnung: "Zeichnungen",
  medien: "Medien",
  lesezeichen: "Lesezeichen",
};

/** Vorgabename eines neuen Arbeitsbereichs; ab dem zweiten mit Nummer. */
export const workspaceDefaultName = "Arbeitsbereich";

/** XP-Arten: bestimmen Farbe, Icon und Punkte je Ereignis. */
export const xpKinds = {
  created: { label: "Angelegt", icon: "plus-circle", color: "var(--xp-created)", amount: 1 },
  done: { label: "Erledigt", icon: "check-circle", color: "var(--xp-done)", amount: 2 },
};

/** Was angelegt wurde: Icon und Farbe für Historie, Kalenderpunkte und Typ-Knöpfe. */
export const xpItems = {
  aufgabe: { label: "Aufgabe", icon: "task", color: "#0a84ff" },
  notiz: { label: "Notiz", icon: "note", color: "#ffd60a" },
  termin: { label: "Termin", icon: "calendar", color: "#5ac8fa" },
  medien: { label: "Medien", icon: "photos", color: "#30d158" },
  projekt: { label: "Projekte", icon: "rocket", color: "#af2d3a" },
  dokument: { label: "Dokument", icon: "doc", color: "#64d2ff" },
  zeichnung: { label: "Zeichnung", icon: "scribble", color: "#ff375f" },
  lesezeichen: { label: "Lesezeichen", icon: "bookmark", color: "#af52de" },
  arbeitsbereich: { label: "Arbeitsbereich", icon: "layers", color: "#ff9f0a" },
  tab: { label: "Tab", icon: "tag", color: "#bf5af2" },
};

/** Stufen 1–4 als feste Schwellen; danach wächst der Abstand um `levelStep` je Stufe. */
export const levelSteps = [0, 0, 300, 600, 1000];
export const levelStep = 100;

/** Auswahl in den Einstellungen. */
export const themes = [
  { id: "system", label: "System", icon: "display" },
  { id: "light", label: "Hell", icon: "sun" },
  { id: "dark", label: "Dunkel", icon: "moon" },
];

/** Zeiträume, die die Diagramme im Fortschritt und im Profil anbieten. */
export const chartRanges = [7, 30, 90];

/** Typ-Icon eines Eintrags; unbekannte Typen bekommen das Platzhalter-Icon. */
export function typeIcon(id) {
  const type = types.find((item) => item.id === id);
  return type ? type.icon : "placeholder";
}

/** Anzeigename eines Typs, z.B. „aufgabe“ → „Aufgabe“. */
export function typeLabel(id) {
  const type = types.find((item) => item.id === id);
  return type ? type.label : "Eintrag";
}

/*
 * Die beiden Typen, deren `label` in der Mehrzahl steht, weil es zugleich eine
 * Übersichtskarte oder einen Reiter beschriftet. Für kurze Meldungen über
 * genau einen Eintrag braucht es die Einzahl.
 */
const typeSingulars = { projekt: "Projekt", medien: "Medium" };

/** Anzeigename in der Einzahl, für Meldungen wie „Projekt erstellt“. */
export function typeSingular(id) {
  return typeSingulars[id] || typeLabel(id);
}

/** Unbestimmter Artikel je Typ, für Sätze wie „Jetzt eine Aufgabe“ oder „Wird ein Projekt“. */
export const typeArticles = { notiz: "eine", aufgabe: "eine", termin: "ein", projekt: "ein", dokument: "ein", lesezeichen: "ein", arbeitsbereich: "ein" };

/** Icon und Farbe für einen Historien-Posten; unbekannte Posten bleiben grau. */
export function xpItemStyle(item) {
  return xpItems[item] || { label: item, icon: "placeholder", color: "var(--muted)" };
}

/* ---------- Auswahl-Listen der einzelnen Seiten ---------- */

/** Zeitraum des Kalenderstreifens. `id` ist die Zahl der Wochen, 0 steht für den ganzen Monat. */
export const calendarSpans = [
  { id: 1, label: "1 Woche", short: "1 W" },
  { id: 2, label: "2 Wochen", short: "2 W" },
  { id: 0, label: "1 Monat", short: "1 M" },
];

/** Ansicht der grauen Fläche unter dem Kalenderstreifen. */
export const calendarModes = ["grid", "list"];

/**
 * Die drei Spalten der Kalenderliste. `pick` sagt, welchen Typ das Eingabefeld
 * vorwählt, wenn man am leeren Tag auf die Pille zum Anlegen tippt.
 */
export const calendarSegments = [
  { id: "aufgaben", label: "Aufgaben", empty: "Keine Aufgaben", pick: "aufgabe", add: "Aufgabe hinzufügen" },
  { id: "termine", label: "Termine", empty: "Nichts geplant", pick: "termin", add: "Termin eintragen" },
  { id: "projekte", label: "Projekte", empty: "Keine Projekte", pick: "projekt", add: "Projekt anlegen" },
];

/** Der Schalter über der Bühne der Übersicht (src/features/dashboard/dashboard-stage.js). */
export const stageModes = [
  { id: "created", label: "Zuletzt erstellt", icon: "plus-circle" },
  { id: "opened", label: "Zuletzt geöffnet", icon: "history" },
  { id: "favorites", label: "Favorisiert", icon: "star-outline" },
];

/** Pillen oben auf der Medien-Seite: „Zuletzt erstellt“ zeigt alles, die anderen je eine Art. */
export const mediaFilters = [
  { id: "recent", label: "Zuletzt erstellt", icon: "history" },
  { id: "image", label: "Bilder", icon: "image" },
  { id: "video", label: "Videos", icon: "video" },
  { id: "audio", label: "Audio", icon: "mic" },
  { id: "doc", label: "Dokumente", icon: "doc" },
];

/**
 * Die vier Medien-Arten in der Reihenfolge, in der sie unter „Verknüpfte
 * Einträge“ untereinander stehen. Dieselben Namen wie die Pillen oben auf der
 * Medien-Seite, nur ohne „Zuletzt erstellt“ — das ist keine Art, sondern alles.
 */
export const mediaKinds = mediaFilters.filter((item) => item.id !== "recent");

/**
 * Pillen oben auf der Ressourcen-Seite: „Alle“ zeigt alles — auch Fotos und
 * Dateien —, „Notizen“ nur Notizen, „Zeichnungen“ das Gezeichnete, „Eigene
 * Dokumente“ das selbst Geschriebene. Für Medien gibt es hier bewusst keine
 * Pille: dafür steht der graue Zweittitel „Medien“ neben der Überschrift, und
 * der führt in den eigenen Reiter.
 * Was eine leere Seite zeigt, steht in src/features/resources/resources.js.
 */
export const resourceFilters = [
  { id: "all", label: "Alle", icon: "cube" },
  { id: "notes", label: "Notizen", icon: "note" },
  { id: "drawings", label: "Zeichnungen", icon: "scribble" },
  { id: "own", label: "Eigene Dokumente", icon: "doc" },
];

/*
 * Welchen Typ das Eingabefeld anlegt, wenn man auf der Ressourcen-Seite etwas
 * anlegt: den, den die gerade aktive Pille zeigt. Unter „Alle“ ist das ein
 * Dokument — daneben stehen ja die Pillen „Notizen“ und „Zeichnungen“, man
 * sieht also sofort, wo das Übrige hingehört.
 */
export const resourceFilterTypes = {
  all: "dokument",
  notes: "notiz",
  drawings: "zeichnung",
  own: "dokument",
};

/* ---------- Ansichten der Projekte (Übersicht, Seite Projekte) ---------- */

/**
 * Sortierarten der Projekte. `up` und `down` sind der Wortlaut der beiden
 * Richtungen im Blatt „Sortieren“ (src/ui/sort-sheet.js), `asc` die Richtung,
 * die beim Wechsel auf diese Option gilt. Die Regeln dahinter stehen in
 * `sortProjects` in src/data/project-views.js.
 */
/*
 * „Eigene Reihenfolge“ entsteht, wenn man eine Zeile gedrückt hält und
 * verschiebt (src/ui/row-reorder.js). Sammlungen und Projekte bieten sie an;
 * die Reihenfolge selbst merkt src/data/manual-order.js.
 */
export const manualSort = { id: "manuell", label: "Eigene Reihenfolge", icon: "list", up: "Von oben nach unten", down: "Von unten nach oben", asc: true };

export const projectSorts = [
  { id: "name", label: "Name", icon: "text", up: "A bis Z", down: "Z bis A", asc: true },
  { id: "erstellt", label: "Erstellt", icon: "plus-circle", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geaendert", label: "Zuletzt geändert", icon: "pencil", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geoeffnet", label: "Zuletzt geöffnet", icon: "history", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "eintraege", label: "Einträge", icon: "list", up: "Wenigste zuerst", down: "Meiste zuerst", asc: false },
  manualSort,
];

/**
 * Womit „Alle“ und jede neue Ansicht der Projekte startet: zuletzt Geöffnetes
 * oben, ohne Filter. `place` ist "alle", "inbox" oder ein Verweis wie „w:3“;
 * `ids` ist die handverlesene Liste — leer heißt „nach den Filtern“.
 */
export const projectViewDefaults = { sort: "geoeffnet", sortAsc: false, place: "alle", favoritesOnly: false, ids: [] };
