# Upstream tools and data

## Plant preview

- Almanac display background and glass frame from the same pinned Gardendless reference below, exported through its native Cocos scene/SpriteFrame API. Exact node paths, texture regions and SHA-256 are recorded in `assets/ui/plant_preview/sources.json`; reproduction and scope in SOURCE.md.
- Cards reuse existing seed packet icons and shared PAM assets. Page layout and card state styles use native Godot controls. Repository code license and original game artwork rights remain separate.

## Adventure world maps

- Source: [Gzh0821/pvzge_web](https://github.com/Gzh0821/pvzge_web/tree/462f1161d5a29423409002936f2e05f1c24ac630), Apache-2.0 for repository code; original game art rights remain separate. Native Cocos resource APIs export the actual 13 normal-world prefabs, their graph and asset references.
- Official DragonBones core evaluates configured idle clips offline at their original frame rate; Godot renders their atlas regions and native AnimationPlayer tracks with Sprite2D/Control nodes. The map gesture and navigation code is implemented in this project. No Cocos runtime is added to the game.
- Reproduction steps, exact scope and texture hashes: `assets/ui/adventure/SOURCE.md` and `sources.json`. This replaces the earlier hand-composed single-island view in the running map.

## Loading flower

- Art: `UIAnimate:Flower` from [Gardendless Plus Art](https://github.com/PVZ2-Gardendless-Plus-Team/PlantsVsZombies2GardendlessPlus.Art/tree/ecbcf8bf50d7a72fe47d744958b66ace1144ad0c/rigs_UIAnimate_Flower), extracted/reconstructed from PVZGE as DragonBones 5.5 JSON. This is not the original PAM. Provenance and texture records are in `../reference/pam-resources/original-loading-flower/SOURCE.md`.
- Offline evaluator: official `dragonbones-runtime@5.6.200`, MIT. Unmodified core TypeScript source, license and package provenance are retained in `../reference/dragonbones-tooling/`; TypeScript 5.6.3 is an offline compiler dependency (Apache-2.0). `../Tools/bake_loading_flower.mjs` evaluates the armature through the upstream parser/runtime and writes native Godot animation tracks. Neither tool runs in the game.
- The game uses `scenes/ui/loading_flower.tscn`, `loading_flower_petals.tscn` and `assets/ui/loading_flower/UIAnimate_tex.png`. Source game artwork rights remain separate from the runtime/tool licenses.

## First test level

- Peashooter PAM: [vghuy17ck1/PopAnimLib](https://github.com/vghuy17ck1/PopAnimLib/blob/1630c8b8bee4a58b873778e1a0f5bfedd725d8fa/Sample/PEASHOOTER.PAM). The checked tree had no LICENSE file. Only animation data is used; no repository code was copied. All 37 images matched the user's project image index.
- Wall-nut PAM: pam-codec sample at the commit below; all 35 images matched the user's project image index.
- Snow Pea Zombie PAM, atlas PNG and ImageConfig: [jiangnangame/Gekota](https://github.com/jiangnangame/Gekota/tree/e567741bac1524256a3817e6ee3b002ccbe92226/fail_example). The repository has GPL-3.0 code; the game data's rights are separate. All 50 PAM image IDs and logical sizes exactly match the supplied atlas config; cropped regions were checked against PNG bounds. No Gekota code is incorporated into the runtime.
- Sources, original PAMs, hashes and reproduction commands: `../reference/pam-resources/*/SOURCE.md`. Local mapping/crop records: `assets/animations/*/images/image_map.json`.
- The test uses Snow Pea Zombie's actual walk/eat animation with basic melee test rules. It does not claim to implement all of that enemy's original behavior.

## pam-viewer v0.1.1

- Repository/source: https://github.com/LambdaEd1th/pam-viewer/tree/v0.1.1
- Binary release: https://github.com/LambdaEd1th/pam-viewer/releases/tag/v0.1.1
- License: AGPL-3.0-or-later. License text is retained at `../reference/pam-tooling/LICENSE-pam-viewer`.
- Used without modifications as an offline conversion tool. `Tools/convert_pam.mjs` invokes its published `pam_viewer_worker` JavaScript/WASM API. The Godot runtime does not load or bundle the worker.
- The worker performs both binary decoding and sparse timeline compilation. Compiled frame data preserves the upstream semantics documented in `crates/core/src/timeline.rs`.

## pam-codec sample

- Source: https://github.com/LambdaEd1th/pam-codec/tree/2badec2d7df8299a53f64e9c78eabb1865d807f5
- Library license: AGPL-3.0-or-later. Retained at `../reference/pam-tooling/LICENSE-pam-codec`.
- `sample/sunflower/SUNFLOWER.PAM` and 12 matching PNG fixtures supply this demonstration's animation and missing image parts. The library code itself is not incorporated into the Godot runtime.
- Original game graphics and animation content are distinct from the converter's software license. This demonstration does not claim ownership or redistribution rights to EA/PopCap game assets.

## User-supplied images

- The frontyard map illustration combines six user-supplied `IMAGE_WORLDMAP_MODERN_ISLAND*` parts. `../Tools/prepare_world_map_assets.py` preserves the originals and records layer paths, hashes, placement and dimensions in `assets/ui/world_map/sources.json`. This is an authored layout rather than a reproduction of the original world-map animation; game artwork rights remain with their respective owners.

- 19 matching sunflower images come from the user's extracted library, now stored in `../SourceAssets/pvz2/images`, selected through `../SourceAssets/pvz2/image_index.csv` resource IDs.
- Every image's source and SHA-256 is recorded in `assets/image_map.json`.
- Frontyard, shadow and sun textures reuse assets previously prepared in the adjacent Unity prototype, with sources recorded in `../Prototype/Assets/PVZPrototype/ASSET_SOURCES.json`.
