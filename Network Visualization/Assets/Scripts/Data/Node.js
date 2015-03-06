#pragma strict

class Node extends TimeObject {

	var labelObject : GameObject;

	private var label : GameObject;

	private var edges : LinkedList.<Edge>;
	private var color : Color;

	var reticlePrefab : Reticle; //used to instantiate reticle
	private var reticle : Reticle; //singleton reticle, instantiated on target

	var desiredDistance : float;
	private var desiredPosition : Vector3;

	var cluster_id :int = -1; //used by ClusterController to identify which group of nodes it belongs to.
	private var activated = true;

	private var sizing_type = 0;
	private var sizing_scale : float = 10.0;
	private var sizing_attribute : Attribute;
	private var desired_size : float = 2.5; //2.5 is the minimum


	private var haloColor : Color;

	private var display_name : String = "";

	private var dateValidationResizeRequired = false;

	static var BASE_DESIRED_DISTANCE : float = 50.0;

	static function Instantiate(source : DataFile, sourceRow : List.<String>) {
		var instance = GameObject.Instantiate( NetworkController.nodePrefab).GetComponent.<Node>();
		var randPosition = new Vector3(Random.Range(-1000, 1000), Random.Range(-1000, 1000), Random.Range(-1000, 1000));
		instance.transform.position = randPosition;
		instance.source = source;
		
		// Initialize the text label.
		instance.label = GameObject.Instantiate(instance.labelObject, instance.transform.position, instance.transform.rotation);
		instance.label.GetComponent(GUIText).anchor = TextAnchor.MiddleCenter;
		instance.label.transform.parent = instance.transform;

		// Populate node's data store with information from the row.
		for (var i : int = 0 ; i < sourceRow.Count ; i++){
    		if (i < source.attributes.Count){ //in case there are stray commas or whatever
	    		var attribute = source.attributes[i];
	    		instance.Set(attribute, sourceRow[i]);
    		}
    	}
    	instance.m_initialized = true;

		instance.GetComponent.<Renderer>().material = new Material(NetworkController.getNodeTexture());
		instance.edges = new LinkedList.<Edge>();
		instance.setColor(ColorController.GenRandomColor(0), false); //random bright color;
		instance.resetHaloColor();	
		
		instance.sizing_type = 0; //by # edges
		instance.UpdateSize();
		instance.UpdateDate();
		instance.UpdateName();
			
		return instance;
	}

	function setColor(c : Color, colorEdges : boolean){
		color = c;
		GetComponent.<Renderer>().material.color = color;
		if (colorEdges){
			for (edge in edges){
				edge.updateColor();
			}
		}
	}

	function AddEdge (edgeSource : DataFile, other : Node, isOutgoing : boolean, foreignKey : ForeignKey){
		for (var edge in edges){
			if (edge.to == other){
				return edge;
			}
		}
		var newEdge = Edge.Initialize(edgeSource, color, isOutgoing, this, other, foreignKey);
		newEdge.Initialize(edgeSource, color, isOutgoing, this, other, foreignKey);
		edges.AddLast( newEdge );
		UpdateSize();
		return newEdge;
	}


	function Update() {
		super.Update();

		//Stop immediately if the node should not be displayed
		var notRendering = (GraphController.isGraphing() && (!GraphController.isUsingMethodWithNodes() ||
				GraphController.getFile() != source) || !hasValidTime());
		if (notRendering) {
			setRender(false);
			return;
		} else {
			setRender(true);
		}

		//Briefly activate colliders for mouse hit detection, only on click.
		GetComponent(SphereCollider).enabled = Input.GetMouseButtonDown(0) || Input.GetMouseButtonDown(1);
		

		//Determine if movement is being controlled by outside sources (Graphing, Planarity, etc.)
		var usingOtherMovement = (NetworkController.isPaused() || GraphController.isGraphing() || 
				(SelectionController.isDragging() && isSelected()));

		var originalPosition = transform.position;
		if (!usingOtherMovement) {
			var netMotion = Vector3.zero;
			var oldRotation = transform.rotation;
			for (var edge in edges) {
				var other_node : Node = edge.to;

				//Do not process the edge if the edge or node is not visible (because of time or some other reason).
				if (!edge.isRendered() || !other_node.isRendered()) {
					continue;
				}

				var motion = calculateMotionRelativeTo(other_node, edge);
				netMotion += motion;
			}
			
			desiredPosition = originalPosition + netMotion;
			transform.rotation = oldRotation;
		}

		transform.position = Vector3.Lerp(originalPosition, desiredPosition, 0.5);
		var size = Mathf.Lerp(transform.localScale.x, desired_size, 0.5);
		transform.localScale = new Vector3(size, size, size);

		if (PlanarityController.isFlat()){
			transform.position.z/=1.15;
		}
	
	}

