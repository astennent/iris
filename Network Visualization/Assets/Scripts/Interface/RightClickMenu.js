#pragma strict

class RightClickMenu extends MonoBehaviour {

	var lastClickTime : float = 0; //Used for timing the disabling of the menu.
	var x : float = 0;
	var y : float = 0;
	private var width : float = 150;

	private var desired_height : float; 
	private var height : float; 
	private var max_height : float = 250;

	var networkController : NetworkController;
	var rightClickController : RightClickController;
	var selectionController : SelectionController;

	function Start() {
		networkController = GameObject.FindGameObjectWithTag("GameController").GetComponent(NetworkController);
		rightClickController = networkController.GetComponent(RightClickController);
		selectionController = networkController.GetComponent(SelectionController);
	}

	function ProcessClick(){
		lastClickTime = Time.time;
		
		x = Mathf.Clamp(Input.mousePosition.x, 0, Screen.width-width);
		y = Mathf.Clamp(Screen.height - Input.mousePosition.y, 0, Screen.height-max_height);

		height = 0;
		desired_height = max_height;
	}

	function Update(){
		var node = rightClickController.getNode();
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
				rightClickController.setNode(null);
			} 
		}
	}

	function OnGUI () {
		var node = rightClickController.getNode();
		if (node != null) {
			var menuRect = new Rect(x, y, width, height);
			
			//GUI.color = node.color;
			GUI.Box(menuRect, node.gameObject.name/*, "button"*/);
			//GUI.color = Color.white;

			var cur_y = y+25;
			var button_rect = new Rect(x, cur_y, width, 30);

			if (height < cur_y+30-y) return; //break early.
			if (node.isSelected()) {
				if (GUI.Button(button_rect, "Unselect Node")){
					selectionController.deselectNode(node);
				}
			} else {
				if (GUI.Button(button_rect, "Select Node")){
					selectionController.selectNode(node);
				}
			}

			cur_y+=30; button_rect.y+=30;
			if (height < cur_y+30-y) return; //break early.

			var clusterSize = rightClickController.getCurrentClusterSize();
			if (GUI.Button(button_rect, "Select Cluster (" + clusterSize + ")")){
				selectionController.selectAllInGroup(node.group_id, true);
			}
		}
	}

	//relies on the Update method to actually disable the menu.
	function DisableDisplay() {
		desired_height = 0;
	}


}