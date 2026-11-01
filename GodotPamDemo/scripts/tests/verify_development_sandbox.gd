extends SceneTree

var sandbox: DevelopmentSandbox

func _initialize() -> void:
	_run.call_deferred()

func _require(condition: bool, message: String) -> void:
	if not condition:
		printerr("SANDBOX_FAILED: ", message)
		quit(1)
		assert(condition, message)

func _run() -> void:
	sandbox = load("res://scenes/development_sandbox.tscn").instantiate()
	root.add_child(sandbox)
	current_scene = sandbox
	await process_frame
	sandbox.set_physics_process(false)
	_require(sandbox.phase == LevelSession.Phase.PLAYING and sandbox.plants.is_empty() and sandbox.zombies.is_empty(), "Empty live session")
	sandbox.advance_seconds(2.0)
	_require(sandbox.phase == LevelSession.Phase.PLAYING, "Empty sandbox stays active")
	_require(sandbox.plant_picker.item_count == sandbox.plant_data.size(), "All catalog plants are selectable")
	sandbox.select_plant("peashooter")
	var before := sandbox.sun
	_require(sandbox.try_plant(Vector2i(2, 2)), "Real planting")
	_require(sandbox.sun == before - int(sandbox.plant_data.peashooter.cost), "Real cost")
	_require(not sandbox.try_plant(Vector2i(3, 2)), "Real cooldown")
	sandbox.no_cooldown = true
	sandbox.unlimited_sun = true
	_require(sandbox.try_plant(Vector2i(3, 2)), "Development planting options")
	_require(not sandbox.try_plant(Vector2i(3, 2)), "Occupied cells still enforced")
	_require(sandbox.spawn_test_zombie("snowpea_test", 2), "Spawn real zombie")
	_require(not sandbox.spawn_test_zombie("missing", 2) and not sandbox.spawn_test_zombie("snowpea_test", 99), "Invalid spawn rejected")
	sandbox.advance_seconds(5.0)
	_require(sandbox.shots_fired > 0, "Real animation events and combat")
	sandbox.toggle_pause()
	var elapsed := sandbox.elapsed
	sandbox.advance_seconds(1.0)
	_require(sandbox.elapsed == elapsed and not sandbox.spawn_test_zombie("snowpea_test", 2), "Pause")
	sandbox.reset_level()
	await process_frame
	_require(sandbox.plants.is_empty() and sandbox.zombies.is_empty() and sandbox.projectiles.is_empty(), "Clear and restart")
	_require(sandbox.phase == LevelSession.Phase.PLAYING, "Restart stays playable")
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		var output := ProjectSettings.globalize_path("res://../Artifacts/development-sandbox")
		DirAccess.make_dir_recursive_absolute(output)
		root.get_texture().get_image().save_png(output.path_join("sandbox.png"))
	sandbox.queue_free()
	await process_frame
	print("DEVELOPMENT_SANDBOX_OK")
	quit(0)
