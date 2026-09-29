/*
 * Das Profilbild: auswählen, verkleinern, speichern und groß ansehen.
 * Gespeichert werden zwei JPEG-Dateien als Text im Browser-Speicher: der
 * runde Ausschnitt, den die App zeigt, und das ganze Foto samt gewähltem
 * Ausschnitt — damit man den Ausschnitt später noch einmal ändern kann.
 * Den Ausschnitt wählt man in src/features/profile/avatar-crop.js.
 * Pfad: src/features/profile/avatar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sourceEdge -> längste Kante des gemerkten ganzen Fotos in Pixeln
 *               (größer = schärfer beim starken Hineinzoomen, braucht mehr Speicher)
 * quality    -> Bildqualität (0 bis 1)
 *
 * Größe der Anzeige steht in styles/profile.css (--profile-avatar-size).
 */

import { emit, events } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { readJson, readText, storageKeys, writeJson, writeText } from "../../core/storage.js";

const sourceEdge = 1280;
const quality = 0.86;

let photo = "";
/* Das ganze Foto und der Ausschnitt darin: { image, crop } oder null */
let source = null;
/* null = nichts zu speichern; sonst die Vorschau oder "" zum Entfernen */
let draft = null;
let draftSource = null;

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

/**
 * Das ganze Foto und der Ausschnitt, von dem aus man neu zuschneidet. Ältere
 * Profilbilder ohne gemerktes Foto schneidet man aus dem Bild selbst zu.
 */
export function currentSource() {
  const shown = draft === null ? source : draftSource;
  if (shown) return shown;
  const image = currentPhoto();
  return image ? { image, crop: null } : null;
}

/** Beim Start einlesen. */
export function loadPhoto() {
  const saved = readText(storageKeys.avatar);
  if (saved && saved.startsWith("data:image/")) photo = saved;
  const whole = readJson(storageKeys.avatarSource);
  if (photo && whole && typeof whole.image === "string" && whole.image.startsWith("data:image/")) source = whole;
}

/** Die offene Änderung verwerfen. */
export function discardDraft() {
  draft = null;
  draftSource = null;
}

/**
 * Eine Änderung vormerken. Ein leerer Wert entfernt das Bild.
 * @param whole das ganze Foto samt Ausschnitt ({ image, crop }), falls vorhanden
 */
export function setDraft(value, whole = null) {
  draft = value;
  draftSource = value ? whole : null;
}

/** Die vorgemerkte Änderung übernehmen und speichern. */
export function commitDraft() {
  photo = draft || "";
  source = photo ? draftSource : null;
  discardDraft();
  writeText(storageKeys.avatar, photo);
  /* Passt das ganze Foto nicht mehr in den Speicher, bleibt wenigstens der
     Ausschnitt erhalten — neu zuschneiden geht dann vom Ausschnitt aus. */
  if (!source || !writeJson(storageKeys.avatarSource, source)) writeText(storageKeys.avatarSource, "");
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
        const scale = Math.min(1, sourceEdge / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
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

/** Der runde Knopf oben rechts: Bild oder Standard-Icon. Meldet es weiter,
    damit auch die Konto-Zeile der Seitenleiste das neue Bild zeigt. */
export function renderProfileButton() {
  dom.profileBtn.innerHTML = photo
    ? `<img class="avatar-photo" src="${photo}" alt="">`
    : `<svg class="icon"><use href="#icon-profile"></use></svg>`;
  emit(events.profileChanged);
}

/** Die große Ansicht des Bildes füllen. */
export function renderAvatarStage() {
  const shown = currentPhoto();
  dom.avatarViewStage.innerHTML = shown
    ? `<img src="${shown}" alt="Profilbild">`
    : `<div class="avatar-view-fallback">PA</div>`;
}

/** Die beiden unsichtbaren Dateifelder für Kamera und Mediathek; `onPicked` bekommt das ganze Foto. */
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
