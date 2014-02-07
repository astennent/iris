#pragma strict

class RightClickMenu extends MonoBehaviour {

	static var lastClickTime : float = 0; //Used for timing the disabling of the menu.
	static var x : float = 0;
	static var y : float = 0;
	private static var width : float = 150;

	private static var desired_height : float; 
	private static var height : float; 
	private static var max_height : float = 250;


	static function ProcessClick(){
		lastClickTime = Time.time;
		
		x = Mathf.Clamp(Input.mousePosition.x, 0, Screen.width-width);
		y = Mathf.Clamp(Screen.height - Input.mousePosition.y, 0, Screen.height-max_height);

		height = 0;
		desired_height = max_height;
	}

	function Update(){
		var node = RightClickController.getNode();
		if (node != null) {
			var speed : float;
			if (desired_height < height) {
				speed = 0.5;
			} else {
				speed = 0.3;
			}
			height = Mathf.Lerp(height, desired_height, speed);

			//decides when to close the menu.
			var menuRect = new Rect(x, y, width, height);
			var mouseCoords = Input.mousePosition;
			mouseCoords.y = Screen.height - mouseCoords.y;
			if ((Input.GetMouseButtonUp(0) || Input.GetMouseButtonUp(1)) && !menuRect.Contains(mouseCoords) && Time.time - lastClickTime > 0.5 ||
					Input.GetButtonDown("Escape")) {
		    	DisableDisplay();
		    } 

		    if (height < 10) {
				RightClickController.setNode(null);
			} 
		}
	}

	function OnGUI () {
		var node = RightClickController.getNode();
		if (node != null) {
			var menuRect = new Rect(x, y, width, height);
			
			//GUI.color = node.color;
			GuiPlus.Box(menuRect, node.getDisplayName()/*, "button"*/);
			//GUI.color = Color.white;

			var cur_y = y+25;
			var button_rect = new Rect(x, cur_y, width, 30);

			if (height < cur_y+30-y) return; //break early.
			if (node.isSelected()) {
				if (GUI.Button(button_rect, "Unselect Node")){
					SelectionController.deselectNode(node);
				}
			} else {
				if (GUI.Button(button_rect, "Select Node")){
					SelectionController.selectNode(node);
				}
			}

			cur_y+=30; button_rect.y+=30;
			if (height < cur_y+30-y) return; //break early.

			var clusterSize = RightClickController.getCurrentClusterSize();
			if (GUI.Button(button_rect, "Select Cluster (" + clusterSize + ")")){
				SelectionController.selectAllInGroup(node.group_id, true);
			}
		}
	}

	//relies on the Update method to actually disable the menu.
	static function DisableDisplay() {
		desired_height = 0;
	}


}