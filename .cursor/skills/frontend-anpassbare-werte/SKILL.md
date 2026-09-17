---
name: frontend-anpassbare-werte
description: >-
  Keeps colors, font sizes and spacing easily adjustable via clearly documented,
  beginner-scoped HTML/CSS. Use when writing or editing frontend code (HTML/CSS)
  in Paulito's Git projects.
---

Use when writing or editing frontend code (HTML/CSS) in Paulito's Git projects, to keep colors, font sizes and spacing easily adjustable via clearly documented, beginner-scoped code.

Ziel
Beim Schreiben oder Bearbeiten von Frontend-Code (HTML, CSS, ggf. CSS-in-JS/styled-components) in diesem Projekt soll der Code so aufgebaut und kommentiert werden, dass Paulito selbstständig alle visuellen Werte (Farben, Schriftgrößen, Abstände zwischen Komponenten) anpassen kann — ohne die Struktur oder Logik des Codes verstehen oder verändern zu müssen.

Diese Regel gilt für jede Datei mit visuellem Code (CSS-Dateien, <style>-Blöcke, style-relevante Komponenten, Tailwind-Configs etc.), sowohl für neu geschriebenen als auch für bestehenden Code: wird eine bestehende Datei bearbeitet, wird bei dieser Gelegenheit auch der Kommentar-Header ergänzt, falls er fehlt.

1. Kommentar-Header ganz oben in jeder Datei mit visuellen Werten
Jede Datei, die visuelle Werte enthält, bekommt ganz oben einen Kommentarblock, der:

alle anpassbaren Werte dieser Datei auflistet (Variablenname bzw. Selektor/Eigenschaft)
kurz in Alltagssprache beschreibt, was der Wert visuell bewirkt (nicht nur den CSS-Namen wiederholen)
den Dateipfad relativ zum Projekt-Root nennt
Beispiel (CSS-Datei):

/*
 * ANPASSBARE WERTE IN DIESER DATEI
 * Pfad: src/components/Card/Card.css
 * -----------------------------------
 * --card-bg-color   -> Hintergrundfarbe der Karte
 * --card-padding     -> Innenabstand der Karte (Abstand Inhalt zum Rand)
 * --card-title-size  -> Schriftgröße des Karten-Titels
 */
Bei größeren Ordnerstrukturen zusätzlich: eine zentrale Übersicht (z.B. ganz oben in styles/variables.css oder in einer README) mit allen Dateien, die anpassbare Werte enthalten, jeweils mit Pfad-Angabe. So findet Paulito auch bei vielen Dateien schnell die richtige Stelle.

2. Zentrale Stellschrauben verwenden (CSS-Variablen)
Wo sinnvoll möglich: Farben, Schriftgrößen und Abstände als CSS-Variablen (:root { --... }) in einer zentralen Datei definieren und in den Komponenten nur referenzieren. Das reduziert die Zahl der Stellen, an denen Paulito suchen muss.

3. Erlaubter Umfang an HTML-Elementen
Standardmäßig nur folgende, bekannte HTML-Elemente verwenden:

div, section, nav, ul, li, header, footer, main, dialog, img, p, h1–h6, button

Weniger geläufige/spezialisierte Tags (z.B. article, aside, figure, picture, details, summary, template, canvas ...) nur einsetzen, wenn es ohne sie nicht sinnvoll geht — und dann direkt kommentieren, warum dieses Element nötig war und was es tut.

4. Erlaubter Umfang an CSS-Eigenschaften
Standardmäßig nur folgende, bekannte CSS-Eigenschaften verwenden:

color, background / background-color, height, width, max-width, max-height, font-size, font-weight, display: flex, flex-direction, justify-content, align-items, gap, padding, margin, box-shadow

Wird eine andere Eigenschaft zwingend benötigt (z.B. position, border-radius, transition, z-index):

so sparsam wie möglich einsetzen
direkt daneben kurz kommentieren, was sie bewirkt und warum keine Eigenschaft aus der Liste oben ausreicht
5. Kommentar-Stil
Kommentare auf Deutsch
Kurz und konkret, kein unnötiger Fachjargon
Bei jedem anpassbaren Wert wird beschrieben, was sich visuell ändert, wenn man ihn ändert — nicht nur der technische Name
6. Beim Anlegen neuer Komponenten/Dateien
Neue Dateien mit visuellem Code bekommen den Kommentar-Header aus Punkt 1 von Anfang an, und die zentrale Übersicht (Punkt 1, zweiter Absatz) wird um den neuen Eintrag ergänzt.

7. Nach jeder Änderung committen
Nach jeder abgeschlossenen Änderung in diesem Projekt (neue Datei, Bearbeitung, Bugfix) sofort einen Git-Commit anlegen — ohne extra nachzufragen.

- Nur die gerade geänderten, relevanten Dateien stagen
- Commit-Nachricht kurz, Fokus auf das Warum
- Keine Secrets (.env, Passwörter, Schlüssel) committen
- Git-Config nicht ändern, keine Hooks überspringen, kein force push
