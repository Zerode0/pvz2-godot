@tool
class_name WorldMapScreen
extends Control
## World carousel, converted map layouts and local level navigation.

enum View { WORLDS, LEVELS }
const WORLD_SPACING := 420.0
const CARD_CENTER := 512.0

@export_group("Navigation")
@export var initial_view: View = View.WORLDS
@export_file("*.tscn") var home_scene_path := "res://scenes/login.tscn"
@export_file("*.json") var catalog_path := "res://data/adventure/worlds.json"
@export var progress_path := ""

@onready var reference_canvas: Control = $ReferenceCanvas
@onready var worlds_view: Control = %WorldsView
@onready var levels_view: Control = %LevelsView
@onready var page_title: Label = %PageTitle
@onready var breadcrumb: Label = %Breadcrumb
@onready var back_button: Button = %BackButton
@onready var enter_button: Button = %EnterWorldButton
@onready var start_button: Button = %StartLevelButton
@onready var status_label: Label = %StatusLabel
@onready var carousel: MapPanView = %WorldCarousel
@onready var map_view: MapPanView = %MapViewport
@onready var world_title: Label = %WorldTitle
@onready var world_description: Label = %WorldDescription
@onready var world_count: Label = %WorldCount
@onready var level_title: Label = %LevelTitle
@onready var level_description: Label = %LevelDescription
@onready var level_number: Label = %LevelNumber
@onready var preview: TextureRect = %Preview
@onready var map_slider: HSlider = %MapSlider
@onready var locate_button: Button = %LocateButton
var catalog := AdventureCatalog.new()
var progress := AdventureProgress.new()
var view: View = View.WORLDS
var current_world_index := 0
var map_canvas: WorldMapCanvas
var world_cards: Array[Button] = []
var world_button: Button
var level_button: Button
var _built_world := ""
var _view_tween: Tween
var _slider_sync := false
var _font: Font
var plant_preview: PlantPreviewScreen
var _preview_return_focus: Control

func open_plant_preview(plant_id: String = "") -> PlantPreviewScreen:
	if is_instance_valid(plant_preview):
		return plant_preview
	var page := preload("res://scenes/plant_preview.tscn").instantiate() as PlantPreviewScreen
	page.navigate_on_back = false
	if not plant_id.is_empty():
		page.initial_plant_id = plant_id
	_preview_return_focus = get_viewport().gui_get_focus_owner()
	page.back_requested.connect(_close_plant_preview)
	plant_preview = page
	reference_canvas.hide()
	set_process_input(false)
	add_child(page)
	return page

func _close_plant_preview() -> void:
	if not is_instance_valid(plant_preview):
		return
	plant_preview.hide()
	plant_preview.queue_free()
	plant_preview = null
	reference_canvas.show()
	set_process_input(true)
	if is_instance_valid(_preview_return_focus):
		_preview_return_focus.grab_focus()

func _ready() -> void:
	_fit_reference_canvas()
	_font = get_theme_font("font")
	if catalog.load_catalog(catalog_path) != OK:
		status_label.text = catalog.error_message
		status_label.show()
		enter_button.disabled = true
		start_button.disabled = true
		return
	if not Engine.is_editor_hint():
		progress.load_progress(progress_path)
		SceneTransition.transition_failed.connect(_on_transition_failed)
	current_world_index = catalog.world_index(progress.current_world)
	_build_carousel()
	carousel.position_changed.connect(_on_carousel_scrolled)
	carousel.gesture_finished.connect(_on_carousel_settled)
	carousel.tapped.connect(_on_world_tapped)
	map_view.tapped.connect(_on_map_tapped)
	map_view.position_changed.connect(_on_map_scrolled)
	map_view.gesture_finished.connect(_save_map_position)
	map_slider.value_changed.connect(_on_slider_changed)
	map_slider.drag_ended.connect(func(_changed): _save_map_position())
	_show_view(initial_view, false)

func _fit_reference_canvas() -> void:
	if not is_node_ready():
		return
	var fit := minf(size.x / 1024.0, size.y / 640.0)
	reference_canvas.scale = Vector2.ONE * fit
	reference_canvas.position = (size - Vector2(1024, 640) * fit) / 2.0

