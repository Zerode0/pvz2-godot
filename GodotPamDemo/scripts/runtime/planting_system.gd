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
	if world.plants.has(cell):
		world.notify("这里已经有植物了。")
		return false
	var data: Dictionary = world.plant_data[world.selected]
	if world.sun < int(data.cost):
		world.notify("还需要一些阳光。")
		return false
	if float(world.cooldowns[world.selected]) > 0.0:
		world.notify("种子包正在恢复。")
		return false
	world._add_plant(world.selected, cell)
	world.sun -= int(data.cost)
	world.cooldowns[world.selected] = float(data.recharge)
	return true

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
