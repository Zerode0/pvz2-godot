---
name: pvz2-plant-preview
description: 在当前 Godot 工程修改或扩展植物卡片预览、图鉴浏览、植物详情与展示动作时使用，提供共享植物目录、可复用卡片和动画预览接口。
---

# 植物卡片预览

工程根目录 `GodotPamDemo`。完整数据契约、模块职责、扩展与实测结论见 `GodotPamDemo/docs/plant-preview.md`；参考证据见 `Artifacts/plant-preview-reference/research.md`。

## 可调用入口

- 场景：`scenes/plant_preview.tscn`，在 ReferenceCanvas 编辑 1024×640 布局。地图右上角入口调用 `WorldMapScreen.open_plant_preview(plant_id)`，参数可省略，返回原地图并保留世界/关卡/偏移。
- 页面：`PlantPreviewScreen.reload_catalog()`、`select_plant(id)`、`set_filter(query, behavior)`；信号 `plant_selected(id)`、`back_requested`。嵌入时关闭 navigate_on_back 并连接返回信号；单独运行用 back_scene_path 和 SceneTransition 导航。
- 目录：`data/ui/plant_preview.json`，条目 ID 连接 actors.json；展示文案与 preview_scale 在预览目录中，玩法数值、图标、动画和动作名来自共享 actor definition。`ContentCatalog.load_actor_catalog(path)` 无需关卡即可读取同一契约。
- 卡片：实例化 `scenes/ui/plant_card.tscn`，加入树后调用 `PlantCard.bind_plant(id, definition)`、`set_selected(bool)`；监听 plant_requested(id)。
- 展示：`PlantAnimationPreview.set_plant(definition, preview_scale)`、`clip_options()`、`play_clip(name)`、`set_paused(bool)`、`clear()`；playback_changed(clip, paused) 同步菜单。每个控件一个播放器，资源沿用 PamAnimationAsset，动作命令不接战斗系统。

## 扩展与验证

已接入植物只需增加预览目录条目；卡片数量和滚动布局自动更新。新植物按内容/动画技能准备 actor、图标及 .tres，再添加展示条目；新行为同步实际玩法、ContentCatalog 契约、分类和属性展示。

资源复现：项目根执行 `python -X utf8 Tools/export_plant_preview_reference.py`、`python -X utf8 Tools/prepare_plant_preview_assets.py`。来源和哈希在 GodotPamDemo/assets/ui/plant_preview/。

验证：项目内 Godot 执行 `--path GodotPamDemo --script res://scripts/tests/verify_plant_preview.gd`。成功标记 PLANT_PREVIEW_OK，结果及截图在 Artifacts/plant-preview/，覆盖真实输入、筛选、动作、播放器释放、错误恢复和地图返回。

实测修正：Cocos loadScene 后只有外层节点，调用 Scene 原生 _load() 展开 prefab 才能读取植物页及卡片模板；Godot 测试注入视口坐标用 push_input(event, true)，默认值会再次应用 stretch 导致点击错位。
