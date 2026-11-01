class_name LevelLaunchRequest
extends Resource
## Parameters consumed by FrontyardLevel before its actual session initializes.

@export_file("*.json") var level_path := "res://data/levels/level_01.json"
@export_file("*.tscn") var scene_path := "res://scenes/level_01.tscn"
@export_file("*.tscn") var return_scene_path := "res://scenes/frontyard_map.tscn"
@export var profile_path := ""
@export var deck: Array[String] = []

var errors: PackedStringArray = []

func validate() -> Error:
	errors.clear()
	var content := ContentCatalog.new()
	if content.load_content(level_path) != OK:
		errors.append_array(content.errors)
	if not ResourceLoader.exists(scene_path, "PackedScene"):
		errors.append("Missing level scene: " + scene_path)
	if not ResourceLoader.exists(return_scene_path, "PackedScene"):
		errors.append("Missing return scene: " + return_scene_path)
	var seen: Dictionary = {}
	for kind in deck:
		if not content.plants.has(kind) or seen.has(kind):
			errors.append("Unknown or duplicate deck plant: " + kind)
		seen[kind] = true
	return OK if errors.is_empty() else ERR_INVALID_DATA
