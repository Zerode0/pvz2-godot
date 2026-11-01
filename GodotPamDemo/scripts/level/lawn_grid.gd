class_name LawnGrid
extends Node2D

@export var rows: int = 5
@export var columns: int = 9
@export var cell_size := Vector2(81, 108)
var hover := Vector2i(-1, -1)
var hover_valid: bool = true

func cell_at(world: Vector2) -> Vector2i:
	var local := to_local(world)
	return Vector2i(floori(local.x / cell_size.x), floori(local.y / cell_size.y))

func contains(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.x < columns and cell.y >= 0 and cell.y < rows

func foot(cell: Vector2i) -> Vector2:
	return position + Vector2((cell.x + 0.5) * cell_size.x, (cell.y + 1) * cell_size.y - 9)

func _draw() -> void:
	if contains(hover):
		var box := Rect2(Vector2(hover) * cell_size, cell_size)
		var color := Color(0.74, 0.95, 0.40, 0.24) if hover_valid else Color(1, 0.27, 0.20, 0.26)
		draw_rect(box, color)
		draw_rect(box.grow(-1.5), Color(color, 0.7), false, 2)
