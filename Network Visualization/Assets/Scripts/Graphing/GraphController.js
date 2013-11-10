#pragma strict

private var graphing = false;
private var file : DataFile;

private var axes : Attribute[];
private var fileManager : FileManager;

private var minMaxCache = new List.<List.<int> >();

private var scale : float = 200;

function Start(){
	fileManager = GetComponent(FileManager);
	resetAxes();
}

function resetAxes(){
	axes = new Attribute[3];
	for (var i = 0 ; i < 3 ; i++) {
		minMaxCache.Add(new List.<int>());
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

	//if file hasn't yet been set, make it the first file.
	if (file == null) {
		if (fileManager.files.Count > 0) {
			file = fileManager.files[0];
		}
	}
}

function setFile(file : DataFile){
	this.file = file;
	resetAxes();
}

function getFile() {
	return file;
}

function getAxes() {
	return axes;
}

function setAxis(axis_index : int, attribute : Attribute) {
	for (var i = 0 ; i < 3 ; i++){
		if (axes[i] == attribute) {
			axes[i] = null;
		}
	}
	axes[axis_index] = attribute;

	var minMax = new List.<int>();
	//update the min/max cache
	if (attribute != null) {
		minMax.Add(int.MaxValue);
		minMax.Add(int.MinValue);
		var nodes = file.nodes;
		for (var entry in nodes) {
			if (attribute.is_numeric){
				var value : float = entry.Value.getData(attribute);
			} else {
				value = getStringValue(entry.Value.getData(attribute));
			}

			//update the cache.
			if (value < minMax[0]) {
				minMax[0] = value;
			} 
			if (value > minMax[1]) {
				minMax[1] = value;
			}
		}
	}
	minMaxCache[axis_index] = minMax;
}

function Update(){
	if (graphing) {
		var nodes = file.nodes;
		for (var entry in nodes) {
			var node = entry.Value;
			var desired_position : Vector3 = Vector3.zero;
			for (var i = 0 ; i < 3 ; i++) {
				var attribute = axes[i];
				var value : float;

				//determine the "value" of the node's attribute
				if (attribute == null) {
					value = scale/2;
				} else if (attribute.is_numeric) {
					value = node.getData(attribute);
				} else { //attribute is string.
					value = getStringValue(node.getData(attribute));
				}

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
			node.transform.position = Vector3.Lerp(node.transform.position, desired_position, .3);
		}
	}
}

//converts the string to a float
function getStringValue(input : String) : float {
	return scale/2;
}

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
	return scale/2;
}