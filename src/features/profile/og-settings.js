/*
 * Die Einstellungs-Liste der „OG Version“ nach SettingsView (Organi7er):
 * Profilkarte mit Bild, Name und „Mehr Infos“, darunter Gruppen mit grauer
 * Überschrift. Was die App kennt (Erscheinungsbild, Dashboard anpassen), steht
 * wie dort; was nur der Web-Entwurf hat (Versionen, Navigation, Suche, Design,
 * Tabs, Konto, Daten, Feedback) ist in dieselben Gruppen einsortiert. Zeilen
 * ohne Gegenstück im Web (Sprache, Form der Kacheln, Farben, Trigger-Wörter,
 * Papierkorb, Logbuch) fehlen mit Absicht. Die Klicks der beiden Menüs
 * (Erscheinungsbild, Dashboard) erledigt onOgClick.
 * Pfad: src/features/profile/og-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * words        -> alle Beschriftungen (Gruppen, Name ohne Eintrag, „Mehr Infos“)
 * themeSheet   -> Überschrift des Menüs „Erscheinungsbild“
 *
 * Aussehen: styles/og-settings.css und styles/og-settings-sheet.css.
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import { account } from "../../data/account.js";
import { themes } from "../../data/config.js";
import { dashSections, homeLayout, setHomeLayout } from "../../data/home-dash.js";
import { profileFields } from "../../data/profile.js";
import { openColumnsSheet } from "../../ui/columns-sheet.js";
import { isMobileOs } from "../../ui/platform.js";
import { openSheet } from "../../ui/sheet.js";
import { hasAccount } from "./account-phase.js";
import { currentPhoto } from "./avatar.js";
import { closingMarkup, listSection, metaLine, rowsOf, sectionMarkup } from "./profile-cards.js";
import { currentTheme, setTheme } from "./theme.js";

const words = {
  unset: "Name hinzufügen",
  more: "Mehr Infos",
  custom: "Individualisierung",
  further: "Weiteres",
  appearance: "Erscheinungsbild",
  dashboard: "Dashboard anpassen",
  dashboardHint: "Übersicht",
};
const themeSheet = words.appearance;

/* Ob „Mehr Infos“ aufgeklappt ist — gilt, bis das Blatt neu geladen wird */
let moreOpen = false;

/** Zeigt die Liste in dieser Fassung (OG Version am Handy)? */
export function isOgSettings() {
  return isMobileOs("ios") && document.documentElement.dataset.mobileVariant === "og";
}

/* Bild: Foto oder die graue Fläche mit der Figur wie in der App */
function avatarMarkup() {
  const photo = currentPhoto();
  return photo ? `<img src="${photo}" alt="">` : icon("person-fill");
}

/* Der aufgeklappte Teil: Mail, Plan und seit wann, dazu der Weg zu „Persönliche Daten“ */
function moreMarkup() {
  const mail = hasAccount() ? `<p class="og-settings-info">${escapeHtml(account.mail)}</p>` : "";
  return `
    <div class="og-settings-more">
      ${mail}<p class="og-settings-info" data-account-since="head">${escapeHtml(metaLine())}</p>
      <button class="og-settings-link" type="button" data-settings-detail="personal">Persönliche Daten${icon("chevron", "plist-trail")}</button>
    </div>`;
}

/* Profilkarte: ohne Namen steht „Name hinzufügen“ blass; ein Tipp darauf bearbeitet ihn */
function identityMarkup() {
  const set = Boolean(profileFields().name);
  const name = set ? escapeHtml(account.name) : words.unset;
  return `
    <section class="profile-id og-settings-id">
      <div class="profile-avatar-wrap">
        <button class="profile-avatar" type="button" data-avatar-view="1" aria-label="Profilbild anzeigen">${avatarMarkup()}</button>
        <button class="profile-avatar-edit" type="button" data-avatar-edit="1" aria-label="Profilbild ändern">${icon("pencil")}</button>
      </div>
      <p class="profile-name${set ? "" : " is-unset"}" data-name-edit="1" data-unset-text="${words.unset}">${name}</p>
      <button class="og-settings-more-btn${moreOpen ? " is-open" : ""}" type="button" data-og-more="1" aria-expanded="${moreOpen}">
        <span>${words.more}</span>${icon("chevron")}
      </button>
      ${moreOpen ? moreMarkup() : ""}
    </section>`;
}

const themeLabel = () => themes.find((theme) => theme.id === currentTheme())?.label ?? "";

/* Gruppe 1: die beiden Zeilen der App, danach die Seiten des Web-Entwurfs */
function customMarkup() {
  const rows = [
    { icon: "contrast", label: words.appearance, trail: "chevron-updown", action: "theme-menu", value: themeLabel },
    { icon: "grid", label: words.dashboard, trail: "chevron", action: "dashboard" },
    ...rowsOf("App"),
  ];
  return sectionMarkup(words.custom, rows);
}

/** Die ganze Liste dieser Fassung. */
export function ogListMarkup() {
  const further = [...rowsOf("Mehr"), ...rowsOf("Support")];
  return [
    identityMarkup(),
    customMarkup(),
    listSection("Konto"),
    listSection("Profil"),
    listSection("Daten"),
    listSection(""),
    sectionMarkup(words.further, further),
    closingMarkup(),
  ].join("");
}

/* Menü „Erscheinungsbild“: System, Hell, Dunkel — die Zeile zeichnet sich danach neu */
function openThemeMenu(rerender) {
  const active = currentTheme();
  openSheet(
    themeSheet,
    themes.map((theme) => ({
      label: theme.label,
      icon: theme.icon,
      active: theme.id === active,
      onSelect: () => {
        setTheme(theme.id);
        rerender();
      },
    }))
  );
}

/* Das Blatt der Übersicht-Abschnitte; die Übersicht zeichnet sich über dataChanged neu */
function openDashboardSheet() {
  openColumnsSheet({
    title: words.dashboard,
    subtitle: words.dashboardHint,
    columns: dashSections,
    layout: homeLayout(),
    onChange: (layout) => {
      setHomeLayout(layout);
      emit(events.dataChanged);
    },
  });
}

/**
 * Klicks, die nur diese Liste kennt. Gibt true zurück, wenn er hierher gehörte;
 * `rerender` zeichnet das Blatt neu, ohne dass es nach oben springt.
 */
export function onOgClick(event, rerender) {
  if (!isOgSettings()) return false;
  if (event.target.closest("[data-og-more]")) {
    moreOpen = !moreOpen;
    rerender();
    return true;
  }
  const action = event.target.closest("[data-settings-action]")?.dataset.settingsAction;
  if (action === "theme-menu") openThemeMenu(rerender);
  else if (action === "dashboard") openDashboardSheet();
  else return false;
  return true;
}
