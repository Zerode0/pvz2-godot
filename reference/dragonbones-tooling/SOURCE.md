# DragonBones JavaScript runtime for offline sampling

- Package: [`dragonbones-runtime@5.6.200`](https://www.npmjs.com/package/dragonbones-runtime/v/5.6.200)
- npm tarball saved as `dragonbones-runtime-5.6.200.tgz`; registry tarball SHA-1: `c59d761ab67e6b25a15e099faa745a04fee86859`.
- Upstream repository: [DragonBones/DragonBonesJS](https://github.com/DragonBones/DragonBonesJS), pinned to commit `64b6c69ae35777c2404be68c9192e2c56906079e`; GitHub reports MIT. `LICENSE` and `package.json` are in the extracted package folder.
- Extracted runtime core TypeScript is in `dragonbones-runtime-5.6.200/DragonBones/src/`. It includes the official `BaseFactory`, parser, `Armature`, `Slot`, transform, animation and geometry code. The package tarball is retained intact alongside it.
- The npm package's declared `main` (`builds/index.js`) is a framework build CLI, not a runtime entry. Its cached `dragonBones.js` is Egret-targeted and fails Node import without Egret (`ReferenceError: egret is not defined`). Do not use that output as the headless runtime.
- The official DragonBonesJS repository also has a Cocos 1.x UMD build at [`Cocos/1.x/out/dragonBones.js`](https://github.com/DragonBones/DragonBonesJS/blob/64b6c69ae35777c2404be68c9192e2c56906079e/Cocos/1.x/out/dragonBones.js), but it is renderer integration code; the npm package tarball does not include this directory. The current candidate for rendererless use is the TypeScript core source, transpiled in the offline tooling environment.

## Project use

Run `node Tools/bake_loading_flower.mjs` from the project root to sample the official core and write native Godot animation resources. The converter uses renderer extension classes, upstream `parseDragonBonesData` / `parseTextureAtlasData`, and upstream armature evaluation. Godot does not load this runtime.

The offline compiler is TypeScript 5.6.3 (`compiler/package-lock.json`, Apache-2.0). Install it with `npm ci --prefix reference/dragonbones-tooling/compiler --ignore-scripts --no-audit --no-fund` if needed. The legacy core types `frameFloatArray` as `Int16Array`; `noCheck` transpiles the unmodified upstream source instead of changing that declaration. Generated core JavaScript is cached at `dragonBones-core.js`.
