class_name CombatSystem
extends RefCounted

var world: Node

func _init(session: Node) -> void:
	world = session

func advance(seconds: float) -> void:
	for plant: LawnPlant in world.plants.values():
		var target_ahead := false
		for zombie: LawnZombie in world.zombies:
			if zombie.alive and zombie.row == plant.row and zombie.position.x > plant.position.x:
				target_ahead = true
				break
		plant.advance(seconds, target_ahead)
	for zombie: LawnZombie in world.zombies.duplicate():
		if not zombie.alive:
			continue
		var target: LawnPlant = null
		for plant: LawnPlant in world.plants.values():
			if plant.alive and plant.row == zombie.row and absf(plant.position.x - zombie.position.x) < 39:
				if target == null or plant.position.x > target.position.x:
					target = plant
		zombie.advance(seconds, target)
		if zombie.position.x < world.grid.position.x - 24:
			var mower: LawnMower = world.mowers[zombie.row]
			if not mower.spent:
				mower.active = true
		if zombie.position.x < float(world.level_data.loss_x):
			world.set_phase(world.Phase.DEFEAT)
			return
	for mower: LawnMower in world.mowers:
		mower.advance(seconds, world.zombies.duplicate())
	_advance_projectiles(seconds)

func _spawn_zombie(row: int, kind: String) -> void:
	var zombie := LawnZombie.new()
	zombie.position = Vector2(float(world.level_data.enemy_spawn_x), world.grid.foot(Vector2i(0, row)).y)
	world.actors.add_child(zombie)
	zombie.configure(kind, row, world.zombie_data[kind])
	zombie.died.connect(func(unit):
		world.zombies.erase(unit)
		world.defeated += 1)
	world.zombies.append(zombie)

func _shoot(plant: LawnPlant) -> void:
	if world.phase != world.Phase.PLAYING:
		return
	var picture := Sprite2D.new()
	var data: Dictionary = plant.definition.projectile
	picture.texture = load(str(data.texture))
	picture.scale = Vector2.ONE * float(data.scale)
	picture.position = plant.position + Vector2(31, -56)
	world.projectile_root.add_child(picture)
	world.projectiles.append({"view": picture, "row": plant.row, "damage": float(plant.definition.projectile_damage), "definition": data})
	world.shots_fired += 1

func _advance_projectiles(seconds: float) -> void:
	for index in range(world.projectiles.size() - 1, -1, -1):
		var pea: Dictionary = world.projectiles[index]
		var previous: float = pea.view.position.x
		pea.view.position.x += float(pea.definition.speed) * seconds
		var radius := float(pea.definition.hit_radius)
		var hit: LawnZombie = null
		for zombie in world.zombies:
			if zombie.alive and zombie.row == int(pea.row) and zombie.position.x + radius >= previous and zombie.position.x - radius <= pea.view.position.x:
				if hit == null or zombie.position.x < hit.position.x:
					hit = zombie
		if hit != null:
			hit.take_damage(float(pea.damage))
		if hit != null or pea.view.position.x > float(pea.definition.despawn_x):
			pea.view.queue_free()
			world.projectiles.remove_at(index)
