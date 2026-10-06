/*
 * ZIP-Dateien schreiben und lesen, ohne fremde Bibliothek — für den Export
 * „Vollständig“ und den Import (src/data/transfer-export.js,
 * src/data/transfer-import.js). Geschrieben wird mit Deflate über
 * CompressionStream, wenn der Browser das kann, sonst unkomprimiert; gelesen
 * wird beides. Dateinamen sind UTF-8. Kein Zip64: Dateien über 4 GB gibt es
 * in der App nicht.
 * Große Dateien (Fotos, Videos) bleiben beim Schreiben als Blob liegen: die
 * Prüfsumme wird stückweise gelesen, komprimiert wird nicht (sie sind es
 * schon), und das fertige ZIP setzt sich aus den Blobs zusammen, ohne sie in
 * den Arbeitsspeicher zu kopieren. Zwischen den Stücken bekommt die Seite
 * Zeit zum Zeichnen — so bleibt ein Handy bedienbar und zeigt den Fortschritt.
 * Pfad: src/core/zip.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * CHUNK_SIZE   -> in wie großen Stücken eine große Datei gelesen wird (kleiner: flüssigere Anzeige, mehr Pausen)
 * DEFLATE_MAX  -> bis zu welcher Größe komprimiert wird; größere Dateien werden unverändert abgelegt
 * PACKED_TYPES -> Dateitypen, die schon komprimiert sind und deshalb nie durch Deflate laufen
 */

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;
/* Bit 11 im Flag-Feld: Dateinamen sind UTF-8 */
const FLAG_UTF8 = 0x0800;
const CHUNK_SIZE = 4 * 1024 * 1024;
const DEFLATE_MAX = 8 * 1024 * 1024;
const PACKED_TYPES = /^(image\/(?!svg|bmp)|video\/|audio\/|application\/(zip|gzip|pdf))/;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/* Prüfsumme nach CRC-32, die Tabelle wird einmal gebaut. */
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/* Die laufende Prüfsumme um ein Stück Bytes fortschreiben (Start: 0xffffffff) */
function crcUpdate(crc, bytes) {
  let value = crc;
  for (let i = 0; i < bytes.length; i += 1) value = crcTable[(value ^ bytes[i]) & 0xff] ^ (value >>> 8);
  return value;
}

function crc32(bytes) {
  return (crcUpdate(0xffffffff, bytes) ^ 0xffffffff) >>> 0;
}

