#pragma strict

var mat : Material; //the material drawn by the connection.
var color : Color; //line color
var isOutgoing : boolean; //is the connection an outgoing one? Determines offset, hides self if false and bidirectional is false.
var from : Node;
var to : Node;
var foreignKey : ForeignKey; //the foreign key that gave rise to this connection.
private var lineRenderer : LineRenderer;
private var networkController : NetworkController;

function Init (m : Material, c : Color, o : boolean, f : Node, t :Node, nC : NetworkController, fkey : ForeignKey) {
	mat = m;
	color = c;
	isOutgoing = o;
	from = f;
	to = t;
	lineRenderer = GetComponent(LineRenderer);
	lineRenderer.material = mat;
	lineRenderer.material.color = color;
	networkController = nC;
	foreignKey = fkey;
}

function LateUpdate () {
	if (from == null || to == null){
		Destroy(gameObject);
		return;
	}
	//Adjust the line to match the from and to nodes.
	lineRenderer.enabled = true;
	var incomingAdjust : Vector3;
	if (isOutgoing){
		incomingAdjust = Vector3.zero;
	} else {
		incomingAdjust = Vector3.up*.4;
	}
	
	lineRenderer.SetPosition(0, from.transform.position + incomingAdjust);
	lineRenderer.SetPosition(1, to.transform.position + incomingAdjust);	
}

function SetColor(c : Color){
	color = c;
	GetComponent(LineRenderer).material.color = c;
}

function Deactivate(){
	from.alertConnectionDeactivated(this);
	to.alertConnectionDeactivated(this);
	Destroy(gameObject);
}