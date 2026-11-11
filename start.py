#!/usr/bin/env python3
"""Serve the built After Hours game on this computer."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

root = Path(__file__).resolve().parent / 'dist'
if not (root / 'index.html').exists():
    raise SystemExit('Missing dist/index.html. Run 'npm ci' then 'node build.mjs' first.')
try:
    server = ThreadingHTTPServer(('127.0.0.1', 8765), partial(SimpleHTTPRequestHandler, directory=str(root)))
except OSError:
    raise SystemExit('Port 8765 is in use. Stop the other preview, then try again.')
print('After Hours is running at http://127.0.0.1:8765')
print('Keep this window open while playing. Press Ctrl+C to stop.')
webbrowser.open('http://127.0.0.1:8765')
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
