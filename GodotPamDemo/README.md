# 前院第一关（测试）

团队首次配置、AI 工具和 GitHub 协作见 [团队使用教程](../docs/团队使用教程.md)。根目录 启动游戏.cmd 和 测试关卡.cmd 使用相对路径，适用于成员电脑；旧 .lnk 仅供原本地目录使用。

在项目外层双击 **运行第一关.lnk**，在入口页点 **Play** → **进入世界** → 选择前院第一关 → **开始关卡**，进入关卡后点“开始防守”或按空格。也可用项目内 Godot 打开 `project.godot`，按 F5。

## 编辑登录界面

打开 `scenes/login.tscn`，F6 单独预览。在 `ReferenceCanvas` 下直接编辑真实 Godot 节点：`mainScreenBg` 更换背景，`PlayButton/PlayLabel` 改按钮文案，`PlayerSelectorButton/PlayerNameLabel` 改玩家名；其他按钮可移动、改尺寸及 Theme Overrides 中的图纹。布局以参考工程的 1024×640 坐标编辑，运行时等比适配窗口。

根节点 Inspector 的 `Navigation > Next Scene Path` 设置开始按钮目标，默认世界地图。关闭 `Navigate On Start` 后连接 `start_requested` 接管导航。`action_requested(action)` 提供 `players`、`settings`、`updates`、`info`、`quit` 按钮接口；退出已接入，其余窗口功能等待外部控制器连接。

视觉依据为 Gardendless 实际 `mainScene` 场景、SpriteFrame 图纹和字体，详见 `assets/ui/login/SOURCE.md`。这是静态主界面及编辑接口的迁移；未实现其随机背景、动画、存档管理、设置窗口和更新服务。Play 经世界轮播和可滑动地图进入本地第一关，没有账号登录服务。

## 编辑地图

世界/选关页右上角“植物图鉴”打开植物卡片预览：搜索中文名称或英文 ID、筛选用途、查看与关卡共享的属性、播放待机/动作/受损动画并暂停。返回保留原地图和位置。当前覆盖向日葵、豌豆射手、坚果，参数为本地测试配置。场景为 `scenes/plant_preview.tscn`；架构、扩展及验证见 [docs/plant-preview.md](docs/plant-preview.md)。

打开 `scenes/world_map.tscn`，在 `ReferenceCanvas` 下编辑世界轮播视口、地图视口、按钮及详情面板。根节点 `catalog_path` 指向 `data/adventure/worlds.json`，世界条目引用独立地图 JSON；节点 `scene` 指定关卡场景、`level_id` 对应通关 ID、`requires` 配置前置通关。已有 13 个常规世界和各自的完整地图路线，只有前院第一关可开始，其余节点可以浏览和查看详情。

鼠标或触摸左右拖动、滚轮浏览，松手后有惯性与边界限制；世界轮播自动居中吸附，地图有远近景视差、全图滑块和“定位所选关卡”。方向键、Home/End 可选世界或节点，Esc 逐级返回。点击节点选择，再点“开始关卡”进入。

`scenes/frontyard_map.tscn` 继承同一地图并默认打开选关页；关卡底栏、暂停及胜负面板都可返回。当前世界、各地图位置、节点选择和通关状态写入 `user://adventure_progress.cfg`；再次进入关卡会创建新单局，已通关节点可再次挑战。

地图来自 Gardendless 固定提交的原生 prefab 坐标、连接及图集，离线用官方 DragonBones core 求值，Godot 运行时使用原生 Sprite2D、AnimationPlayer 和 Control。岛屿与世界图标保留原配置 idle 动作，屏幕外暂停动画；世界轮播缩放和地图交互由 Godot 驱动。来源、哈希与准备命令见 `assets/ui/adventure/SOURCE.md`。

实际导航验证：项目内 Godot 运行 `--path GodotPamDemo --script res://scripts/tests/verify_world_map.gd`，使用独立测试存档，截图输出外层 `Artifacts/world-map/`；加 `-- --maps-only` 可跳过战斗场景往返。

