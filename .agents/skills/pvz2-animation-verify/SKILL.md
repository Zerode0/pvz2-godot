---
name: pvz2-animation-verify
description: "验证 Godot 角色动画接入或排查贴图、绑定、动作和事件故障时使用；核对实际场景及受影响调用路径。"
---

# 动画验证

统一命令为 Tools/project.ps1 Verify -Suite level|transition|world-map|plant-preview|sandbox，可加 -Headless。开发测试关卡验证成功标记 DEVELOPMENT_SANDBOX_OK；有画面时输出 Artifacts/development-sandbox/sandbox.png。

内容启动与单局公共接口验证使用 `Tools/project.ps1 Verify -Suite interfaces -Headless`，成功标记 `RUNTIME_INTERFACES_OK`，调用实际过场和战斗场景；接口契约见 `GodotPamDemo/docs/runtime-interfaces.md`。

植物预览动作/暂停/播放器释放与实际地图入口验证：同一 Godot 执行 `--path GodotPamDemo --script res://scripts/tests/verify_plant_preview.gd`，成功标记 `PLANT_PREVIEW_OK`；截图和 results.json 位于 `Artifacts/plant-preview/`。

在项目根目录运行：

```powershell
& Tools/Godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --path GodotPamDemo --script res://scripts/tests/verify_level_01.gd
```

结果和截图：`Artifacts/level-01/`。加 `-- --capture-playing` 只生成开场与战斗截图；加 `-- --ready-only` 只看准备场景。

原动画实验室回归：同一引擎执行 `--path GodotPamDemo res://scenes/sunflower_demo.tscn -- --verify`。

加载模块验证：同一引擎执行 `--path GodotPamDemo --script res://scripts/tests/verify_scene_transition.gd`，覆盖真实 Play 进入地图、各动画阶段重复请求、同一目标连续重新加载、失败后重试与暂停切场；逐次核对完成次数、常驻实例、遮罩及输入复位。成功标记 `SCENE_TRANSITION_OK`，统计与截图位于 `Artifacts/scene-transition/` 的 `results.json` 及 PNG。加 `--headless` 可只验证流程。
