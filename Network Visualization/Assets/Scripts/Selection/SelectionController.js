#pragma strict

private static var BOX_RANGE : float = 1000;

static var dragging : boolean = false;
private static var dragDistance : float = 30;

static var boxing : boolean = false;

//used to gracefully clear selected nodes when boxing starts
private static var clearedSelectionSinceBoxStart = false; 
private static var startCoords : Vector2; //corner of selection box


static var nodes = new HashSet.<Node>(); //list of all selected nodes
private static var primaryNode : Node; //the focused selected node

private static var networkCamera : NetworkCamera;
private static var cameraTransform : Transform;

function Start(){
	networkCamera = Camera.main.GetComponent(NetworkCamera);
	cameraTransform = networkCamera.transform;
}

static function getPrimaryNode() : Node {
	if (primaryNode != null) {
		return primaryNode;
	} else if (primaryNode == null && nodes.Count == 0) {
		return null;
	} else {
		//Choose the first node.
		var enumerator = nodes.GetEnumerator();
		enumerator.MoveNext();
		selectPrimaryNode(enumerator.Current);
		return primaryNode;
	}
}

static var last_click_time = 0.0;
static function NodeClick(node : Node){
	last_click_time = Time.time;
	var already_selected = nodes.Contains(node);
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
	dragDistance = Vector3.Distance(cameraTransform.position, node.transform.position);
	dragging = true;
}

function Update () {
	if (dragging){
		ProcessDrag();
	}

	ProcessBoxing();

	if ( (Input.GetKey(KeyCode.RightControl) || Input.GetKey(KeyCode.LeftControl)) 
			&& Input.GetKeyDown(KeyCode.A)){
        selectAll();
    }
}

static function ProcessDrag(){
	if(!Input.GetMouseButton(0)  || !CameraController.isFree()){
		dragging = false;
		return;
	}
		
	if (dragging){
		var mouseCoords = Input.mousePosition;
		var desiredTargetPosition = Camera.main.ScreenToWorldPoint(Vector3(mouseCoords.x, mouseCoords.y, dragDistance));

		//Determine the distance that the target node must be moved
		var target = primaryNode.transform;
		var positionDelta = desiredTargetPosition - target.position;

		//move the other selected nodes the same distance.
		for (var node in nodes) {
			node.setDesiredPosition(node.transform.position + positionDelta);
		}	
	}
}

private function ProcessBoxing(){
	if (dragging || !CameraController.isFree() || GraphController.isGraphing()){
		boxing = false;
		return;
	}
	if (!boxing && Input.GetMouseButtonDown(0)  && !GuiPlus.isBlocked()){
		startBoxing();
	} else if (boxing && Input.GetMouseButtonUp(0)){
		stopBoxing();
	}
}

private function startBoxing() {
	boxing = true;
	clearedSelectionSinceBoxStart = false;
	startCoords = Input.mousePosition;
	startCoords.y = Screen.height - startCoords.y; //stupid unity.
}

private function stopBoxing(){
	boxing = false;
	selectBoxedItems();
}

static function isDragging() {
	return dragging;
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

private function selectBoxedItems(){
	if (!Input.GetButton("Ctrl") && Time.time - last_click_time > 0.1){
		clearSelectedNodes();
	}

	var mouseCoords = Input.mousePosition;
	mouseCoords.y = Screen.height - mouseCoords.y; //stupid unity.

	var left = Mathf.Min(mouseCoords.x, startCoords.x);
	var right = Mathf.Max(mouseCoords.x, startCoords.x);
	var top = Mathf.Min(mouseCoords.y, startCoords.y);
	var bottom = Mathf.Max(mouseCoords.y, startCoords.y);

	for (var file : DataFile in FileManager.files){
		for (var node in file.getNodes(true)){
			if (Vector3.Distance(node.transform.position, Camera.main.transform.position) < BOX_RANGE) {
				var node_coords = Camera.main.WorldToScreenPoint(node.transform.position);
				node_coords.y = Screen.height - node_coords.y; //stupid unity.
				if (node_coords.z > 0 &&
						node_coords.x >= left && node_coords.x <= right &&
						node_coords.y <= bottom && node_coords.y >= top){
					nodes.Add(node);
				}
			}
		}
	}

	for (node in nodes){
		node.setSelected(true);
	}

	if (nodes.Count == 1){
		var enumerator = nodes.GetEnumerator();
		enumerator.MoveNext();
		networkCamera.setTarget(enumerator.Current);
	}
}

static function selectAllInGroup(cluster_id : int, clear : boolean){
	if (clear) {
		clearSelectedNodes();
	}
	for (var file : DataFile in FileManager.files){
		for (var node in file.getNodes()){
			if (node.cluster_id == cluster_id){
				nodes.Add(node);
				node.setSelected(true);
			}
		}
	}
}

static function selectAll(){
	for (var file : DataFile in FileManager.files){
		for (var node in file.getNodes()){
			nodes.Add(node);
			node.setSelected(true);	
		}
	}
}

static function clearSelectedNodes(){
	for (node in nodes){
		node.setSelected(false);
	}
	nodes.Clear();
}

static function getNumSelected() {
	return nodes.Count;
}

static function deselectNode(node : Node){
	nodes.Remove(node);
	node.setSelected(false);
}

static function selectNode(node : Node){
	nodes.Add(node);
	node.setSelected(true);
}

static function selectPrimaryNode(node : Node){
	networkCamera.setTarget(node);	
	primaryNode = node;
}