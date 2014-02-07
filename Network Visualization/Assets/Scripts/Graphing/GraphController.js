#pragma strict

private static var graphing = false;
private static var file : DataFile;
private static var file_index : int = -1;

private static var axes : Attribute[];

private static var minMaxCache = new List.<List.<float> >();
private static var uniqueValueCounts = new List.<int>();

private static var scale : float = 200;

private static var forcingNodeSize : boolean = true;
private static var forcedNodeSize : float = 2.5;

function Start() {
	resetAxes();
}

//called by Node to decide if it should ignore its rules.
static function isForcingNodeSize() {
	return forcingNodeSize;
}

static function setForcingNodeSize(forcingNodeSize : boolean){
	this.forcingNodeSize = forcingNodeSize;
	FileManager.UpdateNodeSizes();
}

static function getForcedNodeSize() {
	return forcedNodeSize;
}

static function setForcedNodeSize(forcedNodeSize : float) {
	this.forcedNodeSize = forcedNodeSize;
	FileManager.UpdateNodeSizes();
}

static function resetAxes(){
	axes = new Attribute[3];
	for (var i = 0 ; i < 3 ; i++) {
		minMaxCache.Add(new List.<float>());
		uniqueValueCounts.Add(0);
	}
	if (AxisController.initialized) {
		AxisController.Redraw();
	}
}

static function isGraphing(){
	return graphing;
}

static function toggleGraphing(){
	setGraphing(!graphing);
}
static function setGraphing(graphing : boolean) {
	this.graphing = graphing;
	FileManager.UpdateNodeSizes();
	AxisController.Redraw();
}

static function setFileIndex(file_index : int) {
	this.file_index = file_index;
	if (file_index >= 0 && file_index < FileManager.files.Count) {
		this.file = FileManager.files[file_index];
	} else {
		this.file = null;
	}
	resetAxes();
}
static function getFile() {
	return file;
}
static function getFileIndex() {
	return file_index;
}

static function getAxes() {
	return axes;
}

static function getUniqueValueCount(index : int) {
	return uniqueValueCounts[index];
}

static function getScale(){
	return scale;
}

static function setScale(scale : float){
	this.scale = scale;
}

static function setAxis(axis_index : int, attribute : Attribute) {
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
	AxisController.updateAxis(axis_index);
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
static function makeFraction(val : float, i : int) {
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
static function getFractionalValue(val : float, i : int) {
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