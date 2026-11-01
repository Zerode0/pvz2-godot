# PvZ2 Godot 团队工程

供小团队共同开发的 Windows / Godot 4.7.2 工程，包含当前游戏实际使用的素材、动画、关卡数据和 AI 开发技能。玩法和数值可以按团队讨论自由设计。

当前可运行内容：主菜单、13 个世界的地图浏览、前院第一关、三种植物的图鉴与动画展示，以及复用实际战斗系统的开发测试关卡。只有前院第一关已接入正式可玩流程，其余地图节点用于浏览。

## 第一次运行

安装 [Git for Windows](https://git-scm.com/download/win)，准备自己的 AI 编程工具，然后执行：

~~~powershell
git clone https://github.com/Zerode0/pvz2-godot.git
cd pvz2-godot
powershell -NoProfile -ExecutionPolicy Bypass -File Tools/setup.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File Tools/project.ps1 Run
~~~

配置脚本下载并校验固定版本的 Godot，首次导入素材。此后可双击根目录的 **启动游戏.cmd** 或 **测试关卡.cmd**。

## 教程与 AI 入口

- [团队使用教程](docs/团队使用教程.md)：首次配置、使用不同 AI 工具、日常修改、试玩、提交 PR 和定期整合。
- [资源与工具](docs/资源与工具.md)：现有素材、入库范围、素材依赖及重制入口。
- [开发测试关卡](docs/开发测试关卡.md)：植物选择、刷怪、阳光、冷却和清场。
- [AGENTS.md](AGENTS.md)：所有 AI 共用的项目规则与功能技能索引。
- [团队流程 skill](.agents/skills/pvz2-team-workflow/SKILL.md)：环境配置、开发和提交接口。
- [游戏架构](GodotPamDemo/ARCHITECTURE.md)、[工程操作](GodotPamDemo/README.md)、[植物预览接口](GodotPamDemo/docs/plant-preview.md)。

Codex 使用 AGENTS.md，Claude Code 使用 CLAUDE.md，Cursor 使用 .cursor/rules/project.mdc。其他工具也可直接读取这些 Markdown 文件及 .agents/skills/ 下的技能。

## 常用操作

在仓库根目录的 PowerShell 中执行，命令可交给 AI：

| 目的 | 命令 |
| --- | --- |
| 配置游戏环境 | powershell -ExecutionPolicy Bypass -File Tools/setup.ps1 |
| 打开游戏 | powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Run |
| 打开 Godot 编辑器 | powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Editor |
| 打开统一测试关卡 | powershell -ExecutionPolicy Bypass -File Tools/project.ps1 TestLevel |
| 打开植物展示 | powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Preview |
| 导入与脚本扫描 | powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Check |
| 战斗回归 | powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Verify -Suite level -Headless |
| 测试关卡回归 | powershell -ExecutionPolicy Bypass -File Tools/project.ps1 Verify -Suite sandbox -Headless |

## 团队约定

任务与设计在群里沟通，成员将相关结论提供给自己的 AI。每次任务在独立分支开发，通过 PR 定期整合；成员都可以参与修改和合并。main 保持可运行、可试玩，设计冲突在群里达成共识后合并。

游戏运行所需素材已入库；完整原始图库、旧 Unity 原型、Godot 引擎和本地缓存不随 Git 提交。当前没有 Git LFS 依赖。素材及第三方工具来源保存在 [THIRD_PARTY.md](GodotPamDemo/THIRD_PARTY.md) 和资源旁的 SOURCE.md。
