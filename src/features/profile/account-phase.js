/*
 * Welche Stufe der Konto-Einstellungen gezeigt wird. Die erste Android-App
 * kommt ohne Cloud und damit ohne Konto: dort gibt es nur „Profil“ (Persönliche Daten) und „Daten“
 * (Phase 1). Mit Cloud-Sync kommt das Konto dazu (Phase 2) — diese Stufe
 * zeigen „Android (Experiment)“, iOS, „Erster Test“ und der Desktop, damit
 * beide Stufen im Entwurf nebeneinander ausprobierbar sind.
 * Pfad: src/features/profile/account-phase.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * localOnlyVersions -> welche Fassungen unter „Mobil“ ohne Konto auskommen
 */

import { chosenVersion } from "../../data/platform-versions.js";
import { isDesk } from "../../ui/desk-mode.js";

const localOnlyVersions = ["android"];

/** true, wenn es ein Konto mit Cloud gibt (Phase 2), sonst nur lokale Daten. */
export function hasAccount() {
  if (isDesk()) return true;
  return !localOnlyVersions.includes(chosenVersion("mobile"));
}
