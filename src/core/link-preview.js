/*
 * Einen Link im Netz nachschlagen: Titel eines YouTube-Videos, Name eines
 * Ortes hinter einem Google-Maps-Kurzlink, Titel einer Website und die Farbe
 * ihres Favicons. Der Browser darf fremde Seiten nicht selbst lesen (CORS) —
 * darum fragen wir zwei öffentliche Dienste, die genau das erlauben:
 * noembed.com (Videos) und api.microlink.io (Websites und Kurzlinks, ohne
 * Schlüssel mit Tageslimit). Klappt es nicht (offline, Limit erreicht), kommt
 * null zurück und die Karte behält, was sich aus dem Link selbst lesen ließ.
 * Nachgeladen über src/core/lazy.js erst, wenn eine Karte etwas braucht.
 * Pfad: src/core/link-preview.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * PREVIEW_TIMEOUT_MS -> so lange wird höchstens auf einen Dienst gewartet
 * FAVICON_SIZE       -> in welcher Größe das Favicon geholt wird (Pixel)
 * COLOR_SAMPLE       -> auf so viele Pixel Kantenlänge wird das Favicon zum
 *                       Farbe-Ablesen verkleinert (kleiner = schneller, gröber)
 * MIN_SATURATION     -> blassere Pixel (Weiß, Grau, Schwarz) zählen kaum mit
 */

const PREVIEW_TIMEOUT_MS = 8000;
const FAVICON_SIZE = 64;
const COLOR_SAMPLE = 24;
const MIN_SATURATION = 0.25;

/* JSON holen, nach PREVIEW_TIMEOUT_MS abbrechen; bei jedem Fehler null. */
async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* „Good Aroma · Tempelhofer Damm 1 - Google Maps“ -> „Good Aroma“ */
function placeTitle(title) {
  return (title || "").replace(/\s*[-–·|]\s*Google Maps\s*$/i, "").split(" · ")[0].trim();
}

/** Titel, Kanal und Seitenverhältnis (Höhe geteilt durch Breite, 0 = unbekannt)
    eines Videos über noembed.com: { name, sub, ratio } oder null. */
export async function videoPreview(url) {
  const data = await fetchJson(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
  if (!data || data.error || !data.title) return null;
  const ratio = data.width > 0 && data.height > 0 ? data.height / data.width : 0;
  return { name: data.title, sub: data.author_name || "", ratio };
}

/**
 * Eine Seite über microlink nachschlagen: { name, url, color } oder null.
 * url ist das Ziel nach allen Weiterleitungen — bei einem Maps-Kurzlink der
 * lange Link mit Ortsname und Koordinaten.
 */
export async function pagePreview(url, { place = false } = {}) {
  const data = await fetchJson(`https://api.microlink.io/?palette=true&url=${encodeURIComponent(url)}`);
  const page = data && data.status === "success" ? data.data : null;
  if (!page) return null;
  const name = place ? placeTitle(page.title) : page.title || page.publisher || "";
  const color = page.logo?.background_color || (page.logo?.palette || [])[0] || "";
  return { name: name.trim(), url: page.url || url, color: /^#[0-9a-f]{6}$/i.test(color) ? color : "" };
}

/** Adresse des Favicons einer Website (ein Bild, das jeder Browser laden darf). */
export function faviconUrl(host) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${FAVICON_SIZE}`;
}

/* r, g, b (0–255) -> Sättigung 0–1 wie im HSL-Farbraum */
function saturation(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const light = (max + min) / 2;
  if (max === min) return 0;
  return (max - min) / (1 - Math.abs(2 * light - 1));
}

const hex = (value) => Math.round(value).toString(16).padStart(2, "0");

/*
 * Die kräftigste Farbe eines Bildes: bunte Pixel zählen stark, blasse kaum.
 * Ein losgelöstes canvas nur zum Rechnen — es kommt nie auf die Seite.
 */
function dominantColor(image) {
  const canvas = document.createElement("canvas");
  canvas.width = COLOR_SAMPLE;
  canvas.height = COLOR_SAMPLE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, COLOR_SAMPLE, COLOR_SAMPLE);
  const { data } = context.getImageData(0, 0, COLOR_SAMPLE, COLOR_SAMPLE);
  let red = 0;
  let green = 0;
  let blue = 0;
  let weight = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const sat = saturation(data[i], data[i + 1], data[i + 2]);
    const w = sat >= MIN_SATURATION ? 1 + sat * 4 : 0.05;
    red += data[i] * w;
    green += data[i + 1] * w;
    blue += data[i + 2] * w;
    weight += w;
  }
  return weight ? `#${hex(red / weight)}${hex(green / weight)}${hex(blue / weight)}` : "";
}

/**
 * Die Farbe des Favicons ablesen; "" wenn der Dienst das Bild nicht zum
 * Auslesen freigibt (dann bleibt nur die Farbe aus colorFromText).
 */
export function faviconColor(host) {
  return new Promise((resolve) => {
    const image = new Image();
    /* crossOrigin: nur so darf das canvas die Pixel danach auslesen */
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        resolve(dominantColor(image));
      } catch {
        resolve("");
      }
    };
    image.onerror = () => resolve("");
    image.src = faviconUrl(host);
  });
}

/** Eine feste, gut sichtbare Farbe aus einem Wort — dieselbe Website bekommt immer dieselbe. */
export function colorFromText(text) {
  let hash = 0;
  for (const char of text || "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 55% 50%)`;
}
