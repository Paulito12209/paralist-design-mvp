/*
 * Das Profilbild: auswählen, verkleinern, speichern und groß ansehen.
 * Das Bild liegt als kleine JPEG-Datei im Text im Browser-Speicher.
 * Pfad: src/features/profile/avatar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxEdge -> längste Kante des gespeicherten Bildes in Pixeln
 * quality -> Bildqualität (0 bis 1)
 *
 * Größe der Anzeige steht in styles/profile.css (--profile-avatar-size).
 */

import { dom, el } from "../../core/dom.js";
import { readText, storageKeys, writeText } from "../../core/storage.js";

const maxEdge = 512;
const quality = 0.86;

let photo = "";
/* null = nichts zu speichern; sonst die Vorschau oder "" zum Entfernen */
let draft = null;

/** Das gespeicherte Bild. */
export function savedPhoto() {
  return photo;
}

/** Das Bild, das gerade gezeigt wird — mit noch nicht gespeicherter Änderung. */
export function currentPhoto() {
  return draft === null ? photo : draft;
}

/** Gibt es eine Änderung, die noch gespeichert werden kann? */
export function hasDraft() {
  return draft !== null;
}

/** Beim Start einlesen. */
export function loadPhoto() {
  const saved = readText(storageKeys.avatar);
  if (saved && saved.startsWith("data:image/")) photo = saved;
}

/** Die offene Änderung verwerfen. */
export function discardDraft() {
  draft = null;
}

/** Eine Änderung vormerken. Ein leerer Wert entfernt das Bild. */
export function setDraft(value) {
  draft = value;
}

/** Die vorgemerkte Änderung übernehmen und speichern. */
export function commitDraft() {
  photo = draft || "";
  draft = null;
  writeText(storageKeys.avatar, photo);
}

/*
 * canvas: nötig, um das Bild klein genug für den Gerätespeicher zu machen —
 * ein Foto vom Handy wäre sonst mehrere Megabyte groß.
 */
export function fileToPhoto(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let result = null;
      try {
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
        canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        result = canvas.toDataURL("image/jpeg", quality);
      } catch (error) {
        /* z.B. HEIC ohne Browser-Unterstützung */
      }
      URL.revokeObjectURL(url);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Der runde Knopf oben rechts: Bild oder Standard-Icon. */
export function renderProfileButton() {
  dom.profileBtn.innerHTML = photo
    ? `<img class="avatar-photo" src="${photo}" alt="">`
    : `<svg class="icon"><use href="#icon-profile"></use></svg>`;
}

/** Die große Ansicht des Bildes füllen. */
export function renderAvatarStage() {
  const shown = currentPhoto();
  dom.avatarViewStage.innerHTML = shown
    ? `<img src="${shown}" alt="Profilbild">`
    : `<div class="avatar-view-fallback">PA</div>`;
}

/** Die beiden unsichtbaren Dateifelder für Kamera und Mediathek. */
export function bindPhotoInputs(onPicked) {
  ["photo", "library"].forEach((source) => {
    const input = el(`profile-file-${source}`);
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      const result = await fileToPhoto(file);
      if (result) onPicked(result);
    });
  });
}
