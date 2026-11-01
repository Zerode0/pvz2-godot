"""Inspect the reference almanac through Cocos' own resource API."""

import functools
import http.server
import json
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "Artifacts/plant-preview-reference"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(QuietHandler, directory=str(ROOT / "reference/research/pvzge_web-readonly/docs"))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="msedge", headless=True)
            page = browser.new_page()
            page.goto(f"http://127.0.0.1:{server.server_port}/", wait_until="domcontentloaded")
            page.wait_for_function("typeof System !== 'undefined'")
            page.evaluate("async () => { window.__previewCC = await System.import('cc'); }")
            page.wait_for_function("window.__previewCC.director.getScene()", timeout=45000)
            page.wait_for_function("window.__previewCC.js.getClassByName('AlmanacPlantPage')", timeout=45000)
            result = page.evaluate((ROOT / "Tools/export_plant_preview_reference.js").read_text(encoding="utf-8"))
            (OUTPUT / "runtime.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps({"nodes": len(result["nodes"]), "plant_page": result["plant_page"]}, ensure_ascii=False))
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
