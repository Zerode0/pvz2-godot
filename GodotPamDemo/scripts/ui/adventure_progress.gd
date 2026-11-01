@tool
class_name AdventureProgress
extends Resource
## Map preferences and completed local levels, separate from each level run.

const SAVE_PATH := "user://adventure_progress.cfg"
static var active_profile_path := SAVE_PATH
var current_world := "modern"
var map_offsets: Dictionary = {}
var selected_nodes: Dictionary = {}
var completed_levels: Array[String] = []
var save_path := SAVE_PATH

func load_progress(path: String = "") -> void:
	save_path = active_profile_path if path.is_empty() else path
	var config := ConfigFile.new()
	if config.load(save_path) != OK:
		return
	current_world = str(config.get_value("map", "world", current_world))
	map_offsets = config.get_value("map", "offsets", {})
	selected_nodes = config.get_value("map", "selected_nodes", {})
	completed_levels.assign(config.get_value("levels", "completed", PackedStringArray()))

func save() -> Error:
	var config := ConfigFile.new()
	config.set_value("map", "world", current_world)
	config.set_value("map", "offsets", map_offsets)
	config.set_value("map", "selected_nodes", selected_nodes)
	config.set_value("levels", "completed", PackedStringArray(completed_levels))
	return config.save(save_path)

func record_completed(level_id: String) -> void:
	if level_id not in completed_levels:
		completed_levels.append(level_id)
		save()

func can_play(node: Dictionary) -> bool:
	if str(node.get("scene", "")).is_empty():
		return false
	for requirement in node.get("requires", []):
		if str(requirement) not in completed_levels:
			return false
	return true
