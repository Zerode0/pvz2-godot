extends SceneTree
## Exercises the real autoload and login -> map navigation without exporting a build.

var transition
var failures: Array = []
var played: Array[StringName] = []
var finished_count := 0
var output: String
var watchdog: SceneTreeTimer
var duplicate_requests := 0

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> bool:
	if not condition:
		printerr("TRANSITION_FAILED: ", message)
		quit(1)
	return condition

func capture(filename: String) -> void:
	if DisplayServer.get_name() == "headless":
		return
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(output.path_join(filename + ".png"))

func _on_failure(path: String, error: int) -> void:
	failures.append([path, error])

func _on_finished() -> void:
	finished_count += 1

func _on_animation_started(clip: StringName) -> void:
	played.append(clip)
	if transition.busy:
		duplicate_requests += 1
		transition.change_scene("res://scenes/login.tscn")

func _on_cover_started(_clip: StringName) -> void:
	if transition.busy:
		duplicate_requests += 1
		transition.change_scene("res://scenes/login.tscn")

func overlay_is_clear() -> bool:
	return not transition.busy and not transition.flower.visible \
		and not transition.petal_animation.is_playing() \
		and is_zero_approx(transition.overlay.color.a) \
		and transition.overlay.mouse_filter == Control.MOUSE_FILTER_IGNORE

func _on_timeout() -> void:
	printerr("TRANSITION_FAILED: Timeout")
	quit(1)

func _run() -> void:
	Engine.max_fps = 60
	output = ProjectSettings.globalize_path("res://../Artifacts/scene-transition")
	DirAccess.make_dir_recursive_absolute(output)
	watchdog = create_timer(40.0)
	watchdog.timeout.connect(_on_timeout)
	transition = root.get_node("SceneTransition")
	transition.transition_failed.connect(_on_failure)
	transition.transition_finished.connect(_on_finished)
	transition.flower_animation.animation_started.connect(_on_animation_started)
	transition.animation_player.animation_started.connect(_on_cover_started)
	change_scene_to_file("res://scenes/login.tscn")
	await scene_changed
	# Inspect the actual native component at a full flower pose.
	transition.overlay.color.a = 1.0
	transition.flower.show()
	transition.flower_animation.play(&"Idle")
	transition.flower_animation.seek(1.8, true)
	transition.petal_animation.play(&"idle")
	transition.petal_animation.seek(1.8, true)
	await capture("flower-idle")
	transition.flower_animation.stop()
	transition.petal_animation.stop()
	transition.flower.hide()
	transition.overlay.color.a = 0.0
	played.clear()
	current_scene._on_start_pressed()
	transition.change_scene("res://scenes/login.tscn")
	if not check(transition.busy and transition.overlay.mouse_filter == Control.MOUSE_FILTER_STOP,
			"Navigation must block repeated requests and UI input"):
		return
	await create_timer(0.35).timeout
	await capture("flower-spawn")
	await transition.transition_finished
	if not check(current_scene.scene_file_path == "res://scenes/world_map.tscn" and current_scene.is_node_ready(),
			"The real Play button must enter the world map"):
		return
	if not check(played.has(&"Spawn") and played.has(&"Idle") and played.has(&"Leave"),
			"Spawn, Idle and Leave must all play during navigation"):
		return
	if not check(overlay_is_clear(),
			"Successful navigation must clear the overlay and restore input"):
		return
	await capture("world-map")
	var previous := current_scene
	await transition.change_scene("res://scenes/missing-transition-target.tscn")
	if not check(current_scene == previous and failures.size() == 1
			and failures[0][1] == ERR_FILE_NOT_FOUND and overlay_is_clear(),
			"Failed loading must preserve the current scene and allow another request"):
		return
	# The autoload and its animations must keep running while gameplay is paused.
	paused = true
	await transition.change_scene("res://scenes/login.tscn")
	paused = false
	if not check(current_scene.scene_file_path == "res://scenes/login.tscn"
			and finished_count == 3 and overlay_is_clear(),
			"A second navigation must work while the tree is paused"):
		return
	var autoload_id: int = transition.get_instance_id()
	# Re-request the same PackedScene after its threaded-load result has been consumed.
	for attempt in 2:
		var previous_id := current_scene.get_instance_id()
		await transition.change_scene("res://scenes/level_01.tscn")
		if not check(current_scene.scene_file_path == "res://scenes/level_01.tscn"
				and current_scene.get_instance_id() != previous_id
				and transition.get_instance_id() == autoload_id
				and finished_count == 4 + attempt and failures.size() == 1
				and overlay_is_clear(), "Repeated navigation must create a fresh scene and reset the persistent overlay"):
			return
	if not check(played.count(&"Spawn") == 5 and played.count(&"Idle") == 5
			and played.count(&"Leave") == 5 and duplicate_requests >= 20,
			"Each accepted call must play exactly once; requests during every animation stage must be ignored"):
		return
	var results := {"transitions_completed": finished_count, "failed_loads_recovered": failures.size(),
		"duplicate_requests_ignored": duplicate_requests, "same_target_reloads": 2,
		"paused_navigation": true, "overlay_reset": true, "status": "passed"}
	var result_file := FileAccess.open(output.path_join("results.json"), FileAccess.WRITE)
	result_file.store_string(JSON.stringify(results, "\t") + "\n")
	result_file.close()
	print("SCENE_TRANSITION_OK: ", JSON.stringify(results))
	watchdog.timeout.disconnect(_on_timeout)
	watchdog = null
	transition.transition_failed.disconnect(_on_failure)
	transition.transition_finished.disconnect(_on_finished)
	transition.flower_animation.animation_started.disconnect(_on_animation_started)
	transition.animation_player.animation_started.disconnect(_on_cover_started)
	# Let nested animation/signal coroutine callbacks finish before tearing down the tree.
	await process_frame
	quit()
