#!/usr/bin/env python3
"""
Prueft die Regeln aus .claude/skills/paralist-clean-code/SKILL.md.

Aufruf im Projektordner:

    python3 tools/check.py

Ohne Ausgabe ausser "alles in Ordnung" ist nichts zu tun. Jeder Fund nennt
Datei und Zeile. Das Skript braucht nur Python 3 und aendert nichts.

ANPASSBARE WERTE IN DIESER DATEI
-----------------------------------
MAX_LINES  -> die harte Zeilengrenze je Datei
LAYERS     -> die erlaubte Importrichtung (kleine Zahl = untere Schicht)
"""

import pathlib
import re
import sys

MAX_LINES = 400
LAYERS = {"core": 0, "data": 1, "ui": 2, "features": 3, "shell": 3}
ROOT = pathlib.Path(__file__).resolve().parent.parent

problems = []


def note(where, text):
    problems.append(f"{where}: {text}")


def js_files():
    return sorted((ROOT / "src").rglob("*.js"))


def css_files():
    return sorted((ROOT / "styles").glob("*.css"))


def rel(path):
    return str(pathlib.Path(path).resolve().relative_to(ROOT))


def layer_of(path):
    parts = pathlib.Path(rel(path)).parts
    if len(parts) > 1 and parts[0] == "src":
        return LAYERS.get(parts[1], 4)
    return 4


def code_of(text):
    """Die Datei ohne Kommentare — damit Beispiele in Kommentaren nicht als Code gelten."""
    without_blocks = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    lines = [line for line in without_blocks.split("\n") if not line.lstrip().startswith("//")]
    return "\n".join(lines)


def header_of(text):
    """Der Kommentarblock am Anfang der Datei, sonst leer."""
    if not text.startswith("/*"):
        return ""
    end = text.find("*/")
    return text[: end + 2] if end > 0 else ""


def check_line_limit():
    patterns = ("*.js", "*.css", "*.html", "*.svg", "*.md", "*.py", "*.webmanifest", "*.json")
    for pattern in patterns:
        for path in sorted(ROOT.rglob(pattern)):
            if ".git" in path.parts or "node_modules" in path.parts:
                continue
            lines = path.read_text(encoding="utf-8").count("\n") + 1
            if lines > MAX_LINES:
                note(rel(path), f"{lines} Zeilen — erlaubt sind {MAX_LINES}")


def check_headers():
    for path in js_files() + css_files():
        text = path.read_text(encoding="utf-8")
        head = header_of(text)
        if not head:
            note(rel(path), "kein Kopfkommentar")
            continue
        if f"Pfad: {rel(path)}" not in head:
            note(rel(path), "Kopfkommentar nennt den Pfad nicht oder falsch")
        if "ANPASSBARE WERTE" not in head and "Keine anpassbaren" not in head and "Keine eigenen anpassbaren" not in head:
            note(rel(path), "Kopfkommentar sagt nichts zu anpassbaren Werten")


def check_imports():
    exports = {}
    for path in js_files():
        text = code_of(path.read_text(encoding="utf-8"))
        names = set()
        names |= set(re.findall(r"^export\s+(?:async\s+)?function\s+(\w+)", text, re.M))
        names |= set(re.findall(r"^export\s+(?:const|let|class)\s+(\w+)", text, re.M))
        for block in re.findall(r"^export\s*\{([^}]*)\}", text, re.M):
            for part in block.split(","):
                if part.strip():
                    names.add(part.strip().split(" as ")[-1].strip())
        exports[rel(path)] = names

    for path in js_files():
        text = code_of(path.read_text(encoding="utf-8"))
        for block, spec in re.findall(r"import\s*\{([^}]*)\}\s*from\s*[\"']([^\"']+)[\"']", text):
            target = (path.parent / spec).resolve()
            if not target.exists():
                note(rel(path), f"Import zeigt auf eine fehlende Datei: {spec}")
                continue
            for part in block.split(","):
                name = part.strip().split(" as ")[0].strip()
                if name and name not in exports.get(rel(target), set()):
                    note(rel(path), f"'{name}' wird von {rel(target)} nicht exportiert")
        for spec in re.findall(r"import\(\s*[\"']([^\"']+)[\"']\s*\)", text):
            if not (path.parent / spec).resolve().exists():
                note(rel(path), f"Nachladen zeigt auf eine fehlende Datei: {spec}")


