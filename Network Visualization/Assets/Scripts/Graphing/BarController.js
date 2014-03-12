#pragma strict

class BarController extends MonoBehaviour {

	var barPrefabInstance : GameObject;
	static var barPrefab : GameObject;

	//access with bars[x][y][z]; Always has at least one in each list.
	private static var bars = new List.<List.<List.<Bar> > >();
	private static var numBuckets = [1, 1, 1];
	private static var representativeTracker = [true, true, true];

	function Start() {
		barPrefab = barPrefabInstance;
		updateBarArray(0);
	}

	static function getBars() {
		return bars;
	}

	static function getNumBars(axisIndex : int) {
		if (axisIndex == 0) {
			return bars.Count;
		} else if (axisIndex == 1) {
			return bars[0].Count;
		} else if (axisIndex == 2) {
			return bars[0][0].Count;
		}
	}

	// Called when the axis selecctions change.
	static function updateBars(axisIndex : int) {
		
		// Use the number of ticks from the AxisController to determine the number of buckets.
		numBuckets[axisIndex] = AxisController.getTickCounts()[axisIndex]+1;
		var uniqueCount = GraphController.getUniqueValueCount(axisIndex);

		// Only use one bucket for the counting axis.
		if (GraphController.getAxes()[axisIndex] == null) {
			numBuckets[axisIndex] = 1;
			representativeTracker[axisIndex] = true;
		}

		// If every unique value cannot get its own column, the number of bars 
		// can be reduced to fit naturally inside the tick counts.
		else if (uniqueCount > numBuckets[axisIndex] && numBuckets[axisIndex] > 1) {
			representativeTracker[axisIndex] = false;
			numBuckets[axisIndex] -= 1;
		} 

		// Otherwise, the tick position must be squashed to line up with the bars, 
		// instead of going edge-to-edge
		else {
			representativeTracker[axisIndex] = true;
		}

		//Update the bars array to use the correct number of bars.
		updateBarArray(axisIndex);

		HistogramController.updateHistogram();
	}

	static function isRepresentative(axisIndex : int) {	
		return representativeTracker[axisIndex];
	}

	//Updates the bars array to have the correct the number of bars in each axis.
	static function updateBarArray(axisIndex : int) {
		if (axisIndex == 0) {
			updateBarsX();
		} else if (axisIndex == 1) {
			updateBarsY();
		} else if (axisIndex == 2) {
			updateBarsZ();
		}
	}

	private static function updateBarsX() {

		// If there are too many matrices, remove until there are the right number
		while(bars.Count > numBuckets[0]) {
			var barMatrix = bars[bars.Count-1];
			clearMatrix(barMatrix);
			bars.RemoveAt(bars.Count-1);
		}

		// If there aren't enough matrices, add until there are.
		while (bars.Count < numBuckets[0]) {
			barMatrix = createBarMatrix();
			bars.Insert(0, barMatrix);
		}
	}

	private static function updateBarsY() {
		for (var barMatrix in bars) {

			// If there are too many lists, remove until there are the right number
			while (barMatrix.Count > numBuckets[1]) {
				var barList = barMatrix[barMatrix.Count-1];
				clearList(barList);
				barMatrix.RemoveAt(barMatrix.Count-1);
			}

			// If there aren't enough lists, add until there are.
			while (barMatrix.Count < numBuckets[1]) {
				barList = createBarList();
				barMatrix.Add(barList);
			}
		}
	}

	private static function updateBarsZ() {
		for (var barMatrix in bars) {
			for (var barList in barMatrix) {

				// If there are too many bars, remove until there are the right number
				while (barList.Count > numBuckets[2]) {
					var bar = barList[barList.Count-1];
					clearBar(bar);
					barList.RemoveAt(barList.Count-1);
				}

				// If there aren't enough bars, add until there are.
				while (barList.Count < numBuckets[2]) {
					bar = createBar();
					barList.Add(bar);
				}

			}
		}
	}

	private static function clearMatrix(barMatrix : List.<List.<Bar> >) {
		for (var barList in barMatrix) {
			clearList(barList);
		}
		barMatrix.Clear();
	}

	private static function clearList(barList: List.<Bar>) {
		for (var bar in barList) {
			clearBar(bar);
		}
		barList.Clear();
	}

	private static function clearBar(bar : Bar) {
		Destroy(bar.gameObject);
	}

	private static function createBarMatrix() {
		var barMatrix = new List.<List.<Bar> >();
		for (var y = 0 ; y < numBuckets[1] ; y++) {
			var barList = createBarList();
			barMatrix.Add(barList);
		}
		return barMatrix;
	}

	private static function createBarList() {
		var barList = new List.<Bar>();
		for (var z = 0 ; z < numBuckets[2] ; z++) {
			barList.Add(createBar());
		}
		return barList;
	}

	private static function createBar() : Bar {
		var bar = GameObject.Instantiate(barPrefab, Vector3.zero, new Quaternion()).GetComponent(Bar);
		return bar;
	}

}