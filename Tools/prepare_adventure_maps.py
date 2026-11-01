"""Prepare native Godot map data from Cocos nodes and officially evaluated rig slots."""
import hashlib
import json
import math
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "reference/world-map"
WEB = ROOT / "reference/research/pvzge_web-readonly/docs"
PROJECT = ROOT / "GodotPamDemo"
DATA = PROJECT / "data/adventure"
ART = PROJECT / "assets/ui/adventure"
TITLES = {"egypt": "神秘埃及", "pirate": "海盗港湾", "cowboy": "狂野西部", "future": "遥远未来",
          "dark": "黑暗时代", "beach": "巨浪沙滩", "iceage": "冰河世界", "lostcity": "失落之城",
          "eighties": "霓虹年代", "dino": "恐龙危机", "modern": "前院", "kongfu": "功夫世界", "sky": "天空之城"}
SCALE = 0.65
COPIED = {}
USED_RIGS = set()


def read(name):
    return json.loads((SOURCE / (name + ".json")).read_text(encoding="utf-8"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def texture(rig):
    source = rig.get("textureImage") or rig.get("texture")
    if source not in COPIED:
        path = WEB / source
        target = ART / "atlases" / path.name
        shutil.copyfile(path, target)
        COPIED[source] = {"target": "res://" + target.relative_to(PROJECT).as_posix(),
                          "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    return COPIED[source]["target"]


def transformed(t, p):
    return t[0]*p[0] + t[2]*p[1] + t[4], t[1]*p[0] + t[3]*p[1] + t[5]


def preview(node, target):
    """Only chooser icons are rasterised. Full maps retain native sprites and matrices."""
    rig = node["armatures"][0]
    texture(rig)
    atlas = Image.open(WEB / (rig.get("textureImage") or rig["texture"])).convert("RGBA")
    parts = [p for p in rig["parts"] if p["color"][3] > 0.001]
    points = [transformed(p["transform"], q) for p in parts
              for q in [(0, 0), (p["region"]["width"], 0), (0, p["region"]["height"]),
                        (p["region"]["width"], p["region"]["height"])]]
    left, top = math.floor(min(x for x, y in points)), math.floor(min(y for x, y in points))
    right, bottom = math.ceil(max(x for x, y in points)), math.ceil(max(y for x, y in points))
    scale = min(640 / (right-left), 500 / (bottom-top))
    canvas = Image.new("RGBA", (640, 520))
    offset = ((640-(right-left)*scale)/2-left*scale, (520-(bottom-top)*scale)/2-top*scale)
    for part in parts:
        r = part["region"]
        crop = atlas.crop((r["x"], r["y"], r["x"]+r["width"], r["y"]+r["height"]))
        if part["rotated"]:
            raise ValueError("Rotated chooser frame requires a renderer")
        if part["color"][3] < 1:
            crop.putalpha(crop.getchannel("A").point(lambda a: round(a*part["color"][3])))
        a, b, c, d, x, y = part["transform"]
        a, b, c, d, x, y = a*scale, b*scale, c*scale, d*scale, x*scale+offset[0], y*scale+offset[1]
        determinant = a*d-b*c
        inverse = (d/determinant, -c/determinant, (c*y-d*x)/determinant,
                   -b/determinant, a/determinant, (b*x-a*y)/determinant)
        canvas.alpha_composite(crop.transform(canvas.size, Image.Transform.AFFINE, inverse, Image.Resampling.BICUBIC))
    canvas.save(target)


def convert(feature):
    code, res = feature["CODENAME"], feature["RESNAME"]
    source = read(res + "WORLDMAP")
    by_id = {n["uuid"]: n for n in source["nodes"]}
    far = {f["node"]: f["offsetScale"] for f in source["farIslands"]}

    def ancestry(node):
        result = [node]
        while node.get("parent") in by_id:
            node = by_id[node["parent"]]
            result.append(node)
        return result

    islands = source["islands"]
    min_x = min(by_id[i["node"]]["world"][4] for i in islands)
    max_x = max(by_id[i["node"]]["world"][4] for i in islands)
    origin = 512 - min_x*SCALE
    y_origin = 200 - max(0, max(200-by_id[i["node"]]["world"][5]*SCALE for i in islands)-320)
    rigs = []
    for node in source["nodes"]:
        chain = ancestry(node)
        ids = {n["uuid"] for n in chain}
        names = {n["name"] for n in chain}
        if not node["active"] or not (source["islandParent"] in ids or "Far" in names or "Near" in names or "FarTotal" in names):
            continue
        parallax = next((far[n["uuid"]] for n in chain if n["uuid"] in far), 1.0)
        if "FarTotal" in names:
            parallax = 0.0
        a,b,c,d,x,y = node["world"]
        # DragonBones local coordinates use Y down; Cocos node matrices use Y up.
        transform = [a*SCALE,-b*SCALE,-c*SCALE,d*SCALE,x*SCALE+origin,y_origin-y*SCALE]
        for rig in node["armatures"]:
            if not rig.get("native"):
                continue
            texture(rig)
            USED_RIGS.add(Path(rig["native"]["scene"]).name)
            rigs.append({"scene":rig["native"]["scene"], "bounds":rig["native"]["bounds"],
                         "transform":[round(v,5) for v in transform], "parallax":parallax,
                         "source_node":node["name"], "source_armature":rig["armature"]})
    nodes, ids, used_ids = [], {}, set()
    for index, island in enumerate(islands):
        original = by_id[island["node"]]
        node_id = island["levelIds"][0] if island["levelIds"] else code + "_" + original["name"].lower() + "_" + str(index)
        if node_id in used_ids:
            node_id += "_node_" + str(index)
        used_ids.add(node_id)
        ids[island["node"]] = node_id
        display = island["display"]
        kind = {0:"level",1:"plant",2:"gift",3:"upgrade",4:"portal"}.get(display,"special")
        label = island["label"] or {"plant":"植物", "upgrade":"升级", "portal":"传送门", "gift":"宝箱"}.get(kind,"奖励")
        x,y = original["world"][4:]
        playable = code == "modern" and node_id == "modern1"
        nodes.append({"id":node_id,"kind":kind,"position":[round(x*SCALE+origin,3),round(y_origin-y*SCALE,3)],
                      "number":island["label"] if display==0 else {"plant":"✿","gift":"★","upgrade":"↑","portal":"◎"}.get(kind,"★"),
                      "label":label if display!=0 else "第"+label+"关", "title":TITLES[code]+" · "+("第"+label+"关" if display==0 else label),
                      "description":"种下植物，收集阳光，挡住来袭的僵尸！" if playable else "沿着地图继续探索。" + ("该关卡尚未开放。" if display==0 else "奖励尚未开放。"),
                      "level_id":"frontyard_01" if playable else "", "scene":"res://scenes/level_01.tscn" if playable else "",
                      **({"level_path":"res://data/levels/level_01.json"} if playable else {}),
                      "preview":"res://assets/Frontyard.png" if playable else "res://assets/ui/adventure/"+code+".png",
                      "source_level_ids":island["levelIds"],"source_display":display})
    edges = [[ids[i["node"]],ids[next_id]] for i in islands for next_id in i.get("links",[]) if next_id in ids]
    result = {"schema_version":1,"world_id":code,"width":round((max_x-min_x)*SCALE+1024,3),
              "nodes":nodes,"paths":edges,"rigs":rigs,
              "source":{"prefab":res+"WORLDMAP","commit":"462f1161d5a29423409002936f2e05f1c24ac630","scale":SCALE}}
    write(DATA / (code+".json"), result)
    return len(nodes), len(edges)


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    (ART / "atlases").mkdir(parents=True, exist_ok=True)
    features = {w["RESNAME"].lower():w for w in read("runtime")["features"]["WORLDMAPS"] if w["CODENAME"] in TITLES}
    chooser = read("WorldmapChooserWORLDMAP")
    worlds = []
    for node in chooser["nodes"]:
        if node["name"].lower() not in features:
            continue
        feature = features[node["name"].lower()]
        code = feature["CODENAME"]
        preview(node, ART / (code+".png"))
        native = node["armatures"][0]["native"]
        USED_RIGS.add(Path(native["scene"]).name)
        count, paths = convert(feature)
        worlds.append({"id":code,"title":TITLES[code],"description":("从前院出发，开始冒险。" if code=="modern" else "探索"+TITLES[code]+"的冒险路线。") + "  " + str(count)+" 个地图节点",
                       "preview":"res://assets/ui/adventure/"+code+".png","preview_scene":native["scene"],
                       "preview_bounds":native["bounds"],"map":"res://data/adventure/"+code+".json"})
        print(code, count, "nodes,", paths, "connections")
    if len(worlds) != 13:
        raise ValueError("Expected all 13 normal world maps")
    write(DATA / "worlds.json", {"schema_version":1,"worlds":worlds})
    write(ART / "sources.json", {"repository":"https://github.com/Gzh0821/pvzge_web","commit":"462f1161d5a29423409002936f2e05f1c24ac630",
                                "pipeline":["Tools/export_world_map_reference.py","Tools/sample_world_map.mjs","Tools/prepare_adventure_maps.py"],"textures":COPIED})
    for path in (ART / "rigs").glob("*.tscn"):
        if path.name not in USED_RIGS:
            path.unlink()


if __name__ == "__main__":
    main()
