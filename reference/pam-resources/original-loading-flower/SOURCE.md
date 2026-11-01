# Original PvZ2 loading flower candidate

- Repository: https://github.com/PVZ2-Gardendless-Plus-Team/PlantsVsZombies2GardendlessPlus.Art
- Pinned commit: `ecbcf8bf50d7a72fe47d744958b66ace1144ad0c`
- Rig directory: [`rigs_UIAnimate_Flower`](https://github.com/PVZ2-Gardendless-Plus-Team/PlantsVsZombies2GardendlessPlus.Art/tree/ecbcf8bf50d7a72fe47d744958b66ace1144ad0c/rigs_UIAnimate_Flower)
- Repository `README.md` says the artwork is extracted from the PVZ2 Gardendless (PVZGE) build. `COPYRIGHT.md` says the game artwork belongs to PopCap/EA, that this repository licenses none of it, and that rig/bone/animation names are originals recovered from the build's asset packs. These are repository-author provenance statements, not independent proof of the extraction chain.
- This is **not an original PAM file**. It is DragonBones 5.5 JSON reconstructed from a PVZGE build, with the matching atlas metadata and texture. The standalone source PAM and original game package were not located in this search.

## Contents and identity

- `skeleton.json`: armature `Flower`, 30 fps, animations `Spawn` (27 frames), looping `Idle` (132 frames), and `Leave` (31 frames). `Flower` is part of a UIAnimate skeleton and the animation includes `tip` and `die` frame events. The skeleton also contains `Arrow` and `_flowerpieces` armatures.
- `atlas.json`: 256×256 atlas with `head`, `arrow`, and `piece` regions.
- `atlas.pvzge.json`: the exact DragonBones atlas JSON string embedded in the local PVZGE web build's original serialized import resource `reference/research/pvzge_web-readonly/docs/assets/resources/import/0d/0d4cac202.json` (entry `D5[258][0][0][2]`). Saved separately for a direct source comparison; it is not a hand-corrected atlas.
- `UIAnimate_tex.pvzge.png`: verified matching color atlas (256×256 RGBA); SHA-256 `bfce80aaf42d76e2a0434c4f8edf3b6e212bcea351bdc343b05a78966133ae0f`. Head is the yellow smiling face at `(1,1,136,136)`, arrow at `(1,139,124,100)`, and petal at `(139,1,99,160)`. This is the input used by `Tools/bake_loading_flower.mjs`, copied into Godot as `assets/ui/loading_flower/UIAnimate_tex.png`.
- `UIAnimate_tex.png`: earlier candidate retained for comparison, SHA-256 `866431110b7a1f35f259ed8eea7e32a16d669cb2f56efaf536726568c8cf2c0a`. It has white shapes in a different layout and does **not** match this atlas. The Art repository's `_index.json` names UUID `5e324f39-1148-482b-9024-5ae13ecdad9d.png` for this rig; that index association proved incorrect during integration.

## Retrieval record

- `skeleton.json` Git blob: `64b08041672d0ef53b426677acf088cda83aa0f8`; SHA-256 `2b07740fc0b894fb78b10771f0e0799dc9fd84b2ef9ff019356f6b8c7ebf9761`.
- `atlas.json` Git blob: `0edfde2f47132f24f80e8c47c76afecc39ec1635`; SHA-256 `3adc53d71df9cf52a0ddb34341575134e549a64c5db08bd647f63edf53f4dbe4`.
- The earlier, mismatched texture was retrieved from the Art repository's pinned Git LFS media URL; the saved bytes match its pointer. The same mismatched image exists under the web bundle's `native/5e/` directory.
- Correct texture source: [PVZGE native PNG](https://raw.githubusercontent.com/Gzh0821/pvzge_web/462f1161d5a29423409002936f2e05f1c24ac630/docs/assets/resources/native/38/3888b966-4065-457e-8d0c-92ffab093f0a.png). Local original: `reference/research/pvzge_web-readonly/docs/assets/resources/native/38/3888b966-4065-457e-8d0c-92ffab093f0a.png`.
- The original atlas entry in pack `docs/assets/resources/import/0d/0d4cac202.json`, `D5[258]`, ends with asset reference `[504]`. Its shared UUID table entry `D1[504]` is `38iLlmQGVFfo0Mkv+rCT8K@6c48a`, which decodes to `3888b966-4065-457e-8d0c-92ffab093f0a`. Following this actual asset reference supplied the correct PNG. The atlas JSON itself is unchanged and matches `atlas.pvzge.json` byte for byte.

The matching `UIAnimate:Flower` global transition use was separately reported by the parallel local-resource investigation. The public art repo alone establishes the rig identity and animations, but does not itself document where in the game flow the rig is played.
