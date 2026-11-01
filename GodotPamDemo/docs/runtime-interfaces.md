# 内容接入与单局公共接口

工程内路径均相对 `GodotPamDemo/`。实际实现沿用现有 LevelSession、种植/战斗系统和场景过场；以下接口供内容接入、界面和 AI 验证脚本复用。

## 从配置启动关卡

`LevelLaunchRequest extends Resource`，实现在 `scripts/runtime/level_launch_request.gd`。可在脚本创建，也可保存为 `.tres`。

| 属性 | 默认值与用途 |
| --- | --- |
| `level_path` | `res://data/levels/level_01.json`，实际关卡配置 |
| `scene_path` | `res://scenes/level_01.tscn`，使用 FrontyardLevel 或其派生脚本的场景 |
| `return_scene_path` | `res://scenes/frontyard_map.tscn`，返回位置 |
| `profile_path` | 空字符串使用当前 AdventureProgress 档案；非空指定本次及返回地图使用的存档 |
| `deck: Array[String]` | 空数组使用配置牌组；非空替换本局可选植物，重开保留 |

```gdscript
var request := LevelLaunchRequest.new()
request.level_path = "res://data/levels/level_01.json"
request.deck.assign(["sunflower", "peashooter", "wallnut"])
var error := SceneTransition.launch_level(request)
```

`launch_level(request) -> Error` 返回受理结果：成功 `OK`，过场占用 `ERR_BUSY`，空请求 `ERR_INVALID_PARAMETER`，配置/场景/牌组无效 `ERR_INVALID_DATA`。校验信息位于 `request.errors`；`request.validate()` 可提前校验。受理时复制请求，后续修改原对象不影响启动。场景加载完成与失败沿用 `transition_finished`、`transition_failed(path, error)`。

FrontyardLevel 在初始化实体和 HUD 前接收请求。通关身份取关卡 JSON 的 `id`。同一战斗场景可以服务多个关卡配置；直接运行场景时仍使用 Inspector 的 `level_path`，`map_level_id` 为空时同样取配置 `id`。

地图节点配置 `scene`、`level_path`、`level_id`、`requires` 即可接入；`level_id` 必须与关卡 JSON 的 `id` 一致。前院 `modern1` 已走此入口。地图节点省略 `level_path` 时沿用直接切场景。地图生成工具 `Tools/prepare_adventure_maps.py` 同步输出这一字段。

## 对运行中的单局操作

以下方法位于 `scripts/runtime/level_session.gd`，在实际场景初始化成功后调用。行、列均从 0 开始，格子为 `Vector2i(column, row)`。

| 接口 | 返回值与语义 |
| --- | --- |
| `check_placement(kind, cell) -> Dictionary` | 无副作用的种植检查，返回 `{ok, reason, message}` |
| `plant(kind, cell) -> Dictionary` | 使用同一检查，成功时扣阳光、进入冷却并生成；不依赖当前选择或铲子 |
| `try_plant(cell) -> bool` | 玩家当前工具操作：种当前植物，或在铲子开启时铲除 |
| `remove_plant(cell) -> bool` | 移除指定格植物；可用于准备布阵及清理 |
| `spawn_zombie(kind, row) -> LawnZombie` | 通过实际战斗路径生成并返回实体；未知 ID、行越界、未开始或暂停返回 null |
| `select_plant(kind)` / `set_shovel(value)` | 改变玩家当前操作 |
| `set_paused(value)` / `toggle_pause()` | 战斗阶段暂停或继续 |
| `set_speed(value)` | 设置 1 或 2 倍；实际场景按倍率推进，`advance_seconds` 接收游戏时间 |
| `start_level()` / `reset_level()` | 开始、清理并重开；普通关卡重开回准备，开发测试关卡立即开始 |
| `advance_seconds(seconds)` | 固定步推进，用于实际场景和自动验证 |
| `get_run_state() -> Dictionary` | 返回独立状态快照，不暴露实体节点或内部集合引用 |

种植成功时 `reason`、`message` 为空；失败 `reason` 为 `not_playing`、`paused`、`out_of_bounds`、`unavailable_plant`、`occupied`、`insufficient_sun` 或 `cooldown`。`plant()` 会显示非空 `message`，检查本身不显示提示。角色仍从关卡的 actor catalog 接入，已有行为为 sun/shoot/block。

`get_run_state()` 字段：

- 身份与控制：`level_id`、`phase`（LevelSession.Phase）、`paused`、`speed`、`sun`、`selected`、`shovel`、`notice`。
- 进度与统计：`elapsed`、`defeated`、`wave`、`wave_count`、`enemy_count`（波次计划敌人数）、`plant_count`、`zombie_count`、`projectile_count`、`shots_fired`、`sunflower_events`。
- 卡组：`deck` 和 `cards[kind] = {cost, recharge, cooldown}`。

HUD 的 `refresh(session)` 已通过这一快照更新；鼠标种植预览已调用 `check_placement()`；开发测试关卡 `spawn_test_zombie()` 已调用公共刷怪入口。测试关卡的 unlimited_sun/no_cooldown 属于交互辅助，由现有 `try_plant()` 路径使用；显式 `plant()` 保留真实费用/冷却规则。

## 完成事件

`level_finished(result: Dictionary)` 在每局首次进入胜利/失败时发出，`result` 使用上述状态快照；`reset_level()` 开启新一局的事件周期。原有 `phase_changed`、`run_reset` 保留。前院表现层继续记录通关；开发测试关卡继续跳过通关保存。

## 验证入口

仓库根运行 `powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Verify -Suite interfaces -Headless`，成功标记 `RUNTIME_INTERFACES_OK`。验证使用实际登录页、过场和战斗场景，覆盖启动参数复制、配置与牌组、存档身份、种植检查与扣费、暂停、刷怪、快照隔离、HUD 和每局完成事件。存档使用独立的 `user://verify_runtime_interfaces.cfg`。