def check_direction():
    pattern = re.compile(r"[\"'](\.[^\"']+\.js)[\"']")
    for path in js_files():
        own = layer_of(path)
        own_parts = pathlib.Path(rel(path)).parts
        for spec in pattern.findall(code_of(path.read_text(encoding="utf-8"))):
            target = (path.parent / spec).resolve()
            if not target.exists():
                continue
            if layer_of(target) > own:
                note(rel(path), f"importiert nach oben: {rel(target)}")
            parts = pathlib.Path(rel(target)).parts
            if (
                len(own_parts) > 2
                and len(parts) > 2
                and own_parts[1] == "features"
                and parts[1] == "features"
                and own_parts[2] != parts[2]
            ):
                note(rel(path), f"ein Bereich importiert einen anderen: {rel(target)}")


def check_data_layer():
    forbidden = re.compile(r"\b(getElementById|querySelector|querySelectorAll|innerHTML|addEventListener|classList)\b")
    for path in sorted((ROOT / "src" / "data").rglob("*.js")):
        for number, line in enumerate(path.read_text(encoding="utf-8").split("\n"), 1):
            if forbidden.search(line):
                note(f"{rel(path)}:{number}", "die Datenschicht fasst die Seite an")


def check_css_variables():
    def strip(text):
        return re.sub(r"/\*.*?\*/", "", text, flags=re.S)

    js = "\n".join(path.read_text(encoding="utf-8") for path in js_files())
    from_js = set(re.findall(r'setProperty\("(--[\w-]+)"', js))
    from_js |= set(re.findall(r"(--[\w-]+):\s*\$\{", js))
    from_js |= set(re.findall(r"var\((--[\w-]+)\)", js))

    defined = set()
    for path in css_files():
        defined |= set(re.findall(r"^\s*(--[\w-]+)\s*:", strip(path.read_text(encoding="utf-8")), re.M))
    known = defined | from_js

    for path in css_files():
        text = path.read_text(encoding="utf-8")
        for name in set(re.findall(r"var\((--[\w-]+)", strip(text))):
            if name not in known:
                note(rel(path), f"benutzt {name}, aber nirgends definiert")
        for name in set(re.findall(r"(--[a-z][\w-]*)", header_of(text))):
            if name not in known:
                note(rel(path), f"Kopfkommentar nennt {name}, gibt es aber nicht")

    for path in js_files():
        for name in set(re.findall(r"(--[a-z][\w-]*)", header_of(path.read_text(encoding="utf-8")))):
            if name not in known:
                note(rel(path), f"Kopfkommentar nennt {name}, gibt es aber nicht")


def check_html_ids():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    ids = set(re.findall(r'\sid="([^"]+)"', html))
    js = "\n".join(path.read_text(encoding="utf-8") for path in js_files())

    # Felder, die erst beim Zeichnen entstehen, stehen nicht in index.html
    created_later = {"tab-name-input", "workspace-name-input", "workspace-body", "cal-now", "cal-now-label", "history-more", "icon-sprite"}
    used = set(re.findall(r'\bel\("([^"]+)"\)', js)) | set(re.findall(r'getElementById\("([^"]+)"\)', js))
    for name in sorted(used - ids - created_later):
        note("index.html", f"src/ spricht #{name} an, das Element fehlt")

    sprite = (ROOT / "assets" / "icons" / "sprite.svg").read_text(encoding="utf-8")
    symbols = set(re.findall(r'<symbol id="icon-([^"]+)"', sprite))
    for name in sorted(set(re.findall(r'href="#icon-([a-z0-9-]+)"', html)) - symbols):
        note("index.html", f"benutzt das Icon #{name}, es fehlt im Sprite")
    for name in sorted(set(re.findall(r'\bicon\("([a-z0-9-]+)"', js)) - symbols):
        note("src/", f"benutzt das Icon #{name}, es fehlt im Sprite")


def main():
    check_line_limit()
    check_headers()
    check_imports()
    check_direction()
    check_data_layer()
    check_css_variables()
    check_html_ids()

    if not problems:
        print("alles in Ordnung")
        return 0
    print(f"{len(problems)} Fund(e):")
    for line in problems:
        print(f"  {line}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
