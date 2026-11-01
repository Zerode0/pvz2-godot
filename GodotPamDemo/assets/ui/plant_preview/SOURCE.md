# 植物预览展示窗

来源：本地只读 reference/research/pvzge_web-readonly，上游 [Gzh0821/pvzge_web](https://github.com/Gzh0821/pvzge_web/tree/462f1161d5a29423409002936f2e05f1c24ac630)。

- 原生 almanacScene 植物页的 plantDisplayBackground 与 plantDisplayGlass。确切节点路径、SpriteFrame UUID、图集裁切、尺寸、偏移与 SHA-256 见 sources.json。
- display_background.png 为原场景默认 boost 展示图纹，本项目共用此背景，不代表植物已强化。display_glass.png 还原透明边距，用作展示框。
- 卡片图标引用既有 assets/level/Sunflower.png、Peashooter.png、Wallnut.png，来源在 assets/level/SOURCES.json；PAM 沿用 THIRD_PARTY.md。
- 面板和卡片采用 Godot 原生样式；布局为本项目设计，原龙骨卡框、家族、强化和锁定动画未迁入。

复现：项目根运行 Tools/export_plant_preview_reference.py 后运行 Tools/prepare_plant_preview_assets.py。前者通过参考自带 Cocos API 展开场景，不自行解析序列化格式。

参考仓库代码 Apache-2.0；原游戏图片和字体权利属于相应权利人。
