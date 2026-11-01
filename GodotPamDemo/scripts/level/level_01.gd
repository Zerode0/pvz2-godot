class_name FrontyardLevel
extends LevelSession
## Existing frontyard presentation and player input for a reusable level run.

@export_file("*.tscn") var map_scene_path := "res://scenes/frontyard_map.tscn"
@export var map_level_id := ""
@export var map_progress_path := ""
@onready var hud: LevelHUD = $HUD/LevelHUD
@onready var scene_transition: Node = get_node("/root/SceneTransition")
var _hover_picture: Sprite2D
var _map_return_pending := false
var _paused_before_return := false

func _ready() -> void:
	var request: LevelLaunchRequest = scene_transition.take_level_request(scene_file_path)
	var deck_override: Array[String] = []
	if request != null:
		deck_override.assign(request.deck)
		level_path = request.level_path
		map_scene_path = request.return_scene_path
		map_progress_path = request.profile_path
		if not request.profile_path.is_empty():
			AdventureProgress.active_profile_path = request.profile_path
	if initialize_run(deck_override) != OK:
		set_physics_process(false)
		set_process_unhandled_input(false)
		return
	if request != null or map_level_id.is_empty():
		map_level_id = str(level_data.id)
	hud.build(plant_data, str(level_data.title), deck)
	hud.plant_selected.connect(select_plant)
	hud.shovel_selected.connect(func(): set_shovel(not shovel))
	hud.start_requested.connect(start_level)
	hud.pause_requested.connect(toggle_pause)
	hud.speed_requested.connect(func(): set_speed(2 if speed == 1 else 1))
	hud.restart_requested.connect(reset_level)
	hud.map_requested.connect(return_to_map)
	scene_transition.transition_failed.connect(_on_map_return_failed)
	phase_changed.connect(_on_map_level_phase_changed)
	_hover_picture = Sprite2D.new()
	_hover_picture.modulate = Color(1, 1, 1, 0.48)
	_hover_picture.z_index = 1000
	add_child(_hover_picture)
	hud.refresh(self)

func _physics_process(delta: float) -> void:
	if _map_return_pending:
		return
	if phase == Phase.READY:
		advance_ready_visuals(delta)
	else:
		advance_seconds(delta * speed)
	hud.refresh(self)
	_update_hover()

func _update_hover() -> void:
	var cell := grid.cell_at(get_global_mouse_position())
	var show := grid.contains(cell) and phase == Phase.PLAYING and not paused
	grid.hover = cell if show else Vector2i(-1, -1)
	grid.hover_valid = check_placement(selected, cell).ok
	if shovel:
		grid.hover_valid = plants.has(cell)
	grid.queue_redraw()
	_hover_picture.visible = show and not shovel
	if _hover_picture.visible:
		_hover_picture.texture = load(str(plant_data[selected].icon))
		_hover_picture.position = grid.foot(cell) - Vector2(0, 44)
		_hover_picture.scale = Vector2(78, 82) / _hover_picture.texture.get_size()
		_hover_picture.modulate = Color(1, 1, 1, 0.48) if grid.hover_valid else Color(1, 0.4, 0.3, 0.48)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_RIGHT:
			set_shovel(false)
		elif event.button_index == MOUSE_BUTTON_LEFT:
			var at := get_global_mouse_position()
			if not collect_sun_at(at):
				try_plant(grid.cell_at(at))
	elif event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1: select_slot(0)
			KEY_2: select_slot(1)
			KEY_3: select_slot(2)
			KEY_S: set_shovel(not shovel)
			KEY_SPACE:
				if phase == Phase.READY: start_level()
				else: toggle_pause()
			KEY_ESCAPE: toggle_pause()

func select_slot(index: int) -> void:
	if index >= 0 and index < deck.size():
		select_plant(deck[index])

func return_to_map() -> void:
	if scene_transition.busy:
		return
	_paused_before_return = paused
	paused = true
	_map_return_pending = true
	scene_transition.change_scene(map_scene_path)

func _on_map_return_failed(path: String, _error: int) -> void:
	if not _map_return_pending or path != map_scene_path:
		return
	_map_return_pending = false
	paused = _paused_before_return
	notify("暂时无法返回地图，请重试。")

func _on_map_level_phase_changed(value: Phase) -> void:
	if value == Phase.VICTORY:
		var map_progress := AdventureProgress.new()
		map_progress.load_progress(map_progress_path)
		map_progress.record_completed(map_level_id)
