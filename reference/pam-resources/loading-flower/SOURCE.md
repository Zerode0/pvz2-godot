# LoaderFlower candidate (PVZ2 identity unconfirmed)

This folder preserves the scene record for a PvZ2 Gardendless web-build loading overlay. It is a candidate for visual comparison only; it does not establish that the art is an original PvZ2 asset.

## Source

- Repository: [Gzh0821/pvzge_web](https://github.com/Gzh0821/pvzge_web)
- Checked-out commit: `462f1161d5a29423409002936f2e05f1c24ac630`
- Repository license: Apache-2.0. This covers repository code; it does not establish rights to PvZ2 art included in the game.
- Original file: `docs/assets/resources/import/0f/0f158cd89.json`
- Direct source: https://raw.githubusercontent.com/Gzh0821/pvzge_web/462f1161d5a29423409002936f2e05f1c24ac630/docs/assets/resources/import/0f/0f158cd89.json
- Saved file: `pvzge-almanacScene-loaderflower-candidate.json`
- SHA-256: `c1edd0bb8deff23d78bd11f97a07e713acf3f12b19d108761f53d911e52d6e39`

## What the files show

- The scene is `almanacScene` (the same scene identifier is present in its resource serialization).
- It contains a `LoaderFlower` node, inactive by default, with a 140×140 UI transform.
- Its DragonBones armature display specifies armature `Flower`, animation `Idle`, and references compressed DragonBones asset UUID `adCI+eLcZPqoh992fhCcgo` (`ad088f9e-2dc6-4faa-887d-f767e109c828`) and compressed SpriteFrame UUID `d4vwVs88FKM6Bt3UaYMdig` (`d4bf056c-f3c1-4a33-a06d-dd469831d8a0`).
- The bundled script `docs/assets/main/index.js` defines `KeyListener.flowerOn()` to activate the node and play `Spawn`; `flowerOff()` plays `Leave`. Thus this is Gardendless's global loading overlay, not just a flower in the start screen.
- The compressed UUIDs were decoded using Cocos Creator's format (two leading hex characters followed by standard base64 for the remaining 15 bytes). Looking up these UUIDs did not locate individual files or entries in the three bundle configs. Subsequent inspection recovered the `UIAnimate:Flower` skeleton/atlas from packed resources and followed the atlas asset's own UUID reference to its correct PNG. Complete payload paths and evidence are now in `reference/pam-resources/original-loading-flower/SOURCE.md`. The scene record saved here remains the evidence for global loading-overlay use.
- Original PvZ2 identity is unconfirmed. Gardendless is a fan project based on PvZ2; its repository license does not establish the origin or reuse license of this art.

## Retrieval check

The public GitHub repository metadata/tree was checked on 2026-10-31 (default branch `master`, last pushed 2026-10-27). The recursive tree contained 8,864 entries and did not expose loader/skeleton/atlas filenames. The local build has hashed asset filenames; the exact DragonBones asset/texture IDs above were not found elsewhere in its published asset bundles. The separately named `LawnGrouper` skeleton with a `Flower` atlas subtexture is unrelated and is not included as a match.
