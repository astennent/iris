#pragma strict

class GraphController extends MonoBehaviour {

	private static var graphing = false;
	private static var file : DataFile;
	private static var file_index : int = -1;

	private static var axes : Attribute[];

	private static var minMaxCache = new List.<List.<float> >();
	private static var uniqueValueCounts = new List.<int>();

	private static var scale : float = 200;

	private static var forcingNodeSize : boolean = true;
	private static var forcedNodeSize : float = 2.5;

	private static var methods = ["Scatterplot", "Histogram"];
	static var SCATTERPLOT = 0;
	static var HISTOGRAM = 1;
	private static var method = 0;

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
		updateMethodController(0);
		updateMethodController(1);
		updateMethodController(2);
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

		updateValues(axis_index, attribute);
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

	//Called by setAxis when an attribute is changed
	private static function updateValues(axis_index : int, attribute : Attribute) {
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
		
		//Update the appropriate controller.
		updateMethodController(axis_index);


		//Update the axes tick marks.
		AxisController.Redraw();
	}


	function Update(){
		if (graphing && file != null) {
			if (method == 0) {
				UpdateNodesForScatterplot();
			}
		}
	}

	function UpdateNodesForScatterplot() {
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

	static function updateMethodController(axis_index : int) {
		// Note that these methods rely on axis controller so it must be 
		// the case that axisController is notified of the change first.
		if (method == HISTOGRAM) {
			BarController.updateBars(axis_index);
		}
	}

	//Given a val between min and max, returns the position for positioning
	static function makeFraction(val : float, axisIndex : int) {
		if (minMaxCache[axisIndex].Count > 0) {
			var min = minMaxCache[axisIndex][0];
			var max = minMaxCache[axisIndex][1];
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


	static function isUsingMethodWithNodes() {
		return (method == 0);
	}

	static function isUsingMethodWithBars() {
		return (method == 1);
	}

	//Used by the menu to decide if it should be drawn
	static function methodRequiresSpecialRow() {
		return (method == 1);
	}

	//Used to decide if other axes should be cleared if they occupy the value of the special row
	static function methodRequiresAxisOverwrite() {
		return (method == 1);
	}

	//Used to determine if the special row can be turned all the way off
	static function methodRequiresOneSpecialRow() {
		return (method == 1);
	}

	//Used to determine if tick marks should be squashed to line up with bars.
	static function methodRequiresTickSquash() {
		return (method == 1);
	}

	static function getMinValue(axis_index : int) : float{
		if (minMaxCache[axis_index].Count > 0) {
			return minMaxCache[axis_index][0];
		} else {
			return 0.0;
		}
	}

	static function getMaxValue(axis_index : int) : float {
		if (minMaxCache[axis_index].Count > 0) {
			return minMaxCache[axis_index][1];
		} else {
			return 0.0;
		}
	}

}