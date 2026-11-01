# 补充：完整同人框架与 PVZ2 动画导入

核查日期：2026-10-31。以下核查过仓库文件及具体源码，未运行这些项目。

## MC 大战僵尸 2（Unity）

- 仓库：[Cuerzor/MinecraftVsZombies2Unity](https://github.com/Cuerzor/MinecraftVsZombies2Unity)。根 `LICENSE` 为 GPL-3.0；项目版本文件为 **Unity 2022.3.62f3**，与本地 2022.3.62f3c1 接近。
- 同人作者已实现较大的游戏框架，源码包含实体、护甲、关卡、商店、图鉴、存档、小游戏和多种关卡行为。说明中的未来内容数量属于开发计划，不能当作已完成数量。
- 已实际检查 `Assets/Scripts/Vanilla/GameContent/Stages/Behaviours/WaveStageBehaviour.cs`：有首波计时、大波状态、最终波、割草车刷新和关卡结束检查。
- 入口场景包括 `Assets/Scenes/Landing.unity`、`Assets/GameContent/Scenes/Main.unity` 和 `Level.unity`。
- **下载源码 ZIP 不能自动获得完整工程依赖**：`.gitmodules` 引用了 `PVZEngineUnity`、`MukioI18n`、`CustomBuilder`、`tidalwav` 和 `MVZ2ResourcePack`；资源与引擎要配对提交。还依赖 Addressables、UGUI、TextMeshPro 等包。
- 适合长期研究完整系统，框架迁移工作量大于轻量 PVZ 原型。实际编译、资源包准备与启动流程尚未验证。

### 分离出的关卡引擎

[Cuerzor/PVZEngineUnity](https://github.com/Cuerzor/PVZEngineUnity) 自述为从上述项目分离出的 PVZ 关卡引擎，能查到 `Level/Level/LevelEngine.cs` 和 `Level/Entities/Entity.cs`。但独立仓库未查到根许可证，GitHub API 许可证为空；暂作架构研究，不能直接按主项目 GPL 标记推定独立仓库的授权。

## PVZ2 动画 → Unity 插件

- 仓库：[MechatIsCute/PVZ2-Animation-To-Unity](https://github.com/MechatIsCute/PVZ2-Animation-To-Unity)。已查看 `LICENSE`，为 MIT。
- **现成的 Unity 编辑器导入工具**，可将 XFL 动画目录转换为 Prefab、AnimationClip、纹理和可选粒子。源码包含 `XflImporterWindow`、`XflParser`、`XflPipeline`、`XflPlayer` 等。
- 输入需要 `DOMDocument.xml`、`extra.json`、`LIBRARY/` 等完整 XFL 目录，**不是仅凭现有 PNG 自动还原原动画**。如果手里只有 PAM，需要先转换为它能读取的 XFL，或采用别的 PAM 导出流程。
- README 明确：只在 **Unity 6.5 / URP** 测过；当前 Unity 2022.3 的兼容性待验证。默认生成 Legacy Animation，可选 Animator。
- 本地 `PVZ2-Animation-To-Unity-inspection` 只保存核查过的源码摘取和许可，不是完整可安装包。`MinecraftVsZombies2Unity-inspection` 同理，只用于调研。

这些工具/框架可减少自行开发量。优先选合适项目后按其许可保留声明；仓库代码许可不自动覆盖其中引用的原版游戏美术。
