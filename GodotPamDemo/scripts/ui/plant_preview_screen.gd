@tool
class_name PlantPreviewScreen
extends Control

signal plant_selected(id: String)
signal back_requested

@export_file("*.json") var catalog_path := "res://data/ui/plant_preview.json"
@export_file("*.tscn") var back_scene_path := "res://scenes/world_map.tscn"
@export var navigate_on_back := true
@export var initial_plant_id := "sunflower"

const CARD_SCENE := preload("res://scenes/ui/plant_card.tscn")
const FILTERS: Array[String] = ["", "sun", "shoot", "block"]
var catalog := PlantPreviewCatalog.new()
var selected_id := ""
var visible_ids: Array[String] = []
var cards: Dictionary = {}

@onready var reference_canvas: Control = $ReferenceCanvas
@onready var search: LineEdit = %Search
@onready var role_filter: OptionButton = %RoleFilter
@onready var card_grid: GridContainer = %CardGrid
@onready var count_label: Label = %CountLabel
@onready var empty_label: Label = %EmptyLabel
@onready var details: Control = %Details
@onready var status: Label = %StatusLabel
@onready var plant_title: Label = %PlantTitle
@onready var subtitle: Label = %Subtitle
@onready var role_label: Label = %RoleLabel
@onready var stats: Label = %Stats
@onready var description: Label = %Description
@onready var preview: PlantAnimationPreview = %AnimationPreview
@onready var clip_select: OptionButton = %ClipSelect
@onready var pause_button: Button = %PauseButton

func _ready() -> void:
	_fit_reference_canvas()
	if Engine.is_editor_hint():
		return
	search.text_changed.connect(func(_text): _refresh_cards())
	role_filter.item_selected.connect(func(_index): _refresh_cards())
	%BackButton.pressed.connect(_on_back)
	pause_button.pressed.connect(func(): preview.set_paused(not preview.paused))
	clip_select.item_selected.connect(func(index): preview.play_clip(str(clip_select.get_item_metadata(index))))
	preview.playback_changed.connect(_on_playback_changed)
	SceneTransition.transition_failed.connect(_on_transition_failed)
	if reload_catalog() == OK:
		search.grab_focus()

func reload_catalog() -> Error:
	for card: Node in cards.values():
		card.free()
	cards.clear()
	selected_id = ""
	preview.clear()
	var error := catalog.load_catalog(catalog_path)
	if error != OK:
		visible_ids.clear()
		details.hide()
		status.text = catalog.error_message
		status.show()
		empty_label.text = "目录暂时无法打开"
		empty_label.show()
		count_label.text = "0 株植物"
		return error
	status.hide()
	for id in catalog.order:
		var card := CARD_SCENE.instantiate() as PlantCard
		card_grid.add_child(card)
		card.bind_plant(id, catalog.entries[id].definition)
		card.plant_requested.connect(select_plant)
		cards[id] = card
	_refresh_cards(initial_plant_id)
	return OK

func select_plant(id: String) -> void:
	if not catalog.entries.has(id) or not visible_ids.has(id):
		return
	selected_id = id
	for key: String in cards:
		cards[key].set_selected(key == id)
	var entry: Dictionary = catalog.entries[id]
	var data: Dictionary = entry.definition
	plant_title.text = str(data.title)
	subtitle.text = str(entry.get("subtitle", ""))
	role_label.text = str(PlantPreviewCatalog.ROLES.get(str(data.behavior), data.behavior))
	stats.text = "阳光消耗       %d\n种植冷却       %s 秒\n生命值          %d" % [data.cost, data.recharge, data.health]
	match str(data.behavior):
		"sun": stats.text += "\n产出间隔       %s 秒" % data.interval
		"shoot": stats.text += "\n攻击间隔       %s 秒\n豌豆伤害       %d" % [data.interval, data.projectile_damage]
	description.text = str(entry.get("description", ""))
	details.show()
	status.hide()
	clip_select.clear()
	var error := preview.set_plant(data, float(entry.get("preview_scale", 1.65)))
	pause_button.disabled = error != OK
	clip_select.disabled = error != OK
	if error != OK:
		status.text = "这株植物的预览动画暂时无法打开。"
		status.show()
	else:
		for option in preview.clip_options():
			clip_select.add_item(str(option.title))
			clip_select.set_item_metadata(clip_select.item_count - 1, option.clip)
		_on_playback_changed(preview.player.current_clip, preview.paused)
	plant_selected.emit(id)

func set_filter(query: String, behavior: String = "") -> void:
	search.text = query
	role_filter.select(maxi(0, FILTERS.find(behavior)))
	_refresh_cards()

func _refresh_cards(preferred_id: String = "") -> void:
	visible_ids = catalog.matching_ids(search.text, FILTERS[role_filter.selected])
	for id: String in cards:
		cards[id].visible = visible_ids.has(id)
	count_label.text = "已显示 %d / %d 株植物" % [visible_ids.size(), catalog.order.size()]
	empty_label.text = "没有找到植物\n试试其他名称或分类。"
	empty_label.visible = visible_ids.is_empty()
	if visible_ids.is_empty():
		selected_id = ""
		preview.clear()
		details.hide()
		return
	if visible_ids.has(preferred_id):
		select_plant(preferred_id)
	elif not visible_ids.has(selected_id):
		select_plant(visible_ids[0])

func _on_playback_changed(clip: String, is_paused: bool) -> void:
	pause_button.text = "继续动画" if is_paused else "暂停动画"
	for index in clip_select.item_count:
		if str(clip_select.get_item_metadata(index)) == clip:
			clip_select.select(index)
			break

func _on_back() -> void:
	back_requested.emit()
	if navigate_on_back:
		SceneTransition.change_scene(back_scene_path)

func _on_transition_failed(_path: String, _error: int) -> void:
	status.text = "暂时无法返回，请稍后重试。"
	status.show()

func _unhandled_key_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event.is_action_pressed("ui_cancel"):
		_on_back()
		get_viewport().set_input_as_handled()
	elif not search.has_focus() and not visible_ids.is_empty() and (event.is_action_pressed("ui_left") or event.is_action_pressed("ui_right")):
		var step := -1 if event.is_action_pressed("ui_left") else 1
		select_plant(visible_ids[posmod(visible_ids.find(selected_id) + step, visible_ids.size())])
		get_viewport().set_input_as_handled()

func _fit_reference_canvas() -> void:
	if not is_node_ready():
		return
	var fit := minf(size.x / 1024.0, size.y / 640.0)
	reference_canvas.scale = Vector2.ONE * fit
	reference_canvas.position = (size - Vector2(1024, 640) * fit) * 0.5
