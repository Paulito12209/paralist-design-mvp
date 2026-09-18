/*
 * Bausteine für HTML-Schnipsel: Text absichern und Icons einsetzen.
 * Pfad: src/core/html.js
 *
 * Keine anpassbaren visuellen Werte — Farben und Größen der Icons stehen in
 * styles/base.css (Klasse .icon).
 */

/** Macht Nutzertext für die Ausgabe in HTML unschädlich (Titel, Namen, Suchbegriffe). */
export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
}

/**
 * Ein Icon aus dem SVG-Sprite.
 * @param name Name ohne Präfix, z.B. "inbox" für das Symbol "#icon-inbox".
 * @param className zusätzliche CSS-Klasse, wenn das Icon anders aussehen soll.
 */
export function icon(name, className = "") {
  return `<svg class="icon${className ? ` ${className}` : ""}"><use href="#icon-${name}"></use></svg>`;
}
