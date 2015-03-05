#pragma strict

class Edge extends TimeObject {

	var mat : Material; //the material drawn by the edge.
	var color : Color; //line color
	var isOutgoing : boolean; //is the edge an outgoing one? Determines offset, hides self if false and bidirectional is false.
	var from : Node;
	var to : Node;
	var foreignKey : ForeignKey; //the foreign key that gave rise to this edge.

	private var lineRenderer : LineRenderer;

	function Init (source : DataFile, m : Material, c : Color, o : boolean, f : Node, t :Node, fkey : ForeignKey) {
		color = c;
		isOutgoing = o;
		from = f;
		to = t;
		foreignKey = fkey;
		lineRenderer = GetComponent(LineRenderer);
		lineRenderer.material = m;
		lineRenderer.material.color = color;

		this.source = source;	
		m_initialized = true;	
	}

	function LateUpdate () {
		if (from == null || to == null) {
			Destroy(gameObject);
			return;
		}

		//Logic for hiding the lines. Currently only responds to graphing and timeSeries,
		//TODO: more options for hiding based on rules or one-way edges
		if (GraphController.isGraphing() || !hasValidTime() ||
				!from.hasValidTime() || !to.hasValidTime()) {
			lineRenderer.enabled = false;
			return;
		} 

		lineRenderer.enabled = true;

		//Adjust the line to match the from and to nodes.
		var incomingAdjust : Vector3;
		if (isOutgoing){
			incomingAdjust = Vector3.zero;
		} else {
			incomingAdjust = Vector3.up*.4;
		}
		
		lineRenderer.SetPosition(0, from.transform.position + incomingAdjust);
		lineRenderer.SetPosition(1, to.transform.position + incomingAdjust);	
	}

	private function setColor(c : Color) {
		color = c;
		GetComponent(LineRenderer).material.color = c;
	}

	function updateColor() {
		if (foreignKey.isUsingCustomColor()) {
			setColor(foreignKey.color);
		} else {
			setColor(from.getColor());
		}
	}

	function Deactivate(){
		from.alertEdgeDeactivated(this);
		to.alertEdgeDeactivated(this);

		// Update source file to reflect change.
		source.invalidateAllStats();
		
		Destroy(gameObject);
	}

}