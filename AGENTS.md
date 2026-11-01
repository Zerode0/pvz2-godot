# 项目约定

- 对实际项目应用的内容，禁止创造局部运行示例，不能为完成小范围检验不考虑后续工程要求，也不能不计代价让修改的架构影响其它操作。
- 优先复用已有代码和成熟格式工具；不自行编写 PAM 等既有格式的局部解析器。
- 默认不执行打包、发布、部署或覆盖最终制品的命令；验证尽量简短，针对实际改动。

## 团队开发入口

- 新成员和提交/整合任务先读 .agents/skills/pvz2-team-workflow/SKILL.md；教程见 docs/团队使用教程.md。
- 团队统一 Windows、Godot 4.7.2；环境配置为 Tools/setup.ps1，运行/编辑/测试为 Tools/project.ps1。所有路径相对仓库根定位。
- 任务在群里协调，设计结论由成员提供给本轮 AI；开发使用任务分支和 PR，定期整合，main 保持可运行、可试玩。
- 当前游戏使用的素材、动画数据和必要工具入库。完整 SourceAssets、旧 Unity Prototype、引擎、缓存和运行截图保留本地。
- Codex 读取本文件；Claude Code 从 CLAUDE.md 引入本文件；Cursor 从 .cursor/rules/project.mdc 引入。共享功能技能位于 .agents/skills/，按操作读取。
- 下文 PAgent Luna 路由用于已配置该环境的成员。未配置 PAgent 的团队成员使用当前 AI 查找资源和读取普通 Markdown 技能，操作接口相同。

## 项目资源位置

- Godot：`Tools/Godot/4.7.2/`；PAM 工具缓存：`reference/pam-tooling/`。
- 原始图片：`SourceAssets/pvz2/images/`；索引、提取说明与报告：`SourceAssets/pvz2/`。只读原始素材，按需准备工程使用的子集。
- 工具与素材使用项目内路径，不依赖 Downloads。操作技能脚本位于各自的 `scripts/`。
- 后续 Luna 子 agent 使用 PAgent 的 `gptluna0` 配置，连续任务复用已有会话。

## 按操作读取技能

开始对应操作时，自动读取下表中的 `SKILL.md`；跨步骤按需读取，不一次加载全部。其它操作无需读取。

| 操作 | 技能目录（均在 `.agents/skills/` 下） |
|---|---|
| 查找或补齐动画、贴图、资源包及工具 | `pvz2-resource-search`（统一 PAgent Luna `gptluna0`，可并行） |
| PAM 解码、转 JSON、编译时间轴 | `pvz2-pam-convert` |
| PNG / 图集部件与资源 ID 配对 | `pvz2-texture-map` |
| 骨骼/拆件层级、枢轴、矩阵绑定 | `pvz2-rig-bind` |
| 接入实体、动作状态和帧事件 | `pvz2-animation-integrate` |
| 将植物、僵尸或关卡内容接入游戏 | `pvz2-content-integrate` |
| 动画运行验证与故障定位 | `pvz2-animation-verify` |
| Godot HUD、卡槽、图标尺寸与排版 | `pvz2-godot-ui` |
| 植物卡片预览、图鉴浏览与详情展示 | `pvz2-plant-preview` |

重要新操作完成后，将可复用接口、试错结论和发现按功能更新到对应 skill。
顺利操作只写方便调用的接口；注意点只写真正遇到的问题及有效解法。以后写 skill 禁止额外添加防御性描述。
