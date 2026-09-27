/*
 * Ein Bild aus der App als Datei: auf eine Grundfarbe flach rechnen (PNG
 * oder JPEG) und herunterladen. Weiß wie die Zeichenfläche — ein
 * durchsichtiges Bild mit schwarzen Strichen wäre auf dunklem Grund kaum zu
 * sehen, und JPEG kennt gar keine Durchsicht (es würde schwarz).
 * Pfad: src/core/image-export.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * JPEG_QUALITY    -> Qualität beim Speichern als JPEG (0–1: weniger heißt kleinere Datei, sichtbarere Kanten)
 * PAPER_COLOR     -> Grundfarbe hinter dem Bild
 * REVOKE_DELAY_MS -> wie lange die Adresse der Datei nach dem Herunterladen gültig bleibt;
 *                    Safari liest sie erst nach dem Klick, sofortiges Freigeben brach den Download ab
 */

const JPEG_QUALITY = 0.92;
const PAPER_COLOR = "#ffffff";
const REVOKE_DELAY_MS = 4000;

/* Ein Bild aus einer Daten-Adresse laden */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Bild auf die Grundfarbe legen und als Datei-Daten liefern.
 * @param type "image/png" oder "image/jpeg"
 */
export async function flattenImage(dataUrl, type = "image/png") {
  const img = await loadImage(dataUrl);
  /* canvas: nur zum Rechnen, kommt nie in die Seite — so entsteht die Datei in voller Auflösung */
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = PAPER_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Bild ließ sich nicht erzeugen"))), type, JPEG_QUALITY);
  });
}

/** Datei-Daten unter einem Namen herunterladen. */
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  /* a + download: ohne Teilen-Fenster ist Herunterladen das, was der Browser kann */
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
