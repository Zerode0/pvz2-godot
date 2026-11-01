extends SceneTree
## Runs the actual login, world/map controls and level return path without exporting.

var transition
var output: String
var watchdog: Timer
const PROFILE := "user://verify_world_map_progress.cfg"

func pointer(at: Vector2, pressed: bool, button: MouseButton = MOUSE_BUTTON_LEFT) -> void:
	var event := InputEventMouseButton.new()
	event.position = current_scene.reference_canvas.get_global_transform_with_canvas() * at
	event.global_position = event.position
	event.button_index = button
	event.pressed = pressed
	root.push_input(event, true)

func click(at: Vector2) -> void:
	pointer(at, true)
	await process_frame
	pointer(at, false)
	await process_frame

func move(at: Vector2) -> void:
	var event := InputEventMouseMotion.new()
	event.position = current_scene.reference_canvas.get_global_transform_with_canvas() * at
	event.global_position = event.position
	event.button_mask = MOUSE_BUTTON_MASK_LEFT
	root.push_input(event, true)

func key(code: Key) -> void:
	var event := InputEventKey.new()
	event.keycode = code
	event.pressed = true
	root.push_input(event, true)

func touch(at: Vector2, pressed: bool) -> void:
	var event := InputEventScreenTouch.new()
	event.position = current_scene.reference_canvas.get_global_transform_with_canvas() * at
	event.index = 0
	event.pressed = pressed
	root.push_input(event, true)

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> bool:
	if not condition:
		printerr("WORLD_MAP_FAILED: ", message)
		quit(1)
	return condition

func capture(filename: String) -> void:
	await process_frame
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png(output.path_join(filename + ".png"))

func _timeout() -> void:
	printerr("WORLD_MAP_FAILED: Navigation timeout")
	quit(1)

