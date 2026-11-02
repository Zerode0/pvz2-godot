# Source

- Repository: https://github.com/jiangnangame/Gekota
- Commit: `e567741bac1524256a3817e6ee3b002ccbe92226`
- Repository license: GPL-3.0 (`LICENSE.txt`). This applies to the repository; the PAM is a PvZ2 game asset and is not thereby established as GPL-licensed.
- Path: `fail_example/ZOMBIE_SNOWPEA.PAM`
- Direct file: https://raw.githubusercontent.com/jiangnangame/Gekota/e567741bac1524256a3817e6ee3b002ccbe92226/fail_example/ZOMBIE_SNOWPEA.PAM
- Original identity: Snow Pea Zombie (`ZOMBIE_SNOWPEA`), not the basic zombie.
- Source SHA-256: `2bdfb1a5052121c65e0f01837d02dd026e465bc99ed9a5e7e3f8d0494ce5f521`.
- Decoded with the project's `convert_pam.mjs` and cached `LambdaEd1th/pam-viewer` v0.1.1 WASM. The conversion found 50 image references, 56 sprites, and 468 main frames at 30 fps. Main timeline labels: `idle`, `walk`, `eat`, `die`, and `particles`. The converter initially ran without images and reports 50 missing references.
- Conversion command:

  ```powershell
  node .agents/skills/pvz2-pam-convert/scripts/convert_pam.mjs --worker-dir reference/pam-tooling/web/assets/assets/worker/pkg --input reference/pam-resources/jiangnangame-Gekota-e567741/ZOMBIE_SNOWPEA.PAM --output-dir reference/pam-resources/jiangnangame-Gekota-e567741/decoded
  ```

