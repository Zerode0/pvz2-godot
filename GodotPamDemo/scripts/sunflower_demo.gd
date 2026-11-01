extends Node2D

const Player = preload("res://scripts/pam_player.gd")
const SUNFLOWER = preload("res://data/animations/sunflower.tres")
const INK := Color("e6eee3")
const MUTED := Color("a3b4a4")
const LIME := Color("c6ed86")

var actor: PamPlayer
var rig: PamPlayer
var live_stage: Control
var progress: HSlider
var frame_label: Label
var event_label: Label
var stats_label: Label
var pause_button: Button
var clip_buttons: Dictionary = {}
var sequence: Array[String] = []
var command_log: Array[String] = []
var font: SystemFont
var _verifying: bool = false

func _ready() -> void:
	font = SystemFont.new()
	font.font_names = PackedStringArray(["Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI"])
	_build()
	if "--verify" in OS.get_cmdline_user_args():
		_verify.call_deferred()

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1440, 900), Color("0e1917"))
	draw_line(Vector2(40, 133), Vector2(1400, 133), Color("304339"), 1)
	panel(Rect2(40, 700, 1360, 150), Color("17251f"))
	panel(Rect2(916, 156, 484, 524), Color("1a2925"))
	for x in range(916, 1400, 24):
		draw_line(Vector2(x, 216), Vector2(x, 636), Color(0.34, 0.46, 0.40, 0.13))
	for y in range(228, 636, 24):
		draw_line(Vector2(916, y), Vector2(1400, y), Color(0.34, 0.46, 0.40, 0.13))
	draw_circle(Vector2(1158, 568), 106, Color(0.5, 0.72, 0.40, 0.05))
	draw_arc(Vector2(1158, 568), 106, 0, TAU, 96, Color(0.5, 0.72, 0.40, 0.22), 1, true)

func panel(rect: Rect2, color: Color) -> void:
	var box := StyleBoxFlat.new()
	box.bg_color = color
	box.border_color = Color("344b3c")
	box.set_border_width_all(1)
	box.set_corner_radius_all(12)
	draw_style_box(box, rect)

func label(text: String, rect: Rect2, size: int = 16, color: Color = INK, parent: Node = self) -> Label:
	var item := Label.new()
	item.text = text
	item.position = rect.position
	item.size = rect.size
	item.add_theme_font_override("font", font)
	item.add_theme_font_size_override("font_size", size)
	item.add_theme_color_override("font_color", color)
	parent.add_child(item)
	return item

func button(text: String, rect: Rect2, callback: Callable, parent: Node = self) -> Button:
	var item := Button.new()
	item.text = text
	item.position = rect.position
	item.size = rect.size
	item.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	item.add_theme_font_override("font", font)
	item.add_theme_font_size_override("font_size", 16)
	item.add_theme_color_override("font_color", INK)
	for state: String in ["normal", "hover", "pressed", "focus"]:
		var style := StyleBoxFlat.new()
		style.bg_color = Color("344632") if state in ["hover", "pressed"] else Color("23352b")
		style.border_color = Color("8ba96b") if state != "normal" else Color("496242")
		style.set_border_width_all(1)
		style.set_corner_radius_all(7)
		item.add_theme_stylebox_override(state, style)
	item.pressed.connect(callback)
	parent.add_child(item)
	return item

