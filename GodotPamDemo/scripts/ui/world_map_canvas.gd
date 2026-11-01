@tool
class_name WorldMapCanvas
extends Node2D
## Renders the converted map's original decoration transforms and connection graph.

signal node_selected(id: String)
signal node_focused(id: String)

var markers: Dictionary = {}
var definitions: Dictionary = {}
var selected_id := ""
var _paths: Array = []
var _cull_items: Array[Dictionary] = []
var _path_texture: Texture2D

func build(data: Dictionary, progress: AdventureProgress, font: Font, far_layer: Node2D) -> void:
	for definition in data.get("rigs", []):
		var rig: Node2D = (load(str(definition.scene)) as PackedScene).instantiate()
		var t: Array = definition.transform
		rig.transform = Transform2D(Vector2(t[0], t[1]), Vector2(t[2], t[3]), Vector2(t[4], t[5]))
		rig.z_index = mini(get_child_count() + far_layer.get_child_count() + 1, 3000)
		var b: Array = definition.bounds
		var local := Rect2(b[0], b[1], b[2], b[3])
		var bounds := Rect2(rig.transform * local.position, Vector2.ZERO)
		for corner in [local.position + Vector2(local.size.x, 0), local.end, local.position + Vector2(0, local.size.y)]:
			bounds = bounds.expand(rig.transform * corner)
		if not is_equal_approx(float(definition.get("parallax", 1.0)), 1.0):
			rig.set_meta("origin_x", rig.position.x)
			rig.set_meta("parallax", float(definition.parallax))
			rig.set_meta("map_bounds", bounds)
			far_layer.add_child(rig)
		else:
			add_child(rig)
			_cull_items.append({"item": rig, "bounds": bounds})
	for decoration in data.get("sprites", []):
		var sprite := Sprite2D.new()
		sprite.texture = load(str(decoration.texture))
		if decoration.has("region"):
			var r: Array = decoration.region
			sprite.region_enabled = true
			sprite.region_rect = Rect2(r[0], r[1], r[2], r[3])
		sprite.centered = false
		sprite.z_index = mini(get_child_count() + far_layer.get_child_count() + 1, 3000)
		if decoration.has("transform"):
			var t: Array = decoration.transform
			sprite.transform = Transform2D(Vector2(t[0], t[1]), Vector2(t[2], t[3]), Vector2(t[4], t[5]))
		else:
			sprite.position = Vector2(decoration.position[0], decoration.position[1])
			if decoration.has("size"):
				sprite.scale = Vector2(decoration.size[0], decoration.size[1]) / sprite.texture.get_size()
		if decoration.has("tint"):
			sprite.modulate = Color(str(decoration.tint))
		if decoration.has("color"):
			var c: Array = decoration.color
			sprite.modulate = Color(c[0], c[1], c[2], c[3])
		var far := not is_equal_approx(float(decoration.get("parallax", 1.0)), 1.0)
		if far:
			sprite.set_meta("origin_x", sprite.position.x)
			sprite.set_meta("parallax", float(decoration.get("parallax", 0.25)))
			far_layer.add_child(sprite)
		else:
			add_child(sprite)
			var rect := Rect2()
			var first := true
			var extent := sprite.region_rect.size if sprite.region_enabled else sprite.texture.get_size()
			for corner in [Vector2.ZERO, Vector2(extent.x, 0), extent, Vector2(0, extent.y)]:
				var point: Vector2 = sprite.transform * corner
				if first:
					rect = Rect2(point, Vector2.ZERO)
					first = false
				else:
					rect = rect.expand(point)
			_cull_items.append({"item": sprite, "bounds": rect})
	for data_node in data.nodes:
		var marker := MapLevelButton.new()
		marker.setup(data_node, font, progress)
		marker.z_index = 4000
		markers[data_node.id] = marker
		definitions[data_node.id] = data_node
		marker.pressed.connect(func(): node_selected.emit(str(data_node.id)))
		marker.focus_entered.connect(func(): node_focused.emit(str(data_node.id)))
		add_child(marker)
	_paths = data.get("paths", [])
	if not str(data.get("path_texture", "")).is_empty():
		_path_texture = load(str(data.path_texture))
	queue_redraw()

func select(id: String) -> void:
	selected_id = id
	for key: String in markers:
		markers[key].selected = key == id
		markers[key].queue_redraw()

func hit_node(at: Vector2) -> String:
	for id: String in markers:
		if markers[id].get_rect().grow(12).has_point(at):
			return id
	return ""

func cull(offset: float, width: float) -> void:
	var visible_area := Rect2(offset - 250, -1000, width + 500, 3000)
	for entry in _cull_items:
		entry.item.visible = visible_area.intersects(entry.bounds)
		entry.item.process_mode = Node.PROCESS_MODE_INHERIT if entry.item.visible else Node.PROCESS_MODE_DISABLED
	for marker: MapLevelButton in markers.values():
		marker.visible = visible_area.intersects(marker.get_rect())

func _draw() -> void:
	for edge in _paths:
		var start_data: Dictionary = definitions[edge[0]]
		var end_data: Dictionary = definitions[edge[1]]
		var a := Vector2(start_data.position[0], start_data.position[1])
		var b := Vector2(end_data.position[0], end_data.position[1])
		var direction := (b - a).normalized()
		var length := a.distance_to(b)
		var distance := 45.0
		while distance < length - 45:
			var point := a + direction * distance
			if _path_texture:
				draw_texture_rect(_path_texture, Rect2(point - Vector2(9, 5), Vector2(18, 10)), false)
			else:
				draw_circle(point + Vector2(0, 3), 4.5, Color(0.03, 0.15, 0.12, 0.35))
				draw_circle(point, 4.0, Color("e8d79d"))
			distance += 19.0
