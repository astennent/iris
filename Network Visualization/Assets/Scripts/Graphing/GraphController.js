#pragma strict

private var graphing = false;
private var file : DataFile;
private var file_index : int = -1;

private var axes : Attribute[];
private var fileManager : FileManager;
private var axisController : AxisController;
private var networkController : NetworkController;

private var minMaxCache = new List.<List.<float> >();
private var uniqueValueCounts = new List.<int>();

private var scale : float = 200;

private var forcingNodeSize : boolean = true;
private var forcedNodeSize : float = 2.5;

function Start() {
	fileManager = GetComponent(FileManager);
	axisController = GetComponent(AxisController);
	networkController = GetComponent(NetworkController);
	resetAxes();
	forcingNodeSize = true;
}

//called by Node to decide if it should ignore its rules.
function isForcingNodeSize() {
	return forcingNodeSize;
}

function setForcingNodeSize(forcingNodeSize : boolean){
	this.forcingNodeSize = forcingNodeSize;
	fileManager.UpdateNodeSizes();
}

function getForcedNodeSize() {
	return forcedNodeSize;
}

function setForcedNodeSize(forcedNodeSize : float) {
	this.forcedNodeSize = forcedNodeSize;
	fileManager.UpdateNodeSizes();
}

function resetAxes(){
	axes = new Attribute[3];
	for (var i = 0 ; i < 3 ; i++) {
		minMaxCache.Add(new List.<float>());
		uniqueValueCounts.Add(0);
	}
	if (axisController.initialized) {
		axisController.Redraw();
	}
}

function isGraphing(){
	return graphing;
}

function toggleGraphing(){
	setGraphing(!graphing);
}
function setGraphing(graphing : boolean) {
	this.graphing = graphing;
	fileManager.UpdateNodeSizes();
	axisController.Redraw();
}

function setFileIndex(file_index : int) {
	this.file_index = file_index;
	if (file_index >= 0 && file_index < fileManager.files.Count) {
		this.file = fileManager.files[file_index];
	} else {
		this.file = null;
	}
	resetAxes();
}
function getFile() {
	return file;
}
function getFileIndex() {
	return file_index;
}

function getAxes() {
	return axes;
}

function getUniqueValueCount(index : int) {
	return uniqueValueCounts[index];
}

function getScale(){
	return scale;
}

function setScale(scale : float){
	this.scale = scale;
}

function setAxis(axis_index : int, attribute : Attribute) {
	for (var i = 0 ; i < 3 ; i++){
		if (attribute != null && axes[i] == attribute) {
			setAxis(i, null);
		}
	}
	axes[axis_index] = attribute;

	var minMax = new List.<float>();
	var uniqueValues = new HashSet.<float>();
	//update the min/max cache
	if (attribute != null) {
		minMax.Add(int.MaxValue);
		minMax.Add(int.MinValue);
		var nodes = file.nodes;
		for (var entry in nodes) {
			var value = entry.Value.GetNumeric(attribute);

			//update the cache.
			if (value < minMax[0]) {
				minMax[0] = value;
			} 
			if (value > minMax[1]) {
				minMax[1] = value;
			}

			uniqueValues.Add(value);
		}
	}

	uniqueValueCounts[axis_index] = uniqueValues.Count;	
	minMaxCache[axis_index] = minMax;

	//Send a message to the axis controller to update the number of ticks.
	axisController.updateAxis(axis_index);
}

function Update(){
	if (graphing && file != null) {
		var nodes = file.nodes;
		for (var entry in nodes) {
			var node = entry.Value;
			var desired_position : Vector3 = Vector3.zero;
			for (var i = 0 ; i < 3 ; i++) {
				var attribute = axes[i];

				if (attribute != null) {
					var value = node.GetNumeric(attribute);


				var coordinate = makeFraction(value, i);

				//adjust the desired position
				if (i == 0) {
					desired_position.x = coordinate;
				} else if (i == 1){
					desired_position.y = coordinate;
				} else {
					desired_position.z = coordinate;
				}
				}
			}
			node.transform.position = Vector3.Lerp(node.transform.position, desired_position, .3);
		}
	}
}


//Given a val between min and max, returns the position for positioning
function makeFraction(val : float, i : int) {
	if (minMaxCache[i].Count > 0) {
		var min = minMaxCache[i][0];
		var max = minMaxCache[i][1];
		var frac = scale*(val - min + .0001) / (max - min - .0001);
		if (frac < 0) {
			frac = 0;
		} else if (frac > scale) {
			frac = scale;
		}
		return frac;
	} 
	return 0;
}

//Given a val between 0 and 1, returns the fraction between min and max
function getFractionalValue(val : float, i : int) {
	if (minMaxCache[i].Count > 0) {
		var min = minMaxCache[i][0];
		var max = minMaxCache[i][1];

		if (val < 0) {
			return min;
		} else if (val > 1) {
			return max;
		}

		var frac = min + val*(max - min);
		return frac;
	} 
	return 0;
}