func _run() -> void:
	Engine.max_fps = 60
	AdventureProgress.active_profile_path = PROFILE
	if FileAccess.file_exists(PROFILE):
		DirAccess.remove_absolute(PROFILE)
	output = ProjectSettings.globalize_path("res://../Artifacts/world-map")
	DirAccess.make_dir_recursive_absolute(output)
	watchdog = Timer.new()
	watchdog.one_shot = true
	watchdog.wait_time = 90.0
	root.add_child(watchdog)
	watchdog.timeout.connect(_timeout)
	watchdog.start()
	transition = root.get_node("SceneTransition")
	change_scene_to_file("res://scenes/login.tscn")
	await scene_changed
	current_scene.start_button.pressed.emit()
	await transition.transition_finished
	if not check(current_scene.scene_file_path == "res://scenes/world_map.tscn" and current_scene.view == current_scene.View.WORLDS,
			"Play must enter the world entrance"):
		return
	await capture("worlds")
	var map = current_scene
	if not check(map.catalog.worlds.size() == 13, "All 13 normal reference worlds must be available"):
		return
	key(KEY_HOME)
	await create_timer(0.3).timeout
	pointer(Vector2(510, 300), true, MOUSE_BUTTON_WHEEL_DOWN)
	await create_timer(0.3).timeout
	if not check(map.current_world_index == 1 and is_equal_approx(map.carousel.scroll_x, 420.0), "Wheel must snap the world carousel"):
		return
	key(KEY_END)
	await create_timer(0.3).timeout
	await click(Vector2(512, 300))
	await create_timer(0.35).timeout
	if not check(map.view == map.View.LEVELS and map.levels_view.visible and not map.worlds_view.visible,
			"The world island must open level selection"):
		return
	if not check(map.map_canvas.markers.size() == 66 and map.map_canvas._paths.size() == 65 and map.map_view.max_scroll() > 8000,
			"Frontyard must retain the original full graph and long scrollable extent"):
		return
	var first: Dictionary = map.map_canvas.definitions.modern1
	var first_at := Vector2(first.position[0], first.position[1] + 108)
	await click(first_at)
	if not check(current_scene == map and map.start_button.has_focus() and not transition.busy,
			"Selecting the first level must focus its launch button without navigating"):
		return
	await capture("levels")
	var idle: AnimationPlayer
	for entry in map.map_canvas._cull_items:
		if entry.item.visible:
			idle = entry.item.get_node_or_null("AnimationPlayer")
			if idle != null:
				break
	if not check(idle != null and idle.is_playing(), "Visible islands must play their converted original idle animation"):
		return
	var animation := idle.get_animation("idle")
	var path := animation.track_get_path(0)
	var part: Node = idle.get_parent().get_node(NodePath(path.get_concatenated_names()))
	var property := path.get_subname(0)
	idle.seek(animation.track_get_key_time(0, 0), true)
	var before_pose: Variant = part.get(property)
	idle.seek(animation.track_get_key_time(0, 1), true)
	if not check(part.get(property) != before_pose, "Native tracks must actually update the island sprite"):
		return
	# A gesture beginning on an actual level marker must not activate it.
	pointer(first_at, true)
	await create_timer(0.03).timeout
	move(first_at - Vector2(130, 0))
	await create_timer(0.03).timeout
	move(first_at - Vector2(260, 0))
	pointer(Vector2(first_at.x - 260, 550), false)
	var released: float = map.map_view.scroll_x
	await create_timer(0.12).timeout
	if not check(map.map_view.scroll_x > released and not map.map_view.dragging and map.map_canvas.selected_id == "modern1" and not transition.busy,
			"Drag from a marker must coast and terminate on release outside the map without clicking"):
		return
	map.map_view.pan_to(-1000, false)
	if not check(map.map_view.scroll_x == 0, "Left boundary"):
		return
	map.map_view.pan_to(map.map_view.max_scroll() + 1000, false)
	if not check(is_equal_approx(map.map_view.scroll_x, map.map_view.max_scroll()), "Right boundary"):
		return
	map.map_view.pan_to(1000, false)
	touch(Vector2(760, 260), true)
	await process_frame
	var drag := InputEventScreenDrag.new()
	drag.index = 0
	drag.position = map.reference_canvas.get_global_transform_with_canvas() * Vector2(550, 260)
	root.push_input(drag, true)
	touch(Vector2(550, 260), false)
	if not check(map.map_view.scroll_x > 1100 and not map.map_view.dragging, "Touch drag must use the same map surface"):
		return
	map.map_view.cancel_motion()
	key(KEY_END)
	await create_timer(0.3).timeout
	if not check(map.start_button.disabled, "Unimplemented nodes must never launch a level"):
		return
	map._on_start_level()
	if not check(not transition.busy, "Locked node launch guard"):
		return
	await capture("route-end")
	# Visit each real map to verify textures, marker data and independent positions.
	for index in map.catalog.worlds.size():
		map._show_view(map.View.WORLDS, false)
		map._select_world(index, false)
		map._on_enter_world()
		await process_frame
		var data: Dictionary = map.catalog.maps[map.catalog.worlds[index].id]
		if not check(map.map_canvas.markers.size() == data.nodes.size() and map.map_canvas.get_child_count() > data.nodes.size(), "Each world must render its own full map"):
			return
		if index == 0:
			await capture("egypt")
	map._on_node_selected("modern1")
	map.map_view.pan_to(720, false)
	await capture("route-scrolled")
	if "--maps-only" in OS.get_cmdline_user_args():
		watchdog.timeout.disconnect(_timeout)
		watchdog.queue_free()
		watchdog = null
		print("WORLD_MAP_CAPTURED")
		await process_frame
		quit()
		return
	map.start_button.pressed.emit()
	await transition.transition_finished
	if not check(current_scene.scene_file_path == "res://scenes/level_01.tscn" and current_scene.phase == current_scene.Phase.READY
			and current_scene.plants.size() == 9, "The selected level must load its actual initial formation"):
		return
	var level = current_scene
	level.set_physics_process(false)
	await capture("level-ready")
	level.hud.start_requested.emit()
	level.advance_seconds(1.0)
	level.hud.pause_requested.emit()
	level.hud.refresh(level)
	if not check(level.paused and level.hud.modal.visible, "The real level pause controls must remain usable"):
		return
	await capture("level-paused")
	# A failed return must preserve the previous pause state and restore level updates.
	level.map_scene_path = "res://scenes/missing-world-map.tscn"
	level.hud.modal_map_button.pressed.emit()
	await transition.transition_finished
	if not check(current_scene == level and level.paused and not level._map_return_pending,
			"Failed map navigation must preserve the run and restore its prior pause state"):
		return
	level.map_scene_path = "res://scenes/frontyard_map.tscn"
	level.hud.modal_map_button.pressed.emit()
	await transition.transition_finished
	if not check(current_scene.scene_file_path == "res://scenes/frontyard_map.tscn" and current_scene.view == current_scene.View.LEVELS,
			"Returning from pause must reopen level selection directly"):
		return
	if not check(is_equal_approx(current_scene.map_view.scroll_x, 720.0) and current_scene.map_canvas.selected_id == "modern1",
			"Return must restore scroll position and selected level"):
		return
	current_scene.start_button.pressed.emit()
	await transition.transition_finished
	level = current_scene
	level.set_physics_process(false)
	if not check(level.phase == level.Phase.READY and not level.paused and level.plants.size() == 9
			and level.zombies.is_empty() and level.elapsed == 0.0, "Re-entering must create a fresh, unpaused run"):
		return
	for phase in [level.Phase.VICTORY, level.Phase.DEFEAT]:
		level.set_phase(phase)
		level.hud.refresh(level)
		if not check(level.hud.modal.visible and level.hud.modal_map_button.is_visible_in_tree(),
				"Victory and defeat must both expose the return-to-map control"):
			return
	level.hud.modal_map_button.pressed.emit()
	await transition.transition_finished
	if not check(current_scene.map_canvas.markers.modern1.completed and "frontyard_01" in current_scene.progress.completed_levels,
			"Victory must persist completion and expose replay"):
		return
	var cancel := InputEventKey.new()
	cancel.keycode = KEY_ESCAPE
	cancel.pressed = true
	root.push_input(cancel, true)
	if not check(current_scene.view == current_scene.View.WORLDS,
			"Escape must return from the level map to world selection"):
		return
	current_scene.back_button.pressed.emit()
	await transition.transition_finished
	if not check(current_scene.scene_file_path == "res://scenes/login.tscn" and not transition.busy,
			"The world back button must return to the existing login screen"):
		return
	watchdog.timeout.disconnect(_timeout)
	watchdog.queue_free()
	watchdog = null
	DirAccess.remove_absolute(PROFILE)
	print("WORLD_MAP_OK: 13 animated maps, native idle tracks, mouse/touch, inertia, bounds, carousel snap, locked nodes, first level, saved return, completion, replay, failure recovery")
	await process_frame
	quit()