func _build_carousel() -> void:
	carousel.set_extent(1024 + (catalog.worlds.size() - 1) * WORLD_SPACING)
	for index in catalog.worlds.size():
		var world: Dictionary = catalog.worlds[index]
		var card := Button.new()
		card.name = "World_" + str(world.id).validate_node_name()
		card.position = Vector2(CARD_CENTER + index * WORLD_SPACING - 170, 0)
		card.size = Vector2(340, 325)
		card.pivot_offset = Vector2(170, 165)
		card.mouse_filter = Control.MOUSE_FILTER_IGNORE
		for state in ["normal", "hover", "pressed", "focus"]:
			card.add_theme_stylebox_override(state, StyleBoxEmpty.new())
		if world.has("preview_scene"):
			var visual: Node2D = (load(str(world.preview_scene)) as PackedScene).instantiate()
			var b: Array = world.preview_bounds
			var bounds := Rect2(b[0], b[1], b[2], b[3])
			var fit := minf(340.0 / bounds.size.x, 280.0 / bounds.size.y)
			visual.scale = Vector2.ONE * fit
			visual.position = Vector2(170, 140) - bounds.get_center() * fit
			card.add_child(visual)
		else:
			var image := TextureRect.new()
			image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			image.texture = load(str(world.preview))
			image.size = Vector2(340, 280)
			image.mouse_filter = Control.MOUSE_FILTER_IGNORE
			card.add_child(image)
		var caption := Label.new()
		caption.text = str(world.title)
		caption.position = Vector2(-50, 285)
		caption.size = Vector2(440, 35)
		caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		caption.add_theme_font_override("font", _font)
		caption.add_theme_font_size_override("font_size", 22)
		caption.add_theme_color_override("font_color", Color("fff2ce"))
		caption.add_theme_color_override("font_shadow_color", Color("1b4945"))
		caption.add_theme_constant_override("shadow_offset_y", 2)
		caption.mouse_filter = Control.MOUSE_FILTER_IGNORE
		card.add_child(caption)
		card.pressed.connect(func():
			if current_world_index == index: _on_enter_world()
			else: _select_world(index))
		card.focus_entered.connect(func(): _select_world(index))
		carousel.content.add_child(card)
		world_cards.append(card)
		carousel.snap_points.append(index * WORLD_SPACING)
	carousel.pan_to(current_world_index * WORLD_SPACING, false)
	world_button = world_cards[current_world_index]
	_on_carousel_scrolled(carousel.scroll_x)

func _select_world(index: int, animate: bool = true) -> void:
	current_world_index = clampi(index, 0, catalog.worlds.size() - 1)
	world_button = world_cards[current_world_index]
	carousel.pan_to(current_world_index * WORLD_SPACING, animate and not Engine.is_editor_hint())
	_refresh_world_details()

func _on_carousel_scrolled(offset: float) -> void:
	var center := offset + CARD_CENTER
	for card in world_cards:
		var distance := absf(card.position.x + 170.0 - center)
		var emphasis := clampf(1.0 - distance / 650.0, 0.0, 1.0)
		card.scale = Vector2.ONE * lerpf(0.62, 1.0, emphasis)
		card.modulate = Color(1, 1, 1, lerpf(0.35, 1.0, emphasis))
		card.visible = distance < 1000.0
		card.process_mode = Node.PROCESS_MODE_INHERIT if card.visible else Node.PROCESS_MODE_DISABLED

func _on_carousel_settled() -> void:
	current_world_index = clampi(roundi(carousel.scroll_x / WORLD_SPACING), 0, catalog.worlds.size() - 1)
	world_button = world_cards[current_world_index]
	_refresh_world_details()

func _refresh_world_details() -> void:
	var world: Dictionary = catalog.worlds[current_world_index]
	world_title.text = str(world.title)
	world_description.text = str(world.get("description", ""))
	world_count.text = "%02d / %02d" % [current_world_index + 1, catalog.worlds.size()]
	enter_button.disabled = not catalog.maps.has(world.id)
	enter_button.text = "进入世界  ›" if not enter_button.disabled else "地图尚未接入"
	progress.current_world = str(world.id)
	if not Engine.is_editor_hint():
		progress.save()

