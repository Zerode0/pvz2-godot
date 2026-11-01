"""Reuse the existing extracted-art subset in the Godot level."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'Prototype/Assets/PVZPrototype/Resources/Art'
DEST = ROOT / 'GodotPamDemo/assets/level'
NAMES = ('Sunflower', 'Peashooter', 'Wallnut', 'Pea', 'Zombie',
         'Shovel', 'MowerBody', 'MowerHandle', 'MowerWheel')


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        shutil.copyfile(SOURCE / f'{name}.png', DEST / f'{name}.png')
    existing = json.loads((SOURCE.parents[1] / 'ASSET_SOURCES.json').read_text(encoding='utf-8'))
    (DEST / 'sources.json').write_text(json.dumps([item for item in existing if item['asset'] in NAMES],
                                               ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Reused {len(NAMES)} existing textures')


if __name__ == '__main__':
    main()