	function calculateMotionRelativeTo(other_node : Node, edge : Edge) {

		//Calculate the desired distance.
		var foreignKey = edge.foreignKey;
		var fkeyWeightAttribute = foreignKey.getWeightAttribute();
		var edgeAttributeWeight : float;
		var averageValue : float;

		if (fkeyWeightAttribute != null) {
			edgeAttributeWeight = edge.GetNumeric(fkeyWeightAttribute);
			averageValue = fkeyWeightAttribute.getAverage();
		} else {
			edgeAttributeWeight = 1;
			averageValue = 1;
		}

		//Ratio of the edge weight to the middle weight of the attribute.
		var weightRatio : float;
		if (averageValue <= 0) { //Don't deal with non-numbers or negatives. TODO: Reconsider ignoring negatives.
			weightRatio = 1;
		} else {
			weightRatio = edgeAttributeWeight / averageValue;
			if (weightRatio == 0) {
				weightRatio = 1;
			}
		}

		//modifier for the foreign key that scales the distance across all nodes.
		var fkeyStrength = foreignKey.getWeightModifier();

		//Combine the attribute modifier and the weight ratio
		var distanceModifier = fkeyStrength * weightRatio;

		var desiredDistance : float;
		if (foreignKey.isWeightInverted()) { //high values = far apart.
			desiredDistance = BASE_DESIRED_DISTANCE * distanceModifier;
		} else { //high values = close together (default)
			desiredDistance = BASE_DESIRED_DISTANCE / distanceModifier;
		}
		
		var target = other_node.transform.position;
		var sizeCompensation = (desired_size+other_node.desired_size)/10;

		var speed = (Vector3.Distance(transform.position, target) - (desiredDistance+sizeCompensation) )*.01;
		speed = Mathf.Max(speed, -1);
		
		transform.LookAt(target);
		var motion : Vector3 = transform.forward*speed*NetworkController.gameSpeed;		
		return motion;
	}

	function setDesiredPosition(desiredPosition : Vector3) {
		this.desiredPosition = desiredPosition;
	}
	function getDesiredPosition() {
		return desiredPosition;
	}

	//called every frame, based on graphing.
	function setRender(enable : boolean){
		GetComponent.<Renderer>().enabled = enable;
		if (reticle != null) {
			reticle.GetComponent.<Renderer>().enabled = enable;
		}
	}
	function isRendered() {
		return GetComponent.<Renderer>().enabled;
	}

	function UpdateSize() {

		//override other rules when graphing.
		if (GraphController.isGraphing() && GraphController.isForcingNodeSize()) {
			desired_size = GraphController.getForcedNodeSize();
		} else {
			if (sizing_type == ColorRule.SIZING_EDGES){ 
				//Only count edges in the current time.
				var validCount = getEdges(true).Count;
				desired_size = validCount * 1.25 + 1.5;
			} else if (sizing_type == ColorRule.SIZING_FIXED) { //manual
				desired_size = sizing_scale;
			} else if (sizing_type == ColorRule.SIZING_ATTRIBUTE) { //by attribute
				var attrAdjust : float = (sizing_attribute != null) ? GetNumeric(sizing_attribute) : 1.0;
				desired_size = attrAdjust * sizing_scale;
			}
		}

		desired_size = Mathf.Max(2.5, desired_size);
	}

