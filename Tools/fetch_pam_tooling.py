"""Fetch pinned upstream tooling and sample data; no compiler or game build."""
import hashlib
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'reference/pam-tooling'
COMMIT = '2badec2d7df8299a53f64e9c78eabb1865d807f5'
DOWNLOADS = [
    ('pam-viewer-web-v0.1.1.zip',
     'https://github.com/LambdaEd1th/pam-viewer/releases/download/v0.1.1/pam-viewer-web-v0.1.1.zip',
     '48e7b6b14dc4f76d202efda06fabe1c4c1aba056dbd26ad886ebd6784e9b586d'),
    ('pam-codec-sample-source.zip',
     f'https://codeload.github.com/LambdaEd1th/pam-codec/zip/{COMMIT}',
     '09e19bec53102c189c22f70e83506937202eb7483f6fd22ab9052a90afca3863'),
]


def fetch(item):
    name, url, expected = item
    path = DEST / name
    data = path.read_bytes() if path.exists() else urllib.request.urlopen(url, timeout=35).read()
    if hashlib.sha256(data).hexdigest() != expected:
        raise RuntimeError(f'Unexpected checksum: {name}')
    if not path.exists():
        path.write_bytes(data)
    return path


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=2) as pool:
        viewer_zip, codec_zip = list(pool.map(fetch, DOWNLOADS))
    web = DEST / 'web'
    with zipfile.ZipFile(viewer_zip) as archive:
        for entry in archive.infolist():
            if not (web / entry.filename).resolve().is_relative_to(web.resolve()):
                raise RuntimeError('Unexpected archive path')
        archive.extractall(web)
    images = DEST / 'sample-images'
    images.mkdir(exist_ok=True)
    with zipfile.ZipFile(codec_zip) as archive:
        for name in archive.namelist():
            if '/sample/sunflower/' not in name or name.endswith('/'):
                continue
            basename = Path(name).name
            if basename.lower().endswith('.pam'):
                (DEST / 'SUNFLOWER.PAM').write_bytes(archive.read(name))
            elif basename.endswith('.png'):
                target = basename.removeprefix('image_plant_sunflower_')
                (images / target).write_bytes(archive.read(name))
    print('Ready: pam-viewer v0.1.1 worker + pinned sunflower PAM and matching textures')


if __name__ == '__main__':
    main()
