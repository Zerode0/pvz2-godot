---
name: pvz2-godot-ui
description: "修改 Godot 关卡 HUD、卡槽、图标尺寸和排版时使用，复用已有 UI 接口及实测修正。"
---

# Godot 界面

地图验证实测修正：注入通过 get_global_transform_with_canvas() 算出的视口坐标时，root.push_input(event, true) 避免再次 stretch；默认参数曾使 headless 的滚轮和点击坐标错位。地图和植物预览验证均使用此接口。

团队测试关卡 scenes/development_sandbox.tscn 继承第一关场景；左侧原生控件由 scripts/development/development_sandbox.gd 生成，读取实际 actor catalog。共享操作入口与命令见 docs/开发测试关卡.md。

植物卡片预览/图鉴见 `../pvz2-plant-preview/SKILL.md`；入口 `scenes/plant_preview.tscn`，地图通过 `WorldMapScreen.open_plant_preview()` 嵌入并保留原状态。完整架构与数据契约见 `GodotPamDemo/docs/plant-preview.md`。

入口：`GodotPamDemo/scripts/level/level_hud.gd`；现成接口 `_panel`、`_text`、`_image`、`_button`。

登录页：`GodotPamDemo/scenes/login.tscn`，在 `ReferenceCanvas` 下用 Godot 原生节点编辑背景、按钮、文案及样式。根节点 `next_scene_path` 控制 Play 目标；关闭 `navigate_on_start` 并连接 `start_requested` 可接管导航，`action_requested` 提供其他按钮接口。坐标基准 1024×640，`scripts/ui/login_screen.gd` 自动等比适配窗口。

Gardendless 主场景在 resources bundle 的 `config.json` 中索引0、pack `import/09/09ec05540.json`。参考网页可用 Python Playwright `chromium.launch(channel="msedge", headless=True)` 运行本机 Edge；通过网页原生 `System.import("cc")`、`assetManager.getBundle("resources").loadScene("mainScene", callback)` 获取真实 Node、SpriteFrame 及九宫格元数据。当前接口与来源见 `assets/ui/login/SOURCE.md`。

实际遇阻：TextureRect 图标按纹理原尺寸挤出卡槽。有效顺序是先设置 `expand_mode = EXPAND_IGNORE_SIZE`，再赋 texture、加入父节点，最后设置 position/size；已实现在 `_image()`。

过场接口：`GodotPamDemo/scenes/scene_transition.tscn` 为自动加载的 `SceneTransition`，在 AnimationPlayer 编辑 `fade_out` / `fade_in`；调用 `SceneTransition.change_scene(path)`，可监听 `transition_finished` 与 `transition_failed(path, error)`。默认 1 秒黑色遮罩；后台读取期间播放加载花 `Spawn / Idle / Leave` 并屏蔽输入，失败保留原场景。花的位置由 `Overlay/FlowerAnchor` 编辑，根节点 `flower_scale` 默认 0.2，按 1024×640 界面基准等比适配。

- 关卡卡组入口：`LevelHUD.build(definitions, title, deck)`，`deck: Array[String]` 来自关卡 JSON；原三卡布局沿用，新增牌组数量时同步处理排版。

地图入口：`GodotPamDemo/scenes/world_map.tscn`，`WorldMapScreen.catalog_path` 默认 `data/adventure/worlds.json`；各世界引用独立地图 JSON，节点 `scene`、`level_id`、`requires` 连接实际关卡与通关状态。`MapPanView` 复用裁剪拖动视口，接口为 `pan_to`、`tapped`、`position_changed`、`gesture_finished`；`WorldMapCanvas` 实例化原生岛屿场景并裁剪装饰、更新视差及暂停屏幕外动画；`MapLevelButton` 表示选择、锁定及完成。`ReferenceCanvas` 以 1024×640 编辑标题、视口和详情。

`frontyard_map.tscn` 继承同一场景、`initial_view = LEVELS`，供关卡直接返回。`LevelHUD.map_requested` 连接 `FrontyardLevel.return_to_map()`，目标由 `map_scene_path` 指定。`AdventureProgress` 使用 ConfigFile 保存地图位置/选择和通关 ID；胜利由 `FrontyardLevel.map_level_id` 记入。`progress_path` / `map_progress_path` 为空时共用 `AdventureProgress.active_profile_path`，测试替换该路径隔离存档。

真实地图准备接口：依次运行 `python -X utf8 Tools/export_world_map_reference.py`、`node Tools/sample_world_map.mjs`、`python -X utf8 Tools/prepare_adventure_maps.py`；输入为只读 Gardendless 网页及已缓存官方 DragonBones core，输出 `reference/world-map/`、`data/adventure/`、`assets/ui/adventure/`，其中 `rigs/*.tscn` 是按原帧率生成、可复用的 Sprite2D/AnimationPlayer idle 场景，恒定属性直接保存在节点。来源见后者 `SOURCE.md`。

地图验证：Godot 执行 `--path GodotPamDemo --script res://scripts/tests/verify_world_map.gd`，涵盖实际鼠标/触摸、惯性/边界、13 个世界、锁定入口、进关及存档返回；截图在 `Artifacts/world-map/`，加 `-- --maps-only` 跳过战斗往返。实际遇阻：返回页给地图节点 `grab_focus()` 会触发定位并覆盖已恢复的偏移，改将焦点放在开始或定位按钮。按钮九宫格复用登录 PNG 时，70 像素高按钮使用 24 像素边距并清零内容边距；60 像素上下边距会造成图纹重叠。
