class_name LevelHUD
extends Control

signal plant_selected(kind: String)
signal shovel_selected
signal start_requested
signal pause_requested
signal speed_requested
signal restart_requested
signal map_requested

var order: Array[String] = []
const INK := Color("f1f3dc")
const MUTED := Color("b8c6a3")
var font: SystemFont
var cards: Dictionary = {}
var covers: Dictionary = {}
var sun_value: Label
var wave_text: Label
var kills_text: Label
var progress: ProgressBar
var pause_button: Button
var speed_button: Button
var shovel_button: Button
var ready_panel: Panel
var notice_text: Label
var modal: Control
var modal_title: Label
var modal_subtitle: Label
var modal_action: Button
var map_button: Button
var modal_map_button: Button
var clock_text: Label

func build(definitions: Dictionary, title: String, deck: Array[String]) -> void:
	order.assign(deck)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	font = SystemFont.new()
	font.font_names = PackedStringArray(["Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI"])
	_panel(Rect2(0, 0, 1440, 58), Color("142b1e"))
	_text(title, Rect2(28, 9, 480, 39), 25)
	_text("DAY 01  /  测试敌人：雪豌豆僵尸", Rect2(600, 17, 460, 28), 14, MUTED)
	speed_button = _button("1×", Rect2(1170, 11, 90, 35), func(): speed_requested.emit())
	pause_button = _button("暂停", Rect2(1274, 11, 138, 35), func(): pause_requested.emit())
	_panel(Rect2(24, 77, 112, 126), Color("243b22"))
	_image("res://assets/Sun.png", Rect2(57, 83, 48, 48))
	sun_value = _text("250", Rect2(26, 130, 108, 42), 32, Color("ffe883"))
	sun_value.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_text("阳光", Rect2(62, 174, 70, 23), 14, MUTED)
	for index in order.size():
		var kind: String = order[index]
		var data: Dictionary = definitions[kind]
		var rect := Rect2(151 + index * 130, 77, 117, 126)
		var card := _button("", rect, func(): plant_selected.emit(kind))
		_image(str(data.icon), Rect2(19, 3, 80, 76), card)
		var name_label := _text(str(data.title), Rect2(0, 77, 117, 24), 14, INK, card)
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		_text(str(index + 1), Rect2(10, 101, 24, 22), 12, MUTED, card)
		_text(str(int(data.cost)), Rect2(50, 100, 62, 24), 17, INK, card)
		var cover := ColorRect.new()
		cover.color = Color(0.02, 0.06, 0.02, 0.66)
		cover.mouse_filter = Control.MOUSE_FILTER_IGNORE
		card.add_child(cover)
		cards[kind] = card
		covers[kind] = cover
	shovel_button = _button("", Rect2(555, 77, 110, 126), func(): shovel_selected.emit())
	_image("res://assets/level/Shovel.png", Rect2(10, 23, 90, 56), shovel_button)
	_text("[S] 铲除", Rect2(20, 94, 90, 28), 14, INK, shovel_button)
	_panel(Rect2(1080, 77, 334, 126), Color("1b3423"))
	wave_text = _text("第 1 / 3 波", Rect2(1100, 90, 300, 31), 20)
	kills_text = _text("击退 00 / 18", Rect2(1100, 127, 290, 27), 15, MUTED)
	progress = ProgressBar.new()
	progress.position = Vector2(1100, 168)
	progress.size = Vector2(292, 11)
	progress.show_percentage = false
	progress.max_value = 18
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color("badc59")
	progress.add_theme_stylebox_override("fill", fill)
	add_child(progress)
	ready_panel = _panel(Rect2(690, 77, 366, 126), Color("233e26"))
	_text("测试布阵已就位", Rect2(18, 7, 330, 31), 20, INK, ready_panel)
	_text("预置植物 · 拾取阳光继续种植", Rect2(18, 40, 340, 23), 13, MUTED, ready_panel)
	_button("开始防守  [SPACE]", Rect2(18, 77, 330, 36), func(): start_requested.emit(), ready_panel)
	notice_text = _text("", Rect2(690, 94, 360, 90), 18, Color("eff5b6"))
	notice_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_panel(Rect2(0, 850, 1440, 50), Color("142b1e"))
	_text("1 / 2 / 3 选植物    左键种植 / 拾取阳光    S 铲子    右键取消    空格暂停", Rect2(28, 861, 990, 27), 13, MUTED)
	map_button = _button("返回地图", Rect2(1040, 859, 130, 33), func(): map_requested.emit())
	clock_text = _text("准备就绪", Rect2(1195, 861, 220, 27), 14, MUTED)
	_build_modal()

