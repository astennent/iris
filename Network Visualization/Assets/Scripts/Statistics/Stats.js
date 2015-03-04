#pragma strict

//This class is extended by Attribute so that the public getter methods can be called directly.
class Stats {

	@System.NonSerialized
	protected var m_file : DataFile;
	var column_index : int; // This is public for serialization.

	private var minValue : float;
	private var maxValue : float;
	private var countValue : int;
	private var sumValue : float;

	private var uniqueValueCount : int;

	private var valid : boolean = false;

	private var values : List.<float>;
	private var uniqueValues : HashSet.<float>;
	
	var defaultNumeric : float = 0; //getNumeric return value for when a value is not a valid number.

	function Stats() {
		minValue = 0;
		maxValue = 0;
		countValue = 0;
		sumValue = 0;
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
		if (m_file.linking_table) {
			updateValuesForLinkingTable();
		} else {
			updateValuesForNormalTable();
		}

		calculateStats();
	}

// There is no central location for edges in linking tables, so this is expensive.
	private function updateValuesForLinkingTable() {
		// Find all files that are be connected with the linking table.
		var filesToCheck = new HashSet.<DataFile>();
		for (var fkey in m_file.getForeignKeys()) {
			filesToCheck.Add(fkey.getToFile());
		}

		//Loop over those files and check the relevant edges
		var checkedFiles = new HashSet.<DataFile>();
		for (var file in filesToCheck) {
			if (checkedFiles.Contains(file)) {
				continue;				
			} 

			for (var node in file.getNodes(true)) {
				for (var edge in node.getEdges(true)) {
					//check that the edge's data source is this file.
					if (edge.getSource() == file) {
						addValue(edge);
					}
				}
			}

			checkedFiles.Add(file);
		}
	}

	private function updateValuesForNormalTable() {
		var nodes = m_file.getNodes(true);
		for (var node in nodes) {
			addValue(node);
		}
	}

	//Adds a single data point to the collection
	private function addValue(data : Data) {
		var val = data.GetNumeric(column_index);
		values.Add(val);
		uniqueValues.Add(val);
	}

	//Marks stats as invalid. They will be updated whenever they are required.
	public function invalidate() {
		valid = false;
		ColorController.handleAttributeInvalidate(m_file.attributes[column_index]);
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

		// We don't need to hold onto these and waste RAM.
		values.Clear();
		uniqueValues.Clear();
	}

	public function genFractionalColor(data : Data) : Color {
		var num = data.GetNumeric(column_index);
		return ColorController.GenFractionalColor(getFraction(num));
	}

	public function getFraction(data : Data) {
		return getFraction(data.GetNumeric(column_index));
	}

	//Returns a value between 0 and 1.
	public function getFraction(num : float) {
		if (getRange() == 0) {
			return 0;
		} else {
			return ( num-getMin() ) / getRange();
		}
	}

	// Calculates which "bucket" or "bar" is associated with a certain value. 
	// Return value will be between 0 and numBuckets-1 inclusive.
	public function getBucket(num : float, numBuckets : int) {
		
		// Avoid overflow on the very last node.
		if (num == getMax()) {
			return numBuckets - 1;
		}

		return getFraction(num) * numBuckets;
	}

}