func _on_world_tapped(at: Vector2) -> void:
	var index := clampi(roundi((at.x - CARD_CENTER) / WORLD_SPACING), 0, world_cards.size() - 1)
	if index != current_world_index or absf(carousel.scroll_x - index * WORLD_SPACING) > 2:
		_select_world(index)
	else:
		_on_enter_world()

func _show_view(value: View, animate: bool = true) -> void:
	view = value
	carousel.cancel_motion()
	map_view.cancel_motion()
	worlds_view.visible = view == View.WORLDS
	levels_view.visible = view == View.LEVELS
	page_title.text = "选择世界" if view == View.WORLDS else str(catalog.worlds[current_world_index].title)
	breadcrumb.text = "冒险之旅  /  世界" if view == View.WORLDS else "冒险之旅  /  选择关卡"
	back_button.text = "‹  主菜单" if view == View.WORLDS else "‹  世界"
	status_label.hide()
	if view == View.LEVELS:
		_build_map()
	else:
		_select_world(current_world_index, false)
	if Engine.is_editor_hint():
		return
	if _view_tween:
		_view_tween.kill()
		_view_tween = null
	worlds_view.modulate = Color.WHITE
	levels_view.modulate = Color.WHITE
	if animate:
		var panel := worlds_view if view == View.WORLDS else levels_view
		panel.modulate.a = 0.0
		_view_tween = create_tween()
		_view_tween.tween_property(panel, "modulate:a", 1.0, 0.25)
		_view_tween.finished.connect(func(): _view_tween = null)
	if view == View.WORLDS:
		enter_button.grab_focus()
	elif not start_button.disabled:
		start_button.grab_focus()
	else:
		locate_button.grab_focus()

func _build_map() -> void:
	var world: Dictionary = catalog.worlds[current_world_index]
	if not catalog.maps.has(world.id) or _built_world == str(world.id):
		return
	if is_instance_valid(map_canvas):
		map_canvas.free()
	for child in map_view.far_content.get_children():
		child.free()
	var data: Dictionary = catalog.maps[world.id]
	map_view.set_extent(float(data.width))
	map_canvas = WorldMapCanvas.new()
	map_view.content.add_child(map_canvas)
	map_canvas.build(data, progress, _font, map_view.far_content)
	map_canvas.node_selected.connect(_on_node_selected)
	map_canvas.node_focused.connect(_on_node_focused)
	_built_world = str(world.id)
	var id := str(progress.selected_nodes.get(world.id, str(data.nodes[0].id)))
	if not map_canvas.definitions.has(id):
		id = str(data.nodes[0].id)
	_on_node_selected(id, false)
	var node: Dictionary = map_canvas.definitions[id]
	map_view.pan_to(float(progress.map_offsets.get(world.id, float(node.position[0]) - map_view.size.x / 2.0)), false)
	map_slider.max_value = map_view.max_scroll()
	_on_map_scrolled(map_view.scroll_x)

func _on_map_tapped(at: Vector2) -> void:
	var id := map_canvas.hit_node(at)
	if not id.is_empty():
		_on_node_selected(id)

func _on_node_selected(id: String, focus_launch: bool = true) -> void:
	map_canvas.select(id)
	var data: Dictionary = map_canvas.definitions[id]
	level_button = map_canvas.markers[id]
	level_title.text = str(data.get("title", data.get("label", "关卡")))
	level_number.text = str(catalog.worlds[current_world_index].title) + "  /  " + ("已通关" if level_button.completed else "可挑战" if progress.can_play(data) else "尚未开放")
	start_button.disabled = not progress.can_play(data)
	start_button.text = "再次挑战  ›" if level_button.completed else "开始关卡  ›" if not start_button.disabled else "尚未开放"
	level_description.text = str(data.get("description", "该关卡内容尚未接入。"))
	preview.texture = load(str(data.get("preview", catalog.worlds[current_world_index].preview)))
	var world_id := str(catalog.worlds[current_world_index].id)
	progress.selected_nodes[world_id] = id
	if not Engine.is_editor_hint():
		progress.save()
		if focus_launch and not start_button.disabled:
			start_button.grab_focus()

func _on_node_focused(id: String) -> void:
	_on_node_selected(id, false)
	var data: Dictionary = map_canvas.definitions[id]
	map_view.pan_to(float(data.position[0]) - map_view.size.x / 2.0)

