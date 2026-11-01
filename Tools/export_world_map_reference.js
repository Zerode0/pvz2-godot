async () => {
  const cc = await System.import('cc');
  const bundle = cc.assetManager.getBundle('resources') || await new Promise((resolve, reject) =>
    cc.assetManager.loadBundle('resources', (error, value) => error ? reject(error) : resolve(value)));
  const load = (name, type) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out loading ' + name)), 25000);
    bundle.load(name, type, (error, value) => { clearTimeout(timeout); error ? reject(error) : resolve(value); });
  });
  const features = (await load('json/Features/WorldmapFeatures', cc.JsonAsset)).json;
  const result = { features, prefabs: {}, diagnostics: [] };
  const savedAssets = new Set();
  const vector = v => [v.x, v.y];
  const matrix = n => { const m = n.worldMatrix; return [m.m00, m.m01, m.m04, m.m05, m.m12, m.m13]; };
  const frameInfo = f => f ? ({ uuid: f.uuid, name: f.name, rect: f.rect, rotated: f.rotated,
    originalSize: f.originalSize, offset: f.offset, texture: f.texture?.nativeUrl,
    image: f.texture?.image?.nativeUrl, textureUuid: f.texture?.uuid }) : null;
  const maps = ['WorldmapChooserWORLDMAP', ...features.WORLDMAPS.filter(w =>
    w.CODENAME !== 'chooser' && w.CODENAME !== 'epic' && !w.CODENAME.startsWith('epic_')).map(w => w.RESNAME+'WORLDMAP')];
  for (const name of maps) {
    const awaitAssetSaves = [];
    const prefab = await load('worldmaps/' + name, cc.Prefab);
    const root = cc.instantiate(prefab);
    const nodes = [];
    const walk = node => {
      let active = node.active;
      for (let ancestor=node.parent; ancestor; ancestor=ancestor.parent) active &&= ancestor.active;
      const entry = { uuid: node.uuid, name: node.name, parent: node.parent?.uuid,
        active, position: vector(node.position), scale: vector(node.scale),
        angle: node.angle, world: matrix(node), sprites: [], armatures: [] };
      for (const component of node.components) {
        if (component instanceof cc.Sprite) entry.sprites.push(frameInfo(component.spriteFrame));
        if (component instanceof cc.dragonBones.ArmatureDisplay) {
          const dragon = component.dragonAsset;
          const atlas = component.dragonAtlasAsset;
          for (const [asset, value] of [[dragon, dragon?.dragonBonesJson || dragon?._dragonBonesJson],
              [atlas, atlas?.atlasJson || atlas?._atlasJson]]) {
            if (asset && value && !savedAssets.has(asset.uuid)) {
              savedAssets.add(asset.uuid);
              awaitAssetSaves.push(window.saveMapExport(asset.uuid, typeof value === 'string' ? value : JSON.stringify(value)));
            }
          }
          const armature = { armature: component.armatureName, animation: component.animationName,
            skeletonUuid: dragon?.uuid, atlasUuid: atlas?.uuid,
            texture: atlas?.texture?.nativeUrl, textureImage: atlas?.texture?.image?.nativeUrl,
          };
          entry.armatures.push(armature);
        }
      }
      nodes.push(entry);
      node.children.forEach(walk);
    };
    walk(root);
    await Promise.all(awaitAssetSaves);
    const components = root.getComponentsInChildren(cc.Component);
    const map = components.find(c => Array.isArray(c.levelIslands) && c.islandParent);
    const chooser = components.find(c => Array.isArray(c.icons) && c.iconParent);
    const data = { nodes, root: root.uuid };
    if (map) {
      data.islandParent = map.islandParent.uuid;
      data.farIslands = map.farIslands.map(f => ({ node: f.islandNode?.uuid, offsetScale: f.offsetScale }));
      data.islands = map.levelIslands.map(island => {
        const item = { node: island.islandNode?.uuid, display: island.islandDisplay,
          levelIds: island.levelJsonsID, label: island.levelNodeName, affectsMaxX: island.affectsMaxX,
          links: island._allNextIslands?.map(n => n.uuid), fields: {} };
        for (const [key, value] of Object.entries(island)) {
          if (value instanceof cc.Node) item.fields[key] = { node: value.uuid };
          else if (Array.isArray(value) && value.some(v => v instanceof cc.Node)) item.fields[key] = value.map(v => v?.uuid);
          else if (['string', 'number', 'boolean'].includes(typeof value)) item.fields[key] = value;
        }
        return item;
      });
    }
    if (chooser) data.icons = chooser.icons.map(icon => ({ node: icon.node.uuid,
      enterable: icon.enterable, enterTo: icon.enterTo, atNight: icon.atNight }));
    await window.saveMapExport(name, JSON.stringify(data));
    result.prefabs[name] = { nodes: nodes.length, islands: data.islands?.length || 0 };
    // Detached prefab instances are released with the browser; their lifecycle is not started.
    console.info('Exported map: ' + name);
  }
  return JSON.stringify(result);
}
