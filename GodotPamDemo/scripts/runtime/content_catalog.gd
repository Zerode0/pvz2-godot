class_name ContentCatalog
extends RefCounted
## Loads project JSON with Godot's parser, then checks references before creating actors.

var level: Dictionary = {}
var plants: Dictionary = {}
var zombies: Dictionary = {}
var errors: PackedStringArray = []

func load_actor_catalog(actor_path: String) -> Error:
	errors.clear()
	_load_actors(actor_path)
	_validate_actors()
	return OK if errors.is_empty() else _report()

func _load_actors(actor_path: String) -> void:
	plants = {}
	zombies = {}
	var actors := _read_object(actor_path)
	if int(actors.get("schema_version", 0)) != 1:
		errors.append("Actor catalog must use schema_version 1")
	if not actors.get("plants") is Dictionary or not actors.get("zombies") is Dictionary:
		errors.append("Actor catalog requires plants and zombies objects")
		return
	plants = actors.plants
	zombies = actors.zombies

func load_content(level_path: String) -> Error:
	errors.clear()
	level = _read_object(level_path)
	_load_actors(str(level.get("actor_catalog", "")))
	if int(level.get("schema_version", 0)) != 1:
		errors.append("Level must use schema_version 1")
	for key in ["id", "title", "initial_sun", "sky_sun_interval", "enemy_spawn_x", "loss_x", "deck", "random_seed", "board", "sky_sun", "sun_pickup", "starting_plants", "waves"]:
		if not level.has(key):
			errors.append("Missing level field: " + key)
	if not errors.is_empty():
		return _report()
	var board: Dictionary = level.board
	for key in ["rows", "columns", "cell_width", "cell_height"]:
		if float(board.get(key, 0)) <= 0:
			errors.append("Board field must be positive: " + key)
	if level.deck.is_empty():
		errors.append("Level deck is empty")
	if float(level.sky_sun_interval) <= 0:
		errors.append("Sky sun interval must be positive")
	for key in ["first_delay", "left", "right", "spawn_y", "target_top", "target_bottom"]:
		if not level.sky_sun.has(key):
			errors.append("Missing sky sun field: " + key)
	for key in ["value", "lifetime", "fall_speed", "collect_radius"]:
		if not level.sun_pickup.has(key):
			errors.append("Missing sun pickup field: " + key)
	for kind: String in level.deck:
		if not plants.has(kind):
			errors.append("Unknown deck plant: " + kind)
	var occupied: Dictionary = {}
	for entry: Dictionary in level.starting_plants:
		_check_spawn(entry, plants, board, true)
		var cell := Vector2i(int(entry.get("column", -1)), int(entry.get("row", -1)))
		if occupied.has(cell):
			errors.append("Duplicate starting cell: " + str(cell))
		occupied[cell] = true
	for wave: Dictionary in level.waves:
		if float(wave.get("wait", -1)) < 0 or float(wave.get("interval", -1)) < 0:
			errors.append("Wave wait/interval must be nonnegative")
		for entry: Dictionary in wave.get("enemies", []):
			_check_spawn(entry, zombies, board, false)
	_validate_actors()
	return OK if errors.is_empty() else _report()

func _validate_actors() -> void:
	for group: Dictionary in [plants, zombies]:
		for kind: String in group:
			var definition: Dictionary = group[kind]
			for key in ["animation", "display_scale", "health"]:
				if not definition.has(key):
					errors.append("Missing actor field: %s.%s" % [kind, key])
			if not ResourceLoader.exists(str(definition.get("animation", ""))):
				errors.append("Missing animation for " + kind)
			if float(definition.get("health", 0)) <= 0:
				errors.append("Actor health must be positive: " + kind)
	for kind: String in plants:
		var definition: Dictionary = plants[kind]
		for key in ["title", "cost", "recharge", "behavior", "icon"]:
			if not definition.has(key):
				errors.append("Missing plant field: %s.%s" % [kind, key])
		if str(definition.get("behavior", "")) not in ["sun", "shoot", "block"]:
			errors.append("Unsupported plant behavior: " + kind)
		if float(definition.get("recharge", 0)) <= 0:
			errors.append("Plant recharge must be positive: " + kind)
		if str(definition.get("behavior", "")) in ["sun", "shoot"]:
			for key in ["interval", "action_clip", "action_command"]:
				if not definition.has(key):
					errors.append("Missing action field: %s.%s" % [kind, key])
		if str(definition.get("behavior", "")) == "shoot":
			for key in ["projectile", "projectile_damage"]:
				if not definition.has(key):
					errors.append("Missing projectile field: %s.%s" % [kind, key])
			var projectile: Dictionary = definition.get("projectile", {})
			for key in ["texture", "speed", "scale", "hit_radius", "despawn_x"]:
				if not projectile.has(key):
					errors.append("Missing projectile parameter: %s.%s" % [kind, key])
	for kind: String in zombies:
		for key in ["speed", "bite_damage", "bite_interval", "walk_clip", "bite_clip"]:
			if not zombies[kind].has(key):
				errors.append("Missing zombie field: %s.%s" % [kind, key])

func _read_object(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		errors.append("Cannot read content: " + path)
		return {}
	var json := JSON.new()
	if json.parse(file.get_as_text()) != OK or not json.data is Dictionary:
		errors.append("Invalid JSON object: %s (line %d: %s)" % [path, json.get_error_line(), json.get_error_message()])
		return {}
	return json.data

func _check_spawn(entry: Dictionary, definitions: Dictionary, board: Dictionary, has_column: bool) -> void:
	if not definitions.has(str(entry.get("kind", ""))):
		errors.append("Unknown actor: " + str(entry.get("kind", "")))
	if int(entry.get("row", -1)) < 0 or int(entry.get("row", -1)) >= int(board.get("rows", 0)):
		errors.append("Spawn row outside board: " + str(entry))
	if has_column and (int(entry.get("column", -1)) < 0 or int(entry.get("column", -1)) >= int(board.get("columns", 0))):
		errors.append("Starting column outside board: " + str(entry))

func _report() -> Error:
	for message in errors:
		push_error(message)
	return ERR_INVALID_DATA
