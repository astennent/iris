#pragma strict

var selectionController : SelectionController;
var target: Transform;
var selectionCenter : Vector3;
function Start () {
	target = GameObject.FindGameObjectWithTag("GameController").transform;
	selectionController = GameObject.FindGameObjectWithTag("GameController").GetComponent(SelectionController);
	transform.parent = target;
}

//Used for camera movement
var x : float = 0;
var y : float = 0;
var r : float = 0;

var desired_distance : float = 100;
var bubbleSize : int = 0;

var freeCamera : boolean = false;

function Update () {
	if (target == null){
		freeCamera = true;	
	}	

	if (freeCamera){ //camera is controlled with arrow keys
		UpdateFree();
	} else { //camera is controlled by moving around 
		CalculateSelectionCenter();
		UpdateLocked();
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

function UpdateLocked(){
	var coordinates = Camera.main.WorldToScreenPoint(selectionCenter);
	var mouseCoords = Input.mousePosition;

	
	if (Input.GetMouseButton(0)){
		x += Input.GetAxis("Mouse X")*5;
		y += Input.GetAxis("Mouse Y")*5;
	}
	if (Input.GetMouseButton(1)){
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
	
	var originalRotation : Quaternion = transform.rotation;
	var originalPosition : Vector3 = transform.position;
	var targetPosition :Vector3 = transform.position;

	targetPosition += transform.right*-x;
	targetPosition += transform.up*-y;
	
	x*=.9;
	y*=.9;
	r*=.9;

	var z : float = Input.GetAxis("Mouse ScrollWheel");

	desired_distance = Mathf.Clamp(desired_distance+z, 20, 1000);

	var current_distance : float = Vector3.Distance(selectionCenter, targetPosition);
	transform.position += transform.forward * (current_distance - desired_distance) / 12;
	
	
	transform.LookAt(selectionCenter, transform.up);
	transform.RotateAround(transform.forward, r);
	transform.position = transform.position*.75 + targetPosition*.25;
	transform.rotation = Quaternion.Slerp(originalRotation, transform.rotation,.3);

}


function setTarget(n : Node){
	if (n != null) {
		target = n.transform;
		desired_distance = 100;
	} else {
		target = null;
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
	var selected_nodes = selectionController.nodes;
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
}