# PvZ2 DragonBones animation reference files

Source: [PVZ2 Gardendless Plus Art](https://github.com/PVZ2-Gardendless-Plus-Team/PlantsVsZombies2GardendlessPlus.Art)
Pinned revision: `ecbcf8bf50d7a72fe47d744958b66ace1144ad0c`
Retrieved: 2026-11-01

These are DragonBones 5.5 JSON skeletons converted from the Gardendless build, not original PopCap `.PAM` files. The repository contains hundreds of character rigs. This local selection contains 18 common characters; see [selection.json](selection.json) for per-file source URLs, SHA-256 hashes and animation names. The broader, correctly texture-linked runtime export is in [../pvzge-actors-462f116/SOURCE.md](../pvzge-actors-462f116/SOURCE.md).

| Group | Selected rigs |
|---|---|
| Plants (11) | Peashooter, Sunflower, Wall-nut, Potato Mine, Cherry Bomb, Repeater, Snow Pea, Torchwood, Cabbage-pult, Chomper, Bonk Choy |
| Zombies (7) | Basic, Basic Flag, Imp, Gargantuar, Ancient Egypt Basic, Pirate Basic, Modern Newspaper |

Each selected rig has `skeleton.json` and `atlas.json`. The atlas JSON gives region coordinates but does not identify the correct PNG reliably. The repository snapshot's existing `_textures/` includes the documented Basic zombie texture (`e5e6e663-06a3-4ff8-a2ae-b5a35e821ed5.png`, 1024x512). This selection preserves the Art snapshot; use the runtime export catalog for verified texture links and prefab assembly. The full research summary is in [../../../docs/动画资源库.md](../../../docs/动画资源库.md).

The repository README attributes the artwork to PopCap/EA and includes it as development reference. The repository's code license does not establish permission to redistribute game artwork; review its `COPYRIGHT.md` before any redistribution.
