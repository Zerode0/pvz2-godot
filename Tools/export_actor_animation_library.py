"""Export actor animation files with Cocos native APIs, retaining real texture links."""
import argparse
import functools
import hashlib
import http.server
import json
import shutil
import subprocess
import threading
from pathlib import Path
from urllib.parse import unquote, urlparse

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
REVISION = "462f1161d5a29423409002936f2e05f1c24ac630"
BUILD = ROOT / "reference/research/pvzge_web-readonly"
OUTPUT = ROOT / "reference/pam-resources/pvzge-actors-462f116"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    output = args.output.resolve()
    revision = subprocess.check_output(["git", "-C", str(BUILD), "rev-parse", "HEAD"], text=True).strip()
    if revision != REVISION:
        raise RuntimeError(f"Expected source build {REVISION}, got {revision}")
    output.mkdir(parents=True, exist_ok=True)
    assets = {}

    def save_json(name, value):
        target = (output / name).resolve()
        if not target.is_relative_to(output):
            raise ValueError(name)
        target.parent.mkdir(parents=True, exist_ok=True)
        raw = value.encode("utf-8")
        target.write_bytes(raw)
        assets[name] = {"local_path": target.relative_to(ROOT).as_posix(),
                        "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}

    handler = functools.partial(QuietHandler, directory=str(BUILD / "docs"))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="msedge", headless=True)
            page = browser.new_page()
            page.expose_function("saveActorJson", save_json)
            page.on("console", lambda message: print(message.text, flush=True)
                    if message.text.startswith("Actor exports") else None)
            page.goto(f"http://127.0.0.1:{server.server_port}/", wait_until="domcontentloaded")
            page.wait_for_function("typeof System !== 'undefined'")
            page.evaluate("async () => { window.__actorCC = await System.import('cc'); }")
            page.wait_for_function("window.__actorCC.director.getScene()", timeout=45000)
            page.wait_for_function("window.__actorCC.js.getClassByName('AlmanacPlantPage')", timeout=45000)
            result = page.evaluate((ROOT / "Tools/export_actor_animation_library.js").read_text(encoding="utf-8"))
            browser.close()
    finally:
        server.shutdown()

    textures = {}
    for item in result["entries"]:
        descriptor = json.loads((output / item["descriptor"]).read_text(encoding="utf-8"))
        for node in descriptor["nodes"]:
            for graphic in node["armatures"] + node["sprites"]:
                url = graphic.get("texture_image")
                if not url or url in textures:
                    continue
                local = (BUILD / "docs" / unquote(urlparse(url).path.lstrip("/"))).resolve()
                if not local.is_relative_to(BUILD / "docs") or not local.is_file():
                    result["failures"].append({"texture_image": url, "error": "Missing local texture"})
                    continue
                raw = local.read_bytes()
                digest = hashlib.sha256(raw).hexdigest()
                target = output / "textures" / (digest + local.suffix)
                target.parent.mkdir(parents=True, exist_ok=True)
                if not target.exists():
                    shutil.copyfile(local, target)
                with Image.open(target) as image:
                    image.verify()
                textures[url] = {"local_path": target.relative_to(ROOT).as_posix(),
                    "source_path": local.relative_to(BUILD).as_posix(),
                    "source_url": f"https://raw.githubusercontent.com/Gzh0821/pvzge_web/{REVISION}/{local.relative_to(BUILD).as_posix()}",
                    "sha256": digest, "bytes": len(raw)}

    result.update({"schema_version": 1, "format": "dragonbones", "revision": REVISION,
        "source_repository": "https://github.com/Gzh0821/pvzge_web",
        "method": "Cocos native prefab/component API; atlas.texture.image.nativeUrl",
        "assets": assets, "textures": textures})
    (output / "library.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"actors": len(result["entries"]), "assets": len(assets),
        "textures": len(textures), "failures": len(result["failures"])}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
