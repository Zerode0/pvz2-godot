class_name PlantPreviewCatalog
extends RefCounted
## Joins presentation metadata to the same actor definitions used by combat.

const ROLES := {"sun": "阳光生产", "shoot": "远程攻击", "block": "防御阻挡"}
var content := ContentCatalog.new()
var entries: Dictionary = {}
var order: Array[String] = []
var error_message := ""

func load_catalog(path: String) -> Error:
	entries.clear()
	order.clear()
	error_message = ""
	var json := JSON.new()
	if json.parse(FileAccess.get_file_as_string(path)) != OK or not json.data is Dictionary:
		return _fail("无法读取植物预览目录：" + path)
	var data: Dictionary = json.data
	if int(data.get("schema_version", 0)) != 1 or not data.get("plants") is Array:
		return _fail("植物预览目录需要 schema_version 1 和 plants 数组。")
	if content.load_actor_catalog(str(data.get("actor_catalog", ""))) != OK:
		return _fail("\n".join(content.errors))
	var pending: Dictionary = {}
	var pending_order: Array[String] = []
	for item in data.plants:
		if not item is Dictionary:
			return _fail("植物预览条目必须为对象。")
		var id := str(item.get("id", ""))
		if pending.has(id) or not content.plants.has(id):
			return _fail("植物预览 ID 重复或未接入：" + id)
		var definition: Dictionary = content.plants[id]
		if not ResourceLoader.exists(str(definition.icon)) or float(item.get("preview_scale", 1.65)) <= 0:
			return _fail("植物图标或预览比例无效：" + id)
		var entry: Dictionary = item.duplicate(true)
		entry["definition"] = definition
		pending[id] = entry
		pending_order.append(id)
	entries = pending
	order = pending_order
	return OK

func matching_ids(query: String = "", behavior: String = "") -> Array[String]:
	var result: Array[String] = []
	var needle := query.strip_edges().to_lower()
	for id in order:
		var definition: Dictionary = entries[id].definition
		if not behavior.is_empty() and str(definition.behavior) != behavior:
			continue
		if needle.is_empty() or (id + " " + str(definition.title)).to_lower().contains(needle):
			result.append(id)
	return result

func _fail(message: String) -> Error:
	error_message = message
	return ERR_INVALID_DATA
