"""Read map prefabs through the bundled Cocos runtime, without decoding its format."""

import functools
import http.server
import json
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "reference/world-map"


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
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.expose_function("saveMapExport", lambda name, data: (OUTPUT / f"{name}.json").write_text(data, encoding="utf-8"))
            page.on("console", lambda message: print(message.text, flush=True) if message.text.startswith("Exported map:") else None)
            page.goto(f"http://127.0.0.1:{server.server_port}/", wait_until="domcontentloaded")
            page.wait_for_function("typeof System !== 'undefined'")
            page.evaluate("async () => { window.__mapCC = await System.import('cc'); }")
            page.wait_for_function("window.__mapCC.assetManager.getBundle('resources')", timeout=45000)
            page.wait_for_function("window.__mapCC.director.getScene()", timeout=45000)
            print("Cocos resources ready", flush=True)
            result = json.loads(page.evaluate((ROOT / "Tools/export_world_map_reference.js").read_text(encoding="utf-8")))
            (OUTPUT / "runtime.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps({"worlds": len(result.get("features", {}).get("WORLDMAPS", [])),
                              "prefabs": list(result.get("prefabs", {})), "diagnostics": result.get("diagnostics", [])}, ensure_ascii=False))
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
