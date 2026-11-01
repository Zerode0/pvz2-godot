---
name: pvz2-texture-map
description: "将 PvZ2 提取后的 PNG 或图集部件与 PAM 图片资源配对、处理缺图及分辨率差异时使用。"
---

# 贴图映射

已有图片索引：

```powershell
python scripts/map_images.py --pam-json ANIMATION.pam.json --index image_index.csv --images SOURCE_IMAGES --output-dir TARGET_IMAGES
```

配套 PNG 图集与 ImageConfig：

```powershell
python Tools/prepare_atlas_parts.py --pam-json ANIMATION.pam.json --config IMAGE_CONFIG.json --atlas ATLAS.png --output-dir TARGET_IMAGES
```

输出部件 PNG 和 `image_map.json`。本项目索引为 `SourceAssets/pvz2/image_index.csv`，原图位于 `SourceAssets/pvz2/images/`；`--fallback-dir` 可指定已配套的部件目录。

实际遇阻：提取文件带编号前缀，改按资源 ID 配对；雪豌豆的本地 50 项均缺失，改用同提交图集及 ImageConfig 的 `id/ax/ay/aw/ah`，50/50 裁片成功。PNG 像素尺寸与 PAM image.size 的差异由播放器做逻辑尺寸换算。

加载花曾按 Art `_index.json` 取到布局不同的白色 PNG（UUID `5e324f39-1148-482b-9024-5ae13ecdad9d`）。实际配图是原 PVZGE atlas 资产引用的 UUID `3888b966-4065-457e-8d0c-92ffab093f0a`，已存为 `reference/pam-resources/original-loading-flower/UIAnimate_tex.pvzge.png`；直接沿用原 atlas 的 head `(1,1,136,136)`、arrow `(1,139,124,100)`、piece `(139,1,99,160)`，无需改矩形。来源引用链见同目录 `SOURCE.md`，烘焙脚本使用这张已核对的彩色配图。

地图图集配对：`Tools/export_world_map_reference.py` 从原 Cocos ArmatureDisplay 读 `dragonAtlasAsset.texture.image.nativeUrl`，`Tools/sample_world_map.mjs` 用已缓存官方 DragonBones core 解析骨架与 atlas 并求出 slot region、pivot 后的仿射变换及颜色，同一脚本按原帧率生成 Sprite2D/AnimationPlayer 场景，`Tools/prepare_adventure_maps.py` 生成场景放置数据、缩略图和来源哈希。Cocos 节点 Y 向上、DragonBones 局部 Y 向下，节点矩阵 `[a,b,c,d,x,y]` 转 Godot 使用 `[a,-b,-c,d,x,-y]` 后再组合 slot 变换。

实际遇阻：未加入运行场景的 Cocos armature 虽能构建，slot `_textureData` 为空；改用现成官方离线 core 求值后图集关联完整，保持网页只负责导出原生节点与资源。
