---
name: pvz2-team-workflow
description: 为团队配置本 Godot 工程、启动游戏、选择检查范围，并通过分支和 PR 提交或整合修改时使用。
---

# 团队开发

仓库根包含 AGENTS.md、Tools/、GodotPamDemo/；所有命令从仓库根执行。新人教程为 docs/团队使用教程.md，素材范围与工具依赖见 docs/资源与工具.md。

## 环境与入口

- 初次配置：powershell -NoProfile -ExecutionPolicy Bypass -File Tools/setup.ps1。Godot 4.7.2 的版本、下载地址和 SHA-256 在 Tools/team-environment.json。运行已提交游戏只需 Godot。
- 素材处理依赖：同一脚本加 -AssetTools，安装 Python/Node（缺少时）、项目 Python 虚拟环境和锁定的 TypeScript。使用 Tools/.venv/Scripts/python.exe 调用素材脚本。
- 启动：Tools/project.ps1 Run；编辑器：Editor；统一测试关卡：TestLevel；植物展示：Preview。脚本可通过 powershell -ExecutionPolicy Bypass -File 调用，不依赖当前目录或本机快捷方式。
- 编辑器导入和脚本扫描：Tools/project.ps1 Check。
- 实际场景回归：Tools/project.ps1 Verify -Suite level|transition|world-map|plant-preview|sandbox，可加 -Headless；all 依次执行所有场景检查。运行记录与截图位于忽略提交的 Artifacts/。

## 修改与提交

先查看 git status 和当前分支，在 main 最新版本上为本次任务开 codex/<任务> 分支。main 保持可运行、可试玩。当前对话中的群聊结论是本轮设计依据；工程接口以实际源码和功能技能为准。

按 AGENTS.md 路由读取功能技能。新增素材、数据、行为和实际入口随同一 PR 提交。统一测试关卡复用实际战斗系统，新增玩法在相关系统实现；不在测试场景复制玩法。

完成后执行与改动相关的检查并提供试玩步骤；不把 headless 通过表述为已人工验收画面。提交前检查差异，明确选择本任务文件，保留已有的其他改动。用户要求提交 PR 时推送本任务分支并建立 PR，正文包含功能、试玩方法和实际检查结果。

定期整合时先将 main 合入任务分支、解决冲突并检查，再合并 PR。设计冲突按团队群内共识处理。采用 squash 合并便于按 PR 撤回；回退已共享提交使用 git revert。GitHub 协作者权限由仓库所有者邀请配置。

## 测试关卡接口

入口 scenes/development_sandbox.tscn，继承第一关场景，使用 DevelopmentSandbox extends FrontyardLevel 和相同 LevelSession/CombatSystem。配置 data/levels/development_sandbox.json 复用 actor_catalog；植物和僵尸选择器从该目录自动读取。spawn_test_zombie(kind, row) 使用从 0 开始的行号；界面显示从 1 开始。辅助开关为 unlimited_sun、no_cooldown，默认关闭；空场不会自动胜利，不记录地图通关。清空操作调用 reset_level()，仍可继续测试。
