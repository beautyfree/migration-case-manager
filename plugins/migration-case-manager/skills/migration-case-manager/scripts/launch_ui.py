#!/usr/bin/env python3
"""Serve a prebuilt Migration OS React UI for one private case on loopback only."""

from __future__ import annotations

import argparse
import json
import secrets
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from render_case import meta


COOKIE = "migration_os_session"


def case_payload(case: Path) -> dict[str, str]:
    case_file = case / "00-case.md"
    if not case_file.is_file():
        raise ValueError(f"missing case file: {case_file}")
    values = meta(case_file.read_text(encoding="utf-8"))
    return {"case_id": values.get("case_id", "unknown"), "case_status": values.get("case_status", "unknown"), "phase": values.get("phase", "unknown"), "case_path": str(case)}


def handler_factory(case: Path, assets: Path, token: str):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(assets), **kwargs)

        def log_message(self, _format, *_args):
            return

        def authorized(self) -> bool:
            return f"{COOKIE}={token}" in self.headers.get("Cookie", "")

        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/" and parse_qs(parsed.query).get("token") == [token]:
                self.send_response(HTTPStatus.FOUND)
                self.send_header("Set-Cookie", f"{COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/")
                self.send_header("Location", "/")
                self.end_headers()
                return
            if not self.authorized():
                self.send_error(HTTPStatus.FORBIDDEN, "local session token required")
                return
            if parsed.path == "/api/case":
                body = json.dumps(case_payload(case)).encode()
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "application/json")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            self.path = parsed.path
            super().do_GET()
    return Handler


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    case_payload(case)
    assets = Path(__file__).resolve().parents[3] / "apps" / "migration-os-ui" / "dist"
    if not (assets / "index.html").is_file():
        parser.error(f"missing prebuilt UI assets: {assets}; maintainers must run npm run build")
    token = secrets.token_urlsafe(32)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler_factory(case, assets, token))
    url = f"http://127.0.0.1:{server.server_port}/?token={token}"
    state = case / ".migration-os"
    state.mkdir(exist_ok=True)
    (state / "ui-session.json").write_text(json.dumps({"port": server.server_port, "case_id": case_payload(case)["case_id"]}), encoding="utf-8")
    print(f"Migration OS UI: {url}", flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
