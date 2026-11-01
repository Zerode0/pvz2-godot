"""Prepare the frontyard map illustration from the project's extracted original PNGs."""

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "SourceAssets/pvz2/images"
OUTPUT = ROOT / "GodotPamDemo/assets/ui/world_map"

# Back to front; placement is an authored illustration, not an original PAM rig.
LAYERS = [
    ("sprite_057380_images_1536_full_worldmap_modern_island2.png", (120, 260), (660, 336)),
    ("sprite_057379_images_1536_full_worldmap_modern_island1.png", (80, 140), (740, 389)),
    ("sprite_057384_images_1536_full_worldmap_modern_island6.png", (420, 214), (270, 134)),
    ("sprite_057388_images_1536_full_worldmap_modern_island10.png", (150, 30), (260, 314)),
    ("sprite_057386_images_1536_full_worldmap_modern_island8.png", (432, 367), (175, 62)),
    ("sprite_057389_images_1536_full_worldmap_modern_island11.png", (653, 304), (94, 103)),
]


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (900, 630))
    sources = []
    for name, position, size in LAYERS:
        path = SOURCE / name
        with Image.open(path) as image:
            canvas.alpha_composite(image.convert("RGBA").resize(size, Image.Resampling.LANCZOS), position)
        sources.append({
            "source": path.relative_to(ROOT).as_posix(),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "position": position,
            "size": size,
        })
    canvas.save(OUTPUT / "frontyard_island.png")
    (OUTPUT / "sources.json").write_text(json.dumps({
        "output": "frontyard_island.png",
        "canvas": list(canvas.size),
        "layers": sources,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
