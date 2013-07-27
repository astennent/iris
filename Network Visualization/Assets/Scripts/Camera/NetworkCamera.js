#pragma downcast

var target: Transform;
function Start () {
	target = GameObject.FindGameObjectWithTag("GameController").transform;
	transform.parent = target;
}

//Used for camera movement
var x : float = 0;
var y : float = 0;
var r : float = 0;

//var distance : float = 100;
var desired_distance : float = 100;
var bubbleSize : int = 0;

var freeCamera : boolean = false;

function Update () {
	if (target == null){
		freeCamera = true;	
	}	

	if (freeCamera){
		//camera is controlled with arrow keys
		UpdateFree();
	} else {
		//camera is controlled by moving around 
		UpdateLocked();
	}
	
	ProcessDrag();
	
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

}

function UpdateLocked(){
	var coordinates = Camera.main.WorldToScreenPoint(target.position);
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

	var current_distance : float = Vector3.Distance(target.position, targetPosition);
	transform.position += transform.forward * (current_distance - desired_distance) / 12;
	
	
	transform.LookAt(target, transform.up);
	transform.RotateAround(transform.forward, r);
	transform.position = transform.position*.75 + targetPosition*.25;
	transform.rotation = Quaternion.Slerp(originalRotation, transform.rotation,.3);

}

function NodeClick(obj){
	node = obj.GetComponent(Node);
	nodetarget = obj.transform;
	bubbleSize = node.size;
	
	if (target != nodetarget){
		//switch targets
		node.alertTarget();		
		if (target != null && target.GetComponent(Node) != null){
			target.GetComponent(Node).alertUntarget();
		}
		
		target = nodetarget;
		if (!freeCamera){
			transform.parent = transform;
		}
	} 
	dragging = true;
}

function Untarget(){
	if (target != null && target.GetComponent(Node) != null){
		target.GetComponent(Node).alertUntarget();
	}
	transform.parent = null;
	target = null;
}

var dragging : boolean = false;
function ProcessDrag(){
	if(!Input.GetMouseButton(0) || !freeCamera || target == null){
		dragging = false;
		return;
	}
	
	var dist = Vector3.Distance(transform.position, target.position);
	
	if (dragging){
		var coordinates = Camera.main.WorldToScreenPoint(target.position);
		var mouseCoords = Input.mousePosition;
		
		var x1 = (mouseCoords.x - coordinates.x);
		var y1 = (mouseCoords.y - coordinates.y);
				
		target.position += transform.right*x1*0.0005*dist;
		target.position += transform.up*y1*0.0005*dist;
		
		//check the coords again to make sure you didn't pass the mouse
		//this is to avoid the "shaking effect"
		var new_coords = Camera.main.WorldToScreenPoint(target.position);
		x2 = (mouseCoords.x - new_coords.x);
		y2 = (mouseCoords.y - new_coords.y);
		if (x1 > 0 && x2 < 0 || x1 < 0 && x2 > 0){
			target.position -= transform.right*x1*0.0005*dist;
		}
		if (y1 > 0 && y2 < 0 || y1 < 0 && y2 > 0){
			target.position -= transform.up*y1*0.0005*dist;
		}
		
		
		
	}
}

//called by the search function
function JumpTo(goal : String){
	node = GameObject.Find(goal);
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
