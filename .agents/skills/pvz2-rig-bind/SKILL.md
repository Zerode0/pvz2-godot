---
name: pvz2-rig-bind
description: "在 Godot 重建 PvZ2 角色的骨骼/拆件绑定、父子层级、枢轴与仿射变换，或排查绑定错位、镜像和层序时使用。"
---

# 角色绑定

流程：**解码结果 → 资源映射 → 实例层级 → 枢轴与图片局部绑定 → 时间轴驱动**。

接口与实际修正记录见 [references/binding.md](references/binding.md)。

PAM 的嵌套显示列表对应 Node2D/Sprite2D；角色资源配置为 `GodotPamDemo/data/animations/*.tres`。
