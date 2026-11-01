# Gardendless、PyVZ2 与 Godot 接入调研

调研日期：2026-10-31。只读源码、仓库文件树和部署资源；未启动项目、运行解包、构建或修改现有游戏工程。

## 核查范围与结论

| 项目 | 实际核查 | 结论 |
|---|---|---|
| [Gzh0821/pvzge_web](https://github.com/Gzh0821/pvzge_web) | `master`，commit `462f1161d5a29423409002936f2e05f1c24ac630`。使用 `--depth 1 --filter=blob:none --no-checkout` 的部分 clone，文件通过 `git show` 从对象库只读检查；没有下载完整 LFS 资源。 | **最佳 PvZ2 玩法行为参考，不是可直接搬进 Godot 的源工程。** 有大量真实游戏系统，但仓库交付的是 Cocos Creator 网页构建产物：游戏模块编译进大型 `System.register` bundle，缺少原始 TypeScript 项目。动画走 DragonBones/Cocos 运行时，未发现 PAM 解析或播放实现。 |
| [nineteendo/pyvz2](https://github.com/nineteendo/pyvz2) | `main`，commit `5bdd06336691c53d6963e7f5527f034014cf641d`。重点读 `OBBEdit/unpack.py`、`patch.py`、`libraries/pyvz2rton.py`、模板和 README。 | **用于 OBB/RSB/RTON 数据提取的 Python 工具，不是动画工具。** 没有 PAM/PopAnim 解析器；RSB 图像解码代码被注释掉，不会把纹理条目直接导出为 PNG。GPL-3.0。 |
| [OptiJuegos/PvZ2Native](https://github.com/OptiJuegos/PvZ2Native) | 快速看仓库根文件：C++、CMake/Make、SDL、Dynarmic 和 native game 目录。 | Android/原生兼容层方向的 C++ 工程，与 Godot 运行时接口无关；没有深入审查其内部兼容边界和授权。 |
| [jaykrow/pvz2-experimental](https://github.com/jaykrow/pvz2-experimental) | 快速看仓库根文件：C++ hook/实验源码，含 `AnimationMgr.cpp`、`Effect_PopAnim.cpp` 等。 | 可研究原游戏 hook 和动画入口，运行依赖目标游戏版本、平台及 hook 环境；不能作为 Godot 播放器或玩法模块直接复用。 |
| [pvz2-crestfall/pvz2-crestfall](https://github.com/pvz2-crestfall/pvz2-crestfall) | 快速看仓库根文件：含 PvZ2 Android OBB bundle、脚本和 npm 清单。 | 主要是原游戏改版/资源包，不是独立游戏引擎或玩法源码。 |
| [Katch7K/PvZ2_fanMade](https://github.com/Katch7K/PvZ2_fanMade) | 快速看仓库根文件：`index.html`、`gameplay/`、`jsons/`、`scripts/`、`images/`。 | 网页小游戏/原型，可供 UI 或基本交互参考；未发现它能提供成熟的 PvZ2 关卡与动画运行框架。 |

后三个快速查看的仓库没有在根文件清单中发现明确的 `LICENSE`；本轮未深挖其所有子目录，也不据此推定授权。`pvz2-experimental` 等源代码即使能阅读，也不代表可复制其调用方式或原版资源。

## Gardendless 源码证据

仓库 README 将 Gardendless 描述为完全以 Web 技术和 Cocos 引擎重写的 PvZ2。`master` 根目录有 `docs/` 部署站点、`scripts/`、`tests/` 和 Docker 配置，没有 `package.json` 或原始引擎工程目录。README 要求 Git LFS 拉大资源。当前部署版本的大部分玩法代码在 [docs/assets/main/index.js](https://github.com/Gzh0821/pvzge_web/blob/master/docs/assets/main/index.js) 的 Cocos 编译 bundle 中；资源包入口 [docs/assets/resources/index.js](https://github.com/Gzh0821/pvzge_web/blob/master/docs/assets/resources/index.js) 是构建产物入口，不是独立的动画播放器源码。

在 bundle 里能看到这些已编译模块（对应 Cocos 的模块名保留 `.ts` 后缀，但源码本身已被打包和压缩）：

- `Plant.ts`、`Zombie.ts`：植物/僵尸基类、受伤、行为状态和动画事件等逻辑；`Plants.ts`、`Zombies.ts`：类型表、特性与组件/Prefab 加载。
- `Lane.ts`、`FrontYard.ts`、`Square.ts`：泳道、前院环境、地块/坐标与地形相关行为。
- `Projectiles.ts`、`ProjectileManager.ts`：弹体类型、投射物生成与管理。
- `levelController.ts`、`Levels.ts`、`LevelPlay`：关卡控制与关卡 JSON；`Levels.ts` 内 `LevelJsonAssets.getLevelJson` 使用 Cocos `resources.load("levels/" + id)` 并读取 `JsonAsset.json.objects`。
- `AnimationController.ts` 依赖 Cocos `dragonBones.ArmatureDisplay`：`onLoad` 从 `Body` 子节点调用 `getComponent(ArmatureDisplay)`，播放路径含 `playAnimation`、armature `fadeIn` 与 `gotoAndPlayByProgress`。`Plant.ts` 和 `Zombie.ts` 也引用 Cocos DragonBones 类型。因此可见证据指向 Gardendless 播放 DragonBones 动画数据，**不是 PAM JSON 播放器**。

资源访问路径是 Cocos 资源 bundle 路径，而非原版 PAM 的 image-name 查找：`Plants.ts` 通过 `resources.load("plants/" + ... + "DIS")` / `"PLANT"` 读植物数据；`Zombies.ts` 通过 `resources.load("zombies/" + RES + "ZOMBIE")` 读僵尸数据。前院模块还按 `lawns/<RESNAME>LAWN` 加载草坪数据。也就是说，能从 bundle 反查到资源名约定，但没有看到把原版 OBB/RSB 直接挂入 Cocos 或 Godot 的通用原版资源加载器。

源码 bundle 可以帮助确认系统边界、状态和数据字段，但因原始 TypeScript 工程未随此仓库交付，压缩编译代码不适合作为 Godot 的直接移植底稿。即使 Cocos 能读取部分 DragonBones JSON/图集资源，也不等于可读原版 PAM；本轮在 `main/index.js` 和资源入口里没有找到 PAM/PopAnim 解码实现。仓库 Apache-2.0 许可不自动覆盖其中原版游戏图像、音频等素材。

## PyVZ2 实际能力与入口

主程序入口为 `OBBEdit/unpack.py`。命令形态是从仓库目录交互式运行 `python OBBEdit/unpack.py`，而非带输入/输出 CLI 参数的批处理器。启动时要求 Python 3.9+，让使用者选模板和解包级别，再输入 OBB/RSB/RSG 与输出目录。模板目录区分 ROW、NA、Android 11 的包版本；例如 `options/a--PVZ2ROW Unpack Packages (JSON)--PVZ2ROW Patch Packages (JSON).json` 指定 ROW 包，并默认深入至 RTON→JSON。

代码入口包括：

- `file_to_folder`：判断并递归处理 `1bsr`/`pgsr`，即 RSB/OBB 和 RSG 资源包；`rsb_extract` 与 `rsg_extract` 负责目录与条目提取。深入等级可导出 SECTION、解密 ENCODED 文件或解码 RTON。
- `conversion`：识别加密数据前缀或 `RTON` magic；RTON 分支交给 `RTONDecoder.parse_root_object` 写成 JSON。`libraries/pyvz2rton.py` 实现的是 PopCap RTON↔JSON，不是 PAM↔JSON。
- RSB 图像解码函数/图像分支在 `unpack.py` 中处于注释状态；本工具提取数据路径与 JSON 配置有用，但不能替代 `pam-viewer` 导出帧或 PNG，也不能把所有图集复原成图片。

只读检查未在 PyVZ2 README、`OBBEdit` Python 源码或文件清单中找到 PAM/PopAnim 支持。若需要由 PAM 得到可播放结构，仍应使用 [pam-viewer](https://github.com/LambdaEd1th/pam-viewer) 或 `pam-codec`，再按 `image_index.csv` 映射图像路径。PyVZ2 只有在手头拥有匹配版本 OBB/RSB，并需要查阅包内 JSON 配置时才有额外价值。它的 GPL-3.0 许可也需在改用其代码时评估。

## 给 Godot 4 项目的建议

1. **继续按用户指定的 Godot 4 构建；不要为 Gardendless 切换 Cocos。** Gardendless 的核心紧耦合 Cocos Creator API、DragonBones 组件、prefab/resource bundle 和 Cocos 序列化格式，重建这套引擎运行时会抵消移植价值。
2. **用 Gardendless 定义玩法覆盖面，而非拷贝其 bundle。** 参考其植物/僵尸基类、泳道/地块分层、投射物管理、关卡 JSON 数据化和状态事件拆分；在 Godot 使用对应 Node/Resource/AnimationPlayer 与自有数据模型实现。需要可读、短小的基础循环代码时，之前核查的 [dkheng/PvZ-Unity](https://github.com/dkheng/PvZ-Unity) C# 项目仍更容易理解；Gardendless 适合补齐更贴近 PvZ2 的类型与特殊机制参考。
3. **PAM 动画和玩法数据分离。** 由 pam-viewer 导出 `.pam.json`，再用 `image_index.csv` 把 PAM 图像名映射到现有 PNG 文件；先挑一株少部件的植物验证显示列表变换、标签帧与嵌套 sprite。Godot 读取转换后的 PAM JSON，原版资源目录和现有 Unity 工程保留原位。
4. **PyVZ2 作为可选元数据工具，不作为素材或动画接入层。** 若找到原始 OBB/RSB，可用与目标 ROW/NA 和 Android 版本对应的模板提取 RTON→JSON，辅助补出索引和原资源名；图像拆包、atlas 切片及 PAM 解析仍需各自的专用工具。

## 未运行与限制

- 未启动 Gardendless 或 Godot；未运行 PyVZ2 的交互解包；未验证当前 `Downloads` 里的 OBB/RSB 版本和模板兼容性。
- Gardendless 通过部分 clone 的 bundle 对象读取，未下载 LFS 大资源；源码对象中的资源格式和缺失路径不作超出可见内容的推断。
- 未在 Gardendless bundle 中定位出原版 PAM 播放器；能确认的是 Cocos DragonBones `ArmatureDisplay` 播放路径。未从无源工程中还原完整 Cocos 资源 UUID 到原版资源名映射。
- 没有证据表明仓库代码许可覆盖 PvZ2 原版素材或其中第三方素材；本报告仅讨论代码结构和格式能力，不作素材再分发授权判断。
