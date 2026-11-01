async () => {
  const cc = window.__previewCC;
  const bundle = cc.assetManager.getBundle('resources');
  const scene = await new Promise((resolve, reject) => bundle.loadScene('almanacScene',
    (error, value) => error ? reject(error) : resolve(value)));
  const result = { scene: 'almanacScene', nodes: [], plant_page: {} };
  const walk = (node, parent) => {
    const ui = node.getComponent(cc.UITransform);
    const entry = { name: node.name, path: parent + '/' + node.name, active: node.active,
      position: [node.position.x, node.position.y], scale: [node.scale.x, node.scale.y],
      size: ui ? [ui.width, ui.height] : null, sprites: [], components: [] };
    for (const component of node.components) {
      entry.components.push(cc.js.getClassName(component));
      if (component instanceof cc.Label) entry.text = component.string;
      if (component instanceof cc.Sprite && component.spriteFrame) {
        const f = component.spriteFrame;
        entry.sprites.push({ name: f.name, uuid: f.uuid, rect: f.rect, rotated: f.rotated,
          originalSize: f.originalSize, offset: f.offset, texture: f.texture?.image?.nativeUrl,
          insets: [f.insetLeft, f.insetTop, f.insetRight, f.insetBottom] });
      }
      if (cc.js.getClassName(component) === 'AlmanacPlantPage') {
        for (const key of ['cardsParent', 'plantDisplayer', 'displayBG', 'plantNameLabel',
            'introductionLabel', 'elementParent', 'plantCardTemp']) {
          const value = component[key];
          result.plant_page[key] = value?.node?.name || value?.name || null;
        }
        if (component.plantCardTemp) walk(component.plantCardTemp.data, '/PlantCardPrefab');
      }
    }
    result.nodes.push(entry);
    for (const child of node.children) walk(child, entry.path);
  };
  scene.scene._load();
  walk(scene.scene, '');
  return result;
}
