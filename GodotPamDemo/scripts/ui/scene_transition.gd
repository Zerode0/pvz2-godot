extends CanvasLayer
## Persistent overlay with a native loading-flower animation and threaded scene loading.

signal transition_finished
signal transition_failed(path: String, error: int)

## Source LoaderFlower node scale, relative to the 1024 x 640 UI canvas.
@export var flower_scale: float = 0.2

@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var overlay: ColorRect = $Overlay
@onready var flower: Node2D = $Overlay/FlowerAnchor/LoadingFlower
@onready var flower_animation: AnimationPlayer = $Overlay/FlowerAnchor/LoadingFlower/AnimationPlayer
@onready var petal_animation: AnimationPlayer = $Overlay/FlowerAnchor/LoadingFlower/flowerpieces/AnimationPlayer
var busy := false

func _ready() -> void:
	overlay.resized.connect(_fit_flower)
	flower_animation.animation_finished.connect(_on_flower_finished)
	_fit_flower()

func _fit_flower() -> void:
	flower.scale = Vector2.ONE * flower_scale * minf(overlay.size.x / 1024.0, overlay.size.y / 640.0)

func _input(_event: InputEvent) -> void:
	if busy:
		get_viewport().set_input_as_handled()

func _on_flower_finished(animation: StringName) -> void:
	if animation == &"Spawn" and busy:
		flower_animation.play(&"Idle")

func change_scene(path: String) -> void:
	if busy:
		return
	busy = true
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	flower.show()
	petal_animation.stop()
	petal_animation.play(&"idle")
	flower_animation.play(&"Spawn")
	var error := ERR_FILE_NOT_FOUND
	if ResourceLoader.exists(path, "PackedScene"):
		error = ResourceLoader.load_threaded_request(path, "PackedScene")
	animation_player.play("fade_out")
	await animation_player.animation_finished
	if error == OK:
		var status := ResourceLoader.load_threaded_get_status(path)
		while status == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			await get_tree().process_frame
			status = ResourceLoader.load_threaded_get_status(path)
		if status == ResourceLoader.THREAD_LOAD_LOADED:
			var scene := ResourceLoader.load_threaded_get(path) as PackedScene
			error = get_tree().change_scene_to_packed(scene) if scene != null else ERR_INVALID_DATA
			if error == OK:
				await get_tree().scene_changed
		else:
			error = ERR_CANT_OPEN
	# The destination's _ready has completed before the cover is removed.
	if flower_animation.current_animation == &"Spawn":
		await flower_animation.animation_finished
	flower_animation.play(&"Leave")
	await flower_animation.animation_finished
	flower.hide()
	petal_animation.stop()
	animation_player.play("fade_in")
	await animation_player.animation_finished
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	busy = false
	if error != OK:
		transition_failed.emit(path, error)
	transition_finished.emit()
