#pragma strict

private var graphing : boolean;
private var file : DataFile;

private var axes : Attribute[];
private var fileManager : FileManager;

function Start(){
	fileManager = GetComponent(FileManager);
	graphing = false;
	resetAxes();
}

function resetAxes(){
	axes = new Attribute[3];
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
}

function Update(){
	if (graphing) {
		var nodes = file.nodes;
		for (var entry in nodes) {
			var node = entry.Value;
			for (var i = 0 ; i < 3 ; i++) {
				var attribute = axes[i];
				var coordinate : float;

				// //determine the "value" of the node's attribute
				// if (attribute.is_numeric) {
				// 	coordinate = getNumericCoordinate(attribute, )
				// } else {

				// }
				coordinate = 0.0;

				//actually move the node
				if (i == 0) {
					node.transform.position.x = coordinate;
				} else if (i == 1){
					node.transform.position.y = coordinate;
				} else {
					node.transform.position.z = coordinate;
				}
			}
		}
	}
}

function getNumericCoordinate(attribute : Attribute, value : float) : float{
	return 0;
}

function getStringCoordinate(attribute : Attribute, value) : float{
	return 0;
}