#pragma strict

class PopupOption {

	var func : Function;
	var text : String;
	var color : Color;

	//Constructor
	public function PopupOption(text : String, func : Function) {
		this.text = text;
		this.func = func;
		this.color = Color.white;
	}

	//Constructor with color;
	public function PopupOption(text : String, func : Function, color : Color) {
		this.text = text;
		this.func = func;
		this.color = color;
	}


}