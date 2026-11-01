---
name: pvz2-content-integrate
description: 将植物、僵尸或关卡内容按现有 Godot 数据契约接入游戏时使用；按需衔接动画、贴图和验证技能。
---

# 游戏内容接入

工程根目录为 `GodotPamDemo/`，`project.godot` 的主场景是 `scenes/login.tscn`，登录界面默认经 `SceneTransition` 进入 `scenes/world_map.tscn`，在世界轮播进入前院后选择第一关，再打开 `scenes/level_01.tscn`。已有文件放入工程目录并不会自动出现在游戏中。

## 角色

- 参考 `data/actors.json` 的同类角色，在关卡 `actor_catalog` 指向的 JSON 文件中添加唯一 ID 和定义。`scripts/runtime/content_catalog.gd` 是 schema v1 的实际校验入口；`scripts/level/lawn_plant.gd`、`lawn_zombie.gd` 和 `scripts/runtime/` 是行为实现。
- 动画使用 `data/animations/*.tres` 的 `PamAnimationAsset`：配置 PAM JSON、编译时间轴、贴图目录、默认动作和原点；参考同类现有 `.tres`。`LawnUnit.setup()` 根据 `animation`、`display_scale` 创建共享资源的独立播放器。按实际需求读取 `pvz2-pam-convert`、`pvz2-texture-map`、`pvz2-rig-bind` 和 `pvz2-animation-integrate`。
- 植物现支持 `sun`、`shoot`、`block`。前两者由动画的 `action_clip` 和 `action_command` 触发产阳光或发射；`shoot` 使用配置的弹体参数，当前是同行直线伤害。`block` 可配置受损动作。僵尸当前实现行走与啃咬。新机制需要在实体和相应系统中实现，不能仅增加配置字段。
- 将植物 ID 加入目标关卡的 `deck`，或按需求添加到 `starting_plants`；僵尸 ID 加入 `waves[].enemies`。行列索引从 0 开始。植物卡片使用 `icon`；当前 HUD 布局面向三张卡，更多卡需检查并调整 HUD。

## 关卡

- 参考 `data/levels/level_01.json`，包括 `schema_version`、`actor_catalog`、棋盘、牌组、初始植物和波次；启动时由 `ContentCatalog.load_content()` 读取和校验。`LevelSession` 的 `level_path` 指向关卡 JSON。
- 复用现有场景契约：`FrontyardLevel` / `LevelSession` 派生根节点需要 `PlantingGrid`、`Actors`、`Projectiles`、`Pickups`；`FrontyardLevel` 还需要 `HUD/LevelHUD`。通过场景的 `level_path` 选择数据，在 `data/adventure/worlds.json` 引用的地图 JSON 中，用节点 `scene` 指向关卡场景，`level_id` 对应 `FrontyardLevel.map_level_id`，`requires` 引用前置通关 ID；关卡的 `map_scene_path` 控制返回地图入口。胜利自动记录地图通关状态，地图不推进战斗。

## 完成与验证

统一开发测试入口为 scenes/development_sandbox.tscn，可通过 Tools/project.ps1 TestLevel 启动。它复用正式战斗系统，选择器自动读取 actor catalog；支持手动刷怪、阳光、冷却、清场，不记录地图通关。接口见 docs/开发测试关卡.md。新行为仍在实际实体及系统中实现。

确认资源路径、动作名与事件、角色 ID 和关卡引用相互对应，并在目标实际场景验证显示、操作及受影响的玩法。校验器检查动画资源路径等部分字段，动作、贴图、图标及弹体的完整可用性仍需在实际加载路径核实。涉及角色动画运行时读取 `pvz2-animation-verify`；现有第一关验证脚本针对原有三卡和波次，并会写入 `Artifacts/level-01/`，按本次改动选择验证范围。架构和已知能力边界见 `GodotPamDemo/ARCHITECTURE.md`。
