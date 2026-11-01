# 登录 / 主界面参考

来源：本项目只读参考 `reference/research/pvzge_web-readonly`，上游 https://github.com/Gzh0821/pvzge_web ，调研固定提交 `462f1161d5a29423409002936f2e05f1c24ac630`。

- 场景：`docs/assets/resources/config.json` 的 `scenes/mainScene`（index 0），对应 `docs/assets/resources/import/09/09ec05540.json`。
- 行为：`docs/assets/main/index.js` 中 `mainScene.ts`（`goToGame`、`players`、`setting`、`updates`、`info`、`quit`）。原参考进入世界地图或强制关卡；本项目 Play 默认进入本地简易世界地图，再选择已有第一关。
- 使用原参考自带 Cocos 3.8.4 的 `resources.loadScene("mainScene")` 和 `SpriteFrame` API 读取节点尺寸、位置、缩放、图集矩形、旋转、原尺寸、偏移、九宫格边距及按钮状态。导出证据位于项目外层 `Artifacts/login-reference/main-scene-runtime.json`；没有自行解析 Cocos 序列化格式。
- 背景图集：`docs/assets/resources/native/1a/1aae2f737.png`，原 SpriteFrame `c1cbaf99-42f8-4b52-b3e4-02b26c1ba596@f9941`，裁切 `(3,3,2048,1536)`。
- UI 图集：`docs/assets/resources/native/1e/1e60593a5.png`；按原 SpriteFrame 元数据裁切、还原旋转与透明边距。
- 字体：`docs/assets/resources/native/86/86615cb2-9939-4358-b8e2-ec2d020efeea/FBUSV8C5EI.ttf`。

迁移保留参考的静态默认背景和可核实按钮布局、字体及状态图纹。未声称完整复刻原参考运行时；随机背景、粒子、窗口、存档及地图流程未迁移。原版图像和字体的权利属于相应权利人；参考仓库代码许可不代表这些素材的再分发许可。