- Generated files: `decoded/ZOMBIE_SNOWPEA.pam.json`, `decoded/ZOMBIE_SNOWPEA.compiled.json`, and `decoded/ZOMBIE_SNOWPEA.conversion.json`.
- PAM image identifiers use the `IMAGE_ZOMBIE_ZOMBIE_SNOWPEA_ZOMBIE_SNOWPEA_<dimensions>` naming pattern. The decoded JSON contains all identifiers and dimensions for texture matching.
- The same repository commit provides [the companion atlas PNG](https://raw.githubusercontent.com/jiangnangame/Gekota/e567741bac1524256a3817e6ee3b002ccbe92226/fail_example/ZOMBIE_SNOWPEA.png) and [its ImageConfig](https://raw.githubusercontent.com/jiangnangame/Gekota/e567741bac1524256a3817e6ee3b002ccbe92226/fail_example/ZOMBIE_SNOWPEA.ImageConfig.json); both are saved beside this note. The ImageConfig has 50 image rows, and every one of the PAM's 50 image IDs matches exactly. All 50 rows name the `ATLASIMAGE_ATLAS_ZOMBIESNOWPEAGROUP_1200_00` atlas and include source path plus atlas rectangle (`ax`, `ay`, `aw`, `ah`), so these are direct mappings, not visual guesses. These supplied Snowpea resources are separate from `SourceAssets/pvz2/image_index.csv`, which has no exact basename matches for these 50 PAM images.
- Integrated result: `Tools/prepare_atlas_parts.py` checked each resource ID, logical size and PNG bounds, then cropped all 50 parts. Final worker conversion reports 50 loaded images, zero missing; assets are in `GodotPamDemo/assets/animations/zombie_snowpea/`. This is the first level's test enemy, using actual walk/eat animation and basic melee test rules.

## Additional sample: Ice Age Weasel Hoarder Zombie

- Repository: https://github.com/jiangnangame/Gekota
- Commit: `e567741bac1524256a3817e6ee3b002ccbe92226`
- Repository license: GPL-3.0 (`LICENSE.txt`). This does not establish a license for the included PvZ2 game assets.
- PAM path: `fail_example/ZOMBIE_ICEAGE_WEASELHOARDER.PAM`
- PAM URL: https://raw.githubusercontent.com/jiangnangame/Gekota/e567741bac1524256a3817e6ee3b002ccbe92226/fail_example/ZOMBIE_ICEAGE_WEASELHOARDER.PAM
- Companion files from the same repository path: `ZOMBIE_ICEAGE_WEASELHOARDER.png` and `ZOMBIE_ICEAGE_WEASELHOARDER.ImageConfig.json`; both were downloaded beside the PAM.
- Original identity: Ice Age Weasel Hoarder Zombie (`ZOMBIE_ICEAGE_WEASELHOARDER`), not the basic zombie.
- PAM SHA-256: `00a1357718d916f6d657722ffc9e21a44312836a32795792303fb6bbb85b9efe`.
- Decoded with the project's `convert_pam.mjs` and cached `LambdaEd1th/pam-viewer` v0.1.1 WASM. It contains 70 image references, 14 sprites, and 397 main frames at 30 fps. Main timeline labels: `idle`, `walk`, `eat_start`, `eat_loop`, `eat stop`, `weasel_die`, `weasel_shock`, and `weasel_burn`.
- PAM conversion command:

  ```powershell
  node .agents/skills/pvz2-pam-convert/scripts/convert_pam.mjs --worker-dir reference/pam-tooling/web/assets/assets/worker/pkg --input reference/pam-resources/jiangnangame-Gekota-e567741/ZOMBIE_ICEAGE_WEASELHOARDER.PAM --output-dir reference/pam-resources/jiangnangame-Gekota-e567741/decoded
  ```

- Texture pairing used the project's `SourceAssets/pvz2/image_index.csv` and `SourceAssets/pvz2/images/`:

  ```powershell
  python .agents/skills/pvz2-texture-map/scripts/map_images.py --pam-json reference/pam-resources/jiangnangame-Gekota-e567741/decoded/ZOMBIE_ICEAGE_WEASELHOARDER.pam.json --index SourceAssets/pvz2/image_index.csv --images SourceAssets/pvz2/images --output-dir reference/pam-resources/jiangnangame-Gekota-e567741/mapped-images
  ```

- Mapping result: 70/70 PAM image references matched indexed project images, with zero fallback files. The copied mapped PNGs and `mapped-images/image_map.json` record exact resource IDs, source paths, logical sizes, source atlas, and SHA-256 values. The indexed atlas path for all matches is `ATLASES/ZOMBIEICEAGEWEASELHOARDERGROUP_1536_00.PTX`; extracted source path prefix is `images\\1536\\full\\zombie\\zombie_iceage_weasel\\`.
- Generated decoder files are in `decoded/`; mapped images are in `mapped-images/`.

## Additional sample: Spore-shroom projectile

- Repository: https://github.com/jiangnangame/Gekota
- Commit: `e567741bac1524256a3817e6ee3b002ccbe92226`
- Repository license: GPL-3.0; this does not establish a license for the included PvZ2 asset.
- Original PAM: `fail_example/SPORESHROOM_PROJECTILE.PAM`
- Companion files from the same directory: `SPORESHROOM_PROJECTILE.PNG` and `SPORESHROOM_PROJECTILE.ImageConfig.json`.
- SHA-256: PAM `A4D4EC1C7266867C83646841B80D5669086DF4E2FA504DBDC13A21E247D24A08`; PNG `79D83FF0B6438F076BBA39C2C34E0EB826E3BFC034F4E23C4269E353DD742A27`; ImageConfig `7C25A78AB0FE3925B6A1027D5B69E0D0580AE918A7034A2E30D45891F8C5EF99`.
- Direct PAM URL: https://raw.githubusercontent.com/jiangnangame/Gekota/e567741bac1524256a3817e6ee3b002ccbe92226/fail_example/SPORESHROOM_PROJECTILE.PAM
- This is a projectile animation rather than a full plant rig. The PAM and atlas were saved; detailed reference matching awaits the main agent's format-tool pass.
