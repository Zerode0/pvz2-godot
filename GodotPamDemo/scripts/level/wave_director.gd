class_name WaveDirector
extends RefCounted

signal spawn_requested(row: int, kind: String)
signal wave_changed(wave: int)
var schedule: Array[Dictionary] = []
var elapsed: float = 0.0
var cursor: int = 0
var current_wave: int = 0

func configure(waves: Array) -> void:
	schedule.clear()
	elapsed = 0.0
	cursor = 0
	current_wave = 0
	var time := 0.0
	for index in waves.size():
		var wave: Dictionary = waves[index]
		time += float(wave.wait)
		for enemy: Dictionary in wave.enemies:
			schedule.append({"at": time, "row": int(enemy.row), "kind": str(enemy.kind), "wave": index + 1})
			time += float(wave.interval)

func advance(seconds: float) -> void:
	elapsed += seconds
	while cursor < schedule.size() and float(schedule[cursor].at) <= elapsed:
		var event: Dictionary = schedule[cursor]
		cursor += 1
		if current_wave != int(event.wave):
			current_wave = int(event.wave)
			wave_changed.emit(current_wave)
		spawn_requested.emit(int(event.row), str(event.kind))

func complete() -> bool:
	return cursor == schedule.size()
