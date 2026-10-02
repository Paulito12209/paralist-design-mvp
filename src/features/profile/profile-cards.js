/*
 * Die Karten im Profil-Blatt: Kopf mit Bild und Namen und die Listen darunter
 * (Mehr, App, Konto, Support). Nutzungszeit und Serie stehen in
 * src/ui/usage-pages.js (am Handy im Fortschritt, am Desktop im Profil).
 * Pfad: src/features/profile/profile-cards.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * Name, Mailadresse, Plan und Version im Kopf stehen in src/data/account.js.
 * Zeilen mit `plan: true` (und der Plan im Kopf) erscheinen nur außerhalb der Android-Fassung.
 * listSections   -> welche Zeilen unter welcher Überschrift stehen
 * supportLinks   -> wohin „Feedback“ und „Roadmap“ unter „Support“ führen
 *
 * Farben und Größen stehen in styles/profile.css (--profile-avatar-size).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { account } from "../../data/account.js";
import { isMobileOs } from "../../ui/platform.js";
import { currentPhoto } from "./avatar.js";
import { versionsSummary } from "./versions.js";

/* Die festen Angaben im Kopf des Blatts: Name, Mail, Plan, Version und
   Initialen stehen in src/data/account.js — die Seitenleiste am Desktop zeigt
   sie auch. */
const profile = account;

/*
 * Die beiden Wege zum öffentlichen Board. Getrennt, weil man das Formular
 * sonst nicht findet: die Startseite zeigt nur die Roadmap, das Schreibfeld
 * liegt eine Ebene tiefer und geht mit „/create“ sofort auf.
 */
const supportLinks = {
  feedback: "https://xool.canny.io/paralist/create",
  roadmap: "https://xool.canny.io",
};

/** Die Versionszeile — das Feedback-Formular schickt sie mit. */
export function appVersion() {
  return profile.version;
}

/** Das runde Bild oder die Initialen. */
export function avatarMarkup() {
  const photo = currentPhoto();
  return photo ? `<img src="${photo}" alt="">` : profile.initials;
}

/* Android bietet im Entwurf kein Abo an (alles läuft offline, kein Cloud-Sync):
   dort stehen weder der Plan noch „Plan verwalten“. */
function showsPlan() {
  return !isMobileOs("android");
}

/** Die Zeile unter der Mailadresse: „Pro · Dabei seit …“, in Android nur „Dabei seit …“. */
function metaLine() {
  return showsPlan() ? `${profile.plan} · ${profile.since}` : profile.since;
}

/** Kopf des Blatts: Bild, Name, Mailadresse, Plan. */
export function identityCard() {
  return `
    <section class="profile-id">
      <div class="profile-avatar-wrap">
        <button class="profile-avatar" type="button" data-avatar-view="1" aria-label="Profilbild anzeigen">${avatarMarkup()}</button>
        <button class="profile-avatar-edit" type="button" data-avatar-edit="1" aria-label="Profilbild ändern">${icon("pencil")}</button>
      </div>
      <p class="profile-name">${escapeHtml(profile.name)}</p>
      <p class="profile-mail">${escapeHtml(profile.mail)}</p>
      <p class="profile-meta">${escapeHtml(metaLine())}</p>
    </section>
  `;
}

/*
 * Die Zeilenkarten unter den Diagrammen. `detail` nennt die Seite, die sich
 * beim Antippen auftut (siehe `details` in settings-cards.js), `link` eine
 * Adresse außerhalb der App, `action` etwas, das profile.js beim Antippen
 * ausführt; Zeilen ohne all das zeigen im MVP nur den Aufbau. „Konto löschen“
 * steht absichtlich nicht hier, sondern eine Ebene tiefer in den
 * Kontoeinstellungen (account.js) — ganz unten im Blatt träfe man es zu leicht.
 */
