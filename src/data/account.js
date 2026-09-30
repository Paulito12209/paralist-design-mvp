/*
 * Die festen Angaben zum Konto: Name, Mailadresse, Plan, Initialen und die
 * Version der App. Das Profil-Blatt zeigt sie im Kopf, die Seitenleiste am
 * Desktop unten links. Solange es noch keine Anmeldung gibt, stehen sie hier.
 * Pfad: src/data/account.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * account.name     -> Name im Profil und unten in der Seitenleiste
 * account.mail     -> Mailadresse unter dem Namen im Profil
 * account.meta     -> Zeile unter der Mailadresse („Pro · Dabei seit …“)
 * account.plan     -> Plan in den Kontoeinstellungen
 * account.version  -> Versionszeile am Ende des Profils
 * account.initials -> Buchstaben im runden Bild, solange kein Foto hinterlegt ist
 */

export const account = {
  name: "Paul Angeles",
  mail: "paul@paralist.app",
  meta: "Pro · Dabei seit Juni 2025",
  plan: "Pro",
  version: "PARALIST 0.1.0 (MVP)",
  initials: "PA",
};
