#pragma strict

class NetworkCamera extends MonoBehaviour {

	var target: Transform;

	//Used for camera movement
	var x : float = 0;
	var y : float = 0;
	var r : float = 0;

	var desired_distance : float = 100;
	var bubbleSize : int = 0;

	// Adjusts the speed of rotation based on distance from selection center.
	static var DISTANCE_MODIFIER = .008;

	// Adjusts zoom speed based on distance from selection center.
	static var ZOOM_DSTANCE_MODIFIER = .5;

	private var spinning = false;

	static function StartCamera() {

	}

	function Start () {
		target = GameObject.FindGameObjectWithTag("GameController").transform;
		transform.parent = target;
	}

	function Update () {

		// Stop immediately if you're not using this camera mode.
		if (!CameraController.isNetwork()){
			return;
		} 

		// Also stop if the target is null
		if (target == null) {
			CameraController.useFree();
			return;
		} 

		//Save the original position and rotation for Lerping.
		var selectionCenter : Vector3 = CalculateSelectionCenter();		
		var originalRotation : Quaternion = transform.rotation;
		var originalPosition : Vector3 = transform.position;
		var current_distance : float = Vector3.Distance(selectionCenter, originalPosition);

		var coordinates = Camera.main.WorldToScreenPoint(selectionCenter);
		var mouseCoords = Input.mousePosition;

		// Update the value of spinning
		var mouseClicked = (Input.GetMouseButtonDown(0) || Input.GetMouseButtonDown(1));
		var isBlocked = GuiPlus.isBlocked();
		if (!spinning && mouseClicked && !isBlocked) {  //Don't add spin if the user is operating in a menu.
			spinning = true;
		}

		if (Input.GetMouseButtonUp(0) || Input.GetMouseButtonUp(1)) {
			spinning = false;
		}

		if (spinning) {
			if (Input.GetMouseButton(0)){
				x += Input.GetAxis("Mouse X")*4;
				y += Input.GetAxis("Mouse Y")*4;
			}
			if (Input.GetMouseButton(1)){
				if (mouseCoords.x < coordinates.x && mouseCoords.y > coordinates.y){
					r += Input.GetAxis("Mouse X");
					r += Input.GetAxis("Mouse Y");
				} else if (mouseCoords.x < coordinates.x && mouseCoords.y < coordinates.y){
					r -= Input.GetAxis("Mouse X");
					r += Input.GetAxis("Mouse Y");
				} else if (mouseCoords.x > coordinates.x && mouseCoords.y > coordinates.y){
					r += Input.GetAxis("Mouse X");
					r -= Input.GetAxis("Mouse Y");
				} else {// if (mouseCoords.x > coordinates.x && mouseCoords.y < coordinates.y){
					r -= Input.GetAxis("Mouse X");
					r -= Input.GetAxis("Mouse Y");
				}
				x += Input.GetAxis("Mouse X")*2;
				y += Input.GetAxis("Mouse Y")*2;
			}
		}	

		// Update spin values for keypresses
		x -= Input.GetAxis("Horizontal")*1.6;
		y -= Input.GetAxis("Vertical")*1.6;
		r += Input.GetAxis("StrafeVertical");


		var z : float = Input.GetAxis("Mouse ScrollWheel");
		desired_distance -= z*desired_distance;
		desired_distance = Mathf.Clamp(desired_distance, 1, 1000);


		//Calculate target position based on x and y movement..
		var targetPosition : Vector3 = transform.position;
		var distanceAdjust = Mathf.Pow(current_distance * DISTANCE_MODIFIER, 1);
		targetPosition += transform.right * -x * distanceAdjust;
		targetPosition += transform.up * -y * distanceAdjust;

		//Adjust based on distance to the target
		targetPosition += transform.forward * (current_distance - desired_distance) * ZOOM_DSTANCE_MODIFIER;

		transform.LookAt(selectionCenter, transform.up);
		transform.RotateAround(transform.position,transform.forward, r);
		transform.position = Vector3.Lerp(transform.position, targetPosition, .25);
		transform.rotation = Quaternion.Slerp(originalRotation, transform.rotation,.3);

		//Add friction
		x*=.9;
		y*=.9;
		r*=.9;
	}


	function setTarget(node : Node){
		target = node.transform;
		transform.parent = target;

		if (node != null) {
			desired_distance = 15 + 2*node.getSize();
		} 

		// Don't switch with free camera or you can't drag.
		if (!CameraController.isFree()) {
			CameraController.useNetwork();
		}
	}

	function CalculateSelectionCenter() {
		var selected_nodes = SelectionController.nodes;
		var selectionCenter : Vector3;
		if (selected_nodes.Count < 2) {
			selectionCenter = target.position;
		} else {
			selectionCenter = Vector3.zero;
			for (var node : Node in selected_nodes) {
				selectionCenter += node.transform.position;	
			}
			selectionCenter /= selected_nodes.Count;
			var max_distance = 0.0;
			for (var node : Node in selected_nodes) {
				var distance = Vector3.Distance(node.transform.position, selectionCenter);
				if (distance > max_distance) {
					max_distance = distance;
				}
			}
			desired_distance = max_distance*2;
		}
		return selectionCenter;
	}

}