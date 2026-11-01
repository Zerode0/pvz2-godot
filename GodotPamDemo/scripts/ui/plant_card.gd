class_name PlantCard
extends Button
## Reusable presentation card; the caller owns selection and navigation.

signal plant_requested(id: String)

var plant_id := ""
@onready var portrait: TextureRect = %Portrait
@onready var title_label: Label = %CardTitle
@onready var cost_label: Label = %CardCost

func _ready() -> void:
	pressed.connect(func(): plant_requested.emit(plant_id))

func bind_plant(id: String, definition: Dictionary) -> void:
	plant_id = id
	title_label.text = str(definition.title)
	cost_label.text = str(int(definition.cost))
	portrait.texture = load(str(definition.icon)) as Texture2D
	tooltip_text = "%s · %d 阳光 · 冷却 %s 秒" % [definition.title, definition.cost, definition.recharge]
	accessibility_name = tooltip_text

func set_selected(value: bool) -> void:
	set_pressed_no_signal(value)
