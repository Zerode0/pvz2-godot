# 绑定接口

- 实例 key：父实例路径 + layer index + resource。`compiled.sprites/main` 是逐帧有序快照，`is_sprite` 区分引用；resource 等于 sprites.size() 时引用 main。
- 矩阵 `[a,b,c,d,tx,ty]` → `Transform2D(Vector2(a,b), Vector2(c,d), Vector2(tx,ty))`；2 项为平移，3 项为弧度角加平移。
- 图片 `centered=false`，局部变换 `layer * image_transform * logical_to_texture_scale`；source_rectangle 提供源裁片区域。
- 层序使用 z=0 的正确树顺序。颜色逐层相乘，additive 逐层继承。
- 子帧：`floor((parent_actual_frame - first_frame) * time_scale) + preload_frame`，按子帧数作正模。上游已处理 sprite_frame_number。

## 实际修正

- 样本直接播放会叠加装扮；用资源的 `hidden_sprite_prefixes/hidden_sprite_names` 配置可选层。
- 雪豌豆僵尸曾悬空；在其 `.tres` 调整 `origin` 对齐脚底，原始 PAM 矩阵保持原值。
- 加载花若把父骨架和花瓣一起分别烘焙 `Spawn/Idle/Leave`，切换动作会重置花瓣相位。有效接法是父骨架保留三动作，`_flowerpieces/idle` 单独烘焙到 `loading_flower_petals.tscn`，只在每轮加载开始时重播，跨父动作连续循环。
- DragonBones 隐藏插槽初帧的 `_textureData` 可能为空；`Tools/bake_loading_flower.mjs` 从上游已解析的 `rawDisplayDatas` 取纹理，保留后来出现的花瓣。图片枢轴直接使用上游 `_pivotX/_pivotY`，Sprite2D 使用裁片区域、`centered=false` 与裁边过滤。

上游语义：[pam-viewer timeline.rs](https://github.com/LambdaEd1th/pam-viewer/blob/v0.1.1/crates/core/src/timeline.rs)。工程组件是 `GodotPamDemo/scripts/pam_animation_asset.gd`（共享数据）和 `pam_player.gd`（实例绑定/播放）；角色路径、锚点与可选层配置位于 `data/animations/*.tres`。
