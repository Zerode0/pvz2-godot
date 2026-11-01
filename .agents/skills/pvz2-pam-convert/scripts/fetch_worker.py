"""Fetch the pinned upstream PAM decoder/compiler; creates no game project."""
import argparse
import hashlib
import json
import urllib.request
import zipfile
from pathlib import Path

URL = 'https://github.com/LambdaEd1th/pam-viewer/releases/download/v0.1.1/pam-viewer-web-v0.1.1.zip'
SHA256 = '48e7b6b14dc4f76d202efda06fabe1c4c1aba056dbd26ad886ebd6784e9b586d'
PREFIX = 'assets/assets/worker/pkg/'
FILES = ('package.json', 'pam_viewer_worker.js', 'pam_viewer_worker_bg.wasm', 'pam_viewer_worker.d.ts')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dest', required=True, type=Path)
    parser.add_argument('--archive', type=Path, help='Reuse an existing official Web ZIP')
    args = parser.parse_args()
    archive = args.archive or args.dest / 'pam-viewer-web-v0.1.1.zip'
    data = archive.read_bytes() if archive.exists() else urllib.request.urlopen(URL, timeout=35).read()
    if hashlib.sha256(data).hexdigest() != SHA256:
        raise RuntimeError('Unexpected upstream archive checksum; check the source/version')
    if not archive.exists():
        archive.parent.mkdir(parents=True, exist_ok=True)
        archive.write_bytes(data)
    worker = args.dest / 'worker'
    worker.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as upstream:
        for name in FILES:
            (worker / name).write_bytes(upstream.read(PREFIX + name))
    metadata = {
        'tool': 'LambdaEd1th/pam-viewer', 'version': 'v0.1.1',
        'download': URL, 'archive_sha256': SHA256,
        'source': 'https://github.com/LambdaEd1th/pam-viewer/tree/v0.1.1',
        'license': 'AGPL-3.0-or-later',
        'license_url': 'https://github.com/LambdaEd1th/pam-viewer/blob/v0.1.1/LICENSE',
    }
    (args.dest / 'upstream.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    print(json.dumps({'worker_dir': str(worker.resolve()), 'version': 'v0.1.1'}))


if __name__ == '__main__':
    main()
