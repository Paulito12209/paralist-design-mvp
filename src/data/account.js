/*
 * Die Angaben zum Konto: Name, Mailadresse, Plan, Initialen und die Version
 * der App. Das Profil-Blatt zeigt sie im Kopf, die Seitenleiste am Desktop
 * unten links. Name, Mail, Telefon, Links und „Dabei seit“ trägt die Person
 * selbst ein bzw. die App merkt sie sich (src/data/profile.js, dort stehen
 * auch Platzhalter-Name und Längen); Plan, Geräte und Version stehen fest hier.
 * Pfad: src/data/account.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * account.plan     -> Plan im Profilkopf und rechts in der Zeile „Plan verwalten“
 * account.devices  -> Geräte auf der Seite „Synchronisierung“: Name, Icon, letzter Abgleich
 * account.version  -> Versionszeile am Ende des Profils
 *
 * Gelesen werden die Angaben wie bisher als account.name, account.mail,
 * account.since, account.phone, account.links und account.initials — nur
 * kommen sie jetzt aus dem Speicher statt fest aus dieser Datei.
 */

import { initialsOf, profileFields, shownName, sinceText } from "./profile.js";

/* get: die Angaben ändern sich zur Laufzeit, jede Stelle liest sie beim Zeichnen frisch */
export const account = {
  get name() {
    return shownName();
  },
  get mail() {
    return profileFields().mail;
  },
  get since() {
    return sinceText();
  },
  get phone() {
    return profileFields().phone;
  },
  get links() {
    return profileFields().links;
  },
  get initials() {
    return initialsOf(shownName());
  },
  plan: "Pro",
  /* Cloud-Sync gibt es noch nicht: die Geräte zeigen nur den Aufbau der Seite */
  devices: [
    { name: "Dieses Gerät", icon: "smartphone", synced: "Gerade eben" },
    { name: "Web", icon: "laptop", synced: "Vor 2 Std" },
  ],
  version: "PARALIST 0.1.0 (MVP)",
};
