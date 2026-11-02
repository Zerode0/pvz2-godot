# 角色动画资源调查协议

本协议供重复的植物/僵尸组合贴图动画资源调查使用。项目规则见 AGENTS.md；既有来源与工具入口见 reference/RESEARCH_PROTOCOL.md、reference/SOURCE_RESEARCH.md、reference/ADDITIONAL_SOURCES.md 和 .agents/skills/pvz2-resource-search/SKILL.md。

## 角色

资源调查 agent 查找并取得动画文件、配套图集/贴图、资源映射及来源证据；主 agent 负责格式工具调用、配图核验、去重、总索引及工程接入。任务增量说明各方向与输出位置，避免多个 agent 重复下载同一来源。

## 读取顺序

先读 AGENTS.md、本协议及本轮相关的已有 SOURCE.md，再按需读上述来源报告与仓库文件。参考范围由本轮任务给出；已有文件直接复用。

## 产物

- 来源目录放在 reference/pam-resources/ 下，保存取得的 PAM/动画数据及配套资源，配一份 SOURCE.md。
- 区分原生 PAM、已解码 PAM JSON、DragonBones 等其他格式；不以静态图片或动画视频代替结构化组合动画。
- 来源记录包括原链接、固定版本、原文件路径、本地位置、SHA-256、角色身份、配套图像情况与许可/作者归属说明；未证实部分如实标记。
- 方向报告包含：已取得数量与角色清单、优先常见角色的覆盖、未找到项、可继续获取的实际入口、遇到的问题。
- 机器索引使用 JSON，至少含 local_path、format、source_url、revision、sha256、character/group、companion_files。

既有工程与格式工具规则沿用 AGENTS.md；资源调查不修改实际游戏场景与玩法。长任务先写阶段结果，不重复提交状态不明的下载或模型任务。
