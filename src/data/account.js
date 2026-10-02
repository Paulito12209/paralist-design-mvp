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
 * account.since    -> „Dabei seit …“ unter der Mailadresse; davor steht der Plan (nur mit Konto, Phase 2)
 * account.plan     -> Plan im Profilkopf und rechts in der Zeile „Plan verwalten“
 * account.phone    -> Telefonnummer unter „Persönliche Daten“ (leer = „Hinzufügen“)
 * account.links    -> eigene Links unter „Persönliche Daten“: Name und Adresse
 * account.devices  -> Geräte auf der Seite „Synchronisierung“: Name, Icon, letzter Abgleich
 * account.version  -> Versionszeile am Ende des Profils
 * account.initials -> Buchstaben im runden Bild, solange kein Foto hinterlegt ist
 */

export const account = {
  name: "Paul Angeles",
  mail: "paul@paralist.app",
  since: "Dabei seit Juni 2025",
  plan: "Pro",
  phone: "",
  links: [{ label: "Website", url: "paralist.app" }],
  /* Cloud-Sync gibt es noch nicht: die Geräte zeigen nur den Aufbau der Seite */
  devices: [
    { name: "Dieses Gerät", icon: "smartphone", synced: "Gerade eben" },
    { name: "Web", icon: "laptop", synced: "Vor 2 Std" },
  ],
  version: "PARALIST 0.1.0 (MVP)",
  initials: "PA",
};
