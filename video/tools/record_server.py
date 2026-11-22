"""Serves the game for recording, and saves the frames the recorder sends.

Usage: python3 video/tools/record_server.py [port]   (default port 8001)
Then open http://localhost:8001/video/record.html and press Record.

It serves the whole repository (so the game runs exactly as it is, untouched) with caching off, and takes:
  POST /frame?clip=NAME&i=N   a JPEG frame (as base64 text), saved as video/frames/NAME/000N.jpg
  POST /clear?clip=NAME       empties video/frames/NAME before a clip is recorded again
"""

import base64
import functools
import http.server
import pathlib
import re
import shutil
import sys
from urllib.parse import parse_qs, urlparse

ROOT = pathlib.Path(__file__).resolve().parents[2]
FRAMES = ROOT / "video" / "frames"


def clip_dir(query):
    name = re.sub(r"[^A-Za-z0-9_-]", "", query.get("clip", [""])[0])
    if not name:
        raise ValueError("no clip name")
    return FRAMES / name


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        url = urlparse(self.path)
        query = parse_qs(url.query)
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        try:
            folder = clip_dir(query)
            if url.path == "/frame":
                folder.mkdir(parents=True, exist_ok=True)
                index = int(query.get("i", ["0"])[0])
                (folder / f"{index:06d}.jpg").write_bytes(base64.b64decode(body))
            elif url.path == "/clear":
                shutil.rmtree(folder, ignore_errors=True)
            else:
                self.send_error(404)
                return
        except ValueError as error:
            self.send_error(400, str(error))
            return
        self.send_response(204)
        self.end_headers()

    def log_message(self, fmt, *args):
        if "POST /frame" not in (args[0] if args else ""):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    handler = functools.partial(Handler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Recorder → http://localhost:{port}/video/record.html")
        server.serve_forever()
