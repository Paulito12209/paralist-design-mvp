# 2026-10-02-bottom-sheet-material

## Problem
Bottom Sheets in der Android-Fassung hatten im Dunkelmodus einen hellen Schein
um die Karte, die oberen Ecken waren mit 28px sehr rund, und der Schleier
dahinter entsprach nicht Material 3 (wie in Google Tasks).

## Änderung
- `styles/android-bottom-sheet.css`: neue Regel mit Vorsatz `html[data-mobile-os="android"]`,
  die für Sortieren/Filtern/Typ ändern/Datum (`.modal.date-modal`), das
  Auswahl-Blatt (`.sheet-backdrop.is-m3 .sheet`) und das Details-Blatt
  (`.details-sheet .sheet`) `box-shadow: none` setzt. Der Schleier ist jetzt
  schwarz mit `--m3-sheet-scrim-alpha` und blendet beim Ziehen weiter mit aus
  (`--modal-dim`). Kopfkommentar angepasst.
- `styles/android-sheet.css`: Schleier des Blatts „Ansicht“ nutzt denselben Wert.
- `styles/tokens-android.css`: `--m3-sheet-radius` von 28px auf 16px,
  neuer Wert `--m3-sheet-scrim-alpha: 0.32`.

## Begründung
Der Schein kam aus `styles/overlays.css` (weißer `box-shadow` für `.modal`
und `.sheet` im Dunkelmodus, ein iOS-Look) und hat das `box-shadow: none` der
Android-Fassung per Spezifität überstimmt. Die neue Regel gewinnt dagegen,
ohne `overlays.css` und damit die iOS-Fassung anzufassen. 16px ist die
Material-3-Stufe „Large“; 28px ist „Extra large“. Ein gemeinsamer Wert gilt für
alle Blätter von unten. Der Schleier folgt Material 3: schwarz, 32 %. Das
Plus-Menü behält `--m3-scrim`. Verworfen: den Dunkel-Schein in `overlays.css`
löschen (würde iOS ändern).

## Visualisierung
Vorher:
```
      ░░░░░░ heller Schein ░░░░░░
   ╭──────────────────────────────╮   Ecken 28px
   │ Sortieren                    │   Schleier 82 % fast schwarz
```

Nachher:
```
   ╭──────────────────────────────╮   Ecken 16px, kein Schein
   │ Sortieren                    │   Schleier 32 % schwarz
   │ WONACH      REIHENFOLGE      │
```

## Hinweise
- Blatt „Ansicht“ und Details-Blatt wurden nur über die gemeinsamen Werte
  geändert, nicht per Screenshot geprüft.
- Der Schleier im Hellmodus ist sichtbar anders als vorher (vorher weißlich).
- Wer einen anderen Radius will: nur `--m3-sheet-radius` ändern.
- iOS-Fassung und Desktop sind nicht berührt.
