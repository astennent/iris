#pragma strict

public class GuiPlus extends MonoBehaviour {

	private static var boxes = new List.<Rect>();

	// Draw a GuiBox which prevents the Selection
	// Controller from interacting with nodes
	static function Box(r : Rect, text:String){
		GUI.Box(r, text);
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

}