	function setSizingInfo(sizing_scale : float, sizing_type : int, sizing_attribute : Attribute) {
		this.sizing_scale = sizing_scale;
		this.sizing_type = sizing_type;

		// Only use this sizing attribute if it's the correct source file.
		if (sizing_attribute != null && sizing_attribute.getFile() == this.source) {
			this.sizing_attribute = sizing_attribute;
		} else {
			this.sizing_attribute = null;
		}
		UpdateSize();
	}

	function getSizingScale(){
		return sizing_scale;
	}

	function getSize() {
		return desired_size;
	}

	function getSizingType() {
		return sizing_type;
	}


	function UpdateName(){
		if (!m_initialized) {
			return;
		}

		var name_string = "";
		var attributes = source.getAttributes();
		for (var attribute in attributes) {
			if (attribute.is_shown) {
				name_string += "\n" + Get(attribute);
			}
		}
		if (name_string != "") {
			display_name = name_string.Substring(1);
		} else {
			display_name = " "; //GUIText.text can't have an empty string. Weird.
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
		if (GetComponent.<Renderer>().isVisible && !GraphController.isGraphing()){
			label.transform.position = Camera.main.WorldToViewportPoint(transform.position);
			var fontSize : float = 800/Vector3.Distance(Camera.main.transform.position, transform.position)*desired_size/10;
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
		resetSizing();
	}

	function resetSizing(){
		//set the sizing type to "by edges"
		sizing_type = 0;
	}

	function resetHaloColor(){
		var c : Color = this.color;
		c.a = .75;
		setHaloColor(c);
	}
	function setHaloColor(c : Color){
		haloColor = c;
	}

	function getColor() {
		return color;
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

	//deactivate edges that go to a certain file, presumably because you just deactivated it.
	function DeactivateEdges(file : DataFile){
		var entry = edges.First;
		while (entry != null) {
			var nextEntry = entry.Next;
			var edge = entry.Value;
			if (edge.to.source == file) {
				edge.Deactivate();
				edges.Remove(edge);
			}
			entry = nextEntry;
		}

		UpdateSize();
	}

	function DeactivateEdges(foreignKey : ForeignKey) {
		var entry = edges.First;
		while (entry != null) {
			var nextEntry = entry.Next;
			var edge = entry.Value;
			if (edge.foreignKey == foreignKey) {
				edge.Deactivate();
				edges.Remove(edge);
			}
			entry = nextEntry;
		}

		UpdateSize();
	}

	//called by edges to alert the node that they've been killed.
	function alertEdgeDeactivated(edge : Edge){
		edges.Remove(edge);
	}

	function Set(attribute : Attribute, value : String) {
		//Actually change the value
		super.Set(attribute, value);
		
		//Update visible values in case that changed.
		if (attribute.is_shown) {
			UpdateName();
		}
		UpdateDate();
	}

	function UpdateDate() {
		if (!m_initialized) {
			return;
		}

		//update its own date.
		super.UpdateDate();
		if (source.linking_table) {
			for (var edge in edges) {
				edge.UpdateDate();
			}
		}
	}

	//Called by TimeSeriesController.
	function validateDate() {
		//update its own date.
		super.validateDate();
		if (source.linking_table) {
			for (var edge in edges) {
				edge.validateDate();
			}
		}

		//delay resizing until after all other nodes have been validated.
		dateValidationResizeRequired = true;
	}

	function getEdges() {
		return getEdges(false);
	}

	function getEdges(respectTimeSeries : boolean) {
		if (!respectTimeSeries) {
			return edges;
		}

		//TODO: Cache this
		var output = new LinkedList.<Edge>();
		for (var edge in edges) {
			if (edge.hasValidTime() && edge.to.hasValidTime()) {
				output.AddLast(edge);
			}
		}
		return output;
	}
}