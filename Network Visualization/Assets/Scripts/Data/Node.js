
var data = new Array(); //all information contained in a node file
var source : DataFile;

var labelObject : GameObject;

private var label : GameObject;

var connections : Array;
var connectionPrefab : GameObject;
var lineMat : Material;
var color : Color;

var desiredDistance : float;

var group_id :int = -1; //used by ClusterController to identify which group of connections it belongs to.

private var controller : CharacterController;
private var spawntime;

private var activated = true;


var selected : boolean = false;

private var networkController : NetworkController;

var sizing_types = ["By Connections", "Manual", "By Attribute"];
private var sizing_type = 0;
private var manual_size : float = 10.0;
private var size : float = 2.5; //2.5 is the minimum


function Start(){
	controller = GetComponent(CharacterController);
	spawntime = Time.time;
}

function Init(){
	networkController = GameObject.FindGameObjectWithTag("GameController").GetComponent(NetworkController);

	label = GameObject.Instantiate(labelObject, transform.position, transform.rotation);
	label.GetComponent(GUIText).anchor = TextAnchor.MiddleCenter;
	label.transform.parent = this.transform;
	UpdateName();
	
	connections = new Array();
	
	sizing_type = 0; //by # connections
	UpdateSize();
		
	renderer.material = new Material(networkController.nodeTexture);
	lineMat = new Material(networkController.lineTexture);
	renderer.material.color = color;		
}

function SetColor(c : Color, colorConnections : boolean){
	color = c;
	renderer.material.color = color;
	if (colorConnections){
		for (connection in connections){
			connection.SetColor(c);
		}
	}
}

function AddConnection (other : Node, isOutgoing : boolean, foreignKey : ForeignKey){
	for (var conn in connections){
		if (conn == other){
			return;
		}
	}
	newConn = GameObject.Instantiate(connectionPrefab).GetComponent(Connection);
	newConn.Init(lineMat, color, isOutgoing, this, other, networkController, foreignKey);
	connections.Push( newConn );
	UpdateSize();
}

function Update () {	
	
	var oldRotation = transform.rotation;

	for (var i = 0 ; i < connections.length ; i++){
		var other_node : Node = connections[i].to;
		var connectionWeight : float = connections[i].foreignKey.connectionWeight;
		moveRelativeTo(other_node.transform.position, other_node.size, false, connectionWeight);

		if (Camera.main.GetComponent(NetworkCamera).dragging){
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

function setSizingType(type_index : int){
	sizing_type = type_index;
	UpdateSize();
}

function UpdateSize(){
	if (sizing_type == 0){ //by # connections
		size = (3 + connections.length * 2.5)/2;
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
		gameObject.name = name_string.Substring(1);
	} else {
		gameObject.name = "";
	}
	label.GetComponent(GUIText).text = gameObject.name;
}


function moveRelativeTo(target : Vector3, other_size: float, second_level : boolean, connectionWeight : float){
	if (networkController.paused || connectionWeight == 0){
		return;
	}
	transform.LookAt(target);
	var sizeCompensation = (size+other_size)/10;
	speed = other_size*(Vector3.Distance(transform.position, target) - (desiredDistance+sizeCompensation) )/1000*connectionWeight;
	
	//only move away if you're recursing.
	if (second_level){
		speed = Mathf.Clamp(speed, -1, 0);
	}	
	
	//To prevent infinite sliding, don't allow nodes to back
	//off from each other unless you are dragging them around.
	if (Camera.main.GetComponent(NetworkCamera).dragging){
		speed = Mathf.Clamp(speed, -1, 1);		
	} else {
		speed = Mathf.Clamp(speed, 0, 1);
	}	
	

	var motion : Vector3 = transform.forward*speed*networkController.gameSpeed;
	transform.position += motion;
}

//deprecate
function OnMouseOver() {
	if(Input.GetMouseButtonDown(0)){
       	//left click
		Camera.main.GetComponent(NetworkCamera).NodeClick(gameObject);
		print (name + " " + group_id);
    } else if(Input.GetMouseButtonDown(1)) {
       	//right click action?
    }
}

function LateUpdate () {
	if (renderer.isVisible){
		label.transform.position = Camera.main.WorldToViewportPoint(transform.position);
		var fontSize : float = 800/Vector3.Distance(Camera.main.transform.position, transform.position)*size/10;
		label.GetComponent(GUIText).fontSize = Mathf.Clamp(fontSize, 3.0, 20.0);
		label.GetComponent(GUIText).text = gameObject.name;
	}	else {
		label.GetComponent(GUIText).text = "";
	}
}

//functions for camera targetting.
function alertTarget(){
	selected = true;
}
function alertUntarget(){
	selected = false;
}

function Deactivate(){
	Destroy(gameObject);
}

//deactivate connections that go to a certain file, presumably because you just deactivated it.
function DeactivateConnections(file : DataFile){
	var replacement_connections = new Array();
	for (var x = 0 ; x < connections.length ; x++){
		var connection = connections[x];
		if (connection.to.source == file){
			connection.Deactivate();
			size-=2.5;
		} else {
			replacement_connections.Push(connection);
		}
	}
	connections = replacement_connections;
	UpdateSize();
}

//called by connections to alert the node that they've been killed.
function alertConnectionDeactivated(connection : Connection){
	for (var x = 0 ; x < connections.length ; x++){
		if (connections[x] == connection) {
			connections.remove(x);
		}
	}
}


