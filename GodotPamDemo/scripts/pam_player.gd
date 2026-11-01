class_name PamPlayer
extends Node2D
## Plays pam-viewer's compiled display lists through native Godot Node2D/Sprite2D.
## Binary decoding and sparse timeline compilation remain in the upstream WASM tool.

signal frame_changed(frame: int)
signal animation_command(command: String, argument: String)
signal clip_finished(clip: String)

var pam: Dictionary
var compiled: Dictionary
var clips: Dictionary = {}
var textures: Array[Texture2D] = []
var current_frame: int = 0
var current_clip: String = "idle"
var playing: bool = true
var playback_speed: float = 1.0
var looping: bool = true
var fps: float = 30.0
var show_rig: bool = false
var show_costume: bool = false
var exploded: float = 0.0
var visible_parts: int = 0
var pivots: Array[Dictionary] = []
var _nodes: Dictionary = {}
var _time: float = 0.0
var _additive: CanvasItemMaterial
var _overlay: PivotOverlay
var animation_asset: PamAnimationAsset
var _advancing: bool = false

class PivotOverlay extends Node2D:

	var actor: PamPlayer

	func _draw() -> void:
		if not actor.show_rig:
			return
		for item in actor.pivots:
			var at: Vector2 = item.position
			var color := Color(0.63, 0.92, 0.52, 0.9)
			if item.has("corners"):
				draw_polyline(item.corners, Color(0.56, 0.85, 0.74, 0.48), 0.45, true)
			else:
				draw_circle(at, 1.9, Color(1.0, 0.79, 0.36))
				draw_line(at - Vector2(4, 0), at + Vector2(7, 0), color, 0.65, true)
				draw_line(at - Vector2(0, 4), at + Vector2(0, 7), color, 0.65, true)

func load_animation(asset: PamAnimationAsset) -> Error:
	var error := asset.prepare()
	if error != OK:
		return error
	for child in get_children():
		child.free()
	_nodes.clear()
	pivots.clear()
	animation_asset = asset
	pam = asset.pam
	compiled = asset.compiled
	textures = asset.textures
	clips = asset.clips
	fps = float(pam.frame_rate)
	_additive = CanvasItemMaterial.new()
	_additive.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	_overlay = PivotOverlay.new()
	_overlay.actor = self
	_overlay.name = "OriginalPivots"
	_overlay.z_index = 4090
	add_child(_overlay)
	play_clip(asset.default_clip)
	return OK

func _process(delta: float) -> void:
	advance_seconds(delta)

func advance_seconds(seconds: float) -> void:
	if not playing:
		return
	_time += seconds * playback_speed
	var step := 1.0 / fps
	_advancing = true
	while _time >= step and playing:
		_time -= step
		var clip: Dictionary = clips[current_clip]
		if current_frame >= int(clip.end):
			if looping:
				current_frame = int(clip.start)
			else:
				playing = false
				clip_finished.emit(current_clip)
				# A callback may have selected another animation.
				if not playing:
					break
				continue
		else:
			current_frame += 1
		_apply_frame()
		_dispatch_commands()
	_advancing = false

func play_clip(label: String, loop: bool = true) -> void:
	assert(clips.has(label), "Unknown animation label: " + label)
	current_clip = label
	current_frame = int(clips[label].start)
	looping = loop
	playing = true
	if not _advancing:
		_time = 0.0
	_apply_frame()
	_dispatch_commands()

func seek_frame(frame: int) -> void:
	current_frame = clampi(frame, 0, compiled.main.size() - 1)
	for label: String in clips:
		var clip: Dictionary = clips[label]
		if current_frame >= int(clip.start) and current_frame <= int(clip.end):
			current_clip = label
			break
	_time = 0.0
	_apply_frame()

func refresh_pose() -> void:
	_apply_frame()

func _dispatch_commands() -> void:
	for command: Array in pam.main_sprite.frame[current_frame].get("command", []):
		animation_command.emit(str(command[0]), str(command[1]))

func _apply_frame() -> void:
	for node: Node2D in _nodes.values():
		node.visible = false
	pivots.clear()
	visible_parts = 0
	_place(compiled.main, current_frame, self, "main", Transform2D.IDENTITY, false, [], 0)
	if show_rig:
		_overlay.queue_redraw()
	frame_changed.emit(current_frame)