func _build() -> void:
	label("PVZ2  /  ANIMATION STUDY", Rect2(44, 22, 600, 28), 14, LIME)
	label("向日葵 · 动画实验室", Rect2(40, 55, 900, 56), 34)
	label("原版拆件时间轴与真实贴图", Rect2(1000, 43, 400, 34), 17, MUTED).horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	label("PAM v6     /     30 FPS     /     GODOT 4", Rect2(950, 79, 450, 26), 14, LIME).horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	live_stage = Control.new()
	live_stage.position = Vector2(40, 156)
	live_stage.size = Vector2(850, 524)
	live_stage.clip_contents = true
	add_child(live_stage)
	var background := TextureRect.new()
	background.texture = load("res://assets/Frontyard.png")
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	background.size = live_stage.size
	background.modulate = Color(0.62, 0.72, 0.62)
	live_stage.add_child(background)
	var shade := ColorRect.new()
	shade.size = Vector2(850, 88)
	shade.color = Color(0.04, 0.1, 0.06, 0.82)
	live_stage.add_child(shade)
	label("01  /  LIVE ANIMATION", Rect2(24, 15, 400, 25), 13, LIME, live_stage)
	label("原版动画 · 部件合成", Rect2(24, 42, 600, 32), 22, INK, live_stage)
	button("切换装扮", Rect2(704, 24, 122, 40), _toggle_costume, live_stage)
	var shadow := Sprite2D.new()
	shadow.texture = load("res://assets/Shadow.png")
	shadow.position = Vector2(450, 454)
	shadow.scale = Vector2(1.4, 1.2)
	live_stage.add_child(shadow)
	actor = Player.new()
	actor.name = "Sunflower_OriginalTimeline"
	actor.position = Vector2(450, 450) - Vector2(195, 232) * 3.0
	actor.scale = Vector2.ONE * 3.0
	live_stage.add_child(actor)
	actor.load_animation(SUNFLOWER)
	var rig_stage := Control.new()
	rig_stage.position = Vector2(916, 156)
	rig_stage.size = Vector2(484, 524)
	rig_stage.clip_contents = true
	add_child(rig_stage)
	rig = Player.new()
	rig.name = "Sunflower_PivotsAndParts"
	rig.position = Vector2(242, 405) - Vector2(195, 232) * 2.5
	rig.scale = Vector2.ONE * 2.5
	rig.show_rig = true
	rig_stage.add_child(rig)
	rig.load_animation(SUNFLOWER)
	rig.playing = false
	label("02  /  LAYERS & PIVOTS", Rect2(940, 171, 340, 26), 13, LIME)
	label("拆件层级与枢轴", Rect2(940, 201, 350, 36), 23)
	label("纹理边界 / 镜像 / 透明度 / 局部矩阵", Rect2(940, 243, 430, 30), 14, MUTED)
	button("展开部件", Rect2(1260, 291, 116, 38), _toggle_exploded)
	stats_label = label("", Rect2(940, 604, 436, 48), 14, MUTED)
	label("Sunflower", Rect2(64, 623, 500, 36), 25, Color("ffffff"))
	label("31 张部件贴图  ·  30 个子动画  ·  5 个动作段", Rect2(64, 658, 800, 22), 13, Color("e3ead6"))
	clip_buttons.idle = button("待机  /  Idle", Rect2(64, 720, 182, 44), _select_clip.bind("idle"))
	clip_buttons.special = button("产阳光  /  Special", Rect2(258, 720, 210, 44), _select_clip.bind("special"))
	clip_buttons.plantfood = button("能量豆  /  Plant food", Rect2(480, 720, 230, 44), _select_clip.bind("plantfood"))
	pause_button = button("暂停", Rect2(1030, 720, 120, 44), _toggle_pause)
	button("逐帧  →", Rect2(1162, 720, 110, 44), _step)
	button("1×", Rect2(1284, 720, 92, 44), _speed)
	progress = HSlider.new()
	progress.position = Vector2(64, 789)
	progress.size = Vector2(920, 24)
	progress.min_value = 0
	progress.max_value = actor.compiled.main.size() - 1
	progress.step = 1
	progress.value_changed.connect(_scrub)
	add_child(progress)
	frame_label = label("", Rect2(1030, 778, 350, 36), 16, LIME)
	event_label = label("动画事件：等待产阳光动作", Rect2(64, 816, 1200, 25), 13, MUTED)
	label("SPACE 暂停    /    ← → 逐帧    /    拖动时间轴检查任意姿态", Rect2(44, 861, 1080, 25), 13, MUTED)
	label("PAM → JSON → Node2D", Rect2(1100, 861, 300, 25), 13, LIME).horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	actor.frame_changed.connect(_frame_changed)
	actor.animation_command.connect(_command)
	actor.clip_finished.connect(_finished)
	_frame_changed(0)

func _frame_changed(frame: int) -> void:
	rig.seek_frame(frame)
	progress.set_value_no_signal(frame)
	frame_label.text = "%03d / 164    ·    %s" % [frame, actor.current_clip]
	stats_label.text = "当前显示 %d 张部件  ·  %d 个层级枢轴\n逐帧同步 · 原始图层矩阵" % [actor.visible_parts, rig.pivots.size() - rig.visible_parts]
	for key: String in clip_buttons:
		var active := actor.current_clip == key or (key == "plantfood" and actor.current_clip.begins_with("plantfood"))
		clip_buttons[key].modulate = LIME if active else Color.WHITE

func _select_clip(clip: String) -> void:
	sequence.clear()
	if clip == "plantfood":
		sequence.assign(["plantfood", "plantfood_off", "idle"])
		actor.play_clip("plantfood_on", false)
	else:
		if clip == "special":
			sequence.append("idle")
		actor.play_clip(clip, clip == "idle")
	pause_button.text = "暂停"

func _finished(_clip: String) -> void:
	if not sequence.is_empty():
		var next: String = sequence.pop_front()
		actor.play_clip(next, next == "idle")

func _toggle_pause() -> void:
	actor.playing = not actor.playing
	pause_button.text = "暂停" if actor.playing else "播放"

func _toggle_exploded() -> void:
	rig.exploded = 0.0 if rig.exploded > 0.0 else 0.95
	_fit_rig()
	rig.refresh_pose()

func _fit_rig() -> void:
	if rig.exploded > 0.0:
		rig.scale = Vector2.ONE * 1.4
		rig.position = Vector2(242, 300) - Vector2(195, 175) * 1.4
	else:
		rig.scale = Vector2.ONE * 2.5
		rig.position = Vector2(242, 405) - Vector2(195, 232) * 2.5

