# 植物、僵尸与护甲组合动画原始导出

- 来源：[Gzh0821/pvzge_web](https://github.com/Gzh0821/pvzge_web/tree/462f1161d5a29423409002936f2e05f1c24ac630)。固定提交 `462f1161d5a29423409002936f2e05f1c24ac630`。
- 导出日期：2026-11-01。
- 输入：该提交 `docs/` 中实际 Cocos resources bundle 的 `plants/`、`zombies/`、`armors/` Prefab，以及 PlantFeatures、ZombieFeatures、ArmorFeatures JSON。
- 格式：DragonBones 5.5 JSON 与原图集 PNG；不是原版 PAM，也不是从截图重建的动画。
- 工具：`python -X utf8 Tools/export_actor_animation_library.py`，复用本地固定构建与浏览器的原生 Cocos API；未编写 Cocos 资源包解析器。

## 保存内容

`library.json` 记录 793 个 Prefab 的描述文件、全部数据文件 SHA-256、源版本、纹理原始路径及固定版本下载 URL。纹理沿实际 `ArmatureDisplay.dragonAtlasAsset.texture.image.nativeUrl` 取得，不使用 Art `_index.json` 的候选关联。

| 目录 | 内容 |
| --- | --- |
| `actors/plants/` | 458 个植物 Prefab 的层级、位置、缩放、动作选择与数据引用，含展示、战斗和效果变体 |
| `actors/zombies/` | 270 个僵尸 Prefab 的同类信息，保留复合身体与附属效果的组合关系 |
| `actors/armors/` | 65 个路障、铁桶、砖头、头盔等护甲 Prefab 的组合关系 |
| `skeletons/` | 按资源 UUID 保存的 369 份原始骨架 JSON；同一份可包含多个 armature |
| `atlases/` | 按资源 UUID 保存的 369 份原始 atlas JSON |
| `textures/` | 按内容哈希去重后的 369 个 PNG，370 条源纹理引用指向这些文件 |
| `features/` | 原生 JSON 目录，含 233 个植物定义、388 个僵尸定义及 65 个护甲定义的名字与资源映射 |

数字表示来源构建的条目，包含同人扩展、展示变体和共用身体的角色；不能当作独立原版角色种数。

## 核验

- `Tools/animation_library.py --rebuild` 检查文件 SHA-256、PNG 解码与全部 369 个图集/纹理组合的区域边界。结果在上层 `animation-library.json`。
- `inspection.json` 由项目缓存的官方 DragonBones core 5.6.200 生成，构建并采样 587 组骨架/图集/armature 的每个动作，覆盖全部 793 个 Prefab；这不是逐帧画面验收。
- 资源导出没有失败，目录定义引用的 Prefab 全部存在。
- 保留来源诊断：Grimrose 的重复 p26 槽、AilMint 的重复 drips1 骨/drip11 槽；三个特殊敌人的独立工厂采样提示找不到 snowyBase、wheelRolling、backFire_blue 子骨架。后两者的定义已在其他导出骨架文件中，snowyBase 未在本批骨架中找到。对应条目在总索引保留 warnings，未修改原始数据。

## 归属

仓库代码标注 Apache-2.0；其中 PvZ2 游戏美术的归属与代码许可分开，原游戏内容归 EA/PopCap，Gardendless 的扩展内容保留其来源归属。此目录保留实际构建的提取数据和来源，不把仓库代码许可扩展为美术素材许可。
