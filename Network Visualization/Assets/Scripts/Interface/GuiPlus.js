#pragma strict

public class GuiPlus extends MonoBehaviour {

	private static var boxes = new List.<Rect>();

	// Draw a GuiBox which prevents the Selection
	// Controller from interacting with nodes
	static function Box(r : Rect, text : String) {
		Box(r, text, true);
	}
	static function Box(r : Rect, text:String, drawBox : boolean){
		if (drawBox) {
			GUI.Box(r, text);
		}
		boxes.Add(r);
	}

	static function isBlocked() {
		for (var box in boxes) {
			var mousePosition = Input.mousePosition;
			mousePosition.y = Screen.height - mousePosition.y; //Stupid unity.
			if (box.Contains(mousePosition)){
				return true;
			}
		}
		return false;
	}

	function LateUpdate(){
		boxes = new List.<Rect>();
	}

	//Respects the popup blocker, still displays the button but always returns false.
	//TODO: Switch all buttons over to this.
	static function Button(r : Rect, text : String) {
		if (PopupWindow.isDisplaying()) {
			GUI.Button(r, text);
			return false; //always return false; button is just for show.
		} else {
			return GUI.Button(r, text);
		}
	}

	static function LockableToggle(r : Rect, on : boolean, text : String, locked : boolean) {
		var originalColor = GUI.color;
		if (locked) {
			GUI.color = ColorController.darkenColor(originalColor);
		}
		var result = GUI.Toggle(r, on, text);
		GUI.color = originalColor;
		return (locked) ? on : result;
	}

	static function BeginScrollView() {

	}

	static function EndScrollView() {
		//TOOD: Pop dropdowns.
	}

}