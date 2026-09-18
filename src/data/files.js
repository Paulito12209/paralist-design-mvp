/*
 * Aus einer ausgewählten Datei werden Titel, Art, Dauer und ein kleines
 * Vorschaubild. Wird vom Eingabefeld und von der Medien-Seite benutzt und
 * erst beim ersten Anhängen nachgeladen.
 * Pfad: src/data/files.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * thumbSize    -> längste Kante der Vorschaubilder in Pixeln (kleiner = weniger Speicher, gröber)
 * thumbQuality -> Bildqualität der Vorschau (0 bis 1)
 * probeTimeout -> wie lange auf Video- und Audio-Daten gewartet wird (Millisekunden)
 */

import { pad2 } from "../core/dates.js";

const thumbSize = 360;
const thumbQuality = 0.8;
const probeTimeout = 4000;

/** Art einer Datei aus ihrem MIME-Typ. */
function fileKind(file) {
  const mime = file.type || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "doc";
}

/**
 * Titel einer Datei. Aufnahmen heißen „Foto 18.09.2026 02:41“,
 * importierte Dateien behalten ihren Namen ohne Endung.
 */
function fileTitle(file, kind, source) {
  const now = new Date();
  const stamp = `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (source === "photo") return `Foto ${stamp}`;
  if (source === "video") return `Video ${stamp}`;
  const base = (file.name || "").replace(/\.[^.]+$/, "").trim();
  if (base) return base;
  const labels = { image: "Foto", video: "Video", audio: "Aufnahme", doc: "Datei" };
  return `${labels[kind]} ${stamp}`;
}

/* canvas: nötig, um ein Bild verkleinert als kleine Datei zu speichern */
function drawThumb(source, width, height) {
  const scale = Math.min(1, thumbSize / Math.max(width || 1, height || 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((width || 1) * scale));
  canvas.height = Math.max(1, Math.round((height || 1) * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", thumbQuality);
}

/** Vorschaubild eines Bildes, oder `null`, wenn der Browser es nicht lesen kann. */
function imageThumb(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let thumb = null;
      try {
        thumb = drawThumb(img, img.naturalWidth, img.naturalHeight);
      } catch (error) {
        /* z.B. HEIC ohne Browser-Unterstützung: die Kachel zeigt dann nur das Icon */
      }
      URL.revokeObjectURL(url);
      resolve(thumb);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Standbild kurz nach dem Anfang eines Videos und dessen Dauer. */
function videoThumb(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    /* video: nötig, weil nur ein Videoelement ein Standbild liefern kann */
    const video = document.createElement("video");
    let done = false;
    const finish = (thumb) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve({ thumb, duration: Number.isFinite(video.duration) ? video.duration : 0 });
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      let thumb = null;
      try {
        thumb = drawThumb(video, video.videoWidth, video.videoHeight);
      } catch (error) {
        /* ohne Standbild bleibt das Video-Icon */
      }
      finish(thumb);
    };
    video.onerror = () => finish(null);
    setTimeout(() => finish(null), probeTimeout);
    video.src = url;
  });
}

/** Länge einer Audiodatei in Sekunden, 0 wenn sie sich nicht lesen lässt. */
function audioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => finish(0);
    setTimeout(() => finish(0), probeTimeout);
    audio.src = url;
  });
}

/**
 * Alles, was eine Datei für einen Eintrag braucht: Art, Titel, Dauer und Vorschau.
 * @param source "photo", "video", "audio" oder "import" — woher die Datei kommt.
 */
export async function describeFile(file, source) {
  const kind = fileKind(file);
  const described = {
    kind,
    title: fileTitle(file, kind, source),
    name: file.name || "",
    size: file.size || 0,
    mime: file.type || "",
    duration: 0,
    thumb: null,
  };
  if (kind === "image") {
    described.thumb = await imageThumb(file);
  } else if (kind === "video") {
    const result = await videoThumb(file);
    described.thumb = result.thumb;
    described.duration = result.duration;
  } else if (kind === "audio") {
    described.duration = await audioDuration(file);
  }
  return described;
}
