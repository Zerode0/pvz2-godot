class_name PlantingSystem
extends RefCounted

var world: Node

func _init(session: Node) -> void:
	world = session

func advance(seconds: float) -> void:
	for kind in world.cooldowns:
		world.cooldowns[kind] = maxf(0.0, float(world.cooldowns[kind]) - seconds)

func try_plant(cell: Vector2i) -> bool:
	if world.phase != world.Phase.PLAYING or world.paused or not world.grid.contains(cell):
		return false
	if world.shovel:
		return world.remove_plant(cell)
	return plant(world.selected, cell).ok

## Pure query shared by placement previews and actual planting.
func check_placement(kind: String, cell: Vector2i) -> Dictionary:
	var reason := ""
	var message := ""
	if world.phase != world.Phase.PLAYING:
		reason = "not_playing"
	elif world.paused:
		reason = "paused"
	elif not world.grid.contains(cell):
		reason = "out_of_bounds"
	elif not world.plant_data.has(kind) or kind not in world.deck:
		reason = "unavailable_plant"
	elif world.plants.has(cell):
		reason = "occupied"
		message = "这里已经有植物了。"
	elif world.sun < int(world.plant_data[kind].cost):
		reason = "insufficient_sun"
		message = "还需要一些阳光。"
	elif float(world.cooldowns[kind]) > 0.0:
		reason = "cooldown"
		message = "种子包正在恢复。"
	return {"ok": reason.is_empty(), "reason": reason, "message": message}

## Explicit kind; independent of the current selection and shovel tool.
func plant(kind: String, cell: Vector2i) -> Dictionary:
	var result := check_placement(kind, cell)
	if not result.ok:
		if not str(result.message).is_empty():
			world.notify(result.message)
		return result
	var data: Dictionary = world.plant_data[kind]
	world._add_plant(kind, cell)
	world.sun -= int(data.cost)
	world.cooldowns[kind] = float(data.recharge)
	return result

func remove_plant(cell: Vector2i) -> bool:
	var plant: LawnPlant = world.plants.get(cell)
	if plant == null:
		return false
	world.plants.erase(cell)
	plant.alive = false
	plant.visible = false
	plant.queue_free()
	return true

func _add_plant(kind: String, cell: Vector2i) -> void:
	var plant := LawnPlant.new()
	plant.name = "%s_%d_%d" % [kind, cell.y, cell.x]
	plant.position = world.grid.foot(cell)
	world.actors.add_child(plant)
	plant.configure(kind, cell, world.plant_data[kind])
	plant.shot_requested.connect(world._shoot)
	plant.sun_requested.connect(world._produce_sun)
	plant.died.connect(func(unit): world.plants.erase(Vector2i(unit.column, unit.row)))
	world.plants[cell] = plant
