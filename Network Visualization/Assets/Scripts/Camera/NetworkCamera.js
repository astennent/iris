#pragma strict

var target: Transform;


//Used for camera movement
var x : float = 0;
var y : float = 0;
var r : float = 0;

var desired_distance : float = 100;
var bubbleSize : int = 0;

var freeCamera : boolean = false;

//When a user clicks, if the mouse is in a menu then dragging will not spin the camera around.
private var allowedToSpin : boolean = true;

function Start () {
	target = GameObject.FindGameObjectWithTag("GameController").transform;
	transform.parent = target;
}

function Update () {

	if (Input.GetMouseButtonDown(0)) {
		allowedToSpin = !GuiPlus.isBlocked();
	}

	if (target == null){
		freeCamera = true;	
	}	

	if (freeCamera){ //camera is controlled with arrow keys
		UpdateFree();
	} else { //camera is controlled by moving around 
		var selectionCenter : Vector3 = CalculateSelectionCenter();
		UpdateLocked(selectionCenter);
	}
		
	//spacebar to switch camera type.
	if (Input.GetButtonDown("Jump")){
		ToggleLocked();
	}
}

function UpdateFree(){
	if(Input.GetMouseButton(1)){
		x = Input.GetAxis("Mouse X")*.35;
		y = Input.GetAxis("Mouse Y")*.35;
		
		transform.RotateAround(transform.right, -y);
		transform.RotateAround(transform.up, x);
	}

	var speed : int;
	if (Input.GetButton("Shift")){
		speed = 2;
	} else {
		speed = 1;
	}
	
	var h : float = Input.GetAxis("Horizontal")*speed;
	var f : float = Input.GetAxis("Vertical")*speed;
	var v : float = Input.GetAxis("StrafeVertical")*speed;
	
	transform.position += f*transform.forward;
	transform.position += h*transform.right;
	transform.position += v*transform.up;
	

}

function UpdateLocked(selectionCenter : Vector3){
	var coordinates = Camera.main.WorldToScreenPoint(selectionCenter);
	var mouseCoords = Input.mousePosition;

	
	if (Input.GetMouseButton(0) && allowedToSpin){
		x += Input.GetAxis("Mouse X")*4;
		y += Input.GetAxis("Mouse Y")*4;
	}
	if (Input.GetMouseButton(1) && allowedToSpin){
		if (mouseCoords.x < coordinates.x && mouseCoords.y > coordinates.y){
			r += Input.GetAxis("Mouse X")*.05;
			r += Input.GetAxis("Mouse Y")*.05;
		} else if (mouseCoords.x < coordinates.x && mouseCoords.y < coordinates.y){
			r -= Input.GetAxis("Mouse X")*.05;
			r += Input.GetAxis("Mouse Y")*.05;
		} else if (mouseCoords.x > coordinates.x && mouseCoords.y > coordinates.y){
			r += Input.GetAxis("Mouse X")*.05;
			r -= Input.GetAxis("Mouse Y")*.05;
		} else {// if (mouseCoords.x > coordinates.x && mouseCoords.y < coordinates.y){
			r -= Input.GetAxis("Mouse X")*.05;
			r -= Input.GetAxis("Mouse Y")*.05;
		}
		x += Input.GetAxis("Mouse X")*2;
		y += Input.GetAxis("Mouse Y")*2;
	}	

	// Update spin values for keypresses
	x -= Input.GetAxis("Horizontal")*1.6;
	y -= Input.GetAxis("Vertical")*1.6;
	r += Input.GetAxis("StrafeVertical")*.02;


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
	transform.RotateAround(transform.forward, r);
	transform.position = Vector3.Lerp(transform.position, targetPosition, .25);
	transform.rotation = Quaternion.Slerp(originalRotation, transform.rotation,.3);

	//Add friction
	x*=.9;
	y*=.9;
	r*=.9;
}


function setTarget(node : Node){
	if (node != null) {
		target = node.transform;
		desired_distance = 15 + 2*node.getSize();
	} else {
		target = null;
		desired_distance = 50;
	}

	if (!freeCamera){
		transform.parent = target;
	}
}

//called by the search function
function JumpTo(goal : String){
	var node = GameObject.Find(goal);
	if (node.GetComponent(Node)){
		freeCamera = false;
		target = node.transform;
	}
}

function ToggleLocked(){
	freeCamera = !freeCamera;
	if (freeCamera){
		transform.parent = null;
	} else {
		transform.parent = target;
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