const listSections = [
  /* „Mehr“ zuerst: am Handy steht es so direkt unter „Darstellung“ — die
     Versionen wechselt man beim Ausprobieren oft */
  {
    title: "Mehr",
    rows: [
      { icon: "layers", label: "Versionen", trail: "chevron", detail: "versions", value: versionsSummary },
      { icon: "import", label: "Nach Updates suchen", action: "update" },
    ],
  },
  {
    title: "App",
    rows: [
      { icon: "sidebar", label: "Navigation", trail: "chevron", detail: "navigation" },
      { icon: "search", label: "Suche", trail: "chevron", detail: "search" },
      { icon: "image", label: "Design", trail: "chevron", detail: "design" },
      { icon: "tag", label: "Tabs", trail: "chevron", detail: "tabs" },
    ],
  },
  {
    title: "Konto",
    rows: [
      { icon: "person", label: "Kontoeinstellungen", trail: "chevron", detail: "account" },
      { icon: "arrow-up-circle", label: "Plan verwalten", trail: "chevron", plan: true },
    ],
  },
  {
    title: "Support",
    rows: [
      { icon: "note", label: "Feedback", trail: "external", link: supportLinks.feedback },
      { icon: "roadmap", label: "Roadmap", trail: "external", link: supportLinks.roadmap },
      { icon: "cube", label: "Danksagungen", trail: "chevron", detail: "credits" },
    ],
  },
];

/* Eine Zeile: Link, Unterseite, Aktion oder nur Aufbau. `value` steht grau am
   rechten Rand (z.B. die Mailadresse in den Kontoeinstellungen); als Funktion
   wird er bei jedem Zeichnen frisch gelesen (die gewählten Versionen). */
function rowMarkup(row) {
  const shell = `class="plist-row${row.danger ? " is-danger" : ""}"`;
  const text = typeof row.value === "function" ? row.value() : row.value;
  const value = text ? `<span class="plist-value">${escapeHtml(text)}</span>` : "";
  /* plist-status: dort meldet „Nach Updates suchen“ den Stand, ohne neu zu zeichnen */
  const status = row.action ? `<span class="plist-value plist-status"></span>` : "";
  const inner = `
          ${icon(row.icon)}
          <span>${escapeHtml(row.label)}</span>
          ${value}${status}
          ${row.trail ? icon(row.trail, "plist-trail") : ""}`;
  /* a statt button: nur ein echter Link öffnet verlässlich einen neuen
     Tab. target: die App bleibt dahinter stehen, sonst müsste man sich
     von der fremden Seite mehrfach zurücktippen. rel: der neue Tab darf
     sonst über window.opener auf die App zugreifen. */
  if (row.link) {
    return `<a ${shell} href="${escapeHtml(row.link)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }
  const data = row.detail
    ? ` data-settings-detail="${row.detail}"`
    : row.action
      ? ` data-settings-action="${row.action}"`
      : "";
  return `<button ${shell} type="button"${data}>${inner}</button>`;
}

/** Eine Abschnittsüberschrift mit ihrer Zeilenkarte — auch für die Unterseiten. Zeilen mit `plan: true` entfallen in Android. */
export function sectionMarkup(title, rows) {
  const shown = rows.filter((row) => !row.plan || showsPlan());
  return `<p class="psection">${escapeHtml(title)}</p><section class="plist">${shown.map(rowMarkup).join("")}</section>`;
}

/** Name, Mailadresse und Plan für die Kontoeinstellungen. */
export function accountInfo() {
  return { name: profile.name, mail: profile.mail, plan: profile.plan };
}

/**
 * Die Listen unter den Karten, darunter „Abmelden“ als schlichter Text in der
 * Mitte — kein Menüpunkt wie die anderen, sondern der Schluss der Seite — und
 * ganz unten die Versionszeile.
 */
export function listsMarkup() {
  const sections = listSections.map((section) => sectionMarkup(section.title, section.rows)).join("");
  return sections + closingMarkup();
}

/** Ein einzelner Abschnitt der Listen („Konto“, „Support“, „Mehr“) — für die Profilseite am Desktop. */
export function listSection(title) {
  const section = listSections.find((item) => item.title === title);
  return section ? sectionMarkup(section.title, section.rows) : "";
}

/** „Abmelden“ und die Versionszeile, der Schluss der Seite. */
export function closingMarkup() {
  return `
    <button class="profile-signout" type="button">Abmelden</button>
    <p class="profile-version">${escapeHtml(profile.version)}</p>
  `;
}
