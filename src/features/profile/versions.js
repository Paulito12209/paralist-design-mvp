/*
 * Die Unterseite Einstellungen › Mehr › Versionen: oben „Mobil“ mit Erster
 * Test, Android und iOS, darunter „Desktop“ mit Erster Test, Windows und
 * macOS — je Gruppe genau eine Wahl mit Haken. Die Wahl gilt dauerhaft und steht als data-mobile-os und
 * data-desk-os an <html> (Zustand in src/data/platform-versions.js). Klicks
 * kommen aus src/features/profile/profile.js über onVersionsClick.
 * Pfad: src/features/profile/versions.js
 *
 * Eine Fassung mit Unterschieden („Android (Experiment)“) trägt ein ⓘ hinter
 * ihrem Namen; ein Tipp darauf öffnet ein Blatt, das je Bereich auflistet,
 * was sie anders macht als ihre Grundfassung — und wählt sie nicht aus.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * note         -> der graue Satz unter den Gruppen
 * diffHeading  -> Überschrift über der Liste im Blatt
 *
 * Aussehen der Zeilen und Hinweise in styles/settings.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { chosenLabel, chosenLook, chosenVersion, platforms, setVersion, versionOption } from "../../data/platform-versions.js";
import { applyTabs } from "../../ui/tabs-visibility.js";
import { openSheet } from "../../ui/sheet.js";

const diffHeading = "Anders als „Android“";
const note = "Die gewählte Fassung bleibt, bis du sie hier änderst. Am Handy und Tablet gilt „Mobil“, am Computer „Desktop“.";

/** Die Wahl an <html> schreiben, damit die Stile der Fassung sofort greifen. */
export function applyVersions() {
  const mobile = chosenLook("mobile");
  const root = document.documentElement;
  root.dataset.mobileOs = mobile.os;
  /* Spielart einer Fassung, z.B. Android ohne Symbol „Ansicht“ oben */
  if (mobile.variant) root.dataset.mobileVariant = mobile.variant;
  else delete root.dataset.mobileVariant;
  root.dataset.deskOs = chosenVersion("desk");
  /* Die Reiter-Vorgaben hängen an der Fassung (src/data/tabs-visibility.js) */
  applyTabs();
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
      /* Kein Knopf im Knopf: das ⓘ ist ein span, den onVersionsClick zuerst prüft */
      const info = option.differences
        ? `<span class="sheet-info" role="button" tabindex="0" data-version-info="${platform.id}:${option.id}" aria-label="Was ist anders an „${escapeHtml(option.label)}“?">${icon("info")}</span>`
        : "";
      return `
      <button class="settings-row${on ? " is-active" : ""}" type="button" data-version="${platform.id}:${option.id}" aria-pressed="${on}">
        ${icon(option.icon)}
        <span class="settings-row-label">${option.label}${info}</span>
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

/* Blatt mit den Unterschieden einer Fassung: je Bereich Name und Satz */
function openDifferences(platformId, versionId) {
  const option = versionOption(platformId, versionId);
  if (!option?.differences) return;
  openSheet(option.label, [
    { heading: true, label: diffHeading },
    ...option.differences.map((item) => ({ detail: true, label: item.area, value: item.text })),
  ]);
}

/** Klick auf eine Fassung erledigen. Gibt true zurück, wenn er hierher gehörte. */
export function onVersionsClick(event) {
  const info = event.target.closest("[data-version-info]");
  if (info) {
    openDifferences(...info.dataset.versionInfo.split(":"));
    return true;
  }
  const row = event.target.closest("[data-version]");
  if (!row) return false;
  const [platformId, versionId] = row.dataset.version.split(":");
  setVersion(platformId, versionId);
  applyVersions();
  return true;
}
