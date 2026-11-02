/** Inspect exported actor rigs with the cached official DragonBones runtime. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {parseArgs} from "node:util";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {values: args} = parseArgs({options: {library: {type: "string"}, output: {type: "string"}}});
if (!args.library || !args.output) throw new Error("Usage: --library library.json --output inspection.json");
const source = path.dirname(path.resolve(args.library));
const library = JSON.parse(fs.readFileSync(args.library, "utf8"));
const messages = new Set();
let currentMessages = null;
const runtimeMessage = (...items) => {
  const message = items.join(" ");
  messages.add(message);
  currentMessages?.add(message);
};
const context = vm.createContext({console: {log() {}, info() {}, assert() {},
  warn: runtimeMessage, error: runtimeMessage}});
vm.runInContext(fs.readFileSync(path.join(root, "reference/dragonbones-tooling/dragonBones-core.js"), "utf8"), context);
const db = context.dragonBones;
const proxy = () => ({dbInit() {}, dbClear() {}, dbUpdate() {}, dispose() {},
  hasDBEventListener: () => false, dispatchDBEvent() {}});
class Texture extends db.TextureData { static toString() { return "[class LibraryTexture]"; } }
class Atlas extends db.TextureAtlasData {
  static toString() { return "[class LibraryAtlas]"; }
  createTexture() { return db.BaseObject.borrowObject(Texture); }
}
class Slot extends db.Slot {
  static toString() { return "[class LibrarySlot]"; }
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
}
const entries = [];
const cache = new Map();
const read = name => JSON.parse(fs.readFileSync(path.join(source, name), "utf8"));
for (const item of library.entries) {
  const descriptor = read(item.descriptor);
  const entry = {path: item.path, group: item.group, descriptor: path.relative(root, path.join(source, item.descriptor)).replaceAll("\\", "/"), rigs: [], errors: []};
  for (const node of descriptor.nodes) for (const rig of node.armatures) {
    const key = [rig.skeleton, rig.atlas, rig.armature].join(":");
    if (!cache.has(key)) {
      const record = {skeleton: rig.skeleton, atlas: rig.atlas, armature: rig.armature, clips: [], status: "sampled"};
      currentMessages = new Set();
      const factory = new Factory();
      let armature;
      try {
        const skeleton = factory.parseDragonBonesData(read(rig.skeleton));
        factory.parseTextureAtlasData(read(rig.atlas), null);
        armature = factory.buildArmature(rig.armature, skeleton.name);
        if (!armature) throw new Error("Armature not found: " + rig.armature);
        record.frame_rate = armature.armatureData.frameRate;
        record.slots = armature.getSlots().length;
        record.bones = armature.getBones().length;
        for (const name of armature.animation.animationNames) {
          const animation = armature.armatureData.getAnimation(name);
          armature.animation.reset();
          const config = armature.animation.animationConfig;
          config.animation = name; config.actionEnabled = false; config.fadeInTime = 0; config.playTimes = 1;
          const state = armature.animation.playConfig(config);
          if (!state || state.name !== name) throw new Error("Could not play clip: " + name);
          armature.advanceTime(0);
          armature.advanceTime(Math.min(0.1, animation.duration / 2));
          for (const bone of armature.getBones()) {
            const matrix = bone.globalTransformMatrix;
            if (![matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty].every(Number.isFinite)) {
              throw new Error("Non-finite bone transform: " + name + "/" + bone.name);
            }
          }
          record.clips.push({name, duration: animation.duration});
        }
      } catch (error) { record.status = "error"; record.error = String(error); }
      finally {
        if (armature) armature.dispose();
        factory.clear();
        record.warnings = [...currentMessages];
        currentMessages = null;
      }
      cache.set(key, record);
    }
    const record = cache.get(key);
    const texture = library.textures[rig.texture_image];
    entry.rigs.push({...record, texture: texture?.local_path ?? null});
    if (record.status === "error") entry.errors.push(record.error);
    if (!texture) entry.errors.push("Missing texture: " + rig.texture_image);
  }
  entries.push(entry);
}
const report = {tool: "Official DragonBones core 5.6.200", method: "Parse/build each referenced armature and sample every clip at start and up to 0.1 seconds",
  total: entries.length, sampled: entries.filter(entry => entry.errors.length === 0).length,
  unique_rigs: cache.size, messages: [...messages], entries};
fs.writeFileSync(args.output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({total: report.total, sampled: report.sampled, unique_rigs: report.unique_rigs, messages: report.messages.length}));
if (report.sampled !== report.total) process.exitCode = 1;
