class_name PlantAnimationPreview
extends Control
## Owns one display player. Animation commands never enter the combat systems.

signal playback_changed(clip: String, paused: bool)

var player: PamPlayer
var definition: Dictionary = {}
var paused := false
var _preview_scale := 1.65

func _ready() -> void:
	resized.connect(_layout_player)

func set_plant(data: Dictionary, preview_scale: float = 1.65) -> Error:
	var asset := load(str(data.get("animation", ""))) as PamAnimationAsset
	if asset == null or asset.prepare() != OK:
		clear()
		return ERR_INVALID_DATA
	var idle := str(data.get("idle_clip", asset.default_clip))
	if not asset.clips.has(idle):
		clear()
		return ERR_INVALID_DATA
	clear()
	definition = data
	_preview_scale = preview_scale
	player = PamPlayer.new()
	player.name = "PAM"
	add_child(player)
	player.load_animation(asset)
	player.clip_finished.connect(_on_clip_finished)
	_layout_player()
	play_clip(idle)
	return OK

func clear() -> void:
	if is_instance_valid(player):
		player.free()
	player = null
	definition = {}

func clip_options() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	if not is_instance_valid(player):
		return result
	var labels := {"idle_clip": "待机", "action_clip": "动作演示", "damage_clip": "受损外观", "heavy_damage_clip": "严重受损"}
	var seen: Array[String] = []
	for key: String in labels:
		var clip := str(definition.get(key, ""))
		if not clip.is_empty() and player.clips.has(clip) and not seen.has(clip):
			result.append({"clip": clip, "title": labels[key]})
			seen.append(clip)
	return result

func play_clip(clip: String) -> bool:
	if not is_instance_valid(player) or not player.clips.has(clip):
		return false
	player.play_clip(clip, clip != str(definition.get("action_clip", "")))
	player.playing = not paused
	playback_changed.emit(clip, paused)
	return true

func set_paused(value: bool) -> void:
	paused = value
	if is_instance_valid(player):
		player.playing = not value
		playback_changed.emit(player.current_clip, paused)

func _layout_player() -> void:
	if not is_instance_valid(player):
		return
	var fit := minf(size.x / 240.0, size.y / 220.0)
	var zoom := float(definition.display_scale) * _preview_scale * fit
	player.scale = Vector2.ONE * zoom
	player.position = Vector2(size.x * 0.5, size.y * 0.82) - player.animation_asset.origin * zoom

func _on_clip_finished(_clip: String) -> void:
	play_clip(str(definition.get("idle_clip", player.animation_asset.default_clip)))
