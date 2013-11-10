#pragma strict

var data : Array; //all information contained in a node file
var source : DataFile;

var labelObject : GameObject;

private var label : GameObject;

var connections : List.<Connection>;
var connectionPrefab : GameObject;
var lineMat : Material;
var color : Color;

var reticlePrefab : Reticle; //used to instantiate reticle
private var reticle : Reticle; //singleton reticle, instantiated on target


var desiredDistance : float;


var group_id :int = -1; //used by ClusterController to identify which group of connections it belongs to.
private var activated = true;

private var networkController : NetworkController;

var sizing_types = ["By Connections", "Manual", "By Attribute"];
private var sizing_type = 0;
private var manual_size : float = 10.0;
private var size : float = 2.5; //2.5 is the minimum

private var selectionController : SelectionController;
private var rightClickController : RightClickController;
private var graphController : GraphController;

private var haloColor : Color;

private var display_name : String = "";

function Init(data : Array, color : Color, source : DataFile){
	this.data = data;
	this.color = color;
	this.source = source;
	networkController = GameObject.FindGameObjectWithTag("GameController").GetComponent(NetworkController);
	selectionController = networkController.GetComponent(SelectionController);
	rightClickController = networkController.GetComponent(RightClickController);
	graphController = networkController.GetComponent(GraphController);
	label = GameObject.Instantiate(labelObject, transform.position, transform.rotation);
	label.GetComponent(GUIText).anchor = TextAnchor.MiddleCenter;
	label.transform.parent = this.transform;
	UpdateName();
	
	connections = new List.<Connection>();
	
	sizing_type = 0; //by # connections
	UpdateSize();
		
	renderer.material = new Material(networkController.nodeTexture);
	lineMat = new Material(networkController.lineTexture);
	renderer.material.color = color;	
	resetHaloColor();	
}

function setColor(c : Color, colorConnections : boolean){
	color = c;
	renderer.material.color = color;
	if (colorConnections){
		for (connection in connections){
			connection.setColor(c);
		}
	}
}

function AddConnection (other : Node, isOutgoing : boolean, foreignKey : ForeignKey){
	for (var conn in connections){
		if (conn == other){
			return;
		}
	}
	var newConn = GameObject.Instantiate(connectionPrefab).GetComponent(Connection);
	newConn.Init(lineMat, color, isOutgoing, this, other, networkController, foreignKey);
	connections.Add( newConn );
	UpdateSize();
}


function Update () {
	GetComponent(SphereCollider).enabled = Input.GetMouseButtonDown(0) || Input.GetMouseButtonDown(1);
	
	if (graphController.isGraphing() && graphController.getFile() != source) {
		setRender(false);
	} else {
		setRender(true);
		var oldRotation = transform.rotation;
		
		for (var i = 0 ; i < connections.Count ; i++){
			var other_node : Node = connections[i].to;
			var connectionWeight : float = connections[i].foreignKey.connectionWeight;
			moveRelativeTo(other_node.transform.position, other_node.size, false, connectionWeight);

			if (selectionController.dragging){
				var other_connections = other_node.connections;
				for (var other_connection : Connection in other_connections){
					var other_other_node = other_connection.to;
					moveRelativeTo(other_other_node.transform.position, other_node.size, true, connectionWeight);
				}
			}
		}
	    
	    transform.rotation = oldRotation;
	    
	    if (networkController.flatten){
	    	transform.position.z/=1.1;
	    } 
	}
}

//called every frame, based on graphing.
function setRender(enable : boolean){
	renderer.enabled = enable;
	if (reticle != null) {
		reticle.renderer.enabled = enable;
	}
}

function setSizingType(type_index : int){
	sizing_type = type_index;
	UpdateSize();
}

function UpdateSize(){
	if (sizing_type == 0){ //by # connections
		size = (3 + connections.Count * 2.5)/2;
	} else if (sizing_type == 1) { //manual
		size = manual_size;
	} else if (sizing_type == 2) { //by attribute
		//TODO
	}

	size = Mathf.Max(2.5, size);
	transform.localScale = new Vector3(size, size, size);
	desiredDistance = Random.Range(50.0, 50.0);
}

function getManualSize(){
	return manual_size;
}

function setManualSize(s : float){
	manual_size = s;
}

function UpdateName(){
	var shown_indices = source.shown_indices;
	var name_string = "";
	if (shown_indices.length > 0){
		for (var index in shown_indices){
			name_string += "\n" + data[index];
		}
		display_name = name_string.Substring(1);
	} else {
		display_name = "";
	}
	label.GetComponent(GUIText).text = display_name;
	gameObject.name = display_name;
}

