#pragma strict

public class GuiPlus extends MonoBehaviour {

	private var boxes = new List.<Rect>();

	// Draw a GuiBox which prevents the Selection
	// Controller from interacting with nodes
	function Box(r : Rect, text:String){
		GUI.Box(r, text);
		boxes.Add(r);
	}

	function isBlocked() {
		for (var box in boxes) {
			if (box.Contains(Input.mousePosition)){
				return true;
			}
		}
		return false;
	}

	function LateUpdate(){
		boxes = new List.<Rect>();
	}

}