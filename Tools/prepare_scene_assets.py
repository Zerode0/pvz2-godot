"""Import a small, traceable subset of the user's extracted PNGs for Unity."""
import csv
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'SourceAssets/pvz2/images'
DEST = ROOT / 'Prototype/Assets/PVZPrototype/Resources/Art'
INDEX = ROOT / 'SourceAssets/pvz2/image_index.csv'


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    rows = {r['filename']: r for r in csv.DictReader(INDEX.open(encoding='utf-8-sig'))}
    manifest = []

    def source(number):
        return next(SOURCE.glob(f'sprite_{number:06d}_*.png'))

    def record(name, paths, operation='copy'):
        manifest.append({'asset': name, 'operation': operation,
                         'sources': [rows[p.name] for p in paths]})

    selections = {'Sunflower': 52903, 'Peashooter': 52836, 'Wallnut': 52935,
                  'Zombie': 54097, 'ConeZombie': 54098, 'BucketZombie': 54099,
                  'Pea': 4334, 'Sun': 47748, 'Pause': 47708, 'Speed': 47684,
                  'Shovel': 47743, 'MowerBody': 3274, 'MowerHandle': 3286,
                  'MowerWheel': 3283, 'MowerHub': 3280}
    for name, number in selections.items():
        path = source(number)
        shutil.copyfile(path, DEST / f'{name}.png')
        record(name, [path])

    # Reassemble the background's original adjacent panels. The five-row turf
    # sits over the bare-soil area; no source PNG is changed.
    panels = [source(n) for n in (1556, 1555, 1557)]
    background = Image.new('RGBA', (3949, 1536))
    x = 0
    for path in panels:
        panel = Image.open(path).convert('RGBA')
        background.alpha_composite(panel, (x, 0))
        x += panel.width
    turf = source(1554)
    background.alpha_composite(Image.open(turf).convert('RGBA'), (1016, 396))
    background = background.crop((400, -95, 3300, 1536)).resize((1600, 900), Image.Resampling.LANCZOS)
    # Extend the topmost sky color into the small overscan region.
    sky = Image.new('RGBA', background.size, (135, 174, 137, 255))
    sky.alpha_composite(background)
    sky.save(DEST / 'Frontyard.png')
    record('Frontyard', panels + [turf], 'panel composition, turf overlay, crop and resize')

    shadow = Image.new('RGBA', (180, 70))
    ImageDraw.Draw(shadow).ellipse((12, 15, 168, 53), fill=(20, 35, 14, 110))
    shadow.filter(ImageFilter.GaussianBlur(6)).save(DEST / 'Shadow.png')
    manifest.append({'asset': 'Shadow', 'operation': 'generated soft ellipse', 'sources': []})
    (DEST.parent.parent / 'ASSET_SOURCES.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Prepared {len(selections) + 2} textures in {DEST}')


if __name__ == '__main__':
    main()
