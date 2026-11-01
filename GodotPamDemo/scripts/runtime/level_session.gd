class_name LevelSession
extends Node2D
## One level run. Owns state, system order and lifecycle; has no HUD/input dependency.

enum Phase { READY, PLAYING, VICTORY, DEFEAT }
const STEP := 1.0 / 60.0
@export_file("*.json") var level_path := "res://data/levels/level_01.json"
@export var automatic_victory := true
@onready var grid: LawnGrid = $PlantingGrid
@onready var actors: Node2D = $Actors
@onready var projectile_root: Node2D = $Projectiles
@onready var pickup_root: Node2D = $Pickups

var level_data: Dictionary
var plant_data: Dictionary
var zombie_data: Dictionary
var director := WaveDirector.new()
var plants: Dictionary = {}
var zombies: Array[LawnZombie] = []
var mowers: Array[LawnMower] = []
var projectiles: Array[Dictionary] = []
var suns: Array[Dictionary] = []
var cooldowns: Dictionary = {}
var phase: Phase = Phase.READY
var selected: String = "peashooter"
var shovel: bool = false
var paused: bool = false
var speed: int = 1
var sun: int = 250
var defeated: int = 0
var elapsed: float = 0.0
var notice: String = ""
var notice_time: float = 0.0
var shots_fired: int = 0
var sunflower_events: int = 0
var sky_clock: float = 4.0

signal phase_changed(value: Phase)
signal run_reset

var catalog := ContentCatalog.new()
var deck: Array[String] = []
var rng := RandomNumberGenerator.new()
var planting: PlantingSystem
var combat: CombatSystem
var pickups: PickupSystem
var _accumulator: float = 0.0

func initialize_run() -> Error:
	var error := catalog.load_content(level_path)
	if error != OK:
		return error
	level_data = catalog.level
	plant_data = catalog.plants
	zombie_data = catalog.zombies
	deck.assign(level_data.deck)
	selected = deck[mini(1, deck.size() - 1)]
	grid.rows = int(level_data.board.rows)
	grid.columns = int(level_data.board.columns)
	grid.cell_size = Vector2(float(level_data.board.cell_width), float(level_data.board.cell_height))
	planting = PlantingSystem.new(self)
	combat = CombatSystem.new(self)
	pickups = PickupSystem.new(self)
	director.spawn_requested.connect(_spawn_zombie)
	director.wave_changed.connect(func(wave): notify("第 %d 波僵尸来袭！" % wave))
	reset_level()
	return OK

func set_phase(value: Phase) -> void:
	if phase != value:
		phase = value
		phase_changed.emit(phase)

func reset_level() -> void:
	for root in [actors, projectile_root, pickup_root]:
		for child in root.get_children():
			child.visible = false
			child.queue_free()
	plants.clear()
	zombies.clear()
	mowers.clear()
	projectiles.clear()
	suns.clear()
	cooldowns.clear()
	for kind in deck:
		cooldowns[kind] = 0.0
	sun = int(level_data.initial_sun)
	defeated = 0
	elapsed = 0.0
	shots_fired = 0
	sunflower_events = 0
	sky_clock = float(level_data.sky_sun.first_delay)
	paused = false
	shovel = false
	speed = 1
	set_phase(Phase.READY)
	notice_time = 0.0
	director.configure(level_data.waves)
	for item: Dictionary in level_data.starting_plants:
		_add_plant(str(item.kind), Vector2i(int(item.column), int(item.row)))
	for row in grid.rows:
		var mower := LawnMower.new()
		mower.position = Vector2(grid.position.x - 65, grid.foot(Vector2i(0, row)).y - 8)
		actors.add_child(mower)
		mower.configure(row)
		mowers.append(mower)
	_accumulator = 0.0
	rng.seed = int(level_data.random_seed)
	run_reset.emit()

func start_level() -> void:
	if phase == Phase.READY:
		set_phase(Phase.PLAYING)
		notify("拾取阳光，种植更多植物。")

func toggle_pause() -> void:
	if phase == Phase.PLAYING:
		paused = not paused

func select_plant(kind: String) -> void:
	if kind in deck:
		selected = kind
		shovel = false

func advance_seconds(seconds: float) -> void:
	if phase != Phase.PLAYING or paused or seconds <= 0.0:
		return
	_accumulator += seconds
	while _accumulator + 0.0000001 >= STEP and phase == Phase.PLAYING:
		_accumulator -= STEP
		_simulate(STEP)

func advance_ready_visuals(seconds: float) -> void:
	for plant: LawnPlant in plants.values():
		plant.advance_visual(seconds)

func _simulate(seconds: float) -> void:
	elapsed += seconds
	notice_time = maxf(0.0, notice_time - seconds)
	planting.advance(seconds)
	director.advance(seconds)
	pickups.advance_sky(seconds)
	combat.advance(seconds)
	pickups._advance_suns(seconds)
	if automatic_victory and phase == Phase.PLAYING and director.complete() and zombies.is_empty():
		set_phase(Phase.VICTORY)

func try_plant(cell: Vector2i) -> bool:
	return planting.try_plant(cell)

func remove_plant(cell: Vector2i) -> bool:
	return planting.remove_plant(cell)

func _add_plant(kind: String, cell: Vector2i) -> void:
	planting._add_plant(kind, cell)

func _spawn_zombie(row: int, kind: String) -> void:
	combat._spawn_zombie(row, kind)

func _shoot(plant: LawnPlant) -> void:
	combat._shoot(plant)

func _produce_sun(plant: LawnPlant) -> void:
	pickups._produce_sun(plant)

func _add_sun(at: Vector2, target_y: float) -> void:
	pickups._add_sun(at, target_y)

func collect_sun_at(at: Vector2) -> bool:
	return pickups.collect_sun_at(at)

func notify(message: String) -> void:
	notice = message
	notice_time = 3.0
