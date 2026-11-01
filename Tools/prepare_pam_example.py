"""Map the user's extracted textures to the upstream sunflower PAM sample."""
import csv
import hashlib
import json
import shutil
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'reference/pam-tooling'
DEST = ROOT / 'GodotPamDemo/assets'
SOURCE = ROOT / 'SourceAssets/pvz2/images'
SAMPLE_COMMIT = '2badec2d7df8299a53f64e9c78eabb1865d807f5'


def main():
    pam = json.loads((TOOLS / 'converted/sunflower.pam.json').read_text())
    with (ROOT / 'SourceAssets/pvz2/image_index.csv').open(encoding='utf-8-sig', newline='') as stream:
        rows = list(csv.DictReader(stream))
    images = DEST / 'sunflower'
    images.mkdir(parents=True, exist_ok=True)
    def prepare_image(image):
        basename, resource_id = image['name'].split('|', 1)
        matches = [row for row in rows if row['resource_id'].upper() == resource_id.upper()]
        if not matches:
            # This fixture is an older animation revision: never guess substitutes.
            url = f'https://raw.githubusercontent.com/LambdaEd1th/pam-codec/{SAMPLE_COMMIT}/sample/sunflower/image_plant_sunflower_{basename}.png'
            source = TOOLS / 'sample-images' / f'{basename}.png'
            source.parent.mkdir(exist_ok=True)
            if not source.exists():
                source.write_bytes(urllib.request.urlopen(url, timeout=25).read())
            chosen = {'kind': 'matching upstream fixture', 'url': url}
        else:
            # Use high-resolution source; PAM image.size supplies logical dimensions.
            matches.sort(key=lambda row: ('\\1536\\' in row['source'], int(row['width']) * int(row['height'])), reverse=True)
            chosen = dict(matches[0], kind='local image_index.csv')
            source = SOURCE / chosen['filename']
        target = images / f'{basename}.png'
        shutil.copyfile(source, target)
        return {'pam_image': image['name'], 'file': f'sunflower/{target.name}',
                'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'source': chosen}
    with ThreadPoolExecutor(max_workers=4) as pool:
        mapping = list(pool.map(prepare_image, pam['image']))
    art = ROOT / 'Prototype/Assets/PVZPrototype/Resources/Art'
    for filename in ('Frontyard.png', 'Sun.png', 'Shadow.png'):
        shutil.copyfile(art / filename, DEST / filename)
    (DEST / 'image_map.json').write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding='utf-8')
    local = sum(item['source']['kind'] == 'local image_index.csv' for item in mapping)
    print(f'Mapped {len(mapping)}/{len(pam["image"])} images: {local} local, {len(mapping) - local} upstream fixture')


if __name__ == '__main__':
    main()
