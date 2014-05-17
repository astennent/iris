#pragma strict

class GraphController extends MonoBehaviour {

	private static var graphing = false;
	private static var file : DataFile;
	private static var file_index : int = -1;

	private static var axes : Attribute[];

	private static var scale : float = 200;

	private static var forcingNodeSize : boolean = true;
	private static var forcedNodeSize : float = 2.5;

	private static var methods = ["Scatterplot", "Histogram", "Height Map"];
	static var SCATTERPLOT = 0;
	static var HISTOGRAM = 1;
	static var HEIGHTMAP = 2;
	private static var method = 2;

	//Used in the histogram method to determine if an extra axis should be used to scale vertically.
	private static var histogramCountAxis : int = 1;

	function Start() {
		resetAxes();
	}

	static function getMethodName() {
		return methods[method];
	}
	static function getMethodNames() {
		return methods;
	}
	static function getMethodIndex() {
		return method;
	}
	static function setMethodIndex(method : int) {

		this.method = method;
		
		// Deal with the special row axis being used by a different attribute.
		if (methodRequiresOneSpecialRow()) {
			var specialRowAxis = getSpecialRowAxis();
			var obstructingAttribute = axes[specialRowAxis];
			if (obstructingAttribute != null) {

				// Immediately clear if the axis is being used.
				setAxis(specialRowAxis, null);

				// Use the setting logic to find a replacement if possible.
				setAxis(specialRowAxis, obstructingAttribute);
			}
		}

		//TODO: Make this update all controllers when scatter is refactored out.
		BarController.updateBars(0);
		BarController.updateBars(1);
		BarController.updateBars(2);

		updateMethodController();
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
		if (AxisController.initialized) {
			AxisController.Redraw();
		}
	}

	static function isGraphing(){
		return graphing;
	}

	static function toggleGraphing() {
		setGraphing(!graphing);
	}
	static function setGraphing(graphing : boolean) {
		this.graphing = graphing;
		FileManager.UpdateNodeSizes();
		AxisController.Redraw();
		if (graphing) {
			CameraController.useGraphing();
		}

		HeightMap.refreshHeightmap();
	}

	static function setFileIndex(file_index : int) {
		this.file_index = file_index;
		if (file_index >= 0 && file_index < FileManager.files.Count) {
			this.file = FileManager.files[file_index];
		} else {
			this.file = null;
		}
		resetAxes();
		HeightMap.refreshHeightmap();
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

	static function getAxis(axisIndex : float) {
		return axes[axisIndex];
	}

	static function getScale(){
		return scale;
	}

	static function setScale(scale : float){
		this.scale = scale;
	}

	static function setAxis(axis_index : int, attribute : Attribute) {

		// Check if action is compliant with the special row
		if (attribute != null && methodRequiresOneSpecialRow() && axis_index == getSpecialRowAxis()) {

			//If there is an empty axis, move the special row to that.
			var foundReplacement = false;
			for (var i = 0 ; i < 3 ; i++) {

				// Replace if it's either empty or its the current attribute (about to be emptied)
				if (axis_index != i && (axes[i] == null || axes[i] == attribute)) {
					setSpecialRowAxis(i);
					foundReplacement = true;
				}
			}

			//If you can't move it, then the value cannot be set.
			if (!foundReplacement) {
				return;
			}
		}

		// Toggle off if already selected
		if (axes[axis_index] == attribute) {
			setAxis(axis_index, null);
		} else { 
			
			//Turn off the other axes with this selected, if there is one
			for (i = 0 ; i < 3 ; i++){
				if (attribute != null && axes[i] == attribute) {
					setAxis(i, null);
				}
			}
			axes[axis_index] = attribute;

		}

		//Send a message to the axis controller to update the number of ticks.
		AxisController.updateAxis(axis_index);
		
		BarController.updateBars(axis_index);

		//Update the appropriate controller.
		updateMethodController();

		//Update the axes tick marks.
		AxisController.Redraw();
	}

	static function getSpecialRowAxis() {
		if (method == 1) {
			return histogramCountAxis;
		} else {
			return -1;
		}
	}
	static function setSpecialRowAxis(specialRowAxis : int) {
		if (methodRequiresSpecialRow()) {
			if (method == 1) {
				histogramCountAxis = specialRowAxis;
			}
			if (methodRequiresAxisOverwrite() && axes[specialRowAxis] != null) {
				setAxis(specialRowAxis, null);
			}
		}
	}

	private static function updateMethodController() {
		if (method == HISTOGRAM) {
			HistogramController.updateHistogram();
		} 

		HeightMap.refreshHeightmap();
	}


	function Update(){
		if (graphing && file != null) {
			if (method == 0) {
				UpdateNodesForScatterplot();
			}
		}
	}

	function UpdateNodesForScatterplot() {
		var nodes = file.getNodes(true);
		for (var node in nodes) {
			var desired_position : Vector3 = Vector3.zero;
			for (var i = 0 ; i < 3 ; i++) {
				var attribute = axes[i];

				if (attribute != null) {
					var coordinate = axes[i].getFraction(node) * scale;
					desired_position[i] = coordinate;
				}
			}
			node.setDesiredPosition(desired_position);
		}
	}

	static function isUsingMethodWithNodes() {
		return (method == 0);
	}

	static function isUsingMethodWithBars() {
		return (method == 1);
	}

	//Used by the menu to decide if it should be drawn
	static function methodRequiresSpecialRow() {
		return (method == 1 || method == 2);
	}

	//Used to decide if other axes should be cleared if they occupy the value of the special row
	static function methodRequiresAxisOverwrite() {
		return (method == 1 || method == 2);
	}

	//Used to determine if the special row can be turned all the way off
	static function methodRequiresOneSpecialRow() {
		return (method == 1);
	}

	//Used to determine if tick marks should be squashed to line up with bars.
	static function methodRequiresTickSquash() {
		return (method == 1 || method == 2);
	}

	static function methodLimitsSpecialAxisToY() {
		return (method == 2);
	}

}