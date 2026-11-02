---
name: pvz2-pam-convert
description: "处理 PvZ2 PAM 解码、转 JSON 或增量时间轴编译时使用，复用现成 WASM 工具。"
---

# PAM 转换

本目录 `scripts/fetch_worker.py` 下载 pam-viewer v0.1.1，`scripts/convert_pam.mjs` 通过 Node 调用其 WASM。

```powershell
python scripts/fetch_worker.py --dest TOOL_CACHE
node scripts/convert_pam.mjs --worker-dir TOOL_CACHE/worker --input INPUT.pam --output-dir OUTPUT
```

`--archive ZIP` 复用下载包，项目缓存位于 `reference/pam-tooling/`；配图后加 `--png-dir IMAGES --require-images`。

输出 `*.pam.json`、`*.compiled.json`、`*.conversion.json`。WASM 的 `load` 已完成二进制解码和增量时间轴编译，Godot 使用 compiled 数据。

批量只做资源盘点：`node Tools/inspect_pam_library.mjs --input-list reference/pam-resources/native-pam-paths.json --output reference/pam-resources/native-pam-inspection.json`。输入是仓库相对 PAM 路径的 JSON 数组，输出哈希、图片引用、帧数、动作标签和命令；仍使用同一 WASM，不写出全部 compiled。现有文件与配图状态可用 `python -X utf8 Tools/animation_library.py --query 名字 --format pam` 查找。

实际遇阻：WASM 返回的 BigInt 使 JSON.stringify 报错；转换脚本已在安全整数范围内转为 Number。
