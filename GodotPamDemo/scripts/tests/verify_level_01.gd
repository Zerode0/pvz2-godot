extends SceneTree

var level: FrontyardLevel
var output: String
var results: Dictionary = {}

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> bool:
	if not condition:
		printerr("LEVEL_01_FAILED: ", message)
		quit(1)
	return condition

func capture(filename: String) -> void:
	level.hud.refresh(level)
	await process_frame
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png(output.path_join(filename + ".png"))

func simulate(seconds: int) -> void:
	for index in seconds:
		level.advance_seconds(1.0)
		await process_frame
		if level.phase in [level.Phase.VICTORY, level.Phase.DEFEAT]:
			break

func _run() -> void:
	seed(41)
	AdventureProgress.active_profile_path = "user://verify_level_01_progress.cfg"
	output = ProjectSettings.globalize_path("res://../Artifacts/level-01")
	DirAccess.make_dir_recursive_absolute(output)
	level = load("res://scenes/level_01.tscn").instantiate()
	root.add_child(level)
	current_scene = level
	await process_frame
	level.set_physics_process(false)
	if not check(level.hud.cards.sunflower.get_child(0).size.is_equal_approx(Vector2(80, 76)), "Seed icons must fit their cards"):
		return
	await capture("ready")
	if "--ready-only" in OS.get_cmdline_user_args():
		print("LEVEL_01_READY")
		quit()
		return
	if "--capture-playing" in OS.get_cmdline_user_args():
		level.start_level()
		await simulate(19)
		await capture("playing")
		print("LEVEL_01_CAPTURED")
		quit()
		return
	if not check(level.plants.size() == 9 and level.mowers.size() == 5, "Initial formation"):
		return
	var a: LawnPlant = level.plants[Vector2i(0, 0)]
	var b: LawnPlant = level.plants[Vector2i(0, 2)]
	if not check(a.animation.animation_asset == b.animation.animation_asset, "PAM resources must be shared"):
		return
	level.start_level()
	var before := level.sun
	if not check(not level.try_plant(Vector2i(-1, 0)) and not level.try_plant(Vector2i(0, 0)) and level.sun == before, "Invalid/occupied tiles"):
		return
	level.select_plant("sunflower")
	if not check(level.try_plant(Vector2i(1, 0)) and level.sun == before - 50, "Planting and cost"):
		return
	if not check(not level.try_plant(Vector2i(1, 1)), "Cooldown"):
		return
	level._add_sun(Vector2(400, 400), 400)
	if not check(level.collect_sun_at(Vector2(400, 400)) and level.sun == before - 25, "Sun pickup"):
		return
	level.toggle_pause()
	var paused_frame := a.animation.current_frame
	level.advance_seconds(2.0)
	if not check(level.elapsed == 0.0 and a.animation.current_frame == paused_frame, "Pause must freeze gameplay and animation"):
		return
	level.toggle_pause()
	level.shovel = true
	if not check(level.try_plant(Vector2i(1, 0)) and not level.plants.has(Vector2i(1, 0)), "Shovel"):
		return
	results.controls = "planting, bounds, occupancy, cooldown, sun pickup, shovel, pause"
	level.reset_level()
	await process_frame
	level.start_level()
	await simulate(19)
	await capture("playing")
	if not check(level.shots_fired > 0 and level.sunflower_events > 0 and level.zombies.size() > 0, "PAM-driven shooting/sun and spawned zombies"):
		return
	await simulate(160)
	if not check(level.phase == level.Phase.VICTORY and level.defeated == 18, "Full three-wave victory"):
		return
	results.victory_seconds = level.elapsed
	results.shots_from_pam_events = level.shots_fired
	results.sun_from_pam_events = level.sunflower_events
	await capture("victory")
	level.reset_level()
	await process_frame
	level.start_level()
	var nut: LawnPlant = level.plants[Vector2i(5, 2)]
	level._spawn_zombie(2, "snowpea_test")
	level.zombies[0].position.x = nut.position.x + 20
	level.advance_seconds(2.0)
	if not check(nut.health < nut.max_health, "Zombie bite"):
		return
	results.biting = true
	level.reset_level()
	await process_frame
	for cell: Vector2i in level.plants.keys():
		level.remove_plant(cell)
	level.start_level()
	await simulate(180)
	if not check(level.phase == level.Phase.DEFEAT, "Undefended lawn must lose after mower consumption"):
		return
	results.defeat_seconds = level.elapsed
	results.mowers_triggered = level.mowers.filter(func(mower): return mower.active).size()
	await capture("defeat")
	level.reset_level()
	await process_frame
	if not check(level.phase == level.Phase.READY and level.plants.size() == 9 and level.zombies.is_empty(), "Restart must clear previous entities"):
		return
	results.shared_animation_resources = true
	results.restart = true
	# A render delta smaller than a simulation tick must survive until the next call.
	level.start_level()
	level.advance_seconds(level.STEP * 0.5)
	if not check(level.elapsed == 0.0, "Fractional frame must wait for a full simulation tick"):
		return
	level.advance_seconds(level.STEP * 0.5)
	if not check(is_equal_approx(level.elapsed, level.STEP), "Fractional frame time must accumulate"):
		return
	results.fixed_step_accumulation = true
	level.reset_level()
	var file := FileAccess.open(output.path_join("verification.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(results, "\t"))
	file.close()
	print("LEVEL_01_VERIFIED ", JSON.stringify(results))
	quit()
