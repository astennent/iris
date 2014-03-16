#pragma strict

//This class is extended by Attribute so that the public getter methods can be called directly.
class Stats {

	private var minValue : float;
	private var maxValue : float;
	private var countValue : int;
	private var sumValue : float;
	private var attribute : Attribute;

	private var valid : boolean = false;

	function setStatsAttribute(attribute : Attribute) {
		minValue = 0;
		maxValue = 0;
		countValue = 0;
		sumValue = 0;
		this.attribute = attribute;
	}

	function getMin() {
		updateStats();
		return minValue;
	}

	function getMax() {
		updateStats();
		return maxValue;
	}

	function getMiddle() {
		updateStats();
		return (minValue+maxValue)/2;
	}

	function getRange() {
		updateStats();
		return maxValue - minValue;
	}

	function getCount() {
		updateStats();
		return countValue;
	}

	function getAverage() {
		if (maxValue != minValue) {
			return sumValue/countValue;
		} else {
			return 0;
		}
	}

	private function updateStats() {

		if (valid) {
			return;
		}

		var values = new List.<float>();

		if (attribute.file.linking_table) {
			values = updateValuesForLinkingTable(values);
		} else {
			values = updateValuesForNormalTable(values);
		}

		calculateStats(values);
	}

// There is no central location for connections in linking tables, so this is expensive.
	private function updateValuesForLinkingTable(values : List.<float>) {
		// Find all files that are be connected with the linking table.
		var filesToCheck = new HashSet.<DataFile>();
		for (var fkey in attribute.file.getForeignKeys(true)) {
			filesToCheck.Add(fkey.to_file);
		}

		//Loop over those files and check the relevant connections
		var checkedFiles = new HashSet.<DataFile>();
		for (var file in filesToCheck) {
			if (checkedFiles.Contains(file)) {
				continue;				
			} 

			for (var node in file.getNodes()) {
				for (var connection in node.getConnections(true)) {
					//check that the connection's data source is this file.
					if (connection.source == file) {
						values = addValue(connection, values);
					}
				}
			}

			checkedFiles.Add(file);
		}
		return values;
	}

	private function updateValuesForNormalTable(values : List.<float>) {
		var nodes = attribute.file.getNodes();
		for (var node in nodes) {
			values = addValue(node, values);
		}
		return values;
	}

	//Adds a single data point to the collection
	private function addValue(data : Data, values : List.<float>) {
		var val = data.GetNumeric(attribute);
		values.Add(val);
		return values;
	}

	//Marks stats as invalid. They will be updated whenever they are required.
	public function invalidate() {
		valid = false;
	}

	private function calculateStats(values : List.<float>) {

		countValue = values.Count;
		
		if (countValue == 0) {
			minValue = 0;
			maxValue = 0;
			sumValue = 0;
			return;
		} else {
			minValue = Mathf.Infinity;
			maxValue = -Mathf.Infinity;
			sumValue = 0;
		}

		for (var value in values) {
			if (value < minValue) {
				minValue = value;
			}
			if (value > maxValue) {
				maxValue = value;
			}
			sumValue+=value;
		}

		valid = true;
	}

	public function genFractionalColor(data : Data) : Color {
		var num = data.GetNumeric(attribute);
		return ColorController.GenFractionalColor(num-getMin(), getMax()-getMin());
	}

}