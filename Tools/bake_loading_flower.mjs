// Offline asset preparation: upstream DragonBones evaluates the rig; Godot plays native tracks.
// Run from the repository root: node Tools/bake_loading_flower.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tooling = path.join(root, 'reference/dragonbones-tooling');
const source = path.join(root, 'reference/pam-resources/original-loading-flower');
const project = path.join(root, 'GodotPamDemo');
const output = path.join(project, 'scenes/ui/loading_flower.tscn');
const textureDirectory = path.join(project, 'assets/ui/loading_flower');
const require = createRequire(path.join(tooling, 'compiler/package.json'));
const ts = require('typescript');
const core = path.join(tooling, 'dragonbones-runtime-5.6.200/DragonBones/src/dragonBones');

// Keep the official classes in inheritance order when emitting their shared namespace.
const files = [
  'core/DragonBones.ts', 'core/BaseObject.ts',
  ...fs.readdirSync(path.join(core, 'geom')).map(x => `geom/${x}`),
  ...fs.readdirSync(path.join(core, 'model')).map(x => `model/${x}`),
  'animation/IAnimatable.ts', 'event/IEventDispatcher.ts', 'armature/IArmatureProxy.ts',
  'event/EventObject.ts', 'armature/TransformObject.ts', 'armature/Bone.ts',
  'armature/Surface.ts', 'armature/Slot.ts', 'armature/Constraint.ts', 'armature/Armature.ts',
  'animation/BaseTimelineState.ts', 'animation/TimelineState.ts',
  'animation/AnimationState.ts', 'animation/Animation.ts', 'animation/WorldClock.ts',
  'parser/DataParser.ts', 'parser/ObjectDataParser.ts', 'parser/BinaryDataParser.ts',
  'factory/BaseFactory.ts', 'modules.ts',
].map(x => path.join(core, x));
const runtimePath = path.join(tooling, 'dragonBones-core.js');
const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.None, outFile: runtimePath,
  // The legacy runtime annotates frameFloatArray as Int16Array; transpile it unmodified.
  skipLibCheck: true, noCheck: true, noEmitOnError: true,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: x => x, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
}
program.emit();
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(runtimePath, 'utf8'), context);
const db = context.dragonBones;

const proxy = () => ({
  dbInit() {}, dbClear() {}, dbUpdate() {}, dispose() {},
  hasDBEventListener: () => false, dispatchDBEvent() {},
});
class Texture extends db.TextureData {
  static toString() { return '[class OfflineTextureData]'; }
}
class Atlas extends db.TextureAtlasData {
  static toString() { return '[class OfflineTextureAtlasData]'; }
  createTexture() { return db.BaseObject.borrowObject(Texture); }
}
// These are the renderer extension points provided by the official runtime.
// No format parsing, interpolation, hierarchy or pivot calculation is implemented here.
class Slot extends db.Slot {
  static toString() { return '[class OfflineSlot]'; }
  _initDisplay() {} _disposeDisplay() {} _onUpdateDisplay() {} _addDisplay() {}
  _replaceDisplay() {} _removeDisplay() {} _updateZOrder() {} _updateVisible() {}
  _updateBlendMode() {} _updateColor() {} _updateFrame() {} _updateMesh() {}
  _updateGlueMesh() {} _updateTransform() {} _identityTransform() {}
}
class Factory extends db.BaseFactory {
  constructor() { super(); this._dragonBones = new db.DragonBones(proxy()); }
  _buildTextureAtlasData(atlas) { return atlas ?? db.BaseObject.borrowObject(Atlas); }
  _buildArmature(data) {
    const armature = db.BaseObject.borrowObject(db.Armature);
    armature.init(data.armature, proxy(), {}, this._dragonBones);
    return armature;
  }
  _buildSlot(data, slotData, displays) {
    const slot = db.BaseObject.borrowObject(Slot);
    slot.init(slotData, displays, {}, {});
    return slot;
  }
  advance(seconds) { this._dragonBones.advanceTime(seconds); }
  start(armature) { this._dragonBones.clock.add(armature); }
}

function snapshot(armature) {
  const result = [];
  for (const slot of armature.getSlots()) {
    slot.updateTransformAndMatrix();
    const matrix = slot.globalTransformMatrix;
    const color = slot._colorTransform;
    const rgba = [color.redMultiplier, color.greenMultiplier, color.blueMultiplier, color.alphaMultiplier];
    const shown = slot.visible && slot.parent.visible && slot.displayIndex >= 0;
    const key = slot.name;
    if (slot.childArmature) {
      result.push({ key, child: true, color: rgba, visible: shown,
        transform: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty] });
    } else if (slot._textureData || slot.rawDisplayDatas?.some(x => x?.texture)) {
      const texture = slot._textureData ?? slot.rawDisplayDatas.find(x => x?.texture).texture;
      if (texture.rotated || slot._meshData) throw new Error('This asset requires a mesh/rotated-texture renderer');
      result.push({ key, region: texture.region, color: rgba, visible: shown,
        transform: [matrix.a, matrix.b, matrix.c, matrix.d,
          matrix.tx - matrix.a*slot._pivotX - matrix.c*slot._pivotY,
          matrix.ty - matrix.b*slot._pivotX - matrix.d*slot._pivotY] });
    }
  }
  return result;
}