/* Der Seite einen Moment zum Zeichnen lassen — zwischen zwei Dateien oder Stücken */
function yieldToPage() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/* Prüfsumme einer großen Datei, stückweise gelesen, ohne sie ganz in den Speicher zu holen */
async function blobCrc(blob) {
  let crc = 0xffffffff;
  for (let at = 0; at < blob.size; at += CHUNK_SIZE) {
    const bytes = new Uint8Array(await blob.slice(at, at + CHUNK_SIZE).arrayBuffer());
    crc = crcUpdate(crc, bytes);
    await yieldToPage();
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* Soll diese Datei unverändert hinein? Blobs, die groß oder schon komprimiert sind, und alles mit `store` */
function storesAsIs(file) {
  if (!(file.data instanceof Blob)) return false;
  return Boolean(file.store) || file.data.size > DEFLATE_MAX || PACKED_TYPES.test(file.data.type || "");
}

/* Eine Datei zum Hineinschreiben vorbereiten: Prüfsumme, Daten (Bytes oder Blob), Methode */
async function prepare(file) {
  if (storesAsIs(file)) {
    return { crc: await blobCrc(file.data), packed: file.data, packedSize: file.data.size, rawSize: file.data.size, method: METHOD_STORE };
  }
  const raw = await toBytes(file.data);
  const deflated = raw.length && raw.length <= DEFLATE_MAX ? await pipe(raw, globalThis.CompressionStream) : null;
  /* Nur nehmen, wenn es wirklich kleiner wurde — sonst unkomprimiert */
  const packed = deflated && deflated.length < raw.length ? deflated : raw;
  return { crc: crc32(raw), packed, packedSize: packed.length, rawSize: raw.length, method: packed === raw ? METHOD_STORE : METHOD_DEFLATE };
}

/* Zeit und Datum im alten DOS-Format, wie ZIP es verlangt. */
function dosStamp(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

/* Einen Datenstrom durch eine (De-)Kompression schicken; null, wenn der Browser sie nicht kann. */
async function pipe(bytes, StreamClass) {
  if (typeof StreamClass !== "function") return null;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new StreamClass("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch (error) {
    return null;
  }
}

/* Beliebige Daten als Bytes: Text, Blob, ArrayBuffer oder schon Bytes. */
async function toBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  return encoder.encode(String(data ?? ""));
}

/**
 * Eine ZIP-Datei bauen.
 * @param files Liste von { name, data, store? } — `data` ist Text, Blob, ArrayBuffer
 *   oder Uint8Array; `store: true` legt die Datei unverändert ab
 * @param onProgress optional, ({ done, total, name }) vor jeder Datei
 * @param signal optional, ein AbortSignal — abgebrochen wirft die Funktion einen AbortError
 * @returns Blob vom Typ application/zip
 */
export async function writeZip(files, { onProgress, signal } = {}) {
  const stamp = dosStamp(new Date());
  const parts = [];
  const central = [];
  let offset = 0;

  for (const [index, file] of files.entries()) {
    if (signal?.aborted) throw new DOMException("Export abgebrochen", "AbortError");
    onProgress?.({ done: index, total: files.length, name: file.name });
    await yieldToPage();
    const { crc, packed, packedSize, rawSize, method } = await prepare(file);
    const name = encoder.encode(file.name);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, LOCAL_SIGNATURE, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, FLAG_UTF8, true);
    local.setUint16(8, method, true);
    local.setUint16(10, stamp.time, true);
    local.setUint16(12, stamp.day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, packedSize, true);
    local.setUint32(22, rawSize, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(local.buffer, name, packed);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, CENTRAL_SIGNATURE, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, FLAG_UTF8, true);
    entry.setUint16(10, method, true);
    entry.setUint16(12, stamp.time, true);
    entry.setUint16(14, stamp.day, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, packedSize, true);
    entry.setUint32(24, rawSize, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(entry.buffer, name);

    offset += 30 + name.length + packedSize;
  }
  onProgress?.({ done: files.length, total: files.length, name: "" });

  const centralSize = central.reduce((sum, part) => sum + part.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, END_SIGNATURE, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}

/* Das Ende-Verzeichnis steht am Schluss, davor darf ein Kommentar liegen: rückwärts suchen. */
function findEnd(view) {
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 22 - 0xffff); i -= 1) {
    if (view.getUint32(i, true) === END_SIGNATURE) return i;
  }
  return -1;
}

/** Sieht der Anfang der Datei nach ZIP aus? */
export function looksLikeZip(bytes) {
  return bytes.length > 4 && new DataView(bytes.buffer, bytes.byteOffset).getUint32(0, true) === LOCAL_SIGNATURE;
}

/**
 * Eine ZIP-Datei lesen.
 * @param buffer ArrayBuffer der Datei
 * @returns Liste von { name, size, bytes() } — `bytes()` liefert den Inhalt als Promise<Uint8Array>
 */
export function readZip(buffer) {
  const view = new DataView(buffer);
  const endAt = findEnd(view);
  if (endAt < 0) throw new Error("Kein ZIP-Verzeichnis gefunden");
  const count = view.getUint16(endAt + 10, true);
  let at = view.getUint32(endAt + 16, true);
  const files = [];

  for (let i = 0; i < count; i += 1) {
    if (view.getUint32(at, true) !== CENTRAL_SIGNATURE) break;
    const method = view.getUint16(at + 10, true);
    const packedSize = view.getUint32(at + 20, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const localAt = view.getUint32(at + 42, true);
    const name = decoder.decode(new Uint8Array(buffer, at + 46, nameLength));
    at += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;

    files.push({
      name,
      size,
      async bytes() {
        const localName = view.getUint16(localAt + 26, true);
        const localExtra = view.getUint16(localAt + 28, true);
        const start = localAt + 30 + localName + localExtra;
        const packed = new Uint8Array(buffer, start, packedSize);
        if (method === METHOD_STORE) return packed;
        if (method !== METHOD_DEFLATE) throw new Error(`Kompression ${method} wird nicht unterstützt`);
        const raw = await pipe(packed, globalThis.DecompressionStream);
        if (!raw) throw new Error("Der Browser kann diese ZIP-Datei nicht entpacken");
        return raw;
      },
    });
  }
  return files;
}
