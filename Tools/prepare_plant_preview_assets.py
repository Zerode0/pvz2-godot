"""Prepare almanac textures selected from the native Cocos export."""

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "reference/research/pvzge_web-readonly/docs"
OUTPUT = ROOT / "GodotPamDemo/assets/ui/plant_preview"


def main():
    data = json.loads((ROOT / "Artifacts/plant-preview-reference/runtime.json").read_text(encoding="utf-8"))
    selected = {
        "plantDisplayBackground": "display_background.png",
        "plantDisplayGlass": "display_glass.png",
    }
    records = []
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, filename in selected.items():
        node = next(n for n in data["nodes"] if n["name"] == name and "/Almanac/" in n["path"])
        frame = node["sprites"][0]
        source = WEB / frame["texture"]
        rect = frame["rect"]
        assert not frame["rotated"], name
        atlas = Image.open(source).convert("RGBA")
        image = atlas.crop((rect["x"], rect["y"], rect["x"] + rect["width"], rect["y"] + rect["height"]))
        size, offset = frame["originalSize"], frame["offset"]
        canvas = Image.new("RGBA", (size["width"], size["height"]))
        at = (round((size["width"] - image.width) / 2 + offset["x"]),
              round((size["height"] - image.height) / 2 - offset["y"]))
        canvas.paste(image, at)
        target = OUTPUT / filename
        canvas.save(target)
        records.append({"file": filename, "node": node["path"], "sprite_frame": frame,
                        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                        "output_sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    (OUTPUT / "sources.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Prepared {len(records)} almanac textures")


if __name__ == "__main__":
    main()