func refresh(world: Node) -> void:
	sun_value.text = str(world.sun)
	pause_button.text = "继续" if world.paused else "暂停"
	speed_button.text = "%d×" % world.speed
	ready_panel.visible = world.phase == world.Phase.READY
	notice_text.visible = not ready_panel.visible
	notice_text.text = world.notice if world.notice_time > 0.0 else ""
	wave_text.text = "第 %d / %d 波" % [maxi(1, world.director.current_wave), world.level_data.waves.size()]
	kills_text.text = "击退 %02d / %02d" % [world.defeated, world.director.schedule.size()]
	progress.max_value = world.director.schedule.size()
	progress.value = world.defeated
	clock_text.text = "%02d:%02d" % [int(world.elapsed) / 60, int(world.elapsed) % 60]
	for kind: String in cards:
		var selected: bool = world.selected == kind and not world.shovel
		cards[kind].modulate = Color("d7f79f") if selected else Color.WHITE
		if world.sun < int(world.plant_data[kind].cost):
			cards[kind].modulate *= Color(0.64, 0.64, 0.64)
		covers[kind].size = Vector2(117, 126 * float(world.cooldowns[kind]) / float(world.plant_data[kind].recharge))
	shovel_button.modulate = Color("d7f79f") if world.shovel else Color.WHITE
	var ended: bool = world.phase in [world.Phase.VICTORY, world.Phase.DEFEAT]
	modal.visible = ended or world.paused
	if modal.visible:
		modal_title.text = "草坪守住了！" if world.phase == world.Phase.VICTORY else "僵尸进屋了" if world.phase == world.Phase.DEFEAT else "休息一下"
		modal_subtitle.text = "测试关卡完成，所有僵尸已击退。" if world.phase == world.Phase.VICTORY else "试试增加射手，用坚果挡住来敌。" if world.phase == world.Phase.DEFEAT else "草坪与动画已暂停。"
		modal_action.text = "重新开始" if ended else "继续防守"

func _build_modal() -> void:
	modal = Control.new()
	modal.size = Vector2(1440, 900)
	modal.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(modal)
	var shade := ColorRect.new()
	shade.color = Color(0.02, 0.06, 0.03, 0.68)
	shade.size = modal.size
	modal.add_child(shade)
	var box := _panel(Rect2(440, 295, 560, 310), Color("1d3927"), modal)
	modal_title = _text("", Rect2(30, 25, 500, 55), 31, INK, box)
	modal_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	modal_subtitle = _text("", Rect2(30, 90, 500, 36), 16, MUTED, box)
	modal_subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	modal_action = _button("", Rect2(130, 165, 300, 54), _activate_modal, box)
	modal_map_button = _button("返回地图", Rect2(130, 230, 300, 48), func(): map_requested.emit(), box)
	modal.visible = false

func _activate_modal() -> void:
	if modal_action.text == "重新开始":
		restart_requested.emit()
	else:
		pause_requested.emit()

func _panel(rect: Rect2, color: Color, parent: Node = self) -> Panel:
	var item := Panel.new()
	item.position = rect.position
	item.size = rect.size
	item.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = Color("6c8850")
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	item.add_theme_stylebox_override("panel", style)
	parent.add_child(item)
	return item

func _text(value: String, rect: Rect2, size: int, color: Color = INK, parent: Node = self) -> Label:
	var item := Label.new()
	item.text = value
	item.position = rect.position
	item.size = rect.size
	item.mouse_filter = Control.MOUSE_FILTER_IGNORE
	item.add_theme_font_override("font", font)
	item.add_theme_font_size_override("font_size", size)
	item.add_theme_color_override("font_color", color)
	parent.add_child(item)
	return item

func _image(path: String, rect: Rect2, parent: Node = self) -> void:
	var item := TextureRect.new()
	item.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	item.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	item.mouse_filter = Control.MOUSE_FILTER_IGNORE
	item.texture = load(path)
	parent.add_child(item)
	item.position = rect.position
	item.size = rect.size

func _button(value: String, rect: Rect2, action: Callable, parent: Node = self) -> Button:
	var item := Button.new()
	item.text = value
	item.position = rect.position
	item.size = rect.size
	item.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	item.focus_mode = Control.FOCUS_NONE
	item.add_theme_font_override("font", font)
	item.add_theme_font_size_override("font_size", 16)
	item.add_theme_color_override("font_color", INK)
	for state in ["normal", "hover", "pressed", "focus"]:
		var style := StyleBoxFlat.new()
		style.bg_color = Color("34552b") if state != "normal" else Color("284126")
		style.border_color = Color("d5eb8c") if state != "normal" else Color("6c8850")
		style.set_border_width_all(1)
		style.set_corner_radius_all(6)
		item.add_theme_stylebox_override(state, style)
	item.pressed.connect(action)
	parent.add_child(item)
	return item
