/*
 * Die Unterseite Einstellungen › Mehr › Versionen: oben „Mobil“ mit Erster
 * Test, Android und iOS, darunter „Desktop“ mit Erster Test, Windows und
 * macOS — je Gruppe genau eine Wahl mit Haken. Die Wahl gilt dauerhaft und steht als data-mobile-os und
 * data-desk-os an <html> (Zustand in src/data/platform-versions.js). Klicks
 * kommen aus src/features/profile/profile.js über onVersionsClick.
 * Pfad: src/features/profile/versions.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * note -> der graue Satz unter den Gruppen
 *
 * Aussehen der Zeilen und Hinweise in styles/settings.css.
 */

import { icon } from "../../core/html.js";
import { chosenLabel, chosenVersion, platforms, setVersion } from "../../data/platform-versions.js";

const note = "Die gewählte Fassung bleibt, bis du sie hier änderst. Am Handy und Tablet gilt „Mobil“, am Computer „Desktop“.";

/** Die Wahl an <html> schreiben, damit die Stile der Fassung sofort greifen. */
export function applyVersions() {
  document.documentElement.dataset.mobileOs = chosenVersion("mobile");
  document.documentElement.dataset.deskOs = chosenVersion("desk");
}

/** Kurzfassung für den rechten Rand der Zeile, z.B. „Android · macOS“; gleiche Wahl nur einmal. */
export function versionsSummary() {
  const mobile = chosenLabel("mobile");
  const desk = chosenLabel("desk");
  return mobile === desk ? mobile : `${mobile} · ${desk}`;
}

/* Eine Gruppe: Überschrift und ihre Zeilen, der Haken bei der gewählten Fassung. */
function groupMarkup(platform) {
  const chosen = chosenVersion(platform.id);
  const rows = platform.options
    .map((option) => {
      const on = option.id === chosen;
      return `
      <button class="settings-row${on ? " is-active" : ""}" type="button" data-version="${platform.id}:${option.id}" aria-pressed="${on}">
        ${icon(option.icon)}
        <span>${option.label}</span>
        ${icon("check", "settings-check")}
      </button>`;
    })
    .join("");
  return `<p class="psection">${platform.title}</p><div class="settings-group">${rows}</div>`;
}

/** Unterseite Versionen. */
export function versionsCard() {
  return `${platforms.map(groupMarkup).join("")}<p class="settings-note">${note}</p>`;
}

/** Klick auf eine Fassung erledigen. Gibt true zurück, wenn er hierher gehörte. */
export function onVersionsClick(event) {
  const row = event.target.closest("[data-version]");
  if (!row) return false;
  const [platformId, versionId] = row.dataset.version.split(":");
  setVersion(platformId, versionId);
  applyVersions();
  return true;
}
