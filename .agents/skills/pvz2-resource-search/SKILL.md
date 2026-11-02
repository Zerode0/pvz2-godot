---
name: pvz2-resource-search
description: "查找或补齐本项目 PAM、骨骼动画、贴图、图集、资源包及相关工具时使用。统一委派 PAgent Luna，支持多个子代理。"
---

# 资源查找

团队共享素材与工具范围见 docs/资源与工具.md。已配置 PAgent 的成员沿用下述 Luna 路由；没有该配置的成员由当前 AI 执行同一资源查找任务，使用已有文件、来源记录和当前可用工具。

## 先查已有动画库

只找原图库图片时先用 `python -X utf8 Tools/classify_source_images.py --query 名字 --limit 20`。支持 `--category` 中文类别、`--character` 原始角色目录名、`--resolution 768|1536`；分类清单给出 `original_path`，直接读取原图。分类结果在 `SourceAssets/pvz2/images_by_category/`，重建为同一命令不带查询参数，说明见 `docs/原图库分类与检索.md`。

在仓库根运行 `python -X utf8 Tools/animation_library.py --query 名字`，支持中文/英文、codename、Prefab/armature 名；`--format pam|dragonbones` 筛选格式，`--details` 展开来源与逐图记录。机器索引为 `reference/pam-resources/animation-library.json`，范围、目录和重现命令见 `docs/动画资源库.md`。当前原生 PAM 去重 13 个、12 个配图完整；实际构建的 DragonBones 库有植物 458、僵尸 270、护甲 65 个条目，共用 369 份骨架和 369 张去重 PNG。

DragonBones 入口为 `reference/pam-resources/pvzge-actors-462f116/library.json`；`actors/` 的描述保留组合层级，`skeletons/`、`atlases/`、`textures/` 按 UUID/哈希共享。来源中文/英文目录可定位 233 个植物和 388 个僵尸定义；路障/铁桶共用 Basic 身体，护甲描述在 `actors/armors/BasicConeARMOR.json`、`BasicBucketARMOR.json`。批量文件是 DragonBones 5.5，PAM 单独保留在原来源目录。

## 新来源调查

- 先看项目 `reference/pam-resources/*/SOURCE.md`；已有 PAM、配套图集和来源记录可直接复用。
- 资源查找统一由 Luna 子代理承担；主 agent 负责分工、核验结果与接入工程。独立方向可并行多个，按资源或来源分开，避免重复搜索。
- Luna 只查找素材和工具文件；技术方法咨询、方案选择及代码接入由主 agent 处理。
- 读取 `$pagent`，使用 PAgent Luna 配置 `gptluna0`，连续任务复用同一会话。引用 `reference/RESEARCH_PROTOCOL.md`，只补本轮目标与新增线索。
- 批量角色资源调查引用 `reference/ANIMATION_RESOURCE_PROTOCOL.md`，按来源分工；报告交接后将文件和索引放入可共享的 reference/pam-resources/。
- 旧任务状态未明时先核实状态，避免重复提交。

已取得的资源入口：`vghuy17ck1/PopAnimLib/Sample/`（豌豆射手）、`jiangnangame/Gekota/fail_example/`（僵尸 PAM、PNG、ImageConfig）、`LambdaEd1th/pam-codec/sample/`（植物）。固定提交和本地文件见各自 `SOURCE.md`。

批量导出入口：`python -X utf8 Tools/export_actor_animation_library.py`，通过本地固定 PVZGE 构建的 Cocos 原生资源 API 导出 plants/zombies/armors 及名字目录，沿 atlas 实际 `texture.image.nativeUrl` 复制 PNG。`node Tools/inspect_dragonbones_library.mjs --library reference/pam-resources/pvzge-actors-462f116/library.json --output reference/pam-resources/pvzge-actors-462f116/inspection.json` 使用缓存官方 core 核验动作。总索引重建为 `python -X utf8 Tools/animation_library.py --rebuild`。

加载花资源：`reference/pam-resources/original-loading-flower/` 已保存 `UIAnimate:Flower` 的 DragonBones 5.5 骨架、图集与正确配图 `UIAnimate_tex.pvzge.png`（30 fps，`Spawn` 27 帧、`Idle` 132 帧、`Leave` 31 帧）。骨架来自 Gardendless Plus Art 的 `rigs_UIAnimate_Flower`；配图按原 PVZGE bundle atlas 的资源引用补齐，索引误配的修正见贴图映射技能及同目录 `SOURCE.md`。尚未取得原始 PAM。

离线 DragonBones 工具已缓存于 `reference/dragonbones-tooling/`；来源、官方 core 与编译器入口见其 `SOURCE.md`。npm 包 `main` 是构建 CLI，缓存 JS 依赖 Egret；已验证可用入口为核心 TS，由 `Tools/bake_loading_flower.mjs` 调用。

实际遇阻：逐个 raw 文件下载曾超时，改取 codeload 同提交归档后成功；本地缺图的雪豌豆僵尸在原仓库找到了配套 PNG/ImageConfig。

前院地图拆件位于 `SourceAssets/pvz2/images/sprite_057379` 至 `sprite_057414` 的 `worldmap_modern_island*.png`；草地、底座、树、栅栏、路面及邮箱已选入 `Tools/prepare_world_map_assets.py`，输出 `GodotPamDemo/assets/ui/world_map/frontyard_island.png` 与逐层来源记录。完整 `modern_island14` 是蓝绿色幽灵配色；这些拆件用于早期手工单岛。当前地图的真实布局和动画入口见下文。

完整可滑动地图资源已接入：Gardendless 提交 `462f1161d5a29423409002936f2e05f1c24ac630` 的世界配置、13 个常规 prefab、骨架及图集索引在 `reference/world-map/`；工具链入口与来源见 `GodotPamDemo/assets/ui/adventure/SOURCE.md`。PAgent 调研记录为 `Artifacts/world-map-reference/gardendless-map-research.md`；后续主会话原生运行时导出补齐了坐标和真实资源。当前实际地图已替换早期手工单岛。

实际遇阻：网页 resources bundle 出现时脚本尚未注册，前几个 prefab 无地图组件；导出前继续等待 `cc.director.getScene()` 后取得全部组件。大体积返回值包含重复骨架导致浏览器序列化停滞，改为按 prefab/资源 UUID 分文件传出。
