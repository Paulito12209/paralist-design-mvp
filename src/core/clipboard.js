/*
 * Text in die Zwischenablage legen.
 * Pfad: src/core/clipboard.js
 *
 * Keine anpassbaren visuellen Werte.
 */

/*
 * Ersatzweg für Browser ohne navigator.clipboard (z.B. eine Seite über http
 * im Heimnetz): ein unsichtbares Textfeld markieren und „Kopieren“ auslösen.
 * execCommand gilt als veraltet, ist dort aber der einzige Weg.
 */
function copyWithField(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  /* position/opacity: das Feld darf nicht sichtbar werden und nichts verschieben */
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  let done = false;
  try {
    done = document.execCommand("copy");
  } catch {
    done = false;
  }
  field.remove();
  return done;
}

/** Text kopieren. Liefert true, wenn er in der Zwischenablage liegt. */
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* z.B. keine Berechtigung — dann der Ersatzweg */
    }
  }
  return copyWithField(text);
}
