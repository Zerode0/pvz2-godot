class_name LawnMower
extends Node2D

var row: int
var active: bool = false
var spent: bool = false

func configure(lane: int) -> void:
	row = lane
	_picture("MowerHandle", Vector2(-18, -36), Vector2(33, 54))
	_picture("MowerBody", Vector2(1, -16), Vector2(65, 39))
	_picture("MowerWheel", Vector2(-23, 0), Vector2(21, 21))
	_picture("MowerWheel", Vector2(23, 0), Vector2(21, 21))

func _picture(art: String, at: Vector2, size: Vector2) -> void:
	var picture := Sprite2D.new()
	picture.texture = load("res://assets/level/" + art + ".png")
	picture.position = at
	picture.scale = size / picture.texture.get_size()
	add_child(picture)

func advance(seconds: float, enemies: Array[LawnZombie]) -> void:
	if not active or spent:
		return
	var previous := position.x
	position.x += 600.0 * seconds
	for enemy in enemies:
		if enemy.alive and enemy.row == row and enemy.position.x >= previous - 55 and enemy.position.x <= position.x + 55:
			enemy.take_damage(enemy.health)
	if position.x > 1410:
		spent = true
		visible = false