## 编辑过场动画

打开 `scenes/scene_transition.tscn`，在 `AnimationPlayer` 中编辑 `fade_out` 和 `fade_in` 的关键帧、时长与遮罩；两个动画结束时分别应完全遮住画面和完全透明。场景以自动加载的 `SceneTransition` 常驻，调用 `SceneTransition.change_scene("res://scenes/level_01.tscn")` 即可播放加载花、后台读取场景并切换；`transition_finished` 和 `transition_failed(path, error)` 可用于后续衔接。加载期间屏蔽输入并忽略重复请求；读取失败时保留当前场景，退场后恢复输入。

加载花使用找到的 `UIAnimate:Flower`：`Spawn` 出现，等待时循环 `Idle`，目标场景准备好后播放 `Leave` 再淡入。`scenes/ui/loading_flower.tscn` 和 `loading_flower_petals.tscn` 是可直接编辑的原生 Godot 动画；花瓣独立循环，跨动作保持连续。根节点 `flower_scale` 调整大小，默认沿用来源节点的 0.2 倍缩放，并按 1024×640 界面基准适配窗口。

源数据是 PVZGE 提取的 DragonBones 5.5 JSON，尚未取得原始 PAM。转换由官方 DragonBones 运行库离线求值，不给游戏加入 DragonBones 解析器。重新准备资源：在项目外层运行 `node Tools/bake_loading_flower.mjs`；工具依赖及来源位于 `reference/dragonbones-tooling/`。运行验证：`Tools/Godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --path GodotPamDemo --script res://scripts/tests/verify_scene_transition.gd`，截图位于 `Artifacts/scene-transition/`。音频淡出尚未接入。

## 当前内容

- 五行九列，三波共 18 个测试敌人；预置 9 株植物，初始 250 阳光。
- 向日葵、豌豆射手、坚果、雪豌豆僵尸均使用实际 PAM 拆件动画。射手发射和向日葵产出由原版 `use_action` 帧事件触发。
- 阳光拾取、费用/冷却、同行命中、僵尸啃食、坚果受损动作、每行一次的割草机、暂停/二倍速、胜负及重开。
- 敌人暂选有完整配套资源的**雪豌豆僵尸**，按近战测试参数运行；未实现其原版射击/减速能力。此关不是官方第一关参数复刻。

操作：**1/2/3** 选植物，左键种植/拾取阳光，**S** 铲除，右键取消，空格或 Esc 暂停。

## 工程入口

- 项目入口：`scenes/login.tscn`；世界入口：`scenes/world_map.tscn`；选关返回入口：`scenes/frontyard_map.tscn`；关卡：`scenes/level_01.tscn`；波次与初始布阵：`data/levels/level_01.json`。
- 实体参数：`data/actors.json`；共享动画资源：`data/animations/*.tres`。
- `scripts/level/` 管理网格、实体、波次和 HUD；`PamAnimationAsset` 共享解码数据/纹理，`PamPlayer` 保存各自播放状态。关卡统一驱动时钟。
- 原动画实验室仍可通过 **运行示例.lnk** 打开，保留在 `scenes/sunflower_demo.tscn`；旧说明见 `docs/animation-study.md`。

## 资源与验证

转换沿用项目内 pam-viewer WASM；向日葵与坚果来自 pam-codec 样本，豌豆射手来自 PopAnimLib，雪豌豆僵尸及配套图集来自 Gekota。PAM 与来源记录保存在外层 `reference/pam-resources/`、`reference/pam-tooling/`，配图记录随各资产保存，详见 `THIRD_PARTY.md`。

实际关卡已验证三波胜利、失守失败、割草机、费用/冷却/拾取/铲除、啃食、暂停、重开与共享动画资源。结果及截图位于外层 `Artifacts/level-01/`。只做编辑器/场景运行验证，没有打包或发布。
