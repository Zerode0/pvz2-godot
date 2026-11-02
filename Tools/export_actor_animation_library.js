async () => {
  const cc = window.__actorCC;
  const bundle = cc.assetManager.getBundle("resources");
  const result = {entries: [], failures: [], features: {}};
  const saved = new Set();
  const load = (name, type = cc.Prefab) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out loading " + name)), 25000);
    bundle.load(name, type, (error, value) => {
      clearTimeout(timer);
      error ? reject(error) : resolve(value);
    });
  });
  const saveAsset = async (asset, text, category) => {
    if (!asset || !text) return null;
    const name = category + "/" + asset.uuid + ".json";
    if (!saved.has(name)) {
      await window.saveActorJson(name, typeof text === "string" ? text : JSON.stringify(text));
      saved.add(name);
    }
    return name;
  };
  for (const feature of ["PlantFeatures", "ZombieFeatures", "ArmorFeatures"]) {
    const asset = await load("json/Features/" + feature, cc.JsonAsset);
    const filename = "features/" + feature + ".json";
    await window.saveActorJson(filename, JSON.stringify(asset.json));
    result.features[feature] = filename;
  }
  const prefabs = ["plants", "zombies", "armors"].flatMap(group =>
    bundle.getDirWithPath(group, cc.Prefab).map(info => ({group, path: info.path})));
  console.info("Actor exports found: " + prefabs.length);
  for (const info of prefabs) {
    let root;
    try {
      const prefab = await load(info.path);
      root = cc.instantiate(prefab);
      const entry = {group: info.group, path: info.path, prefab_uuid: prefab.uuid, nodes: []};
      const walk = async (node, parent) => {
        const nodePath = parent ? parent + "/" + node.name : node.name;
        const data = {path: nodePath, active: node.active,
          position: [node.position.x, node.position.y], scale: [node.scale.x, node.scale.y],
          angle: node.angle, armatures: [], sprites: []};
        for (const component of node.components) {
          if (component instanceof cc.dragonBones.ArmatureDisplay) {
            const dragon = component.dragonAsset;
            const atlas = component.dragonAtlasAsset;
            data.armatures.push({armature: component.armatureName, animation: component.animationName,
              time_scale: component.timeScale,
              skeleton: await saveAsset(dragon, dragon?.dragonBonesJson || dragon?._dragonBonesJson, "skeletons"),
              atlas: await saveAsset(atlas, atlas?.atlasJson || atlas?._atlasJson, "atlases"),
              texture_uuid: atlas?.texture?.uuid,
              texture_image: atlas?.texture?.image?.nativeUrl});
          }
          if (component instanceof cc.Sprite && component.spriteFrame) {
            const frame = component.spriteFrame;
            data.sprites.push({uuid: frame.uuid, name: frame.name, rect: frame.rect,
              rotated: frame.rotated, original_size: frame.originalSize, offset: frame.offset,
              texture_image: frame.texture?.image?.nativeUrl});
          }
        }
        entry.nodes.push(data);
        for (const child of node.children) await walk(child, nodePath);
      };
      await walk(root, "");
      await window.saveActorJson("actors/" + info.path + ".json", JSON.stringify(entry));
      result.entries.push({group: info.group, path: info.path,
        descriptor: "actors/" + info.path + ".json",
        armatures: entry.nodes.reduce((sum, node) => sum + node.armatures.length, 0)});
    } catch (error) {
      result.failures.push({path: info.path, error: String(error)});
    } finally {
      if (root) root.destroy();
    }
    if (result.entries.length % 25 === 0) console.info("Actor exports saved: " + result.entries.length);
  }
  return result;
}
