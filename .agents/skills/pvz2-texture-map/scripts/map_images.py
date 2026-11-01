"""Map PAM image IDs to extracted PNGs using an existing CSV index."""
import argparse
import csv
import hashlib
import json
import shutil
from pathlib import Path, PurePosixPath


def basename(value):
    return PurePosixPath(value.replace('\\', '/')).name


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pam-json', required=True, type=Path)
    parser.add_argument('--index', required=True, type=Path)
    parser.add_argument('--images', required=True, type=Path)
    parser.add_argument('--output-dir', required=True, type=Path)
    parser.add_argument('--fallback-dir', type=Path, help='Images explicitly paired with this PAM')
    parser.add_argument('--prefer-resolution', default='1536')
    args = parser.parse_args()
    pam = json.loads(args.pam_json.read_text(encoding='utf-8-sig'))
    by_id, by_name = {}, {}
    with args.index.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        if not {'filename', 'source', 'resource_id'}.issubset(reader.fieldnames or []):
            raise RuntimeError('Index requires filename, source and resource_id columns')
        for row in reader:
            if row.get('type') not in (None, '', 'sprite'):
                continue
            by_id.setdefault(row['resource_id'].casefold(), []).append(row)
            by_name.setdefault(basename(row['source']).casefold(), []).append(row)
    fallback = {}
    if args.fallback_dir:
        fallback = {p.stem.casefold(): p for p in args.fallback_dir.iterdir()
                    if p.is_file() and p.suffix.lower() == '.png'}
    plan, missing, targets = [], [], {}
    image_root = args.images.resolve()
    for image in pam['image']:
        primary, _, alternate = image['name'].partition('|')
        filename = basename(primary) + '.png'
        if any(char in filename for char in '<>:"|?*') or filename in ('.png', '..png'):
            raise RuntimeError(f'Image requires an explicit filename mapping: {image["name"]}')
        matches = by_id.get(alternate.casefold(), []) if alternate else by_name.get(basename(primary).casefold(), [])
        if matches:
            def score(row):
                parts = PurePosixPath(row['source'].replace('\\', '/')).parts
                return (args.prefer_resolution in parts,
                        int(float(row.get('width') or 0)) * int(float(row.get('height') or 0)))
            chosen = max(matches, key=score)
            source = (image_root / chosen['filename']).resolve()
            if not source.is_relative_to(image_root):
                raise RuntimeError(f'Index filename escapes image directory: {chosen["filename"]}')
            origin = {'kind': 'indexed', 'row': chosen}
        else:
            source = fallback.get(basename(primary).casefold()) or fallback.get(alternate.casefold())
            if source is None:
                missing.append(image['name'])
                continue
            origin = {'kind': 'paired-fallback'}
        if not source.is_file():
            missing.append(f'{image["name"]}: file missing {source}')
            continue
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        key = filename.casefold()
        if key in targets and targets[key] != digest:
            raise RuntimeError(f'Conflicting images share basename {filename}; use an explicit namespaced resolver')
        targets[key] = digest
        plan.append({'pam_image': image['name'], 'file': filename, 'source_path': str(source),
                     'sha256': digest, 'logical_size': image.get('size'), 'origin': origin})
    if missing:
        raise RuntimeError('Mapping incomplete; no images written:\n' + '\n'.join(missing))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for item in plan:
        target = args.output_dir / item['file']
        if Path(item['source_path']).resolve() != target.resolve():
            shutil.copyfile(item['source_path'], target)
    manifest = {'mapped': len(plan), 'indexed': sum(i['origin']['kind'] == 'indexed' for i in plan),
                'paired_fallback': sum(i['origin']['kind'] == 'paired-fallback' for i in plan), 'images': plan}
    (args.output_dir / 'image_map.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in manifest.items() if k != 'images'}))


if __name__ == '__main__':
    main()
