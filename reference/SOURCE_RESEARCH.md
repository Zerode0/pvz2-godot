# PVZ2 源码参考调研

调研日期：2026-10-31。范围：本地 `reference/pvz2-remake-master` 与指定 GitHub 仓库；只读检查源码、项目元数据和 README，未运行构建。远程元数据取自 GitHub REST API（仓库 `/repos/{owner}/{repo}`、`/contents`、递归 Git tree）。完成度判断仅基于可见文件与代码，不代表实机完整测试。

## 项目性质、许可证与完成度

| 项目 | 性质 / 许可证 | 可证实的完成度 |
|---|---|---|
| 本地 `reference/pvz2-remake-master` | Unity 同人项目，`ProjectSettings/ProjectVersion.txt` 显示 Unity `2022.3.62f3c1`；根目录未见 README 或 LICENSE，不能确认源码和素材的授权。 | 有关卡/选关、阳光、种子包、格子和向日葵脚本；`Assets/Scripts/InLevel/girdManager.cs` 生成 7×15 点位及碰撞区，`Assets/Scripts/utils/plant/sunFlower.cs` 用 Animator 和 DOTween 定时产阳光，`Assets/Config/entitys/plants/peashooter.json` 仅是基础属性数据。源码扫描未发现僵尸类、波次控制器或战斗投射物实现；`Assets/Config/entitys/zombies/` 只有配置目录而无已检出的实现文件。实际包含 `Assets/Scenes/Ingame.unity`、`Welcome.unity`、`wordMapEgypt.unity` 和部分 Prefab，但场景存在并不能证明战斗系统完整。因此适合作为 Unity 组织与格子入门参考，不能视作完整战斗实现。 |
| [strycks/PvZ2_Remake](https://github.com/strycks/PvZ2_Remake) | README 自述为受 PvZ2 启发、使用 SDL2 的桌面塔防重制；GitHub API 标注 MIT。README 明确说图像资源直接取自或改编自 PvZ2，MIT 标注不能自动证明这些游戏素材也获 MIT 授权。 | README 自述 5 个关卡、5 路草坪、豌豆射手/向日葵/坚果/土豆雷及多种僵尸。代码树含 `WaveManager.cpp`、`FLawn.cpp`、`FGrid.cpp`、`FPeashooter.cpp`、`FZombie.cpp`、`Assets/Level/day1_wave.txt` 等：波次按表格刷基础/路障/铁桶僵尸，草坪有行列状态，射手按同行目标开火。源码覆盖能支持“有核心回合循环原型”，但未启动程序验证 README 中的全部玩法；与当前 Unity 工程技术栈不同。 |
| [pvz2-reborn/pvz2-remake](https://github.com/pvz2-reborn/pvz2-remake) | GitHub 描述为 “test unity project”；API 未标许可证，README 请求返回 404。 | 远程树和本地副本一致地有 Unity 2022.3 项目、关卡配置、基础植物脚本及大量图片，但 C# 源码未见僵尸和波次系统；更像早期测试工程。由于没有许可证，不应复制代码或素材。 |
| [LambdaEd1th/pam-viewer](https://github.com/LambdaEd1th/pam-viewer) / [pam-codec](https://github.com/LambdaEd1th/pam-codec) | 前者是 PAM 动画预览/编辑器，后者是 Rust PAM 二进制读写库；GitHub API 与 README 标注 AGPL-3.0。Viewer README 自述可导入 PAM 与纹理、预览时间轴并导出 PNG/APNG/WebP/PAM/JSON/YAML/TOML/FLA。 | `pam-codec` README 说明 PAM 文档包含图片、Sprite 图层、帧和 add/remove/move 变换指令，支持 v1–v6；测试样例目录有真实 PAM 和对应 PNG。适合研究动画资源结构和导出工作流。未验证其对用户现有具体 PAM 文件的兼容性；AGPL 也意味着集成/再分发前要单独评估授权义务。 |

## 能参考的系统

- **植物与战斗**：本地 `Assets/Scripts/utils/plant/sunFlower.cs` 体现“逻辑事件驱动动画、动画后生成阳光”；`strycks/PvZ2_Remake/PvZ2_Remake/FPeashooter.cpp` 和 `FZombie.cpp` 展示按行索敌、发射豌豆、僵尸移动/受伤/动画状态。借鉴其行为拆分即可，不复制受版权约束的实现。
- **场景与格子**：本地 `Assets/Scripts/InLevel/girdManager.cs` 是简单规则间距格点和点击最近格点；SDL 项目的 `FGrid.cpp`、`FLawn.cpp` 则清楚地区分固定行列、格子状态和草坪渲染，可借鉴数据边界。格子尺寸/坐标属于各自画面，不宜照搬数值。
- **波次**：SDL 项目的 `WaveManager.cpp` 从 `Assets/Level/day1_wave.txt` 读取波数、旗帜波与僵尸数量；先等待清场/计时，再刷对应组别。它比把刷怪逻辑塞进场景脚本更适合做轻量数据驱动原型。
- **资源与动画**：本地 `Assets/Config/entitys/plants/plantTypeList.json` 显示类型名、框架、资源组、属性表、动画 rig 和 PopAnim 名称是分开的引用关系；PAM 则进一步把纹理、子动画、时间轴帧与变换拆开。前者适合理解实体注册，后者适合理解拆件动画。现有本地样例尚未验证 PAM 到 Unity 的直接运行时接入。

## 给 Unity 2022.3 前院场景的建议

1. **先完成可读的静态前院构图**：背景层、草坪层、房屋/路径和前景遮挡按独立 Sorting Layer / Z 层组织；先用现有 UI 完整立绘检验角色在目标镜头下的尺寸、遮挡与对比度，再替换拆件动画，避免现在就把场景和动画耦合。
2. **用逻辑网格与画面分开**：定义固定 `row/column` 和一个 `GridToWorld(row,col)` 映射，场景只负责背景与锚点；植物/僵尸按格子索引定位。可以参考本地 girdManager 的规律格距，但不要直接沿用其 `1.26 / 1.54` 间距或 7×15 范围。
3. **让植物数据驱动、动画做表现**：每株先只配置成本、冷却、耐久和攻击/产能参数；攻击、受击、死亡等由独立状态切换 Animator。PNG 部件先按 pivot 和锚点规范整理；待拿到对应 PAM/纹理后，先离线用 pam-viewer 导出透明序列或 Sprite Sheet 来验证帧，再决定是否投入运行时解析。
4. **预留草坪可用区与来敌方向**：在前院构图阶段明确 5 条视觉泳道、可种植边界、房屋端失败边界及右侧入场区；网格叠加仅用于调试，不必成为最终画面元素。5 行只是玩法原型参考，格数应按当前镜头的透视/画幅决定。
5. **若要展示波次节奏，单独用小型配置表**：每波记录延迟与僵尸类型/数量，HUD 进度和“旗帜波”指示只读该数据；先用少量假数据验证节奏，避免让当前贴图场景依赖某个完整同人项目的战斗代码。

## 来源与未验证项

- 本地源码：`reference/pvz2-remake-master/ProjectSettings/ProjectVersion.txt`、`Assets/Scripts/InLevel/girdManager.cs`、`Assets/Scripts/InLevel/girds.cs`、`Assets/Scripts/utils/plant/sunFlower.cs`、`Assets/Scripts/utils/plant/basePlant.cs`、`Assets/Config/entitys/plants/peashooter.json`、`Assets/Config/entitys/plants/plantTypeList.json`。
- SDL 项目：README、[WaveManager.cpp](https://github.com/strycks/PvZ2_Remake/blob/main/PvZ2_Remake/WaveManager.cpp)、[FGrid.cpp](https://github.com/strycks/PvZ2_Remake/blob/main/PvZ2_Remake/FGrid.cpp)、[FLawn.cpp](https://github.com/strycks/PvZ2_Remake/blob/main/PvZ2_Remake/FLawn.cpp)、[FPeashooter.cpp](https://github.com/strycks/PvZ2_Remake/blob/main/PvZ2_Remake/FPeashooter.cpp)、[FZombie.cpp](https://github.com/strycks/PvZ2_Remake/blob/main/PvZ2_Remake/FZombie.cpp)、[day1_wave.txt](https://github.com/strycks/PvZ2_Remake/blob/main/PvZ2_Remake/Assets/Level/day1_wave.txt)。许可证：[LICENSE](https://github.com/strycks/PvZ2_Remake/blob/main/LICENSE)。
- Unity 测试工程：[仓库](https://github.com/pvz2-reborn/pvz2-remake)，[远程 C# 文件树](https://github.com/pvz2-reborn/pvz2-remake/tree/master/Assets/Scripts)。GitHub API 显示无许可证；远程 README 404。
- PAM 工具：[pam-viewer README](https://github.com/LambdaEd1th/pam-viewer/blob/main/README.md)、[pam-codec README](https://github.com/LambdaEd1th/pam-codec/blob/main/README.md)、[pam-codec 数据模型](https://github.com/LambdaEd1th/pam-codec/tree/main/src)。
- 公开 GitHub 元数据检查日期：2026-10-31。未验证项：仓库可执行程序的完整玩法、远程素材权属与再分发许可、用户素材中具体 PAM 的版本和纹理配对、PAM 工具与 Unity 的直接运行时兼容性。

## 可复用 Unity 实现

### 推荐：dkheng/PvZ-Unity

**推荐把它当玩法代码底座，保留当前已搭好的场景和贴图。** 这是本轮少数同时有 Unity 项目、可读 C#、完整关卡场景、植物/僵尸/投射物/波次、动画与 Prefab 的候选。不是建议把其场景和美术整套覆盖到现有项目。

- 仓库：[dkheng/PvZ-Unity](https://github.com/dkheng/PvZ-Unity)，默认分支 `main`，本次读取树 SHA `9ffc4b7fd14097a6f071bb32e62c92f39fcb7752`。本地快照：`reference/research/PvZ-Unity-main.zip`（121.7 MB）及解压目录 `reference/research/PvZ-Unity-main/PvZ-Unity-main/`。
- **许可证原文**：根 `LICENSE` 是标准 MIT License，Copyright (c) 2023 dkheng，授予使用、复制、修改、合并、发布、分发、再许可和销售的权利，条件是保留版权与许可声明；含标准免责条款。仓库 README 另说“部分所用素材来源于网络”，所以这只足以判断仓库代码许可清楚，不能据此确认人物图片、音乐、音效等第三方素材可复用。建议沿用逻辑，把 Prefab 的美术引用换成用户提供的 PNG；不要仅凭 MIT 复制游戏美术资源。
- **Unity / 依赖**：`ProjectSettings/ProjectVersion.txt` 与 README 都指向 Unity `2021.3.8f1c1`。`Packages/manifest.json` 主要是官方 2D Animation、Tilemap、PSD Importer、UGUI、TMP、Timeline 等包，没有显著的第三方运行时依赖。迁至当前 Unity 2022.3 属相邻 LTS 版本迁移，判断为低至中等迁移：脚本 API 差异预计少，旧版包与序列化场景可能需要 Unity 升级和 Inspector 重新绑定；未在本轮打开 Unity 验证。
- **实现证据**：README 自述“实现了完整关卡流程，但没有复刻原版完整游戏流程”，并给出 `Assets/Scenes/GameScene`。代码树有 65 个运行时 C# 脚本和该场景。`Assets/Resources/Scripts/GameManagement/GameManagement.cs` 按关卡选择控制器、载入背景/种植区/对话 UI；`Level0Controller.cs` 配置 5 行草坪及植物牌组；`Assets/Resources/Scripts/Zombies/ZombieManagement.cs` 从 `Resources/Json/ZombieData/LevelN` 读取时间节点，按行生成僵尸、等待存活僵尸清零后接下一波并判断胜利；`Zombie.cs` 有移动、咬植物、受伤/死亡和到达失败线逻辑；`Assets/Resources/Scripts/Planting/PlantGrid.cs` 点击格子种植、铲除并扣阳光；`Assets/Resources/Scripts/Plants/PeaShooterSingle.cs` 通过动画事件发射豌豆，`PlantBullets/Base/StraightBullet.cs` 做同行命中/伤害，`SunFlower.cs` 定时产阳光。Prefabs 与 Animator/Animation 资源也齐备。README 截图/演示链接能说明作者展示过流程；本轮未运行可执行场景。

### 针对当前场景的迁移清单

先复制**脚本和波次数据**，以现成场景做挂接，不复制 GameScene 覆盖当前构图。优先从快照取：

1. 回合与波次：`Assets/Resources/Scripts/GameManagement/{GameManagement,LevelController,LevelData,Level0Controller}.cs`、`Assets/Resources/Scripts/Zombies/{Zombie,ZombieManagement,NormalZombie,ConeZombie,BucketZombie}.cs`、`Assets/Resources/Json/ZombieData/Level0.json`。
2. 网格与种植：`Assets/Resources/Scripts/Planting/{PlantGrid,PlantingManagement,ToBePlanted,Shovel}.cs`、`Assets/Resources/Scripts/Plants/{Plant,PeaShooterSingle,SunFlower,WallNut}.cs`。
3. 攻击与阳光：`Assets/Resources/Scripts/PlantBullets/Base/StraightBullet.cs`、`Assets/Resources/Scripts/Sun/{SunBase,SunManagement,FlowerSun,SkySun,SunNumber}.cs`。
4. 只把其 Prefab/Animator Controller 当作组件配置参考，或复制后替换 Sprite；旧 Prefab 依赖原有命名、动画参数、Resources 路径、音效和场景物件。现有场景需要重新连接 `Game Management`、`Zombie Management`、`Planting Management`、阳光 UI、格子碰撞器、Sorting Layer 与 Inspector 引用。预估为**中等迁移量**：已有战斗逻辑可以省去从零设计，但做出贴合现有前院的可玩场景仍需接线和调参。

### 与其他候选对比

| 候选 | 已核实证据 | 适用性 |
|---|---|---|
| [HectorPulido/UnityPlantsVsZombiesClone](https://github.com/HectorPulido/UnityPlantsVsZombiesClone) | MIT 原文，Unity 5.6.0f3；`GameManager.cs` 管卡片/阳光/点击种植，`Zombie.cs` 移动、咬植物、碰豌豆减血，`InstanciadorDeZombies.cs` 定时实例化单类僵尸。 | 易读小教程，有可用的极简循环，但缺少完整波次/格子管理与多种敌人，且版本太旧；优先级低于 dkheng。 |
| [CompleteUnityDeveloper/07-Glitch-Garden](https://github.com/CompleteUnityDeveloper/07-Glitch-Garden) | MIT 原文，Unity 2019.3.0a8；`AttackerSpawner`、`Attacker`、`DefenderSpawner`、`Projectile`、`LevelController` 实现通用泳道塔防、资源与胜负流程。 | 源码结构易读、Unity 技术可迁移，但它是通用 lane defense，不是 PVZ 行格种植和波次系统；更适合借鉴攻击/防守抽象。 |
| Cuerzor/MinecraftVsZombies2Unity | 主 agent 已核实 Unity 2022.3.62f3、GPL-3.0，且通过 `PVZEngineUnity`、资源包子模块及 Addressables 等组成较大框架；独立引擎仓库缺 LICENSE。 | 与现版本更近但授权和依赖复杂，无法视为轻量 MIT 代码拷入方案；作为架构参考。 |

**结论**：对于后续复用和扩展当前可玩前院场景，dkheng/PvZ-Unity 是四者中最接近“拿来接入”的项目。可先迁移 wave/controller、植物与僵尸交互逻辑，再逐个把它们接到现有格子和贴图上。若只借代码，保留 MIT 声明；美术沿用用户提供的素材；其再发布许可需另行核实。

本节调研只读取代码和资产清单、下载源码快照，未修改 `Prototype`、未覆盖原有 `reference/pvz2-remake-master`，未运行构建。
