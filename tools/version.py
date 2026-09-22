#!/usr/bin/env python3
"""
Schreibt den Versionsstempel der App nach src/data/version.js.

Aufruf im Projektordner, nach jeder Änderung und vor dem Commit:

    python3 tools/version.py

Der Stempel ist ein Prüfwert über alle Dateien, die der Browser lädt. Ändert
sich irgendeine davon, ändert sich der Stempel — und eine offene App merkt beim
nächsten Nachsehen, dass es eine neue Fassung gibt, und bietet das Aktualisieren
an (src/shell/update-prompt.js). tools/check.py meldet, wenn der Stempel nicht
mehr zu den Dateien passt.

Bei einem Merge-Konflikt in src/data/version.js einfach dieses Skript noch
einmal laufen lassen: die Datei wird immer komplett neu geschrieben.

ANPASSBARE WERTE IN DIESER DATEI
-----------------------------------
SERVED     -> welche Dateien und Ordner zur ausgelieferten App gehören
STAMP_LEN  -> wie viele Zeichen des Prüfwerts im Stempel stehen
"""

import hashlib
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "src" / "data" / "version.js"
SERVED = ("index.html", "manifest.webmanifest", "assets", "src", "styles")
STAMP_LEN = 12

HEADER = """/*
 * Versionsstempel der App und die Liste aller Dateien, die sie lädt.
 * Diese Datei schreibt tools/version.py — nicht von Hand ändern, sondern das
 * Skript laufen lassen. src/shell/update-prompt.js vergleicht den Stempel hier
 * mit dem auf dem Server und holt beim Aktualisieren genau diese Dateien frisch.
 * Pfad: src/data/version.js
 *
 * Keine anpassbaren visuellen Werte: welche Dateien dazugehören, steht in
 * tools/version.py (SERVED).
 */
"""


def served_files():
    """Alle ausgelieferten Dateien, sortiert, ohne den Stempel selbst."""
    found = []
    for name in SERVED:
        path = ROOT / name
        items = [path] if path.is_file() else sorted(path.rglob("*"))
        for item in items:
            if item.is_file() and item.name != ".DS_Store" and item != TARGET:
                found.append(item.relative_to(ROOT).as_posix())
    return sorted(found)


def stamp(files):
    digest = hashlib.sha256()
    for name in files:
        digest.update(name.encode("utf-8") + b"\0")
        digest.update((ROOT / name).read_bytes() + b"\0")
    return digest.hexdigest()[:STAMP_LEN]


def expected_text():
    """So muss src/data/version.js aussehen, damit sie zu den Dateien passt."""
    files = served_files()
    # "./" ist die Startadresse selbst: der Browser merkt sich index.html auch darunter.
    listed = ["./", "src/data/version.js"] + files
    lines = "\n".join(f'  "{name}",' for name in listed)
    return (
        f"{HEADER}\n"
        f'export const appVersion = "{stamp(files)}";\n\n'
        "/* Alle Dateien, die beim Aktualisieren am Zwischenspeicher vorbei neu geholt werden. */\n"
        f"export const appFiles = [\n{lines}\n];\n"
    )


def is_current():
    return TARGET.exists() and TARGET.read_text(encoding="utf-8") == expected_text()


def main():
    TARGET.write_text(expected_text(), encoding="utf-8")
    print(f"Versionsstempel geschrieben: {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
