@tool
class_name LoginScreen
extends Control
## Editable Gardendless mainScene layout; local project navigation remains configurable.

signal start_requested
signal action_requested(action: StringName)

@export_group("Navigation")
@export_file("*.tscn") var next_scene_path: String = "res://scenes/world_map.tscn"
## Turn this off when a parent controller handles start_requested.
@export var navigate_on_start: bool = true

@onready var start_button: Button = %PlayButton
@onready var status_label: Label = %StatusLabel
@onready var reference_canvas: Control = $ReferenceCanvas

func _ready() -> void:
	_fit_reference_canvas()
	if Engine.is_editor_hint():
		return
	start_button.grab_focus()
	SceneTransition.transition_failed.connect(_on_transition_failed)

func _fit_reference_canvas() -> void:
	if not is_node_ready():
		return
	var fit := minf(size.x / 1024.0, size.y / 640.0)
	reference_canvas.scale = Vector2.ONE * fit
	reference_canvas.position = (size - Vector2(1024, 640) * fit) / 2.0

func _unhandled_key_input(event: InputEvent) -> void:
	if not Engine.is_editor_hint() and event.is_action_pressed("ui_accept"):
		_on_start_pressed()
		get_viewport().set_input_as_handled()

func _on_action_pressed(action: StringName) -> void:
	action_requested.emit(action)
	if action == &"quit":
		get_tree().quit()

func _on_start_pressed() -> void:
	start_requested.emit()
	if not navigate_on_start:
		return
	SceneTransition.change_scene(next_scene_path)

func _on_transition_failed(path: String, error: int) -> void:
	status_label.text = "场景暂时无法打开，请检查目标场景。"
	status_label.show()
	push_error("LoginScreen could not open %s (error %d)." % [path, error])