func _on_map_scrolled(offset: float) -> void:
	if not is_instance_valid(map_canvas):
		return
	map_canvas.cull(offset, map_view.size.x)
	for sprite in map_view.far_content.get_children():
		sprite.position.x = float(sprite.get_meta("origin_x", sprite.position.x)) - offset * float(sprite.get_meta("parallax", 0.25))
		if sprite.has_meta("map_bounds"):
			var bounds: Rect2 = sprite.get_meta("map_bounds")
			bounds.position.x -= offset * float(sprite.get_meta("parallax"))
			sprite.visible = bounds.intersects(Rect2(-250, -1000, map_view.size.x + 500, 3000))
			sprite.process_mode = Node.PROCESS_MODE_INHERIT if sprite.visible else Node.PROCESS_MODE_DISABLED
	_slider_sync = true
	map_slider.value = offset
	_slider_sync = false

func _on_slider_changed(value: float) -> void:
	if _slider_sync:
		return
	map_view.cancel_motion()
	map_view.scroll_x = value

func _save_map_position() -> void:
	if not is_instance_valid(map_canvas) or _built_world.is_empty() or Engine.is_editor_hint():
		return
	progress.map_offsets[_built_world] = map_view.scroll_x
	progress.save()

func _on_locate() -> void:
	if not is_instance_valid(map_canvas):
		return
	var data: Dictionary = map_canvas.definitions[map_canvas.selected_id]
	map_view.pan_to(float(data.position[0]) - map_view.size.x / 2.0)

func _on_enter_world() -> void:
	if not Engine.is_editor_hint() and not SceneTransition.busy and not enter_button.disabled:
		_save_map_position()
		_show_view(View.LEVELS)

func _on_start_level() -> void:
	if start_button.disabled or not is_instance_valid(map_canvas):
		return
	var data: Dictionary = map_canvas.definitions[map_canvas.selected_id]
	if progress.can_play(data):
		_save_map_position()
		map_view.cancel_motion()
		if str(data.get("level_path", "")).is_empty():
			SceneTransition.change_scene(str(data.scene))
		else:
			var request := LevelLaunchRequest.new()
			request.level_path = str(data.level_path)
			request.scene_path = str(data.scene)
			request.profile_path = progress.save_path
			if SceneTransition.launch_level(request) != OK:
				status_label.text = "关卡配置无法打开：" + "；".join(request.errors)
				status_label.show()

func _on_back() -> void:
	if SceneTransition.busy:
		return
	_save_map_position()
	if view == View.LEVELS:
		_show_view(View.WORLDS)
	else:
		SceneTransition.change_scene(home_scene_path)

func _on_previous_world() -> void:
	_select_world(current_world_index - 1)

func _on_next_world() -> void:
	_select_world(current_world_index + 1)

func _input(event: InputEvent) -> void:
	if Engine.is_editor_hint() or not event.is_pressed() or event.is_echo():
		return
	if SceneTransition.busy:
		return
	if event.is_action_pressed("ui_cancel"):
		_on_back()
		get_viewport().set_input_as_handled()
	elif event is InputEventKey and event.keycode in [KEY_LEFT, KEY_RIGHT, KEY_HOME, KEY_END]:
		if view == View.WORLDS:
			var index := current_world_index + (-1 if event.keycode == KEY_LEFT else 1)
			if event.keycode == KEY_HOME: index = 0
			elif event.keycode == KEY_END: index = catalog.worlds.size() - 1
			_select_world(index)
		else:
			var ids: Array = map_canvas.markers.keys()
			var index := ids.find(map_canvas.selected_id) + (-1 if event.keycode == KEY_LEFT else 1)
			if event.keycode == KEY_HOME: index = 0
			elif event.keycode == KEY_END: index = ids.size() - 1
			var id := str(ids[clampi(index, 0, ids.size() - 1)])
			_on_node_focused(id)
		get_viewport().set_input_as_handled()

func _on_transition_failed(_path: String, _error: int) -> void:
	status_label.text = "暂时无法打开场景，请重试。"
	status_label.show()

func _exit_tree() -> void:
	_save_map_position()
