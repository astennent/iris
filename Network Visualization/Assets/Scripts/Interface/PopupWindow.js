#pragma strict

class PopupWindow extends MonoBehaviour {
	
	private static var height = 140;
	private static var width = 350;
	private static var displaying : boolean = false;

	private static var message : String;
	private static var options : List.<PopupOption>;

	static function createWindow(message : String) {
		createWindow(message);
	}

	static function createWindow(message : String, option : PopupOption) {
		options = new List.<PopupOption>();
		if (option != null) {
			options.Add(option);
		}
		createWindow(message, options);
	}

	static function createWindow(message : String, options : List.<PopupOption>) {
		this.message = message;
		displaying = true;
		this.options = options;
	}



	static function isDisplaying(){
		return displaying;
	}

	function OnGUI(){
		if (!displaying) {
			return;
		}
		var rect = new Rect( (Screen.width - width)/2, (Screen.height - height)/2, width, height);
		GUI.Box(rect, "");

		//cancel button.
		var optionRect = new Rect(rect.x+rect.width-70, rect.y+rect.height-50, 60, 40);
		if (GUI.Button(optionRect, "Cancel")) {
			DisableDisplay();
		}

		for (var option in options) {
			optionRect.x -= (optionRect.width + 10);
			
			//TODO: Set width to content size

			GUI.color = option.color;
			if (GUI.Button(optionRect, option.text)) {
				option.func(); //call the function attached to the object
				DisableDisplay();
			}

		}
	}

	static function DisableDisplay() {
		this.displaying = false;
	}

}