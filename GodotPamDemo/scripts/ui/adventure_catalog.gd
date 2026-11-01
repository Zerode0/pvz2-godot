@tool
class_name AdventureCatalog
extends RefCounted
## The project's map manifest; upstream formats are converted offline.

var worlds: Array[Dictionary] = []
var maps: Dictionary = {}
var error_message := ""

func load_catalog(path: String) -> Error:
	worlds.clear()
	maps.clear()
	error_message = ""
	var manifest := _read_json(path)
	if manifest.is_empty():
		return ERR_INVALID_DATA
	if int(manifest.get("schema_version", 0)) != 1:
		return _fail("不支持的地图目录版本。")
	var ids: Dictionary = {}
	for value in manifest.get("worlds", []):
		if value is not Dictionary or str(value.get("id", "")).is_empty() or ids.has(value.id):
			return _fail("世界 ID 为空或重复。")
		ids[value.id] = true
		var map_path := str(value.get("map", ""))
		if not map_path.is_empty():
			var data := _read_json(map_path)
			if data.is_empty() or not _valid_map(data):
				return ERR_INVALID_DATA
			maps[value.id] = data
		worlds.append(value)
	if worlds.is_empty():
		return _fail("地图目录没有世界。")
	return OK

func world_index(id: String) -> int:
	for index in worlds.size():
		if str(worlds[index].id) == id:
			return index
	return 0

func _read_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		error_message = "无法读取地图：" + path
		return {}
	var json := JSON.new()
	if json.parse(file.get_as_text()) != OK or json.data is not Dictionary:
		error_message = "地图数据格式错误：" + path
		return {}
	return json.data

func _valid_map(data: Dictionary) -> bool:
	if int(data.get("schema_version", 0)) != 1 or float(data.get("width", 0)) < 1024.0:
		_fail("地图版本或宽度无效。")
		return false
	var ids: Dictionary = {}
	for value in data.get("nodes", []):
		if value is not Dictionary or str(value.get("id", "")).is_empty() or ids.has(value.id):
			_fail("地图节点 ID 为空或重复。")
			return false
		ids[value.id] = true
		if value.get("position", []).size() != 2:
			_fail("地图节点坐标无效。")
			return false
		var scene := str(value.get("scene", ""))
		if not scene.is_empty() and not ResourceLoader.exists(scene, "PackedScene"):
			_fail("关卡场景不存在：" + scene)
			return false
		var level_path := str(value.get("level_path", ""))
		if not level_path.is_empty():
			var content := ContentCatalog.new()
			if content.load_content(level_path) != OK or str(content.level.get("id", "")) != str(value.get("level_id", "")):
				_fail("关卡配置无效或 level_id 不匹配：" + level_path)
				return false
	for edge in data.get("paths", []):
		if edge.size() != 2 or not ids.has(edge[0]) or not ids.has(edge[1]):
			_fail("地图路径引用了不存在的节点。")
			return false
	if ids.is_empty():
		_fail("地图没有关卡节点。")
		return false
	return true

func _fail(message: String) -> Error:
	error_message = message
	return ERR_INVALID_DATA
