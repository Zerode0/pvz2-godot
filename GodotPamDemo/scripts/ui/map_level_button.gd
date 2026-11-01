@tool
class_name MapLevelButton
extends Button
## Selectable map marker. Pointer gestures belong to MapPanView; keyboard focus is native.

var number_label: Label
var caption: Label
var available := false
var completed := false
var selected := false
var marker_id := ""
var kind := "level"

func setup(data: Dictionary, font: Font, progress: AdventureProgress) -> void:
	marker_id = str(data.id)
	kind = str(data.get("kind", "level"))
	name = "Level_" + marker_id.validate_node_name()
	size = Vector2(76, 78)
	pivot_offset = size / 2.0
	position = Vector2(float(data.position[0]), float(data.position[1])) - size / 2.0
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	for state in ["normal", "hover", "pressed", "focus"]:
		add_theme_stylebox_override(state, StyleBoxEmpty.new())
	available = progress.can_play(data)
	completed = str(data.get("level_id", "")) in progress.completed_levels
	number_label = Label.new()
	number_label.text = str(data.get("number", ""))
	number_label.position = Vector2(0, 5)
	number_label.size = Vector2(76, 46)
	number_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	number_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	number_label.add_theme_font_override("font", font)
	number_label.add_theme_font_size_override("font_size", 24)
	number_label.add_theme_color_override("font_color", Color("fff7d2") if available else Color("d8ddd4"))
	number_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(number_label)
	caption = Label.new()
	caption.text = str(data.get("label", data.id))
	caption.position = Vector2(-65, 77)
	caption.size = Vector2(206, 32)
	caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	caption.add_theme_font_override("font", font)
	caption.add_theme_font_size_override("font_size", 15)
	caption.add_theme_color_override("font_color", Color("fff4d8"))
	caption.add_theme_color_override("font_shadow_color", Color("123e39"))
	caption.add_theme_constant_override("shadow_offset_y", 2)
	caption.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(caption)
	focus_entered.connect(queue_redraw)
	focus_exited.connect(queue_redraw)
	queue_redraw()

func _draw() -> void:
	draw_set_transform(Vector2(38, 39), 0.0, Vector2(1, 0.7))
	draw_circle(Vector2(0, 12), 37, Color(0.02, 0.1, 0.09, 0.25))
	draw_circle(Vector2(0, 7), 34, Color("38563a") if available else Color("3b575a"))
	var colors := {"plant": Color("4c8766"), "gift": Color("b18443"), "upgrade": Color("497e99"), "portal": Color("79639a")}
	draw_circle(Vector2.ZERO, 34, Color("d8c271") if available else Color("a7b8a7"))
	draw_circle(Vector2.ZERO, 28, Color("78a82e") if available else colors.get(kind, Color("5f7779")))
	if selected or has_focus():
		draw_arc(Vector2.ZERO, 39, 0, TAU, 60, Color("ffec9a"), 3, true)
	draw_set_transform(Vector2.ZERO)
	if not available:
		draw_style_box(_lock_box(), Rect2(48, 48, 18, 16))
		draw_arc(Vector2(57, 48), 6, PI, TAU, 12, Color("f0e4bd"), 3, true)
	elif completed:
		draw_circle(Vector2(60, 56), 11, Color("f3d776"))
		draw_polyline(PackedVector2Array([Vector2(54, 56), Vector2(58, 60), Vector2(66, 51)]), Color("33572a"), 3, true)

func _lock_box() -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = Color("e7d8a5")
	box.set_corner_radius_all(3)
	return box
