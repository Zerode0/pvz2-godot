---
name: pvz2-animation-integrate
description: "把角色动画绑定接入 Godot 实际实体、关卡、动作状态机、帧事件或资源生命周期时使用。"
---

# 动画工程接入

工程根目录：`GodotPamDemo`。第一关入口为 `scenes/level_01.tscn`。

- 动画资源：`data/animations/*.tres` → `PamAnimationAsset`，共享 JSON、纹理、动作段和锚点配置。
- 播放实例：`PamPlayer.load_animation(asset)`、`play_clip(name, loop)`、`seek_frame(frame)`。
- 界面展示：`PlantAnimationPreview.set_plant(definition, preview_scale)`、`play_clip()`、`set_paused()`、`clear()`；共享 PamAnimationAsset，独立播放器且动作命令不接玩法。实际调用见植物预览 skill。
- 关卡驱动：`set_process(false)` 后由统一时钟调用 `advance_seconds(dt)`，暂停/倍率随关卡。
- 事件接口：`animation_command(command, argument)`、`clip_finished(clip)`；实体实现见 `scripts/level/lawn_plant.gd`，角色参数见 `data/actors.json`。

- 单局入口：`scripts/runtime/level_session.gd` 的 `initialize_run()` / `advance_seconds()` / `reset_level()`；`FrontyardLevel` 只接场景输入与 HUD，`level_path` 选择 schema v1 关卡 JSON。植物事件由 `PlantingSystem` 连接至 `CombatSystem` / `PickupSystem`，共享动画接口不变。

## 加载花与切场

- 调用或等待 `SceneTransition.change_scene("res://scenes/level_01.tscn")`；常驻 autoload 负责后台读取、目标场景 ready、`Spawn → Idle → Leave` 和遮罩退场。`busy` 期间的新请求直接忽略，不排队。
- `transition_failed(path, error)` 在恢复原场景输入后发出；每次接受的请求最终都会发 `transition_finished`，包括失败。过场为 `PROCESS_MODE_ALWAYS`，场景树暂停时仍能切换。
- 原生资源为 `scenes/ui/loading_flower.tscn` 与 `loading_flower_petals.tscn`。完成依据是 `AnimationPlayer.animation_finished`；转换保留姿态，原数据的 `tip` / `die` 帧事件未转发。
- 重新准备资源：项目根执行 `node Tools/bake_loading_flower.mjs`；依赖安装接口为 `npm ci --prefix reference/dragonbones-tooling/compiler --ignore-scripts --no-audit --no-fund`。输入为 `reference/pam-resources/original-loading-flower/`，官方 DragonBones core 只作离线求值，输出上述原生场景及 `assets/ui/loading_flower/`。
