/*
 * Die Angaben der Person unter Einstellungen › Persönliche Daten: Name,
 * Mailadresse, Telefon, Links — und seit wann die App auf diesem Gerät
 * benutzt wird („Dabei seit …“). Alles liegt unter einem eigenen Schlüssel
 * im Browser-Speicher, nicht im Zustand mit den Einträgen. Ohne Eingabe
 * stehen die Vorgaben da: ein Platzhalter-Name und leere Felder.
 * Pfad: src/data/profile.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * defaultName   -> was als Name steht, solange niemand einen eingetragen hat
 * legacySince   -> „Dabei seit“ für Geräte, die die App schon vor dieser
 *                  Änderung benutzt haben (Format JJJJ-MM-TT); neue Geräte
 *                  bekommen den Tag ihres ersten Öffnens. Die Person kann den
 *                  Tag danach selbst ändern, aber nie in die Zukunft
 * maxLength     -> längste Eingabe je Feld; längere Texte werden gekürzt
 * firstLinkLabel -> Beschriftung der ersten Link-Zeile (sie bleibt immer stehen)
 */

import { dayKey, parseDay } from "../core/dates.js";
import { readJson, readText, storageKeys, writeJson } from "../core/storage.js";

export const defaultName = "Dein Name";
const legacySince = "2025-06-01";
const maxLength = 120;
const firstLinkLabel = "Website";

let cache = null;

function stored() {
  const saved = readJson(storageKeys.profile, {});
  const links = Array.isArray(saved.links) ? saved.links.filter((link) => link && typeof link.url === "string") : [];
  if (!links.length) links.push({ label: firstLinkLabel, url: "" });
  return {
    since: typeof saved.since === "string" ? saved.since : "",
    name: typeof saved.name === "string" ? saved.name : "",
    mail: typeof saved.mail === "string" ? saved.mail : "",
    phone: typeof saved.phone === "string" ? saved.phone : "",
    links,
  };
}

function profile() {
  if (!cache) cache = stored();
  return cache;
}

function save() {
  writeJson(storageKeys.profile, profile());
}

/**
 * Beim Start, vor dem Laden des Zustands: den Tag des ersten Öffnens merken.
 * Gibt es schon einen Zustand, aber noch keinen Eintrag, war das Gerät vorher
 * in Benutzung — dann gilt der alte feste Wert statt „heute“.
 */
export function trackFirstOpen() {
  if (stored().since) return;
  const used = readText(storageKeys.state) !== null;
  cache = { ...stored(), since: used ? legacySince : dayKey(new Date()) };
  save();
}

/** Die gespeicherten Angaben, leer wo nichts eingetragen ist (für die Eingabefelder). */
export function profileFields() {
  return profile();
}

/** Monat und Jahr des „Dabei seit“, z.B. „Juni 2025“ — oder leer, wenn der Speicher nicht zur Verfügung steht. */
export function sinceMonth() {
  /* Nur die ersten zehn Zeichen: ältere Stände trugen noch eine Uhrzeit dahinter */
  const date = parseDay(profile().since.slice(0, 10));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

/** „Dabei seit Juni 2025“ — oder leer. */
export function sinceText() {
  const month = sinceMonth();
  return month ? `Dabei seit ${month}` : "";
}

/** Den Tag („JJJJ-MM-TT“) des Dabei-seit ändern. Ein leerer oder zukünftiger Tag gilt nicht. */
export function setSince(day) {
  if (!day || day > dayKey(new Date())) return;
  profile().since = day;
  save();
}

/** Der angezeigte Name: der eingetragene oder der Platzhalter. */
export function shownName() {
  return profile().name || defaultName;
}

/** Die Buchstaben im runden Bild: erster Buchstabe des ersten und des letzten Worts. */
export function initialsOf(name) {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 1);
  return letters.map((word) => word[0].toUpperCase()).join("");
}

/** Name, Mail oder Telefon setzen. */
export function setProfileField(field, value) {
  profile()[field] = value.trim().slice(0, maxLength);
  save();
}

/** Die Adresse einer Link-Zeile setzen; eine leere Adresse entfernt jede Zeile außer der ersten. */
export function setLinkUrl(index, value) {
  const links = profile().links;
  if (!links[index]) return;
  const url = value.trim().slice(0, maxLength);
  if (!url && index > 0) links.splice(index, 1);
  else links[index].url = url;
  save();
}

/** Eine neue, leere Link-Zeile anhängen. Gibt ihre Nummer zurück. */
export function addLink() {
  const links = profile().links;
  links.push({ label: `Link ${links.length + 1}`, url: "" });
  save();
  return links.length - 1;
}
