#!/usr/bin/env python3
"""Create searchable classification catalogs; all images stay in the original library."""

from __future__ import annotations

import argparse
import csv
import re
import json
import gzip
import hashlib
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "SourceAssets/pvz2/image_index.csv"
IMAGES = ROOT / "SourceAssets/pvz2/images"
DEFAULT_OUTPUT = ROOT / "SourceAssets/pvz2/images_by_category"
SHARED_CATALOG = ROOT / "reference/image-library/image_catalog.csv.gz"

LABELS = {
    "plants": "植物", "zombies": "僵尸", "ui": "界面", "maps": "地图与场景",
    "effects": "特效", "items": "道具与NPC", "other": "其他资源", "unclassified": "待分类",
}


def clean_component(value: str) -> str:
    value = re.sub(r"[^\w .()'-]+", "_", value, flags=re.UNICODE).strip(" .")
    return value[:100] or "未命名"


def source_parts(row: dict[str, str]) -> list[str]:
    return [part.lower() for part in re.split(r"[\\/]+", row.get("source", "")) if part]


def entity_for(row: dict[str, str], kind: str) -> str | None:
    parts = source_parts(row)
    for i, part in enumerate(parts[:-1]):
        if part == kind:
            entity = parts[i + 1]
            if entity.isdigit() or entity in {"initial", "images", "768", "1536"}:
                continue
            return clean_component(entity)
    # Atlas names commonly encode the entity where source directories do not.
    atlas = row.get("atlas", "").upper().rsplit("/", 1)[-1]
    atlas = re.sub(r"\.PTX$", "", atlas)
    atlas = re.sub(r"_(?:768|1536)_\d+$", "", atlas)
    prefix = kind.upper()
    if atlas.startswith(prefix):
        name = atlas[len(prefix):]
        name = re.sub(r"GROUP$", "", name)
        if name:
            return clean_component(name.lower())
    return None


