extends SceneTree
## Exercises the real map entry, controls, shared data and player lifetime.

var output: String
var page
var results: Dictionary = {}

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> bool:
	if not condition:
		printerr("PLANT_PREVIEW_FAILED: ", message)
		quit(1)
	return condition

func click_control(control: Control) -> void:
	var at := control.get_global_transform_with_canvas() * (control.size * 0.5)
	var motion := InputEventMouseMotion.new()
	motion.position = at
	motion.global_position = at
	root.push_input(motion, true)
	for pressed in [true, false]:
		var event := InputEventMouseButton.new()
		event.position = at
		event.global_position = at
		event.button_index = MOUSE_BUTTON_LEFT
		event.pressed = pressed
		root.push_input(event, true)
	await process_frame
	await process_frame

func press_key(code: Key) -> void:
	var event := InputEventKey.new()
	event.keycode = code
	event.pressed = true
	root.push_input(event, true)
	await process_frame

func capture(name: String) -> void:
	await process_frame
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png(output.path_join(name + ".png"))

func _run() -> void:
	Engine.max_fps = 60
	AdventureProgress.active_profile_path = "user://verify_plant_preview.cfg"
	output = ProjectSettings.globalize_path("res://../Artifacts/plant-preview")
	DirAccess.make_dir_recursive_absolute(output)
	var watchdog := Timer.new()
	watchdog.wait_time = 45
	watchdog.one_shot = true
	root.add_child(watchdog)
	watchdog.timeout.connect(func(): printerr("PLANT_PREVIEW_FAILED: timeout"); quit(1))
	watchdog.start()
	change_scene_to_file("res://scenes/world_map.tscn")
	await scene_changed
	await process_frame
	await process_frame
	var map = current_scene
	var world_before: int = map.current_world_index
	await click_control(map.get_node("ReferenceCanvas/PlantPreviewButton"))
	await capture("map-entry")
	page = map.plant_preview
	if not check(is_instance_valid(page) and page.selected_id == "sunflower", "Map button opens a populated preview"):
		return
	if not check(page.cards.size() == 3 and page.preview.player.visible_parts > 0, "All integrated cards and actual PAM parts are visible"):
		return
	await capture("sunflower")
	var source := ContentCatalog.new()
	if not check(source.load_content("res://data/levels/level_01.json") == OK and source.plants == page.catalog.content.plants,
			"Combat and preview consume identical actor definitions"):
		return
	var old_player = page.preview.player
	var resource = old_player.animation_asset
	await click_control(page.cards.peashooter)
	if not check(page.selected_id == "peashooter" and not is_instance_valid(old_player) and page.preview.player.visible_parts > 0,
			"Real card click changes the plant and releases the old player"):
		return
	await capture("peashooter")
	await click_control(page.pause_button)
	var frame: int = page.preview.player.current_frame
	await create_timer(0.15).timeout
	if not check(page.preview.paused and page.preview.player.current_frame == frame, "Pause button freezes preview frames"):
		return
	await click_control(page.pause_button)
	await create_timer(0.15).timeout
	if not check(page.preview.player.current_frame != frame, "Resume advances the real animation"):
		return
	page.preview.play_clip("attack")
	page.preview.player.set_process(false)
	page.preview.player.advance_seconds(3.0)
	if not check(page.preview.player.current_clip == "idle" and page.preview.player.playing, "Action returns to idle without creating combat entities"):
		return
	page.preview.player.set_process(true)
	page.select_plant("wallnut")
	page.preview.play_clip("damage3")
	if not check(page.clip_select.item_count == 3 and page.preview.player.current_clip == "damage3", "Wallnut exposes real damage clips"):
		return
	await capture("wallnut")
	page.search.text = "pea"
	page.search.text_changed.emit("pea")
	if not check(page.visible_ids == ["peashooter"] and page.selected_id == "peashooter", "Search signal filters by English ID and updates selection"):
		return
	page.set_filter("", "sun")
	if not check(page.visible_ids == ["sunflower"] and page.preview.player.animation_asset == resource, "Role filter reuses the shared animation Resource"):
		return
	page.set_filter("无此植物")
	if not check(page.visible_ids.is_empty() and page.empty_label.visible and not page.details.visible and page.preview.player == null,
			"Empty results release the preview and show the empty state"):
		return
	await capture("empty")
	page.set_filter("")
	page.get_node("ReferenceCanvas/BackButton").grab_focus()
	await press_key(KEY_RIGHT)
	if not check(page.selected_id == "peashooter" and map.current_world_index == world_before, "Keyboard navigation belongs to the preview while it is open"):
		return
	for index in 9:
		page.select_plant(page.catalog.order[index % 3])
	if not check(page.preview.get_child_count() == 1, "Repeated switching retains only one player"):
		return
	var size_before := root.size
	root.size = Vector2i(960, 600)
	await process_frame
	await capture("compact")
	if not check(page.reference_canvas.get_global_rect().size.x <= root.get_visible_rect().size.x + 1, "Reference layout fits the smaller viewport"):
		return
	root.size = size_before
	page.catalog_path = "user://missing_plant_preview.json"
	if not check(page.reload_catalog() != OK and page.cards.is_empty() and page.preview.player == null and page.status.visible,
			"Catalog failure removes stale presentation and remains recoverable"):
		return
	page.catalog_path = "res://data/ui/plant_preview.json"
	if not check(page.reload_catalog() == OK and page.selected_id == "sunflower", "Catalog reload recovers"):
		return
	await press_key(KEY_ESCAPE)
	if not check(map.plant_preview == null and map.reference_canvas.visible and map.current_world_index == world_before,
			"Esc returns to the same live map and preserves its selection"):
		return
	map._show_view(map.View.LEVELS, false)
	map.map_view.pan_to(300, false)
	var offset: float = map.map_view.scroll_x
	map.open_plant_preview("wallnut")
	await process_frame
	page = map.plant_preview
	await click_control(page.get_node("ReferenceCanvas/BackButton"))
	if not check(map.plant_preview == null and map.view == map.View.LEVELS and is_equal_approx(map.map_view.scroll_x, offset),
			"Return button preserves the live level map and scroll offset"):
		return
	results = {"cards": 3, "shared_combat_catalog": true, "mouse_keyboard": true, "search_role_empty": true,
		"pause_action_damage_clips": true, "single_player_lifetime": true, "map_state_return": true,
		"catalog_reload": true, "compact_layout": true}
	var file := FileAccess.open(output.path_join("results.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(results, "\t"))
	print("PLANT_PREVIEW_OK ", JSON.stringify(results))
	quit()
