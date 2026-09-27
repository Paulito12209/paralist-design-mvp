/*
 * Was sich allein aus einem Link ablesen lässt, ohne ihn aufzurufen:
 * YouTube-Kennung, Ort und Koordinaten aus einem Google-Maps-Link, der Name
 * der Website. Das Nachschlagen im Netz (Titel, Favicon-Farbe) macht
 * src/core/link-preview.js — was hier steht, gilt sofort und auch offline.
 * Pfad: src/data/link-kinds.js
 *
 * Keine anpassbaren visuellen Werte.
 */

/** Aus einer Eingabe einen vollständigen Link machen, sonst "". „www.x.de“ bekommt https:// davor. */
export function normalizeUrl(input) {
  const text = (input || "").trim();
  if (!text || /\s/.test(text)) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    /* Ohne Punkt im Namen ist es kein Link, sondern ein Wort („hallo“) */
    return /^https?:$/.test(url.protocol) && url.hostname.includes(".") ? url.href : "";
  } catch {
    return "";
  }
}

/** Der Rechnername ohne „www.“ — z.B. „github.com“. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Die elfstellige Kennung eines YouTube-Videos, sonst "". */
export function youtubeId(url) {
  try {
    const link = new URL(url);
    const host = link.hostname.replace(/^(www|m|music)\./, "");
    if (host === "youtu.be") return link.pathname.slice(1, 12);
    if (host !== "youtube.com" && host !== "youtube-nocookie.com") return "";
    if (link.searchParams.get("v")) return link.searchParams.get("v").slice(0, 11);
    const match = /^\/(?:shorts|embed|live|v)\/([\w-]{11})/.exec(link.pathname);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

/** Vorschaubild eines YouTube-Videos (braucht keinen Schlüssel und keine Anfrage vorab). */
export function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Ist das ein Kurzlink, dessen Ziel erst beim Aufrufen feststeht (maps.app.goo.gl)? */
export function isShortMapsLink(url) {
  const host = hostOf(url);
  return host === "maps.app.goo.gl" || host === "goo.gl" || host === "g.co";
}

/* „Good+Aroma“ -> „Good Aroma“ */
function readablePart(part) {
  try {
    return decodeURIComponent(part.replace(/\+/g, " ")).trim();
  } catch {
    return part.replace(/\+/g, " ").trim();
  }
}

/**
 * Ort aus einem Karten-Link: { name, lat, lng }; was fehlt, bleibt leer.
 * Versteht google.com/maps/place/…/@lat,lng, ?q=…/?query=… und Apple Maps (?q=…&ll=…).
 */
export function placeFromUrl(url) {
  const result = { name: "", lat: "", lng: "" };
  let link;
  try {
    link = new URL(url);
  } catch {
    return result;
  }
  const place = /\/maps\/place\/([^/]+)/.exec(link.pathname);
  if (place) result.name = readablePart(place[1]);
  const query = link.searchParams.get("q") || link.searchParams.get("query") || "";
  const coordsInQuery = /^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/.exec(query);
  if (!result.name && query && !coordsInQuery) result.name = readablePart(query);
  /* Der genaue Punkt steht bei Google als !3d…!4d… (die Stecknadel), sonst
     als @lat,lng (die Kartenmitte); Apple schreibt ll=lat,lng. */
  const pin = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(link.href);
  const centre = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(link.href);
  const apple = /^(-?\d+\.\d+),(-?\d+\.\d+)$/.exec(link.searchParams.get("ll") || "");
  const coords = pin || coordsInQuery || centre || apple;
  if (coords) {
    result.lat = coords[1];
    result.lng = coords[2];
  }
  return result;
}

/** Wonach die kleine Karte suchen soll: Koordinaten sind genauer als der Name. */
export function mapQuery(url, name) {
  const place = placeFromUrl(url);
  if (place.lat) return `${place.lat},${place.lng}`;
  return place.name || name || "";
}

/** Ein erster Name, bevor das Netz etwas Besseres liefert. */
export function guessName(kind, url) {
  if (kind === "place") return placeFromUrl(url).name;
  if (kind === "video") return youtubeId(url) ? "" : hostOf(url);
  return hostOf(url);
}
