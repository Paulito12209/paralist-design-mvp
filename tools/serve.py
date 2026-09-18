#!/usr/bin/env python3
"""
Entwicklungsserver fuer dieses Projekt.

    python3 tools/serve.py          # http://localhost:4173
    python3 tools/serve.py 4174     # anderer Port, wenn 4173 belegt ist

Gegenueber `python3 -m http.server`:

* Mehrere Anfragen gleichzeitig und ueber dieselbe Verbindung. Die App besteht
  aus vielen kleinen Modulen und laedt sie parallel; der einfache Server
  beantwortet nur eine Anfrage nach der anderen und laesst dabei gelegentlich
  eine Verbindung fallen.
* Kein Zwischenspeichern. Der einfache Server sendet kein `Cache-Control`,
  darum zeigt der Browser nach einer Aenderung manchmal noch den alten Stand.

ANPASSBARE WERTE IN DIESER DATEI
-----------------------------------
DEFAULT_PORT -> Port, wenn keiner angegeben wird
"""

import functools
import http.server
import pathlib
import socketserver
import sys

DEFAULT_PORT = 4173
ROOT = pathlib.Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    """Liefert die Dateien des Projekts aus und verbietet das Zwischenspeichern."""

    # HTTP/1.1 haelt die Verbindung offen: die vielen kleinen Module brauchen dann
    # nicht je eine eigene Verbindung. Zulaessig, weil jede Antwort hier eine
    # Content-Length mitschickt.
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Nur Fehler melden; jede einzelne Datei zu protokollieren ist unuebersichtlich.
        status = args[1] if len(args) > 1 else ""
        if str(status).startswith(("4", "5")):
            sys.stderr.write(f"{self.requestline} -> {status}\n")


class Server(socketserver.ThreadingTCPServer):
    """Beantwortet mehrere Anfragen gleichzeitig und gibt den Port sofort wieder frei."""

    daemon_threads = True
    allow_reuse_address = True


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    handler = functools.partial(Handler, directory=str(ROOT))
    try:
        with Server(("", port), handler) as server:
            print(f"Paralist laeuft auf http://localhost:{port}  (zum Beenden Strg+C)")
            server.serve_forever()
    except OSError as error:
        print(f"Port {port} ist belegt ({error}). Anderen Port angeben, z.B.: python3 tools/serve.py {port + 1}")
        return 1
    except KeyboardInterrupt:
        print("\nbeendet")
    return 0


if __name__ == "__main__":
    sys.exit(main())