function getDisplayName(){
	return display_name;
}

//ignore alpha
function getMenuColor(){
	return new Color(color.r, color.g, color.b);
}

function moveRelativeTo(target : Vector3, other_size: float, second_level : boolean, connectionWeight : float){
	if (networkController.isPaused() || connectionWeight == 0){
		return;
	}
	transform.LookAt(target);
	var sizeCompensation = (size+other_size)/10;
	var speed = other_size*(Vector3.Distance(transform.position, target) - (desiredDistance+sizeCompensation) )/1000*connectionWeight;
	
	//only move away if you're recursing.
	if (second_level){
		speed = Mathf.Clamp(speed, -1, 0);
	}	
	
	//To prevent infinite sliding, don't allow nodes to back
	//off from each other unless you are dragging them around.
	if (selectionController.dragging){
		speed = Mathf.Clamp(speed, -.2, 1);		
	} else {
		speed = Mathf.Clamp(speed, -.1, 1);
	}	
	

	var motion : Vector3 = transform.forward*speed*networkController.gameSpeed;
	transform.position += motion;
}

function OnMouseOver() {
	if (Input.GetMouseButton(0) || Input.GetMouseButtonUp(0)){
		selectionController.NodeClick(this);
    } 
    if (Input.GetMouseButton(1) || Input.GetMouseButtonUp(1)) { //rightclick
    	rightClickController.NodeClick(this);
    }
}

function LateUpdate () {
	if (renderer.isVisible){
		label.transform.position = Camera.main.WorldToViewportPoint(transform.position);
		var fontSize : float = 800/Vector3.Distance(Camera.main.transform.position, transform.position)*size/10;
		label.GetComponent(GUIText).fontSize = Mathf.Clamp(fontSize, 3.0, 20.0);
		label.GetComponent(GUIText).text = display_name;
	}	else {
		label.GetComponent(GUIText).text = "";
	}
}

function setSelected(selected : boolean){
	if (selected && reticle == null){
		reticle = gameObject.Instantiate(reticlePrefab);
		reticle.Init(this);
	} else if (!selected && reticle != null){
		Destroy(reticle.gameObject);
		reticle = null; //unneeded?
	}
}
function isSelected(){
	return (reticle != null);
}

function resetColorRules(){
	resetHaloColor();
	resetManualSizing();
}

function resetManualSizing(){
	//set the sizing type to "by connections"
	setSizingType(0);
}

function resetHaloColor(){
	var c : Color = this.color;
	c.a = .75;
	setHaloColor(c);
}
function setHaloColor(c : Color){
	haloColor = c;
}

function getHaloColor() {
	return haloColor;
}

function Deactivate(){
	if (reticle) {
		Destroy(reticle.gameObject);
	}

	//detach the camera if attached.
	if (Camera.main.transform.parent == transform) {
		Camera.main.transform.parent = null;
	}

	selectionController.deselectNode(this);
	Destroy(gameObject);
}

//deactivate connections that go to a certain file, presumably because you just deactivated it.
function DeactivateConnections(file : DataFile){
	var replacement_connections = new List.<Connection>();
	for (var x = 0 ; x < connections.Count ; x++){
		var connection = connections[x];
		if (connection.to.source == file){
			connection.Deactivate();
			x--;
			size-=2.5;
		} else {
			replacement_connections.Add(connection);
		}
	}
	connections = replacement_connections;
	UpdateSize();
}
function DeactivateConnections(foreignKey : ForeignKey) {
	var replacement_connections = new List.<Connection>();
	for (var x = 0 ; x < connections.Count ; x++){
		var connection = connections[x];
		if (connection.foreignKey == foreignKey){
			connection.Deactivate();
			x--;
			size-=2.5;
		} else {
			replacement_connections.Add(connection);
		}
	}
	connections = replacement_connections;
	UpdateSize();
}

//called by connections to alert the node that they've been killed.
function alertConnectionDeactivated(connection : Connection){
	for (var x = 0 ; x < connections.Count ; x++){
		if (connections[x] == connection) {
			connections.RemoveAt(x);
		}
	}
}

//Used to update displayed information in real time.
function setData(index : int, value) {
	/*data[index] = data;
	if (index in source.shown_indices) {
		UpdateName();
	}*/
}

function getData(attribute : Attribute) {
	if (attribute.file == source) {
		return data[attribute.column_index];
	} else {
		return null;
	}
}

