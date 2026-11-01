extends SceneTree
## Exercises public interfaces through a real transition and the actual battle scene.

const PROFILE := "user://verify_runtime_interfaces.cfg"
var completions: Array[Dictionary] = []

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> bool:
	if not condition:
		printerr("RUNTIME_INTERFACES_FAILED: ", message)
		quit(1)
	return condition

func _run() -> void:
	var watchdog := create_timer(30.0)
	watchdog.timeout.connect(func(): printerr("RUNTIME_INTERFACES_FAILED: timeout"); quit(1))
	var transition := root.get_node("SceneTransition")
	change_scene_to_file("res://scenes/login.tscn")
	await scene_changed
	var previous_scene := current_scene
	var request := LevelLaunchRequest.new()
	request.level_path = "res://data/levels/development_sandbox.json"
	request.profile_path = PROFILE
	request.deck.assign(["wallnut", "sunflower"])
	request.scene_path = "res://scenes/missing-level.tscn"
	if not check(transition.launch_level(request) == ERR_INVALID_DATA and current_scene == previous_scene and not transition.busy, "Invalid request preserves the current scene"):
		return
	request.scene_path = "res://scenes/level_01.tscn"
	if not check(transition.launch_level(request) == OK and transition.launch_level(request) == ERR_BUSY, "Accept request and reject overlapping launches"):
		return
	request.deck.clear()
	request.profile_path = "user://unused_runtime_interfaces.cfg"
	await transition.transition_finished
	var level := current_scene as FrontyardLevel
	if not check(level != null and level.phase == LevelSession.Phase.READY and level.plants.is_empty(), "Shared scene receives the requested level before initialization"):
		return
	level.set_physics_process(false)
	if not check(level.deck == ["wallnut", "sunflower"] and level.map_progress_path == PROFILE and level.map_level_id == level.level_data.id and AdventureProgress.active_profile_path == PROFILE, "Copied request retains deck, profile and content identity"):
		return
	level.level_finished.connect(func(result): completions.append(result))
	level.start_level()
	var before := level.sun
	if not check(level.check_placement("peashooter", Vector2i(1, 1)).reason == "unavailable_plant" and level.check_placement("wallnut", Vector2i(-1, 1)).reason == "out_of_bounds" and level.sun == before, "Placement queries reject invalid input without changing economy"):
		return
	level.select_plant("sunflower")
	level.set_shovel(true)
	if not check(level.plant("wallnut", Vector2i(1, 1)).ok and level.selected == "sunflower" and level.shovel and level.sun == before - 50, "Explicit planting uses requested kind independently of selected tool"):
		return
	if not check(level.check_placement("wallnut", Vector2i(1, 1)).reason == "occupied" and level.plant("wallnut", Vector2i(2, 1)).reason == "cooldown", "Preview and execution share occupancy and cooldown rules"):
		return
	var state := level.get_run_state()
	state.deck.clear()
	state.cards.wallnut.cooldown = 0.0
	if not check(level.deck.size() == 2 and float(level.cooldowns.wallnut) > 0.0, "State snapshots do not expose mutable session collections"):
		return
	level.set_speed(2)
	level.set_paused(true)
	var elapsed := level.elapsed
	level.advance_seconds(1.0)
	if not check(level.speed == 2 and level.elapsed == elapsed and not level.plant("sunflower", Vector2i(2, 1)).ok and level.spawn_zombie("snowpea_test", 1) == null, "Public operations obey pause"):
		return
	level.set_paused(false)
	if not check(level.spawn_zombie("missing", 1) == null and level.spawn_zombie("snowpea_test", -1) == null, "Invalid manual spawns are rejected"):
		return
	var zombie := level.spawn_zombie("snowpea_test", 1)
	if not check(zombie != null and zombie.row == 1 and level.zombies.has(zombie), "Public spawn returns the actual combat entity"):
		return
	level.hud.refresh(level)
	if not check(level.hud.sun_value.text == str(level.sun), "Actual HUD consumes the state snapshot"):
		return
	level.set_phase(LevelSession.Phase.VICTORY)
	level.set_phase(LevelSession.Phase.VICTORY)
	if not check(completions.size() == 1 and completions[0].level_id == level.level_data.id and completions[0].phase == LevelSession.Phase.VICTORY, "One completion payload per run"):
		return
	var progress := AdventureProgress.new()
	progress.load_progress(PROFILE)
	if not check(str(level.level_data.id) in progress.completed_levels, "Completion is saved to the requested profile under the content ID"):
		return
	level.reset_level()
	level.start_level()
	level.set_phase(LevelSession.Phase.DEFEAT)
	if not check(completions.size() == 2 and completions[1].phase == LevelSession.Phase.DEFEAT and level.deck.size() == 2 and level.zombies.is_empty(), "Reset preserves the requested deck and starts a fresh completion lifecycle"):
		return
	DirAccess.remove_absolute(PROFILE)
	print("RUNTIME_INTERFACES_OK")
	quit()
