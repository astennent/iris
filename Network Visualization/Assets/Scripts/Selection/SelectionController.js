#pragma downcast

var dragging : boolean = false;
var boxing : boolean = false;

//used to gracefully clear selected nodes when boxing starts
private var clearedSelectionSinceBoxStart = false; 
private var startCoords : Vector2; //corner of selection box

var targets = new List.<Node>(); //list of all selected nodes
var selectedTarget : Node; //the focused selected node
var networkCamera : NetworkCamera;
var cameraTransform : Transform;

private var fileManager : FileManager;

function Start(){
	networkCamera = Camera.main.GetComponent(NetworkCamera);
	cameraTransform = networkCamera.transform;
	fileManager = GetComponent(FileManager);
}

function NodeClick(node : Node){
	print (Time.time);

	var already_selected = targets.Contains(node);
	var ctrl = Input.GetButton("Ctrl");

	if (already_selected && ctrl){
		deselectNode(node); 
	} else {
		if (!already_selected){
			if (!ctrl){
				clearSelectedNodes();
			}
			selectNode(node);
		}
		selectPrimaryNode(node); //make this your main node
	}

	dragging = true;
}

function Update () {
	if (dragging){
		ProcessDrag();
	}

	ProcessBoxing();

	if (Input.GetButtonDown("Escape")){
		clearSelectedNodes();
	}

	if ( (Input.GetKey(KeyCode.RightControl) || Input.GetKey(KeyCode.LeftControl)) 
			&& Input.GetKeyDown(KeyCode.A)){
        selectAll();
    }
}

function ProcessDrag(){
	if(!Input.GetMouseButton(0)  || !networkCamera.freeCamera){
		dragging = false;
		return null;
	}
		
	if (dragging){
		var target = selectedTarget.transform;
		var original_position = target.position;
		
		var mouseCoords = Input.mousePosition;
		var coordinates = Camera.main.WorldToScreenPoint(target.position);
		var x1 = (mouseCoords.x - coordinates.x);
		var y1 = (mouseCoords.y - coordinates.y);

		var dist = Vector3.Distance(cameraTransform.position, target.position);		
		target.position += cameraTransform.right*x1*0.0005*dist;
		target.position += cameraTransform.up*y1*0.0005*dist;
		
		//check the coords again to make sure you didn't pass the mouse
		//this is to avoid the "shaking effect"
		var new_coords = Camera.main.WorldToScreenPoint(target.position);
		var x2 = (mouseCoords.x - new_coords.x);
		var y2 = (mouseCoords.y - new_coords.y);
		if (x1 > 0 && x2 < 0 || x1 < 0 && x2 > 0){
			target.position -= cameraTransform.right*x1*0.0005*dist;
		}
		if (y1 > 0 && y2 < 0 || y1 < 0 && y2 > 0){
			target.position -= cameraTransform.up*y1*0.0005*dist;
		}	

		//move all selected nodes the same distance.
		var positionDelta =  target.position - original_position;
		for (var node in targets){
			if (node != selectedTarget){
				node.transform.position += positionDelta;
			}
		}		

	}
}

function ProcessBoxing(){
	if (dragging || !networkCamera.freeCamera){
		boxing = false;
		return null;
	}
	if (!boxing && Input.GetMouseButtonDown(0)){
		startBoxing();
	}
	if (boxing && Input.GetMouseButtonUp(0)){
		stopBoxing();
	}
}

function startBoxing(){
	boxing = true;
	boxDelay = true;
	clearedSelectionSinceBoxStart = false;
	startCoords = Input.mousePosition;
	startCoords.y = Screen.height - startCoords.y; //stupid unity.
}

function stopBoxing(){
	boxing = false;
	selectBoxedItems();
}

function OnGUI(){
	if (boxing){
		GUI.color = Color.red;
		var mouseCoords = Input.mousePosition;
		mouseCoords.y = Screen.height - mouseCoords.y; //stupid unity.

		var left = Mathf.Min(mouseCoords.x, startCoords.x);
		var right = Mathf.Max(mouseCoords.x, startCoords.x);
		var top = Mathf.Min(mouseCoords.y, startCoords.y);
		var bottom = Mathf.Max(mouseCoords.y, startCoords.y);

		if ( (right-left)*(bottom-top) > 50){ //only draw if the box is big enough
			var rect = new Rect(left, top, right-left, bottom-top);
			GUI.Box(rect, "");
			if (!clearedSelectionSinceBoxStart && !Input.GetButton("Ctrl")){
				clearedSelectionSinceBoxStart = true;
				clearSelectedNodes();
			}
		}
	} 
}

function selectBoxedItems(){
	if (!Input.GetButton("Ctrl")){
		clearSelectedNodes();
	}

	var mouseCoords = Input.mousePosition;
	mouseCoords.y = Screen.height - mouseCoords.y; //stupid unity.

	var left = Mathf.Min(mouseCoords.x, startCoords.x);
	var right = Mathf.Max(mouseCoords.x, startCoords.x);
	var top = Mathf.Min(mouseCoords.y, startCoords.y);
	var bottom = Mathf.Max(mouseCoords.y, startCoords.y);

	for (var file : DataFile in fileManager.files){
		for (var entry in file.nodes){
			var node : Node = entry.Value.GetComponent(Node);
			var node_coords = Camera.main.WorldToScreenPoint(node.transform.position);
			node_coords.y = Screen.height - node_coords.y; //stupid unity.
			if (node_coords.z > 0 &&
					node_coords.x >= left && node_coords.x <= right &&
					node_coords.y <= bottom && node_coords.y >= top){
				targets.Add(node);
			}
		}
	}

	for (node in targets){
		node.alertTarget();
	}

	if (targets.Count == 1){
		networkCamera.setTarget(targets[0]);
	}
}

function selectAllInGroup(group_id : int){
	for (var file : DataFile in fileManager.files){
		for (var entry in file.nodes){
			var node : Node = entry.Value.GetComponent(Node);
			if (node.group_id == group_id){
				targets.Add(node);
				node.alertTarget();
			}
		}
	}
}

function selectAll(){
	for (var file : DataFile in fileManager.files){
		for (var entry in file.nodes){
			var node : Node = entry.Value.GetComponent(Node);
			targets.Add(node);
			node.alertTarget();	
		}
	}
}

function clearSelectedNodes(){
	for (node in targets){
		node.alertUntarget();
	}
	targets = new List.<Node>();
}

function deselectNode(node : Node){
	targets.Remove(node);
	node.alertUntarget();
}

function selectNode(node : Node){
	targets.Add(node);
	node.alertTarget();
}

function selectPrimaryNode(node : Node){
	networkCamera.setTarget(node);	
	selectedTarget = node;
	//node.alertPrimaryTarget(); TODO
}