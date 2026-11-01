# 前院地图素材

`frontyard_island.png` 用用户已提取的 `SourceAssets/pvz2/images/` 原版 Modern 世界地图拆件组合：草地、泥土底座、树、白栅栏、路面和邮箱。布局为本工程设计，并非还原原版地图动画或绑定。原文件只读。

在工程外层运行 `python Tools/prepare_world_map_assets.py` 可重新准备地图图像；`sources.json` 记录每层原文件、SHA-256、位置和尺寸。资源 ID 可在 `SourceAssets/pvz2/image_index.csv` 查询。

背景使用 Godot 原生渐变，关卡节点使用原生 Button；进入世界与开始按钮复用已有登录页按钮贴图。预览使用现有 `assets/Frontyard.png`。未引入新的运行库。原版美术素材权利属于相应权利人。