def classify(row: dict[str, str]) -> tuple[str, str]:
    parts = source_parts(row)
    content = [p for p in parts if p not in {"images", "768", "1536", "initial", "full"}]
    top = content[0] if content else ""
    if row.get("type") != "atlas":
        # The explicit source directory takes precedence over shared atlas names.
        if top in {"plant", "zombie", "zombies"}:
            return ("plants" if top == "plant" else "zombies"), content[1] if len(content) > 2 else ""
        if top == "empowermints" and len(content) > 2 and content[1] == "plant":
            return "plants", content[2]
        if top == "effects" or top in {"space_spiral", "pea_shadows", "pea_single_shadow", "plantshadow", "plantshadow2", "ice_sparkles", "animations"}:
            return "effects", ""
        if top.endswith("_projectile") or top == "projectilepea":
            return "effects", ""
        if top in {"ui", "dev", "credits", "logos", "notes", "downarrow", "missing_image", "missing_pam", "dangerroom"} or top.startswith("pirate_cannon_guide_"):
            return "ui", ""
        if top in {"worldmap", "backgrounds", "titlebackgrounds", "mainmenu_background", "transition"} or top.startswith("zombie_gate_"):
            return "maps", ""
        if top in {"npc", "crazydave", "winnie", "zen_garden", "security_gourds", "mowers", "worldkey", "endlevel", "minigame", "eggbreaker", "gravestones", "firebreaker", "giftbox", "icetrap", "railcart", "vasebreaker"}:
            return "items", ""
        return "unclassified", ""
    source = "/".join(parts)
    atlas = row.get("atlas", "").upper()
    rid = row.get("resource_id", "").upper()
    text = f"{source} {atlas} {rid} {row.get('filename', '').upper()}"

    for kind, label in (("plant", "plants"), ("zombie", "zombies")):
        ent = entity_for(row, kind)
        if ent:
            return label, ent
    if any(token in text for token in ("/ui/", "_UI_", "UI_", "SEEDPACKET", "BUTTON", "DIALOG", "FONT", "STORE", "MENU", "DOWNARROW", "MISSING_IMAGE")):
        return "ui", ""
    if any(token in text for token in ("WORLDMAP", "WORLD_MAP", "MAP_", "_MAP", "BACKGROUND", "BACKDROP", "TERRAIN", "LAWN", "ROOFTOP", "GRAVEYARD", "BEACH", "EGYPT", "FUTURE", "DARK", "DINO", "WEST", "CIRCUS")):
        return "maps", ""
    if any(token in text for token in ("EFFECT", "PARTICLE", "EXPLOSION", "SMOKE", "SPARK", "TRAIL", "FLASH", "ANIM_", "SHADOW", "DUST")):
        return "effects", ""
    if any(token in text for token in ("NPC", "PROJECTILE", "COLLECTABLE", "PICKUP", "COIN", "GEM", "SUN", "MOWER", "PINATA", "TILE", "GRAVESTONE", "BOOST", "PROP", "ITEM", "DOOBER", "OBSTACLE", "CREATURE", "ICETRAP")):
        return "items", ""
    if row.get("type") == "atlas":
        return "other", ""
    # Meaningful source folders provide a useful fallback before the manual queue.
    if len(parts) >= 4 and parts[-2] not in {"initial", "images"}:
        return "other", ""
    return "unclassified", ""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--query", help="在已生成的 CSV 目录中按名字、resource ID、原路径或图集检索。")
    parser.add_argument("--category", choices=list(LABELS.values()))
    parser.add_argument("--character", help="精确匹配角色分组名。")
    parser.add_argument("--resolution", choices=["768", "1536"])
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--share-catalog", action="store_true", help="将现有本地分类清单压缩到共享 reference/image-library/，不复制图片。")
    args = parser.parse_args()
    output = args.output.resolve()
    if args.share_catalog:
        source = output / "image_catalog.csv"
        raw = source.read_bytes()
        SHARED_CATALOG.parent.mkdir(parents=True, exist_ok=True)
        SHARED_CATALOG.write_bytes(gzip.compress(raw, mtime=0))
        with source.open(encoding="utf-8-sig", newline="") as stream:
            records = list(csv.DictReader(stream))
        summary = {"schema_version": 1, "records": len(records),
                   "categories": dict(Counter(row["category"] for row in records)),
                   "catalog_sha256": hashlib.sha256(raw).hexdigest(),
                   "catalog_compressed_sha256": hashlib.sha256(SHARED_CATALOG.read_bytes()).hexdigest(),
                   "original_images_included": False, "original_path_base": "repository root"}
        (SHARED_CATALOG.parent / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    if args.query is not None or args.category or args.character or args.resolution:
        catalog = output / "image_catalog.csv"
        if not catalog.is_file() and output == DEFAULT_OUTPUT.resolve():
            catalog = SHARED_CATALOG
        if not catalog.is_file():
            raise SystemExit(f"分类清单不存在：{catalog}；先运行一次不带 --query 的命令。")
        query = (args.query or "").casefold()
        opener = gzip.open if catalog.suffix == ".gz" else open
        with opener(catalog, "rt", encoding="utf-8-sig", newline="") as f:
            matches = [row for row in csv.DictReader(f) if query in " ".join(row.values()).casefold()
                       and (not args.category or row["category"] == args.category)
                       and (not args.character or row["character"] == args.character.casefold())
                       and (not args.resolution or row["resolution"] == args.resolution)]
        print(f"匹配 {len(matches)} 条，显示 {min(args.limit, len(matches))} 条")
        for row in matches[:args.limit]:
            print(json.dumps(row, ensure_ascii=False))
        return
    if output == IMAGES.resolve() or IMAGES.resolve() in output.parents:
        raise SystemExit("输出目录不能位于原始 images 目录内。")

    with INDEX.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    atlas_category: dict[str, str] = {}
    atlas_votes: dict[str, Counter[str]] = defaultdict(Counter)
    atlas_characters = defaultdict(Counter)
    for row in rows:
        atlas = row.get("atlas", "").upper()
        if atlas:
            category, _ = classify(row)
            atlas_votes[atlas][category] += 1
            if category in {"plants", "zombies"}:
                atlas_characters[atlas][classify(row)[1]] += 1
    for row in rows:
        if row.get("type") == "atlas":
            category, _ = classify(row)
            source = row.get("source", "").replace("\\", "/").upper()
            atlas_key = source if source.startswith("ATLASES/") else ""
            votes = atlas_votes.get(atlas_key)
            if votes:
                category = votes.most_common(1)[0][0]
            atlas_category[atlas_key] = category

    output.mkdir(parents=True, exist_ok=True)
    counts: Counter[str] = Counter()
    inventory: list[dict[str, str]] = []
    unclassified: list[dict[str, str]] = []
    missing: list[str] = []
    for row in rows:
        filename = row["filename"]
        original = IMAGES / filename
        if not original.is_file():
            missing.append(filename)
            continue
        category, entity = classify(row)
        if row.get("type") == "atlas":
            atlas_key = row.get("source", "").replace("\\", "/").upper()
            category = atlas_category.get(atlas_key, category)
            names = atlas_characters.get(atlas_key, {})
            entity = next(iter(names)) if category in {"plants", "zombies"} and len(names) == 1 else ""
        content = [p for p in source_parts(row) if p not in {"images", "768", "1536", "initial", "full"}]
        subgroup = "" if entity else (content[1] if len(content) > 2 and content[0] in {"ui", "effects", "worldmap", "npc", "backgrounds"} else content[0] if content else "")
        match = re.search(r"(?:[/\\_])(768|1536)(?:[/\\_])", row.get("source", ""))
        counts[category] += 1
        record = {
            "category": LABELS[category], "character": entity, "type": row.get("type", ""),
            "filename": filename, "original_path": original.relative_to(ROOT).as_posix(),
            "subcategory": subgroup, "resolution": match.group(1) if match else "", "source": row.get("source", ""),
            "resource_id": row.get("resource_id", ""), "atlas": row.get("atlas", ""),
            "width": row.get("width", ""), "height": row.get("height", ""),
        }
        inventory.append(record)
        if category == "unclassified":
            unclassified.append(record)

    fields = ["category", "character", "subcategory", "type", "resolution", "filename", "original_path", "source", "resource_id", "atlas", "width", "height"]
    for name, data in (("image_catalog.csv", inventory), ("unclassified.csv", unclassified)):
        with (output / name).open("w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(data)
    for category in sorted({row["category"] for row in inventory}):
        folder = output / category
        folder.mkdir(parents=True, exist_ok=True)
        with (folder / "分类清单.csv").open("w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(row for row in inventory if row["category"] == category)
    with (output / "分类统计.txt").open("w", encoding="utf-8") as f:
        f.write(f"图片仅保留原 images/ 一份，分类目录只保存检索清单。\n索引记录：{len(rows)}\n分类记录：{len(inventory)}\n缺失原图：{len(missing)}\n")
        for category, count in sorted(counts.items(), key=lambda item: LABELS[item[0]]):
            f.write(f"{LABELS[category]}：{count}\n")
        f.write(f"待分类：{len(unclassified)}\n")
        if missing:
            f.write("\n缺失原图：\n" + "\n".join(missing) + "\n")
    print(f"indexed={len(rows)} classified={len(inventory)} missing={len(missing)} output={output}")
    for category, count in sorted(counts.items()):
        print(f"{LABELS[category]}={count}")
    print(f"待分类={len(unclassified)}")


if __name__ == "__main__":
    main()