func _place(timeline: Array, frame: int, parent: Node2D, path: String,
		accumulated: Transform2D, additive: bool, stack: Array, depth: int) -> void:
	if timeline.is_empty() or depth >= 128:
		return
	var actual_frame := posmod(frame, timeline.size())
	var snapshot: Array = timeline[actual_frame]
	for order in snapshot.size():
		var layer: Dictionary = snapshot[order]
		if float(layer.color.a) <= 0.0:
			continue
		var resource: int = int(layer.resource)
		var is_sprite: bool = bool(layer.is_sprite)
		if is_sprite and resource < pam.sprite.size() and not show_costume:
			if animation_asset.is_hidden(str(pam.sprite[resource].get("name", ""))):
				continue
		var key := path + "/%s_%s_%s" % [int(layer.index), "sprite" if is_sprite else "image", resource]
		var node: Node2D = _nodes.get(key)
		if node == null:
			node = Node2D.new() if is_sprite else Sprite2D.new()
			node.name = "Layer_%s_%s_%s" % [int(layer.index), "Sprite" if is_sprite else "Image", resource]
			parent.add_child(node)
			_nodes[key] = node
		var transform_matrix := to_transform(layer.transform)
		if depth == 0 and exploded > 0.0:
			var center := animation_asset.explode_origin
			transform_matrix.origin = center + (transform_matrix.origin - center) * (1.0 + exploded)
		node.transform = transform_matrix
		node.visible = true
		# Preserve depth-first display-list order across nested sprites.
		node.z_index = 0
		parent.move_child(node, -1)
		var tint: Dictionary = layer.color
		node.modulate = Color(float(tint.r), float(tint.g), float(tint.b), float(tint.a))
		var world_matrix := accumulated * transform_matrix
		var use_additive := additive or bool(layer.additive)
		if is_sprite:
			if stack.has(resource):
				continue
			if show_rig:
				pivots.append({"position": world_matrix.origin, "resource": resource, "index": int(layer.index)})
			var child: Array = compiled.main if resource == compiled.sprites.size() else compiled.sprites[resource]
			if child.is_empty():
				continue
			var elapsed: int = actual_frame - int(layer.first_frame)
			var child_frame := int(floor(elapsed * float(layer.time_scale))) + int(layer.preload_frame)
			_place(child, child_frame, node, key, world_matrix, use_additive, stack + [resource], depth + 1)
		else:
			var picture := node as Sprite2D
			picture.texture = textures[resource]
			picture.centered = false
			picture.material = _additive if use_additive else null
			var image: Dictionary = pam.image[resource]
			var source_size: Vector2 = picture.texture.get_size()
			var rectangle = layer.get("source_rectangle")
			picture.region_enabled = rectangle != null
			if rectangle != null:
				source_size = Vector2(float(rectangle.size[0]), float(rectangle.size[1]))
				picture.region_rect = Rect2(Vector2(float(rectangle.position[0]), float(rectangle.position[1])), source_size)
			var logical_size := source_size
			if image.get("size") != null:
				logical_size = Vector2(float(image.size[0]), float(image.size[1]))
			var image_transform := to_transform(image.transform)
			var pixels := Transform2D.IDENTITY.scaled(logical_size / source_size)
			picture.transform = transform_matrix * image_transform * pixels
			var final_matrix := world_matrix * image_transform
			if show_rig:
				var corners := PackedVector2Array([final_matrix * Vector2.ZERO,
					final_matrix * Vector2(logical_size.x, 0), final_matrix * logical_size,
					final_matrix * Vector2(0, logical_size.y), final_matrix * Vector2.ZERO])
				pivots.append({"position": final_matrix.origin, "corners": corners})
			visible_parts += 1

static func to_transform(values: Array) -> Transform2D:
	match values.size():
		2:
			return Transform2D(0.0, Vector2(float(values[0]), float(values[1])))
		3:
			return Transform2D(float(values[0]), Vector2(float(values[1]), float(values[2])))
		6:
			return Transform2D(Vector2(float(values[0]), float(values[1])),
				Vector2(float(values[2]), float(values[3])), Vector2(float(values[4]), float(values[5])))
	assert(false, "Invalid compiled transform")
	return Transform2D.IDENTITY
