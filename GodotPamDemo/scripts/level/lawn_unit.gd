class_name LawnUnit
extends Node2D

signal died(unit: LawnUnit)
var definition: Dictionary
var kind: String
var row: int
var health: float
var max_health: float
var alive: bool = true
var animation: PamPlayer
var visual: Node2D
var _flash: float = 0.0

func setup(unit_kind: String, lane: int, data: Dictionary) -> void:
	kind = unit_kind
	row = lane
	definition = data
	health = float(data.health)
	max_health = health
	alive = true
	var shadow := Sprite2D.new()
	shadow.texture = preload("res://assets/Shadow.png")
	shadow.scale = Vector2(0.43, 0.34)
	add_child(shadow)
	visual = Node2D.new()
	add_child(visual)
	var asset := load(str(data.animation)) as PamAnimationAsset
	animation = PamPlayer.new()
	animation.name = "PAM"
	visual.add_child(animation)
	var size_scale: float = float(data.display_scale)
	animation.scale = Vector2.ONE * size_scale
	animation.position = -asset.origin * size_scale
	if animation.load_animation(asset) != OK:
		push_error("Could not load animation for " + kind)
	animation.set_process(false)

func take_damage(amount: float) -> void:
	if not alive:
		return
	health = maxf(0.0, health - amount)
	_flash = 0.13
	queue_redraw()
	if health <= 0.0:
		alive = false
		died.emit(self)
		visible = false
		queue_free()

func advance_visual(seconds: float) -> void:
	_flash = maxf(0.0, _flash - seconds)
	visual.modulate = Color(1, 0.59, 0.50) if _flash > 0.0 else Color.WHITE
	animation.advance_seconds(seconds)

func _draw() -> void:
	if alive and health < max_health:
		var top := -float(definition.get("height", 100)) - 8
		draw_rect(Rect2(-26, top, 52, 5), Color(0.08, 0.12, 0.06, 0.9))
		draw_rect(Rect2(-25, top + 1, 50 * health / max_health, 3), Color("b9e652"))
