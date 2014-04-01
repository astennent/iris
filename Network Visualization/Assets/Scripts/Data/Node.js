#pragma strict

class Node extends TimeObject {

	var labelObject : GameObject;

	private var label : GameObject;

	private var connections : LinkedList.<Connection>;
	var connectionPrefab : GameObject;
	var lineMat : Material;
	var color : Color;

	var reticlePrefab : Reticle; //used to instantiate reticle
	private var reticle : Reticle; //singleton reticle, instantiated on target

	var desiredDistance : float;


	var group_id :int = -1; //used by ClusterController to identify which group of connections it belongs to.
	private var activated = true;

	var sizing_types = ["By Connections", "Manual", "By Attribute"];
	private var sizing_type = 0;
	private var manual_size : float = 10.0;
	private var size : float = 2.5; //2.5 is the minimum


	private var haloColor : Color;

	private var display_name : String = "";

	private var dateValidationResizeRequired = false;

	static var BASE_DESIRED_DISTANCE : float = 50.0;


	function Init(color : Color, source : DataFile) {
		this.color = color;
		this.source = source;

		label = GameObject.Instantiate(labelObject, transform.position, transform.rotation);
		label.GetComponent(GUIText).anchor = TextAnchor.MiddleCenter;
		label.transform.parent = this.transform;
		UpdateSize();
		
		connections = new LinkedList.<Connection>();
		
		sizing_type = 0; //by # connections
			
		renderer.material = new Material(NetworkController.getNodeTexture());
		lineMat = new Material(NetworkController.getLineTexture());
		renderer.material.color = color;	
		resetHaloColor();	

		initialized = true;
		UpdateName();
		UpdateDate();
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

	function AddConnection (connectionSource : DataFile, other : Node, isOutgoing : boolean, foreignKey : ForeignKey){
		for (var conn in connections){
			if (conn == other){
				return;
			}
		}
		var newConn = GameObject.Instantiate(connectionPrefab).GetComponent(Connection);
		newConn.Init(connectionSource, lineMat, color, isOutgoing, this, other, foreignKey);
		connections.AddLast( newConn );
		UpdateSize();
		return newConn;
	}


	function Update() {
		super.Update();

		if (GraphController.isGraphing() && (!GraphController.isUsingMethodWithNodes() || GraphController.getFile() != source) || 
				!hasValidTime()) {
			setRender(false);
			return;
		}

		GetComponent(SphereCollider).enabled = Input.GetMouseButtonDown(0) || Input.GetMouseButtonDown(1);
		
		setRender(true);
		var oldRotation = transform.rotation;
		
		for (var connection in connections) {
			var other_node : Node = connection.to;

			//Do not process the connection if the connection or node is not in the correct time.
			if (!connection.hasValidTime() || !other_node.hasValidTime()) {
				continue;
			}

			moveRelativeTo(other_node, other_node.size, null, connection);
		}
	    
	    transform.rotation = oldRotation;
	    
	    if (NetworkController.flatten){
	    	transform.position.z/=1.1;
	    } 
	
	}

	function moveRelativeTo(other_node : Node, other_size: float, original_node : Node, connection : Connection) {

		if (NetworkController.isPaused()){
			return;
		}

		//Calculate the desired distance.
		var foreignKey = connection.foreignKey;
		var fkeyWeightAttribute = foreignKey.getWeightAttribute();
		var connectionAttributeWeight : float;
		var averageValue : float;

		if (fkeyWeightAttribute != null) {
			connectionAttributeWeight = connection.GetNumeric(fkeyWeightAttribute);
			averageValue = fkeyWeightAttribute.getAverage();
		} else {
			connectionAttributeWeight = 1;
			averageValue = 1;
		}

		//Ratio of the connection weight to the middle weight of the attribute.
		var weightRatio : float;
		if (averageValue <= 0) { //Don't deal with non-numbers or negatives. TODO: Reconsider ignoring negatives.
			weightRatio = 1;
		} else {
			weightRatio = connectionAttributeWeight / averageValue;
			if (weightRatio == 0) {
				weightRatio = 1;
			}
		}

		//modifier for the foreign key that scales the distance across all nodes.
		var fkeyStrength = foreignKey.getWeightModifier();

		//Combine the attribute modifier and the weight ratio
		var distanceModifier = fkeyStrength * weightRatio;

		var desiredDistance : float;
		if (foreignKey.weightInverted) { //high values = far apart.
			desiredDistance = BASE_DESIRED_DISTANCE * distanceModifier;
		} else { //high values = close together (default)
			desiredDistance = BASE_DESIRED_DISTANCE / distanceModifier;
		}
		
		var target = other_node.transform.position;
		var sizeCompensation = (size+other_size)/10;

		var speed = (Vector3.Distance(transform.position, target) - (desiredDistance+sizeCompensation) )*.01;

		speed = Mathf.Clamp(speed, -1, 1);
		
		transform.LookAt(target);
		var motion : Vector3 = transform.forward*speed*NetworkController.gameSpeed;		
		transform.position += motion;
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

		//override other rules when graphing.
		if (GraphController.isGraphing() && GraphController.isForcingNodeSize()) {
			size = GraphController.getForcedNodeSize();
		} else {
			if (sizing_type == 0){ //by # connections
				//Only count connections in the current time.
				var validCount = getConnections(true).Count;
				size = validCount * 1.25 + 1.5;
			} else if (sizing_type == 1) { //manual
				size = manual_size;
			} else if (sizing_type == 2) { //by attribute
				//TODO
			}
		}

		size = Mathf.Max(2.5, size);
		transform.localScale = new Vector3(size, size, size);
	}


	function getManualSize(){
		return manual_size;
	}
	function setManualSize(s : float){
		manual_size = s;
	}

	function getSize() {
		return size;
	}

	function UpdateName(){
		var shown_indices = source.shown_indices;
		var name_string = "";
		if (shown_indices.length > 0){
			for (var index in shown_indices){
				name_string += "\n" + Get(index); //access Data attribute
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



	function OnMouseOver() {
		if (Input.GetMouseButton(0) || Input.GetMouseButtonUp(0)){
			SelectionController.NodeClick(this);
	    } 
	    if (Input.GetMouseButton(1) || Input.GetMouseButtonUp(1)) { //rightclick
	    	RightClickController.NodeClick(this);
	    }
	}

	function LateUpdate () {
		if (renderer.isVisible && !GraphController.isGraphing()){
			label.transform.position = Camera.main.WorldToViewportPoint(transform.position);
			var fontSize : float = 800/Vector3.Distance(Camera.main.transform.position, transform.position)*size/10;
			label.GetComponent(GUIText).fontSize = Mathf.Clamp(fontSize, 3.0, 20.0);
			label.GetComponent(GUIText).text = display_name;
		}	else {
			label.GetComponent(GUIText).text = "";
		}

		if (dateValidationResizeRequired) {
			dateValidationResizeRequired = false;
			UpdateSize();
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

		// Mark all the Stats this node was used in as invalid
		source.invalidateAllStats();		

		SelectionController.deselectNode(this);
		Destroy(gameObject);
	}

	//deactivate connections that go to a certain file, presumably because you just deactivated it.
	function DeactivateConnections(file : DataFile){
		var entry = connections.First;
		while (entry != null) {
			var nextEntry = entry.Next;
			var connection = entry.Value;
			if (connection.to.source == file) {
				connection.Deactivate();
				connections.Remove(connection);
			}
			entry = nextEntry;
		}

		UpdateSize();
	}

	function DeactivateConnections(foreignKey : ForeignKey) {
		var entry = connections.First;
		while (entry != null) {
			var nextEntry = entry.Next;
			var connection = entry.Value;
			if (connection.foreignKey == foreignKey) {
				connection.Deactivate();
				connections.Remove(connection);
			}
			entry = nextEntry;
		}

		UpdateSize();
	}

	//called by connections to alert the node that they've been killed.
	function alertConnectionDeactivated(connection : Connection){
		connections.Remove(connection);
	}

	function Set(attribute : Attribute, value : String) {
		//Actually change the value
		super.Set(attribute, value);
		
		//Update visible values in case that changed.
		if (initialized) {
			UpdateName();
		}
	}

	function UpdateDate() {
		//update its own date.
		super.UpdateDate();
		if (source.linking_table) {
			for (var connection in connections) {
				connection.UpdateDate();
			}
		}
	}

	//Called by TimeSeriesController.
	function validateDate() {
		//update its own date.
		super.validateDate();
		if (source.linking_table) {
			for (var connection in connections) {
				connection.validateDate();
			}
		}

		//delay resizing until after all other nodes have been validated.
		dateValidationResizeRequired = true;
	}

	//TODO: Cache this
	function getConnections(respectTimeSeries : boolean) {
		if (!respectTimeSeries) {
			return connections;
		}

		var output = new LinkedList.<Connection>();
		for (var connection in connections) {
			if (connection.hasValidTime() && connection.to.hasValidTime()) {
				output.AddLast(connection);
			}
		}
		return output;
	}
}