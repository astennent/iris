#pragma strict

//This class is extended by Attribute so that the public getter methods can be called directly.
class Stats {

	private var minValue : float;
	private var maxValue : float;
	private var countValue : int;
	private var sumValue : float;
	private var attribute : Attribute;
	private var uniqueValueCount : int;

	private var valid : boolean = false;

	private var values : List.<float>;
	private var uniqueValues : HashSet.<float>;

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

	function getUniqueValueCount() {
		updateStats();
		return uniqueValueCount;
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

		values = new List.<float>();
		uniqueValues = new HashSet.<float>();

		if (attribute.file.linking_table) {
			updateValuesForLinkingTable();
		} else {
			updateValuesForNormalTable();
		}

		calculateStats();
	}

// There is no central location for connections in linking tables, so this is expensive.
	private function updateValuesForLinkingTable() {
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

			for (var node in file.getNodes(true)) {
				for (var connection in node.getConnections(true)) {
					//check that the connection's data source is this file.
					if (connection.source == file) {
						addValue(connection);
					}
				}
			}

			checkedFiles.Add(file);
		}
	}

	private function updateValuesForNormalTable() {
		var nodes = attribute.file.getNodes(true);
		for (var node in nodes) {
			addValue(node);
		}
	}

	//Adds a single data point to the collection
	private function addValue(data : Data) {
		var val = data.GetNumeric(attribute);
		values.Add(val);
		uniqueValues.Add(val);
	}

	//Marks stats as invalid. They will be updated whenever they are required.
	public function invalidate() {
		valid = false;
	}

	private function calculateStats() {

		countValue = values.Count;
		uniqueValueCount = uniqueValues.Count;
		
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

		// Is this useless optimization?
		values.Clear();
		uniqueValues.Clear();
	}

	public function genFractionalColor(data : Data) : Color {
		var num = data.GetNumeric(attribute);
		return ColorController.GenFractionalColor(getFraction(num));
	}

	public function getFraction(data : Data) {
		return getFraction(data.GetNumeric(attribute));
	}

	public function getFraction(num : float) {
		if (getRange() == 0) {
			return 0;
		} else {
			return ( num-getMin() ) / getRange();
		}
	}

}