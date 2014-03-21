#pragma strict

class NetworkCamera extends MonoBehaviour {

	var target: Transform;

	//Used for camera movement
	var x : float = 0;
	var y : float = 0;
	var r : float = 0;

	var desired_distance : float = 100;
	var bubbleSize : int = 0;

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

		var selectionCenter : Vector3 = CalculateSelectionCenter();		
		var coordinates = Camera.main.WorldToScreenPoint(selectionCenter);
		var mouseCoords = Input.mousePosition;

		if (!GuiPlus.isBlocked()) {  //Don't add spin if the user is operating in a menu.
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

		//Save the original position and rotation for Lerping.
		var originalRotation : Quaternion = transform.rotation;
		var originalPosition : Vector3 = transform.position;
		var current_distance : float = Vector3.Distance(selectionCenter, originalPosition);

		//Calculate target position based on x and y movement..
		var targetPosition : Vector3 = transform.position;
		targetPosition += transform.right*-x;
		targetPosition += transform.up*-y;

		//Adjust based on distance to the target
		targetPosition += transform.forward * (current_distance - desired_distance)/2;

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

		CameraController.useNetwork();
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