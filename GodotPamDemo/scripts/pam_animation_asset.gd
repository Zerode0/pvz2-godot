class_name PamAnimationAsset
extends Resource
## Shared immutable animation data; playback state stays on each PamPlayer.

@export_file("*.json") var pam_path: String
@export_file("*.json") var compiled_path: String
@export_dir var texture_directory: String
@export var default_clip: String = "idle"
@export var origin: Vector2 = Vector2.ZERO
@export var explode_origin: Vector2 = Vector2.ZERO
@export var hidden_sprite_prefixes: PackedStringArray = []
@export var hidden_sprite_names: PackedStringArray = []

var pam: Dictionary = {}
var compiled: Dictionary = {}
var clips: Dictionary = {}
var textures: Array[Texture2D] = []
var loaded: bool = false

func prepare() -> Error:
	if loaded:
		return OK
	var raw = JSON.parse_string(FileAccess.get_file_as_string(pam_path))
	var timeline = JSON.parse_string(FileAccess.get_file_as_string(compiled_path))
	if not raw is Dictionary or not timeline is Dictionary:
		push_error("Invalid animation JSON: " + pam_path)
		return ERR_PARSE_ERROR
	if raw.get("main_sprite") == null or timeline.get("main") == null:
		push_error("Animation requires a main sprite: " + pam_path)
		return ERR_INVALID_DATA
	var loaded_textures: Array[Texture2D] = []
	for image: Dictionary in raw.image:
		var filename: String = str(image.name).split("|")[0].replace("\\", "/").get_file()
		var texture := load(texture_directory.path_join(filename + ".png")) as Texture2D
		if texture == null:
			return ERR_FILE_NOT_FOUND
		loaded_textures.append(texture)
	var sections: Dictionary = {}
	var previous := ""
	var frames: Array = raw.main_sprite.frame
	for index in frames.size():
		var frame: Dictionary = frames[index]
		if frame.has("label"):
			if not previous.is_empty():
				sections[previous].end = index - 1
			previous = str(frame.label)
			sections[previous] = {"start": index, "end": frames.size() - 1}
		if frame.get("stop", false) and not previous.is_empty():
			sections[previous].end = index
	if not sections.has(default_clip):
		push_error("Missing default clip %s in %s" % [default_clip, pam_path])
		return ERR_INVALID_DATA
	pam = raw
	compiled = timeline
	clips = sections
	textures = loaded_textures
	loaded = true
	return OK

func is_hidden(sprite_name: String) -> bool:
	if sprite_name in hidden_sprite_names:
		return true
	for prefix in hidden_sprite_prefixes:
		if sprite_name.begins_with(prefix):
			return true
	return false
