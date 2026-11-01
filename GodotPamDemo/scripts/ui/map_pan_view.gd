@tool
class_name MapPanView
extends Control
## Shared clipped horizontal surface for the world carousel and world map.

signal tapped(content_position: Vector2)
signal position_changed(offset: float)
signal gesture_finished

@export var wheel_step := 150.0
@export var drag_threshold := 10.0
@export var friction := 3.0

var content_width := 1024.0
var snap_points := PackedFloat32Array()
var scroll_x := 0.0:
	set(value):
		var bounded := clampf(value, 0.0, max_scroll())
		if is_equal_approx(scroll_x, bounded):
			return
		scroll_x = bounded
		if is_instance_valid(content):
			content.position.x = -scroll_x
		position_changed.emit(scroll_x)
var velocity := 0.0
var dragging := false
var content: Control
var far_content: Node2D
var _pointer_active := false
var _touch_index := -1
var _press_position := Vector2.ZERO
var _press_scroll := 0.0
var _last_motion_time := 0
var _coasting := false
var _scroll_tween: Tween

func _ready() -> void:
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_DRAG
	far_content = Node2D.new()
	far_content.name = "FarIslands"
	add_child(far_content)
	content = Control.new()
	content.name = "MapContent"
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(content)
	resized.connect(_on_resized)
	get_window().focus_exited.connect(cancel_motion)
	visibility_changed.connect(_on_visibility_changed)

func max_scroll() -> float:
	return maxf(0.0, content_width - size.x)

func set_extent(width: float) -> void:
	content_width = maxf(width, size.x)
	content.size = Vector2(content_width, size.y)
	scroll_x = scroll_x

func cancel_motion() -> void:
	if _scroll_tween:
		_scroll_tween.kill()
		_scroll_tween = null
	velocity = 0.0
	_pointer_active = false
	_touch_index = -1
	dragging = false
	_coasting = false

func pan_to(target: float, animate: bool = true) -> void:
	cancel_motion()
	target = clampf(target, 0.0, max_scroll())
	if not animate or absf(target - scroll_x) < 0.5:
		scroll_x = target
		gesture_finished.emit()
		return
	_scroll_tween = create_tween().set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	_scroll_tween.tween_property(self, "scroll_x", target, 0.24)
	_scroll_tween.finished.connect(func():
		_scroll_tween = null
		gesture_finished.emit())

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN, MOUSE_BUTTON_WHEEL_LEFT, MOUSE_BUTTON_WHEEL_RIGHT] and event.pressed:
			var direction := -1.0 if event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_LEFT] else 1.0
			if snap_points.is_empty():
				pan_to(scroll_x + direction * wheel_step)
			else:
				var next := clampi(_nearest_snap() + int(direction), 0, snap_points.size() - 1)
				pan_to(snap_points[next])
			accept_event()
		elif event.button_index == MOUSE_BUTTON_LEFT and event.pressed and _touch_index < 0:
			_begin_pointer(event.position, -1)
			accept_event()
	elif event is InputEventScreenTouch and event.pressed and not _pointer_active:
		_begin_pointer(event.position, event.index)
		accept_event()

func _input(event: InputEvent) -> void:
	if not _pointer_active:
		return
	var inverse := get_global_transform_with_canvas().affine_inverse()
	if _touch_index < 0:
		if event is InputEventMouseMotion:
			_move_pointer(inverse * event.position)
			get_viewport().set_input_as_handled()
		elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
			_end_pointer(inverse * event.position)
			get_viewport().set_input_as_handled()
	else:
		if event is InputEventScreenDrag and event.index == _touch_index:
			_move_pointer(inverse * event.position)
			get_viewport().set_input_as_handled()
		elif event is InputEventScreenTouch and event.index == _touch_index and not event.pressed:
			_end_pointer(inverse * event.position, event.canceled)
			get_viewport().set_input_as_handled()

func _begin_pointer(at: Vector2, touch_index: int) -> void:
	cancel_motion()
	_pointer_active = true
	_touch_index = touch_index
	_press_position = at
	_press_scroll = scroll_x
	_last_motion_time = Time.get_ticks_usec()

func _move_pointer(at: Vector2) -> void:
	var now := Time.get_ticks_usec()
	var dt := clampf(float(now - _last_motion_time) / 1000000.0, 1.0 / 240.0, 0.1)
	if not dragging and at.distance_to(_press_position) >= drag_threshold:
		dragging = true
	if dragging:
		var before := scroll_x
		scroll_x = _press_scroll - (at.x - _press_position.x)
		velocity = lerpf(velocity, (scroll_x - before) / dt, 0.6)
	_last_motion_time = now

func _end_pointer(at: Vector2, canceled: bool = false) -> void:
	var was_dragging := dragging
	_pointer_active = false
	_touch_index = -1
	dragging = false
	if canceled:
		velocity = 0.0
		_settle()
	elif not was_dragging:
		velocity = 0.0
		if Rect2(Vector2.ZERO, size).has_point(at):
			tapped.emit(at + Vector2(scroll_x, 0))
	elif Time.get_ticks_usec() - _last_motion_time > 100000:
		velocity = 0.0
		_settle()
	else:
		_coasting = true

func _process(delta: float) -> void:
	if _pointer_active or not _coasting:
		return
	var before := scroll_x
	scroll_x += velocity * delta
	velocity *= exp(-friction * delta)
	if absf(velocity) < 8.0 or is_equal_approx(before, scroll_x):
		velocity = 0.0
		_coasting = false
		_settle()

func _nearest_snap() -> int:
	var nearest := 0
	for index in snap_points.size():
		if absf(snap_points[index] - scroll_x) < absf(snap_points[nearest] - scroll_x):
			nearest = index
	return nearest

func _settle() -> void:
	if not snap_points.is_empty() and absf(snap_points[_nearest_snap()] - scroll_x) > 0.5:
		pan_to(snap_points[_nearest_snap()])
	else:
		gesture_finished.emit()

func _on_resized() -> void:
	if is_instance_valid(content):
		set_extent(content_width)

func _on_visibility_changed() -> void:
	if not is_visible_in_tree():
		cancel_motion()
