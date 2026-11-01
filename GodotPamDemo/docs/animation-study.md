# 向日葵 PAM 动画示例

这是保留的动画实验室说明，以下相对路径均以 Godot 工程根目录为准。当前 F5 默认打开第一关；本实验室使用 **运行示例.lnk**，或打开 `scenes/sunflower_demo.tscn` 按 F6。

使用 Godot **4.7.2** 打开工程的 `project.godot`，打开动画实验室场景按 **F6**。贴图与 JSON 已准备好，运行时不需要 Node、Python、网络或第三方 Godot 插件。

本机也可以在资源管理器双击 **运行示例.lnk** 直接播放；双击 **Godot编辑工程.lnk** 打开编辑器。引擎已放入外层 `Tools/Godot/4.7.2/`，两个快捷方式已更新。

## 可以查看什么

- 原始 PAM 的待机、产阳光、能量豆启动/循环/结束，共 5 个动作段、165 帧，30 FPS。
- 31 张独立部件图片，按原始嵌套层级、完整仿射矩阵、层序、透明度与混合方式合成；没有把动画烘焙成图片序列。
- 左侧实际播放，右侧同步显示部件边界与枢轴；支持展开部件、切换样本自带装扮、暂停、逐帧、时间轴和播放速度。
- `use_action`、`use_special` 等原版帧事件驱动示例阳光生成。能量豆按 `plantfood_on → plantfood → plantfood_off → idle` 顺序展示。

快捷键：空格暂停/播放，左右方向键逐帧。

## 动画与“骨骼”的区别

这份 PAM 是嵌套 Sprite 显示列表和逐帧矩阵动画，并不包含传统网格蒙皮的顶点权重。Godot 用真实的 `Node2D → Node2D → Sprite2D` 层级表达绑定，直接设置完整 `Transform2D`，保留镜像、缩放与斜切。右侧显示的是原始枢轴与图片边界；示例没有虚构骨骼权重或重画动作。

## 复用的现成工具

1. 下载并使用 [pam-viewer v0.1.1](https://github.com/LambdaEd1th/pam-viewer/releases/tag/v0.1.1) 官方发布的 WebAssembly worker。独立 Node 适配脚本调用其 `load` 接口；PAM 二进制解码与 `remove/append/change` 时间轴编译均由上游完成。
2. 原始 JSON 和上游 `CompiledAnimation` 分别保存为 `assets/sunflower.pam.json` 与 `assets/sunflower.compiled.json`。Godot 只负责播放上游已经编译的显示列表，不自行解析 PAM 二进制。
3. `scripts/pam_player.gd` 将已编译帧映射到 Godot 节点；`scripts/sunflower_demo.gd` 是交互示例及帧事件演示。

原版时间轴数据来自 [pam-codec 的 sunflower 样本](https://github.com/LambdaEd1th/pam-codec/tree/2badec2d7df8299a53f64e9c78eabb1865d807f5/sample/sunflower)，原始文件保留在外层 `reference/pam-tooling/SUNFLOWER.PAM`。**本次没有从用户当前版本的 OBB 重新提取 PAM。**

贴图中 19 张按外层 `SourceAssets/pvz2/image_index.csv` 的资源 ID 选取用户 1536 素材；原始图库现位于 `SourceAssets/pvz2/images/`。另外 12 张在本地版本中没有同 ID 图片，使用与样本 PAM 同提交的配套图。PAM 的逻辑尺寸负责贴图分辨率换算。完整来源、哈希及映射见 `assets/image_map.json`；转换工具最终报告 31/31 已加载、缺失 0。

背景、地面阴影、阳光图片复用外层现有原型整理过的资产；来源记录仍在 `Prototype/Assets/PVZPrototype/ASSET_SOURCES.json`。

## 重新准备数据

在外层项目根目录运行；下列命令会刷新此示例的派生 JSON 和贴图：

```powershell
python Tools/fetch_pam_tooling.py
node Tools/convert_pam.mjs reference/pam-tooling/SUNFLOWER.PAM reference/pam-tooling/converted
python Tools/prepare_pam_example.py
node Tools/convert_pam.mjs reference/pam-tooling/SUNFLOWER.PAM GodotPamDemo/assets GodotPamDemo/assets/sunflower
```

下载器固定工具版本和样本提交，校验归档 SHA-256。Node 仅用于转换阶段；所有解码和时间轴编译来自未修改的上游 WASM。

## 验证与范围

已通过 Godot 实际渲染、5 个动作段、花瓣矩阵变化、帧 89 的产阳光事件、帧 138/142/146 的能量豆事件与返回待机检查。外层 `Artifacts/pam-example/verification.json`、截图及 GIF 是验证结果。没有导出游戏包、安装包或发布制品。

此例用于验证向日葵数据通路，不是覆盖所有 PAM 版本与行为的通用插件；当前只派发主时间轴命令，不实现原版全部脚本指令。新角色仍需匹配其 PAM 和同版本贴图，再验证标签、资源映射与混合效果。

## 上游许可

工具及数据来源见 `THIRD_PARTY.md`。原版美术与动画样本的权利范围需要与工具代码分开看待。
