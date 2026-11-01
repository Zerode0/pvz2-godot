class_name PickupSystem
extends RefCounted

var world: Node

func _init(session: Node) -> void:
	world = session

func advance_sky(seconds: float) -> void:
	world.sky_clock -= seconds
	if world.sky_clock <= 0.0:
		var sky: Dictionary = world.level_data.sky_sun
		_add_sun(Vector2(world.rng.randf_range(float(sky.left), float(sky.right)), float(sky.spawn_y)), world.rng.randf_range(float(sky.target_top), float(sky.target_bottom)))
		world.sky_clock += float(world.level_data.sky_sun_interval)

func _produce_sun(plant: LawnPlant) -> void:
	if world.phase == world.Phase.PLAYING:
		world.sunflower_events += 1
		world._add_sun(plant.position + Vector2(20, -58), plant.position.y + 8)

func _add_sun(at: Vector2, target_y: float) -> void:
	var picture := Sprite2D.new()
	picture.texture = preload("res://assets/Sun.png")
	picture.scale = Vector2.ONE * 0.4
	picture.position = at
	world.pickup_root.add_child(picture)
	world.suns.append({"view": picture, "target": target_y, "life": float(world.level_data.sun_pickup.lifetime)})

func collect_sun_at(at: Vector2) -> bool:
	if world.phase != world.Phase.PLAYING or world.paused:
		return false
	for index in range(world.suns.size() - 1, -1, -1):
		if at.distance_to(world.suns[index].view.position) < float(world.level_data.sun_pickup.collect_radius):
			world.sun += int(world.level_data.sun_pickup.value)
			world.suns[index].view.queue_free()
			world.suns.remove_at(index)
			return true
	return false

func _advance_suns(seconds: float) -> void:
	for index in range(world.suns.size() - 1, -1, -1):
		var pickup: Dictionary = world.suns[index]
		pickup.life = float(pickup.life) - seconds
		pickup.view.position.y = move_toward(float(pickup.view.position.y), float(pickup.target), float(world.level_data.sun_pickup.fall_speed) * seconds)
		pickup.view.modulate.a = minf(1.0, float(pickup.life))
		if float(pickup.life) <= 0.0:
			pickup.view.queue_free()
			world.suns.remove_at(index)
