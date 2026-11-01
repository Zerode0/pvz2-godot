# 植物卡片预览：架构与接入

## 入口与依据

Play → 世界/选关页右上角“植物图鉴”。也可在 Godot 打开 `scenes/plant_preview.tscn`，F6 单独运行；在 `ReferenceCanvas` 下编辑 1024×640 布局，运行时等比居中适配。

参考 Gardendless 固定提交 `462f1161d5a29423409002936f2e05f1c24ac630` 的 `AlmanacPlantPage.ts`、`CardFeature.ts`、`CardSelectAlmanac.ts`，以及通过 Cocos 原生 API 导出的真实 `almanacScene` 和 `PlantCardTemplate`。原参考为上方详情、下方横向列表；本项目使用左侧搜索卡片、右侧详情，沿用列表选择、独立展示、共享属性及播放资源分离的职责。未迁入 Cocos 对象池、玩家解锁、服装或 DragonBones 卡片动画。

运行时证据：外层 `Artifacts/plant-preview-reference/runtime.json`（223 个节点及 SpriteFrame）、模块摘录及 `research.md`。展示背景与玻璃边框来自原场景，卡片图标复用已准备的 seed packet；面板和卡片状态为 Godot 原生样式。来源见 `assets/ui/plant_preview/SOURCE.md`、`sources.json`。

## 模块所有权与接口

| 模块 | 责任与接口 |
| --- | --- |
| `ContentCatalog` | `load_actor_catalog(path) -> Error` 独立读取既有 actor catalog；`load_content(level_path)` 复用同一个读取与校验函数。 |
| `PlantPreviewCatalog` | `load_catalog(path) -> Error`、`matching_ids(query, behavior) -> Array[String]`；公开 `order`、`entries`、`error_message`。组合展示元数据和角色定义；匹配中文名或英文 ID，保持目录顺序。 |
| `PlantCard` | 场景 `scenes/ui/plant_card.tscn`；加入树后调用 `bind_plant(id, definition)`、`set_selected(bool)`；发出 `plant_requested(id)`，展示图标、名称、费用、焦点及选择反馈。 |
| `PlantAnimationPreview` | `set_plant(definition, preview_scale) -> Error`、`clear()`、`clip_options()`、`play_clip(name) -> bool`、`set_paused(bool)`；发出 `playback_changed(clip, paused)`。拥有一个 PamPlayer，切换时释放旧实例，动画 Resource 共享。 |
| `PlantPreviewScreen` | `reload_catalog() -> Error`、`select_plant(id)`、`set_filter(query, behavior)`；发出 `plant_selected(id)`、`back_requested`；负责输入、筛选、详情、空状态、错误和播放控件。 |
| `WorldMapScreen` | `open_plant_preview(plant_id)`，参数可省略，返回 PlantPreviewScreen。作为全屏子页面嵌入，隐藏原地图并关闭地图键盘输入；返回释放页面并恢复原地图及焦点。原地图实例保留世界、关卡与偏移。 |

数据流：actors.json → ContentCatalog → PlantPreviewCatalog ← plant_preview.json → PlantPreviewScreen → PlantCard / PlantAnimationPreview → PamPlayer。PamAnimationAsset 在播放器间共享；页面选择只传递植物 ID。

页面 Inspector：`catalog_path`、`initial_plant_id`、`back_scene_path`、`navigate_on_back`。嵌入其他场景时关闭 `navigate_on_back` 并连接 `back_requested`；单独运行默认通过既有 `SceneTransition` 返回地图。

动画按资源 `origin` 对齐脚底，比例为 `display_scale × preview_scale × 控件适配比例`。待机和受损外观循环，`action_clip` 单次播放后返回待机。暂停属于预览实例，植物切换时保持。预览不创建 LawnPlant 或 LevelSession，animation_command 不连接玩法系统，动作不会生成弹体、阳光或修改血量。

## 数据契约

目录 `data/ui/plant_preview.json`：

| 字段 | 含义 |
| --- | --- |
| `schema_version` | 当前为 1。 |
| `actor_catalog` | 既有 actors.json 路径。 |
| `plants` | 有序展示数组，允许空数组。 |
| `plants[].id` | 唯一且存在于 actor catalog 的 plants。 |
| `plants[].subtitle / description` | 可选展示文案。 |
| `plants[].preview_scale` | 可选正数，默认 1.65。 |

费用、生命、冷却、行为、图标、动画、动作及攻击/产出间隔来自 actor definition。`entries[id].definition` 由 UI 只读。目录失败会清空卡片和播放器并显示错误，修复后调用 reload_catalog()。

扩展同机制植物：先按内容/动画技能接入 actor、图标、PAM `.tres`，再在预览目录添加 ID、文案和比例，页面自动加入卡片；不必加入当前关卡牌组。动作菜单读取 `idle_clip` 及可选 `action_clip / damage_clip / heavy_damage_clip`，不存在的可选段不显示。新增行为时同步玩法、ContentCatalog 契约、ROLES 分类、筛选及属性行。长文案或更多属性需要相应调整详情容器。

当前覆盖三种已接入植物，参数为本地测试关卡配置；未实现完整官方图鉴、解锁/收集进度、服装、升级、组卡或战斗演练。

本次实测结果：PLANT_PREVIEW_OK；共享目录修改后的第一关回归 LEVEL_01_VERIFIED（种植、冷却、拾取、暂停、PAM 发射/产出事件、胜败、割草车和重开）通过。skill 格式校验通过。未执行打包、发布或导出。

## 工具与验证

项目根执行 `python -X utf8 Tools/export_plant_preview_reference.py`，以 Edge + Playwright 读取只读网页参考，调用 Cocos loadScene 和 Scene._load() 展开场景/prefab，导出 runtime.json；再运行 `python -X utf8 Tools/prepare_plant_preview_assets.py`，按 SpriteFrame 提取两张展示贴图及哈希。工具不解析 Cocos 序列化，不加入游戏运行时。

实际遇阻：仅 loadScene 后读到 13 个外层节点，没有植物页；调用原生 Scene._load() 后取得 223 个节点及卡片引用。

```powershell
& Tools/Godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --path GodotPamDemo --script res://scripts/tests/verify_plant_preview.gd
```

成功标记 `PLANT_PREVIEW_OK`；结果及截图在 `Artifacts/plant-preview/`。覆盖真实地图/卡片输入、键盘、搜索/分类/空结果、动画推进/暂停、动作回待机、受损外观、共享资源、旧播放器释放、重复切换、目录错误恢复、小窗口、世界和选关页返回保留状态。可加 --headless 验证流程，截图须图形模式。

实测修正：测试用 get_global_transform_with_canvas() 得到视口坐标后，须调用 Viewport.push_input(event, true)；默认 false 会再次应用 stretch，导致鼠标偏离。测试脚本不以 PlantPreviewScreen/WorldMapScreen 静态类型提前加载场景脚本，--script 初始化时 autoload 名称尚未注册；场景载入后获取实例即可。
