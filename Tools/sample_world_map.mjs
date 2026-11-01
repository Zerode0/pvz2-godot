// Evaluate the exported rigs with the official DragonBones core used by loading_flower.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'reference/world-map');
const nativeDirectory = path.join(root, 'GodotPamDemo/assets/ui/adventure/rigs');
fs.mkdirSync(nativeDirectory,{recursive:true});
const runtimeMessages = new Set();
const context = vm.createContext({ console: { log() {}, info() {},
  warn: (...args) => runtimeMessages.add(args.join(' ')), error: (...args) => runtimeMessages.add(args.join(' ')), assert() {} } });
vm.runInContext(fs.readFileSync(path.join(root, 'reference/dragonbones-tooling/dragonBones-core.js'), 'utf8'), context);
const db = context.dragonBones;
const proxy = () => ({ dbInit() {}, dbClear() {}, dbUpdate() {}, dispose() {},
  hasDBEventListener: () => false, dispatchDBEvent() {} });
class Texture extends db.TextureData { static toString() { return '[class MapTexture]'; } }
class Atlas extends db.TextureAtlasData {
  static toString() { return '[class MapAtlas]'; }
  createTexture() { return db.BaseObject.borrowObject(Texture); }
}
class Slot extends db.Slot {
  static toString() { return '[class MapSlot]'; }
  _initDisplay() {} _disposeDisplay() {} _onUpdateDisplay() {} _addDisplay() {}
  _replaceDisplay() {} _removeDisplay() {} _updateZOrder() {} _updateVisible() {}
  _updateBlendMode() {} _updateColor() {} _updateFrame() {} _updateMesh() {}
  _updateGlueMesh() {} _updateTransform() {} _identityTransform() {}
}
class Factory extends db.BaseFactory {
  constructor() { super(); this._dragonBones = new db.DragonBones(proxy()); }
  _buildTextureAtlasData(atlas) { return atlas ?? db.BaseObject.borrowObject(Atlas); }
  _buildArmature(data) {
    const a = db.BaseObject.borrowObject(db.Armature);
    a.init(data.armature, proxy(), {}, this._dragonBones); return a;
  }
  _buildSlot(data, slotData, displays) {
    const s = db.BaseObject.borrowObject(Slot); s.init(slotData, displays, {}, {}); return s;
  }
}
const multiply = (a,b) => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],
  a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function snapshot(a, parent=[1,0,0,1,0,0], prefix='') {
  const parts=[];
  for(const s of a.getSlots()) {
    if(s.displayIndex<0 || !s.visible || !s.parent.visible) continue;
    s.updateTransformAndMatrix();
    const m=s.globalTransformMatrix;
    const t=[m.a,m.b,m.c,m.d,m.tx,m.ty];
    if(s.childArmature) {parts.push(...snapshot(s.childArmature,multiply(parent,t),prefix+s.name+'/'));continue;}
    const tex=s._textureData ?? s.rawDisplayDatas?.find(d=>d?.texture)?.texture;
    if(!tex) continue;
    if(s._meshData) throw new Error('Mesh requires a native mesh renderer: '+s.name);
    t[4]-=m.a*s._pivotX+m.c*s._pivotY;
    t[5]-=m.b*s._pivotX+m.d*s._pivotY;
    const c=s._colorTransform;
    parts.push({slot:prefix+s.name,texture:tex.name,region:tex.region,rotated:tex.rotated,
      transform:multiply(parent,t),color:[c.redMultiplier,c.greenMultiplier,c.blueMultiplier,c.alphaMultiplier]});
  }
  return parts;
}
const num = n => Number(n.toFixed(6)).toString();
const nums = ns => ns.map(num).join(', ');
function nativeRig(a, rig, key) {
  const clipName=rig.animation || a.animation.animationNames[0];
  const clip=a.armatureData.getAnimation(clipName);
  const fps=a.armatureData.frameRate;
  const duration=clip.duration;
  const count=Math.max(1,Math.round(duration*fps));
  a.animation.reset();
  const config=a.animation.animationConfig;
  config.animation=clipName; config.actionEnabled=false; config.playTimes=0; config.fadeInTime=0;
  a.animation.playConfig(config); a.advanceTime(0);
  const frames=[snapshot(a)];
  for(let frame=1;frame<=count;frame++) { a.advanceTime(1/fps); frames.push(snapshot(a)); }
  const slots=new Map();
  for(const frame of frames) for(const slot of frame) if(!slots.has(slot.slot)) slots.set(slot.slot,slot);
  if(!slots.size) return null;
  const points=[];
  const tracks=[];
  const nodes=[];
  let slotIndex=0;
  for(const [name, first] of slots) {
    const node='Part_'+slotIndex++;
    const poses=frames.map(frame=>frame.find(p=>p.slot===name));
    for(const pose of poses) if(pose) {
      const t=pose.transform, r=pose.region;
      for(const [x,y] of [[0,0],[r.width,0],[0,r.height],[r.width,r.height]])
        points.push([t[0]*x+t[2]*y+t[4],t[1]*x+t[3]*y+t[5]]);
    }
    const rect=p=>`Rect2(${nums([p.region.x,p.region.y,p.region.width,p.region.height])})`;
    nodes.push(`[node name="${node}" type="Sprite2D" parent="."]`,
      `transform = Transform2D(${nums(first.transform)})`,
      `visible = ${!!poses[0]}`,
      `modulate = Color(${nums(first.color)})`,
      'texture = ExtResource("atlas")', 'centered = false', 'region_enabled = true',
      'region_filter_clip_enabled = true', `region_rect = ${rect(first)}`, '');
    for(const [property,serialize] of [
      ['transform',p=>`Transform2D(${nums(p.transform)})`],
      ['modulate',p=>`Color(${nums(p.color)})`],
      ['region_rect',rect], ['visible',p=>String(!!p)]
    ]) {
      const values=poses.map(p=>p || (property==='visible'?null:first));
      const constant=values.map(serialize);
      if(constant.every(v=>v===constant[0])) continue;
      const keys=[];
      constant.forEach((value,frame)=>{
        // Retain both ends of a constant run before a varying segment.
        if(!frame || value!==constant[frame-1] || (frame+1<constant.length && value!==constant[frame+1]))
          keys.push({time:frame/fps,value});
      });
      const base=`tracks/${tracks.length/5}`;
      tracks.push(`${base}/type = "value"`,`${base}/path = NodePath("${node}:${property}")`,
        `${base}/interp = ${property==='transform'||property==='modulate'?1:0}`,
        `${base}/keys = {"times": PackedFloat32Array(${keys.map(k=>num(k.time)).join(', ')}), "transitions": PackedFloat32Array(${keys.map(()=>1).join(', ')}), "update": 0, "values": [${keys.map(k=>k.value).join(', ')}]}`, '');
    }
  }
  const hasAnimation=tracks.length>0;
  const filename=createHash('sha256').update(key).digest('hex').slice(0,20)+'.tscn';
  const atlas=path.basename(rig.textureImage || rig.texture);
  const chunks=[`[gd_scene load_steps=${hasAnimation?4:2} format=3]`,
    `[ext_resource type="Texture2D" path="res://assets/ui/adventure/atlases/${atlas}" id="atlas"]`,''];
  if(hasAnimation) chunks.push('[sub_resource type="Animation" id="idle"]',
    'resource_name = "idle"',`length = ${num(duration)}`,'loop_mode = 1',...tracks,
    '[sub_resource type="AnimationLibrary" id="library"]','_data = {&"idle": SubResource("idle")}','');
  chunks.push('[node name="MapRig" type="Node2D"]','',...nodes);
  if(hasAnimation) chunks.push('[node name="AnimationPlayer" type="AnimationPlayer" parent="."]',
    'libraries = {&"": SubResource("library")}','autoplay = "idle"');
  fs.writeFileSync(path.join(nativeDirectory,filename),chunks.join('\n')+'\n');
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const left=Math.min(...xs),top=Math.min(...ys);
  return {scene:'res://assets/ui/adventure/rigs/'+filename,
    bounds:[left,top,Math.max(...xs)-left,Math.max(...ys)-top],duration,animated:hasAnimation};
}
const read = name => JSON.parse(fs.readFileSync(path.join(source,name+'.json'),'utf8'));
const cache=new Map();
const nativeCache=new Map();
const factories=new Map();
for(const file of fs.readdirSync(source).filter(f=>f.endsWith('WORLDMAP.json'))) {
  const data=JSON.parse(fs.readFileSync(path.join(source,file),'utf8'));
  let count=0;
  for(const n of data.nodes) for(const rig of n.armatures) {
    if(!rig.skeletonUuid) continue;
    const key=[rig.skeletonUuid,rig.atlasUuid,rig.armature,rig.animation].join(':');
    if(!cache.has(key)) {
      const factoryKey=[rig.skeletonUuid,rig.atlasUuid].join(':');
      if(!factories.has(factoryKey)) {
        const f=new Factory();
        const sk=f.parseDragonBonesData(read(rig.skeletonUuid));
        f.parseTextureAtlasData(read(rig.atlasUuid),null);
        factories.set(factoryKey,{f,name:sk.name});
      }
      const {f,name}=factories.get(factoryKey);
      const a=f.buildArmature(rig.armature,name);
      if(!a) throw new Error('Missing '+key);
      const config=a.animation.animationConfig;
      config.animation=rig.animation || a.animation.animationNames[0];
      config.actionEnabled=false; config.fadeInTime=0; config.playTimes=0;
      a.animation.playConfig(config);
      a.advanceTime(0); a.advanceTime(1.2);
      const parts=snapshot(a);
      if(!parts.length) runtimeMessages.add('Empty sampled pose '+key);
      cache.set(key,parts);
      nativeCache.set(key,nativeRig(a,rig,key));
      a.dispose();
    }
    rig.parts=cache.get(key); delete rig.emptySlot;
    rig.native=nativeCache.get(key);
    count+=rig.parts.length;
  }
  fs.writeFileSync(path.join(source,file),JSON.stringify(data));
  console.log(file+': '+count+' evaluated slots');
}
fs.writeFileSync(path.join(source,'sample-diagnostics.json'),JSON.stringify([...runtimeMessages],null,2));
