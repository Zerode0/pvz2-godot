"""Build or search the local animation catalog; file paths are repository-relative."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RESOURCES = ROOT / "reference/pam-resources"
SOURCE = RESOURCES / "pvzge-actors-462f116"
CATALOG = RESOURCES / "animation-library.json"


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def relative(path):
    return path.relative_to(ROOT).as_posix()


def rebuild():
    library = read(SOURCE / "library.json")
    inspection = read(SOURCE / "inspection.json")
    native = read(RESOURCES / "native-pam-inspection.json")
    native_sources = read(RESOURCES / "native-pam-sources.json")
    native_textures = {entry["sha256"]: entry for entry in read(RESOURCES / "native-pam-textures.json")}
    errors = []
    verified = set()
    for record in list(library["assets"].values()) + list(library["textures"].values()):
        path = ROOT / record["local_path"]
        if hashlib.sha256(path.read_bytes()).hexdigest() != record["sha256"]:
            errors.append("Hash mismatch: " + record["local_path"])
        verified.add(record["local_path"])
    for record in native_sources:
        for asset in [record] + record["companion_files"]:
            filename = asset["local_path"].replace("\\", "/")
            if hashlib.sha256((ROOT / filename).read_bytes()).hexdigest() != asset["sha256"].lower():
                errors.append("Hash mismatch: " + filename)
            verified.add(filename)
    for record in native_textures.values():
        for asset in record.get("files", []):
            filename = asset["local_path"]
            if hashlib.sha256((ROOT / filename).read_bytes()).hexdigest() != asset["sha256"]:
                errors.append("Hash mismatch: " + filename)
            verified.add(filename)

    dimensions = {}
    for url, record in library["textures"].items():
        with Image.open(ROOT / record["local_path"]) as image:
            dimensions[url] = image.size
            image.verify()
    atlas_pairs = set()
    for entry in library["entries"]:
        descriptor = read(SOURCE / entry["descriptor"])
        for node in descriptor["nodes"]:
            for rig in node["armatures"]:
                atlas_pairs.add((rig["atlas"], rig["texture_image"]))
    for atlas, texture in atlas_pairs:
        width, height = dimensions[texture]
        for region in read(SOURCE / atlas)["SubTexture"]:
            x, y = region.get("x", 0), region.get("y", 0)
            w, h = region["width"], region["height"]
            if not (0 <= x <= x+w <= width and 0 <= y <= y+h <= height):
                errors.append(f"Atlas bounds: {atlas}/{region['name']}")

    entries = []
    for item in inspection["entries"]:
        entry = {"format": "dragonbones", "id": item["path"], "group": item["group"],
                 "descriptor": item["descriptor"], "rigs": [], "errors": item["errors"]}
        for rig in item["rigs"]:
            entry["rigs"].append({**rig, "skeleton": relative(SOURCE / rig["skeleton"]),
                                 "atlas": relative(SOURCE / rig["atlas"])})
        entries.append(entry)
    armatures = {}
    skeleton_pairs = {rig["skeleton"]: {"skeleton": rig["skeleton"], "atlas": rig["atlas"], "texture": rig["texture"]}
                      for entry in entries for rig in entry["rigs"]}
    for skeleton, files in skeleton_pairs.items():
        for armature in read(ROOT / skeleton)["armature"]:
            armatures.setdefault(armature["name"], []).append(files)
    paths = {entry["id"] for entry in entries}
    characters = []
    for filename, key, group, suffix in [("PlantFeatures", "PLANTS", "plants", "PLANT"),
                                        ("ZombieFeatures", "ZOMBIES", "zombies", "ZOMBIE"),
                                        ("ArmorFeatures", "ARMORS", "armors", "ARMOR")]:
        for item in read(SOURCE / "features" / (filename + ".json"))[key]:
            definition = item["RES"]
            references = ([f"plants/{definition['Plant']}PLANT", f"plants/{definition['Disabled']}DIS"]
                          if isinstance(definition, dict) and "Plant" in definition and "Disabled" in definition
                          else [f"{group}/{definition}{suffix}"] if isinstance(definition, str) else [])
            characters.append({"id": item["CODENAME"], "group": group, "name": item.get("NAME", {}),
                               "world": item.get("OBTAINWORLD"), "resources": references,
                               "missing_resources": [value for value in references if value not in paths]})

    grouped = {}
    for item in native["entries"]:
        grouped.setdefault(item["sha256"], []).append(item)
    pam_entries = []
    for digest, aliases in grouped.items():
        source_records = [item for item in native_sources if item["sha256"].lower() == digest]
        texture = native_textures[digest]
        best = next(item for item in aliases if item["local_path"] == texture["pam_path"])
        pam_entries.append({"format": "native-pam", "local_path": best["local_path"], "sha256": digest,
                            "characters": sorted({item["character"] for item in source_records}),
                            "group": source_records[0]["group"] if source_records else "unknown",
                            "aliases": [item["local_path"] for item in aliases], "sources": source_records,
                            "frame_rate": best["frame_rate"], "main_frames": best["main_frames"],
                            "images": len(best["images"]), "labels": best["labels"], "commands": best["commands"],
                            "textures": texture})
    summary = {"prefabs": len(entries), "groups": dict(Counter(entry["group"] for entry in entries)),
               "named_definitions": dict(Counter(entry["group"] for entry in characters)),
               "unique_skeleton_files": sum(path.startswith("skeletons/") for path in library["assets"]),
               "unique_texture_files": len({item["sha256"] for item in library["textures"].values()}),
               "native_pams": len(pam_entries),
               "native_pams_with_complete_textures": sum(item["textures"]["status"] == "complete" for item in pam_entries),
               "hash_checked_files": len(verified), "atlas_texture_pairs_checked": len(atlas_pairs),
               "export_failures": library["failures"], "file_errors": errors,
               "runtime_messages": inspection["messages"]}
    if errors:
        raise RuntimeError("\n".join(errors))
    write(CATALOG, {"schema_version": 1, "summary": summary,
        "dragonbones_source": relative(SOURCE / "library.json"), "characters": characters,
        "entries": entries, "armatures": armatures, "native_pams": pam_entries})
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rebuild", action="store_true")
    parser.add_argument("--query", help="Chinese/English name, codename, rig or filename")
    parser.add_argument("--format", choices=["all", "pam", "dragonbones"], default="all")
    parser.add_argument("--details", action="store_true", help="Include full provenance and per-file texture records")
    args = parser.parse_args()
    if args.rebuild:
        rebuild()
    if args.query is not None:
        data = read(CATALOG)
        needle = args.query.casefold()
        match = lambda item: needle in json.dumps(item, ensure_ascii=False).casefold()
        characters = [item for item in data["characters"] if match(item)]
        references = {path for item in characters for path in item["resources"]}
        output = {}
        if args.format in ("all", "dragonbones"):
            output["characters"] = characters
            output["shared_armatures"] = {name: files for name, files in data["armatures"].items() if needle in name.casefold()}
            output["dragonbones"] = [entry for entry in data["entries"] if entry["id"] in references or match(entry)]
            if not args.details:
                output["dragonbones"] = [{**entry, "rigs": [{key: value for key, value in rig.items() if key not in ("slots", "bones")}
                                                            for rig in entry["rigs"]]} for entry in output["dragonbones"]]
        if args.format in ("all", "pam"):
            needles = {needle} | {str(item.get("name", {}).get("en", "")).casefold() for item in characters}
            needles.discard("")
            output["native_pams"] = [entry for entry in data["native_pams"]
                                    if any(value in json.dumps({key: value for key, value in entry.items() if key not in ("textures", "sources")}, ensure_ascii=False).casefold()
                                           for value in needles)]
            if not args.details:
                output["native_pams"] = [{**{key: value for key, value in entry.items() if key not in ("sources", "textures", "aliases")},
                    "texture_status": entry["textures"]["status"], "image_directory": entry["textures"].get("image_directory")}
                    for entry in output["native_pams"]]
        print(json.dumps(output, ensure_ascii=False, indent=2))
    elif not args.rebuild:
        print(json.dumps(read(CATALOG)["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
