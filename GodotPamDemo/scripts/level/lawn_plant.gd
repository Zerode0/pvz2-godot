class_name LawnPlant
extends LawnUnit

signal shot_requested(plant: LawnPlant)
signal sun_requested(plant: LawnPlant)
var column: int
var timer: float = 0.4
var action_pending: bool = false

func configure(plant_kind: String, cell: Vector2i, data: Dictionary) -> void:
	column = cell.x
	setup(plant_kind, cell.y, data)
	timer = float(data.get("initial_delay", 0.4)) + row * 0.17
	animation.animation_command.connect(_on_command)
	animation.clip_finished.connect(_on_finished)
	var idle: Dictionary = animation.clips[animation.current_clip]
	animation.seek_frame(int(idle.start) + posmod(row * 7 + column * 3, int(idle.end) - int(idle.start) + 1))

func advance(seconds: float, target_ahead: bool) -> void:
	if not alive:
		return
	advance_visual(seconds)
	timer -= seconds
	if timer > 0.0 or action_pending:
		return
	var action := str(definition.get("action_clip", ""))
	if action.is_empty() or (str(definition.behavior) == "shoot" and not target_ahead):
		return
	action_pending = true
	timer = float(definition.interval)
	animation.play_clip(action, false)

func _on_command(command: String, _argument: String) -> void:
	if not alive or not action_pending or command != str(definition.get("action_command", "use_action")):
		return
	if str(definition.behavior) == "sun":
		sun_requested.emit(self)
	elif str(definition.behavior) == "shoot":
		shot_requested.emit(self)

func _on_finished(_clip: String) -> void:
	action_pending = false
	animation.play_clip(str(definition.get("idle_clip", animation.animation_asset.default_clip)))

func update_damage_pose() -> void:
	if str(definition.behavior) != "block" or not alive:
		return
	var clip: String = str(definition.get("idle_clip", "idle"))
	if health / max_health < 0.35:
		clip = str(definition.get("heavy_damage_clip", clip))
	elif health / max_health < 0.67:
		clip = str(definition.get("damage_clip", clip))
	if animation.clips.has(clip) and animation.current_clip != clip:
		animation.play_clip(clip)