const skeleton = JSON.parse(fs.readFileSync(path.join(source, 'skeleton.json'), 'utf8'));
const atlas = JSON.parse(fs.readFileSync(path.join(source, 'atlas.json'), 'utf8'));
const manifest = { runtime: 'dragonbones-runtime@5.6.200', frame_rate: skeleton.frameRate, clips: {} };
function sampleClips(armatureName, names) {
const samples = {};
for (const name of names) {
  const factory = new Factory();
  const data = factory.parseDragonBonesData(skeleton);
  factory.parseTextureAtlasData(atlas, null);
  const armature = factory.buildArmature(armatureName, data.name);
  if (!armature) throw new Error(`Missing armature ${armatureName}`);
  const animation = armature.armatureData.getAnimation(name);
  const fps = armature.armatureData.frameRate;
  const count = Math.round(animation.duration * fps);
  // Independent native clips are selected by SceneTransition; suppress authored goto actions.
  const config = armature.animation.animationConfig;
  config.animation = name;
  config.fadeInTime = 0;
  config.playTimes = name.toLowerCase() === 'idle' ? 0 : 1;
  config.actionEnabled = false;
  armature.animation.playConfig(config);
  factory.start(armature);
  factory.advance(0);
  samples[name] = [];
  for (let frame = 0; frame <= count; frame++) {
    if (frame) factory.advance(1 / fps);
    samples[name].push(snapshot(armature));
  }
  manifest.clips[name] = { frames: count, duration: animation.duration };
  armature.dispose();
}
return samples;
}

const number = x => Number(x.toFixed(6)).toString();
const values = xs => xs.map(number).join(', ');
function writeScene(samples, destination, rootName, childScene = null) {
const first = Object.values(samples)[0][0];
const chunks = [];
const animationIds = [];
for (const [name, frames] of Object.entries(samples)) {
  const id = `animation_${name}`;
  animationIds.push(`${JSON.stringify(name)}: SubResource("${id}")`);
  chunks.push(`[sub_resource type="Animation" id="${id}"]`, `resource_name = "${name}"`,
    `length = ${number(manifest.clips[name].duration)}`, ...(name.toLowerCase() === 'idle' ? ['loop_mode = 1'] : []));
  let index = 0;
  for (const slot of first) {
    const poses = frames.map(frame => {
      const pose = frame.find(x => x.key === slot.key);
      if (!pose) throw new Error(`Missing slot ${slot.key} in ${name}`);
      return pose;
    });
    for (const [property, serialize] of [
      ['transform', p => `Transform2D(${values(p.transform)})`],
      ['modulate', p => `Color(${values(p.color)})`],
      ['visible', p => String(p.visible)],
    ]) {
      // Constant tracks need only one key; changing poses retain the original 30 fps sampling.
      const keys = [];
      poses.forEach((pose, frame) => {
        const value = serialize(pose);
        if (!keys.length || keys.at(-1).value !== value) keys.push({ time: frame / skeleton.frameRate, value });
      });
      const base = `tracks/${index++}`;
      chunks.push(`${base}/type = "value"`, `${base}/path = NodePath("${slot.key}:${property}")`,
        `${base}/interp = 0`,
        `${base}/keys = {"times": PackedFloat32Array(${keys.map(x => number(x.time)).join(', ')}), ` +
        `"transitions": PackedFloat32Array(${keys.map(() => '1').join(', ')}), ` +
        `"update": 0, "values": [${keys.map(x => x.value).join(', ')}]}`);
    }
  }
  chunks.push('');
}
chunks.push('[sub_resource type="AnimationLibrary" id="library"]',
  `_data = {${animationIds.join(', ')}}`, '', `[node name="${rootName}" type="Node2D"]`);
for (const slot of first) {
  if (slot.child) {
    if (!childScene) throw new Error('Nested armature requires a native child scene');
    chunks.push('', `[node name="${slot.key}" parent="." instance=ExtResource("petals")]`,
      `transform = Transform2D(${values(slot.transform)})`, `visible = ${slot.visible}`);
    continue;
  }
  const r = slot.region;
  chunks.push('', `[node name="${slot.key}" type="Sprite2D" parent="."]`,
    'texture = ExtResource("texture")', 'centered = false', 'region_enabled = true', 'region_filter_clip_enabled = true',
    `region_rect = Rect2(${values([r.x, r.y, r.width, r.height])})`,
    `transform = Transform2D(${values(slot.transform)})`, `modulate = Color(${values(slot.color)})`,
    `visible = ${slot.visible}`);
}
chunks.push('', '[node name="AnimationPlayer" type="AnimationPlayer" parent="."]',
  'libraries = {&"": SubResource("library")}', '');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, `[gd_scene load_steps=${Object.keys(samples).length + 3 + (childScene ? 1 : 0)} format=3]\n\n` +
  '[ext_resource type="Texture2D" path="res://assets/ui/loading_flower/UIAnimate_tex.png" id="texture"]\n' +
  (childScene ? `[ext_resource type="PackedScene" path="${childScene}" id="petals"]\n` : '') + '\n' + chunks.join('\n'));
}
const petals = sampleClips('_flowerpieces', ['idle']);
if (petals.idle[0].length !== 8) throw new Error('Expected eight petal slots');
writeScene(petals, path.join(project, 'scenes/ui/loading_flower_petals.tscn'), 'Petals');
const flower = sampleClips('Flower', ['Spawn', 'Idle', 'Leave']);
writeScene(flower, output, 'LoadingFlower', 'res://scenes/ui/loading_flower_petals.tscn');
fs.mkdirSync(textureDirectory, { recursive: true });
// Art's _index points to a different atlas PNG; use the texture referenced by the PVZGE atlas asset.
fs.copyFileSync(path.join(source, 'UIAnimate_tex.pvzge.png'), path.join(textureDirectory, atlas.imagePath));
fs.writeFileSync(path.join(textureDirectory, 'bake.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Baked Spawn/Idle/Leave into ${output} (head + independently looping eight-petal armature)`);