func _toggle_costume() -> void:
	actor.show_costume = not actor.show_costume
	rig.show_costume = actor.show_costume
	actor.refresh_pose()

func _step() -> void:
	actor.playing = false
	actor.seek_frame(posmod(actor.current_frame + 1, actor.compiled.main.size()))
	pause_button.text = "播放"

func _scrub(value: float) -> void:
	sequence.clear()
	actor.playing = false
	actor.seek_frame(int(value))
	pause_button.text = "播放"

func _speed() -> void:
	var options := [0.25, 0.5, 1.0, 2.0]
	var index: int = options.find(actor.playback_speed)
	actor.playback_speed = float(options[posmod(index + 1, options.size())])
	for item in get_children():
		if item is Button and item.position.x == 1284:
			item.text = "%s×" % actor.playback_speed

func _command(command: String, _argument: String) -> void:
	command_log.append("%d:%s" % [actor.current_frame, command])
	event_label.text = "原版帧事件  %s  ·  frame %d" % [command, actor.current_frame]
	if command in ["use_action", "use_special"] and not _verifying:
		var sun := Sprite2D.new()
		sun.texture = load("res://assets/Sun.png")
		sun.position = Vector2(450, 275)
		sun.scale = Vector2.ONE * 0.6
		live_stage.add_child(sun)
		var tween := create_tween().set_parallel(true)
		tween.tween_property(sun, "position", Vector2(610 + randf() * 70, 390 + randf() * 50), 1.4).set_trans(Tween.TRANS_QUAD)
		tween.tween_property(sun, "modulate:a", 0.0, 0.7).set_delay(1.4)
		tween.chain().tween_callback(sun.queue_free)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_SPACE:
				_toggle_pause()
			KEY_RIGHT:
				_step()
			KEY_LEFT:
				_scrub(posmod(actor.current_frame - 1, actor.compiled.main.size()))

func _verify() -> void:
	_verifying = true
	actor.set_process(false)
	rig.set_process(false)
	var target := ProjectSettings.globalize_path("res://../Artifacts/pam-example")
	DirAccess.make_dir_recursive_absolute(target)
	assert(actor.textures.size() == 31 and actor.clips.size() == 5)
	assert(actor.compiled.main.size() == 165)
	actor.seek_frame(0)
	var start: Transform2D = actor._nodes["main/59_sprite_5"].transform
	actor.seek_frame(30)
	assert(not actor._nodes["main/59_sprite_5"].transform.is_equal_approx(start), "Petals must animate")
	_select_clip("special")
	for index in 61:
		actor.advance_seconds(1.0 / 30.0 + 0.000001)
	assert("89:use_action" in command_log, "PAM action event was lost")
	assert(actor.current_clip == "idle", "Special must return to idle")
	command_log.clear()
	_select_clip("plantfood")
	for index in 46:
		actor.advance_seconds(1.0 / 30.0 + 0.000001)
	for command: String in ["138:use_special", "142:use_special", "146:use_special"]:
		assert(command in command_log, "Missing plant food event: " + command)
	assert(actor.current_clip == "idle")
	actor.playing = false
	pause_button.text = "播放"
	for frame in [0, 89, 142]:
		actor.seek_frame(frame)
		var commands: Array = actor.pam.main_sprite.frame[frame].get("command", [])
		event_label.text = "动画事件：等待播放" if commands.is_empty() else "原版帧事件  %s  ·  frame %d" % [commands[0][0], frame]
		await get_tree().process_frame
		await RenderingServer.frame_post_draw
		var error := get_viewport().get_texture().get_image().save_png(target.path_join("frame_%03d.png" % frame))
		assert(error == OK)
	rig.exploded = 0.95
	_fit_rig()
	actor.seek_frame(0)
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(target.path_join("parts.png"))
	if "--record" in OS.get_cmdline_user_args():
		rig.exploded = 0.0
		_fit_rig()
		DirAccess.make_dir_recursive_absolute(target.path_join("motion"))
		for frame in 60:
			actor.seek_frame(frame)
			await get_tree().process_frame
			await RenderingServer.frame_post_draw
			get_viewport().get_texture().get_image().save_png(target.path_join("motion/%03d.png" % frame))
	var results := {"textures": 31, "nested_sprites": 30, "main_frames": 165,
		"clips": actor.clips, "root_events_checked": ["89:use_action", "138:use_special", "142:use_special", "146:use_special"],
		"petals_motion": true, "special_returns_to_idle": true, "plantfood_sequence": true,
		"visible_parts_at_idle": actor.visible_parts, "screenshots": ["frame_000.png", "frame_089.png", "frame_142.png", "parts.png"]}
	var stream := FileAccess.open(target.path_join("verification.json"), FileAccess.WRITE)
	stream.store_string(JSON.stringify(results, "\t"))
	print("PAM_EXAMPLE_VERIFIED ", JSON.stringify(results))
	get_tree().quit()
