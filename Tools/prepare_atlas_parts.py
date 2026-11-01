"""Crop an exactly paired PAM/ImageConfig atlas using Pillow."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pam-json', required=True, type=Path)
    parser.add_argument('--config', required=True, type=Path)
    parser.add_argument('--atlas', required=True, type=Path)
    parser.add_argument('--output-dir', required=True, type=Path)
    args = parser.parse_args()
    pam = json.loads(args.pam_json.read_text(encoding='utf-8'))
    config = json.loads(args.config.read_text(encoding='utf-8'))
    by_id = {entry['id']: entry for entry in config}
    atlas = Image.open(args.atlas).convert('RGBA')
    plan = []
    for image in pam['image']:
        name, resource_id = image['name'].split('|', 1)
        entry = by_id[resource_id]
        x, y, width, height = [int(entry[key]) for key in ('ax', 'ay', 'aw', 'ah')]
        if image.get('size') != [width, height] or not (0 <= x < x + width <= atlas.width and 0 <= y < y + height <= atlas.height):
            raise ValueError(f'Atlas mismatch: {resource_id}')
        if entry.get('rotated', False):
            raise ValueError('Rotated atlas entries require the source importer')
        plan.append((name, resource_id, (x, y, x + width, y + height)))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    for name, resource_id, rectangle in plan:
        target = args.output_dir / (name + '.png')
        atlas.crop(rectangle).save(target)
        manifest.append({'pam_image': name, 'resource_id': resource_id, 'file': target.name,
                         'source_atlas': str(args.atlas), 'source_config': str(args.config),
                         'rectangle': rectangle, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    (args.output_dir / 'image_map.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Exactly matched and cropped {len(plan)}/{len(pam["image"])} atlas entries')


if __name__ == '__main__':
    main()
