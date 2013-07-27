
var data = new Array(); //all information contained in a node file
var source : DataFile;

var labelObject : GameObject;

private var label : GameObject;

var connections : Array;
var connectionPrefab : GameObject;
var lineMat : Material;
var color : Color;

var desiredDistance : float;
var size : float = 1.0;

var group_id :int = -1; //used by ClusterController to identify which group of connections it belongs to.

private var controller : CharacterController;
private var spawntime;

private var activated = true;


var selected : boolean = false;

private var networkController : NetworkController;



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
	
	desiredDistance = Random.Range(50.0,50.0);
	size = 3;
		
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

function AddConnection (other : Node, outgoing : boolean){
	for (var conn in connections){
		if (conn == other){
			return;
		}
	}
	newConn = GameObject.Instantiate(connectionPrefab).GetComponent(Connection);
	newConn.Init(lineMat, color, outgoing, this, other, networkController);
	connections.Push( newConn );

	size+=2.5;
}

function Update () {	
	
	var oldRotation = transform.rotation;
	actualSize = Mathf.Max(5, size);
	actualSize /=2;
	transform.localScale = new Vector3(actualSize, actualSize, actualSize);

	for (var i = 0 ; i < connections.length ; i++){
		var other_node : Node = connections[i].to;
		var other_size = other_node.size;
		var other_connections = other_node.connections;

		moveRelativeTo(other_node.transform.position, other_size, true, other_connections);

	}

    
    transform.rotation = oldRotation;
    
    if (networkController.flatten){
    	transform.position.z/=1.1;
    }  
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


function moveRelativeTo(target : Vector3, other_size: float, recurse : boolean, other_connections : Array){
	if (networkController.paused){
		return;
	}
	transform.LookAt(target);
	var sizeCompensation = (size+other_size)/10;

	
	//Make nodes move away from each other so they don't collide.
	if (recurse == false){
		sizeCompensation*=3;
	}
	
	speed = other_size*(Vector3.Distance(transform.position, target) - (desiredDistance+sizeCompensation) )/1000;
	
	//only move away if you're recursing.
	if (!recurse){
		speed = Mathf.Clamp(speed, -1, 0);
	}	
	
	//To prevent infinite sliding, don't allow nodes to back
	//off from each other unless you are dragging them around.
	if (Camera.main.GetComponent(NetworkCamera).dragging){
		speed = Mathf.Clamp(speed, -1, 1);
		
		//Also, look at nodes that are connected to this node to avoid some collisions.
		if (recurse){
			for ( var j=0 ; j <other_connections.length ; j++){
				var other_other_node : Node = other_connections[j].to;
				if (other_other_node != this){
					moveRelativeTo(other_other_node.transform.position, other_other_node.size, false, null);
				}
			}
		}
		
		
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
			replacement_connections.append(connection);
		}
	}
	connections = replacement_connections;
	
}

//called by connections to alert the node that they've been killed.
function alertConnectionDeactivated(connection : Connection){
	for (var x = 0 ; x < connections.length ; x++){
		if (connections[x] == connection) {
			connections.remove(x);
		}
	}
}


