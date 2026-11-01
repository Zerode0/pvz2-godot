class_name LawnZombie
extends LawnUnit

var bite_clock: float = 0.0

func configure(zombie_kind: String, lane: int, data: Dictionary) -> void:
	setup(zombie_kind, lane, data)

func advance(seconds: float, target: LawnPlant) -> void:
	if not alive:
		return
	advance_visual(seconds)
	var clip: String
	if target == null:
		position.x -= float(definition.speed) * seconds
		clip = str(definition.walk_clip)
	else:
		clip = str(definition.bite_clip)
		bite_clock -= seconds
		if bite_clock <= 0.0:
			target.take_damage(float(definition.bite_damage))
			target.update_damage_pose()
			bite_clock += float(definition.bite_interval)
	if animation.current_clip != clip:
		animation.play_clip(clip)
