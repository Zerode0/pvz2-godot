import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
inspection = json.loads((ROOT / "reference/pam-resources/native-pam-inspection.json").read_text())
unique = {}
for item in inspection["entries"]:
    unique.setdefault(item["sha256"], []).append(item)
records = []
converter = ROOT / ".agents/skills/pvz2-pam-convert/scripts/convert_pam.mjs"
mapper = ROOT / ".agents/skills/pvz2-texture-map/scripts/map_images.py"
worker = ROOT / "reference/pam-tooling/web/assets/assets/worker/pkg"

def run(command):
    result = subprocess.run([str(value) for value in command], cwd=ROOT, text=True, encoding="utf-8", capture_output=True)
    if result.returncode:
        raise RuntimeError((result.stdout + result.stderr).strip())
    return result.stdout

for digest, aliases in unique.items():
    item = max(aliases, key=lambda entry: len(list((ROOT / entry["local_path"]).parent.glob("*.png"))))
    pam_path = ROOT / item["local_path"]
    stem = pam_path.stem
    decoded = ROOT / "work/animation-research/decoded" / digest[:12]
    record = {"sha256": digest, "pam_path": item["local_path"], "images": len(item["images"])}
    try:
        run(["node", converter, "--worker-dir", worker, "--input", pam_path, "--output-dir", decoded])
        pam_json = decoded / (stem + ".pam.json")
        siblings = {path.stem.casefold(): path for path in pam_path.parent.glob("*.png")}
        if all(any(value.replace("\\", "/").split("/")[-1].casefold() in siblings
                   for value in image["name"].split("|")) for image in item["images"]):
            images = pam_path.parent
            record["method"] = "same-source PNG parts"
        else:
            images = ROOT / "reference/pam-resources/native-pam-images" / stem.lower()
            config = pam_path.with_suffix(".ImageConfig.json")
            atlas = pam_path.with_suffix(".png")
            if config.is_file() and atlas.is_file():
                try:
                    run(["python", "-X", "utf8", ROOT / "Tools/prepare_atlas_parts.py", "--pam-json", pam_json,
                         "--config", config, "--atlas", atlas, "--output-dir", images])
                    record["method"] = "paired ImageConfig atlas"
                except RuntimeError:
                    run(["python", "-X", "utf8", mapper, "--pam-json", pam_json,
                         "--index", ROOT / "SourceAssets/pvz2/image_index.csv", "--images", ROOT / "SourceAssets/pvz2/images", "--output-dir", images])
                    record["method"] = "project image resource ID index"
            else:
                run(["python", "-X", "utf8", mapper, "--pam-json", pam_json,
                     "--index", ROOT / "SourceAssets/pvz2/image_index.csv", "--images", ROOT / "SourceAssets/pvz2/images", "--output-dir", images])
                record["method"] = "project image resource ID index"
        run(["node", converter, "--worker-dir", worker, "--input", pam_path, "--output-dir", decoded, "--png-dir", images, "--require-images"])
        record.update({"status": "complete", "image_directory": images.relative_to(ROOT).as_posix(),
                       "files": [{"local_path": path.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
                                 for path in sorted(images.glob("*.png"))]})
    except Exception as error:
        missing = [line.strip() for line in str(error).splitlines() if "|IMAGE_" in line]
        record.update({"status": "incomplete", "missing_images": missing,
                       "reason": "Image mapping incomplete" if missing else str(error).splitlines()[-1]})
    records.append(record)
    print(stem, record["status"], record["images"], flush=True)
(ROOT / "reference/pam-resources/native-pam-textures.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
