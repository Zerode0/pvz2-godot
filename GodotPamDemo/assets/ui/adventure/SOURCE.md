# Adventure maps

Source: [PvZ2 Gardendless Online](https://github.com/Gzh0821/pvzge_web/tree/462f1161d5a29423409002936f2e05f1c24ac630), local read-only reference `reference/research/pvzge_web-readonly`. Map configuration, prefab coordinates, island graph, armatures and texture references were read through its native Cocos resource APIs. The world carousel follows its 13 normal-world icons; epic variants are not included.

Reproduce from the repository root:

```powershell
python -X utf8 Tools/export_world_map_reference.py
node Tools/sample_world_map.mjs
python -X utf8 Tools/prepare_adventure_maps.py
```

The exporter uses Python Playwright and installed Edge to open a localhost copy of the reference. It writes native prefab metadata and original skeleton/atlas JSON to `reference/world-map/`. DragonBones' official cached core evaluates each configured idle clip at its original frame rate. It emits reusable native Godot scenes with Sprite2D atlas regions and sparse AnimationPlayer tracks for affine transform, color, visibility and region changes. Constant properties stay on the nodes. Map JSON places these scenes with original node transforms and parallax; offscreen rigs pause processing. Chooser cards use the native scenes too; footer thumbnails are rendered at 1.2 seconds with Pillow.

`sources.json` records atlas paths and SHA-256 hashes. `data/adventure/*.json` retain source prefab name, commit, original level IDs and display type. Coordinates use uniform 0.65 scaling, Y-axis conversion and padding for centering endpoints; a world-specific vertical offset keeps markers and captions visible. Node identifiers remain unique even when two reference islands share one original level ID (Egypt and Kongfu).

Godot owns input, clipping, inertia, carousel snapping, marker selection and profile persistence. `modern1` points to the existing local first level; the remaining 792 map nodes expose their details with launching disabled. Native reference island decorations and branching are retained; markers and footer are Godot controls.

The reference repository's code license is Apache-2.0. Original game art rights are separate. The DragonBones core is MIT; its source and license remain in `reference/dragonbones-tooling/`. Cocos and DragonBones are offline preparation dependencies and are not loaded by the Godot game.
