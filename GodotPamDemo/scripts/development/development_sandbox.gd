class_name DevelopmentSandbox
extends FrontyardLevel
## Development controls use the same session, actors and combat as actual levels.

var unlimited_sun := false
var no_cooldown := false
var plant_picker: OptionButton
var zombie_picker: OptionButton
var row_picker: OptionButton
var sun_input: SpinBox
var status: Label

func _ready() -> void:
	super._ready()
	if planting == null:
		return
	deck.assign(plant_data.keys())
	for kind in deck:
		cooldowns[kind] = 0.0
	_build_controls()
	start_level()

func _build_controls() -> void:
	var panel := PanelContainer.new()
	panel.position = Vector2(24, 216)
	panel.size = Vector2(274, 610)
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	var style := StyleBoxFlat.new()
	style.bg_color = Color("1b2c22")
	style.border_color = Color("6c8850")
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	panel.add_theme_stylebox_override("panel", style)
	hud.add_child(panel)
	var margin := MarginContainer.new()
	for side in ["left", "top", "right", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 12)
	panel.add_child(margin)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 9)
	margin.add_child(column)
	_label(column, "开发测试关卡", 22)
	_label(column, "使用正式战斗系统 · 不记录通关", 14)
	_label(column, "植物：选择后在草坪点击种植")
	plant_picker = OptionButton.new()
	for kind in plant_data:
		plant_picker.add_item(str(plant_data[kind].title) + " / " + kind)
		plant_picker.set_item_metadata(plant_picker.item_count - 1, kind)
	column.add_child(plant_picker)
	plant_picker.item_selected.connect(func(index): select_plant(str(plant_picker.get_item_metadata(index))))
	for index in plant_picker.item_count:
		if str(plant_picker.get_item_metadata(index)) == selected:
			plant_picker.select(index)
	_label(column, "僵尸")
	zombie_picker = OptionButton.new()
	for kind in zombie_data:
		zombie_picker.add_item(str(zombie_data[kind].get("title", kind)))
		zombie_picker.set_item_metadata(zombie_picker.item_count - 1, kind)
	column.add_child(zombie_picker)
	row_picker = OptionButton.new()
	for row in grid.rows:
		row_picker.add_item("第 %d 行" % (row + 1))
	column.add_child(row_picker)
	_button(column, "生成僵尸", func(): spawn_test_zombie(str(zombie_picker.get_item_metadata(zombie_picker.selected)), row_picker.selected))
	var row := HBoxContainer.new()
	column.add_child(row)
	sun_input = SpinBox.new()
	sun_input.max_value = 999999
	sun_input.step = 25
	sun_input.value = sun
	sun_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(sun_input)
	_button(row, "设置阳光", func(): sun = int(sun_input.value))
	_toggle(column, "无限阳光", func(value): unlimited_sun = value)
	_toggle(column, "取消种植冷却", func(value): no_cooldown = value)
	_button(column, "清空草坪 / 重新开始", reset_level)
	_button(column, "返回世界地图", return_to_map)
	status = _label(column, "", 14)
	_label(column, "暂停、倍率与铲子使用原关卡按钮。", 13)
	_label(column, "未开启辅助选项时保留真实费用与冷却。", 13)

func _physics_process(delta: float) -> void:
	if unlimited_sun:
		sun = 999999
	if no_cooldown:
		for kind in cooldowns:
			cooldowns[kind] = 0.0
	super._physics_process(delta)
	if is_instance_valid(status):
		status.text = "植物 %d / 僵尸 %d / 弹体 %d" % [plants.size(), zombies.size(), projectiles.size()]
		hud.wave_text.text = "手动生成敌人"
		hud.kills_text.text = "已击退 %d" % defeated
		hud.progress.hide()

func try_plant(cell: Vector2i) -> bool:
	if unlimited_sun:
		sun = 999999
	if no_cooldown:
		cooldowns[selected] = 0.0
	var planted := super.try_plant(cell)
	if no_cooldown:
		cooldowns[selected] = 0.0
	return planted

func spawn_test_zombie(kind: String, row: int) -> bool:
	return spawn_zombie(kind, row) != null

func reset_level() -> void:
	super.reset_level()
	start_level()

func _on_map_level_phase_changed(_value: Phase) -> void:
	pass

func _label(parent: Node, value: String, font_size := 16) -> Label:
	var label := Label.new()
	label.text = value
	label.add_theme_font_override("font", hud.font)
	label.add_theme_font_size_override("font_size", font_size)
	parent.add_child(label)
	return label

func _button(parent: Node, value: String, action: Callable) -> Button:
	var button := Button.new()
	button.text = value
	button.custom_minimum_size.y = 30
	button.add_theme_font_override("font", hud.font)
	button.pressed.connect(action)
	parent.add_child(button)
	return button

func _toggle(parent: Node, value: String, action: Callable) -> void:
	var toggle := CheckBox.new()
	toggle.text = value
	toggle.add_theme_font_override("font", hud.font)
	toggle.toggled.connect(action)
	parent.add_child(toggle)
