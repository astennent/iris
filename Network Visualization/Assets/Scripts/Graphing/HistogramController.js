#pragma strict

class HistogramController extends MonoBehaviour {
	
	static function updateHistogram() {
		updateBarPositions();
		updateCountAxisScale();
	}

	private static function updateBarPositions() {

		var bars = BarController.getBars();

		var ranges = getRanges();

		var xAdjust = GraphController.getScale() / (bars.Count) / 2.0;
		var yAdjust = GraphController.getScale() / (bars[0].Count) / 2.0;
		var zAdjust = GraphController.getScale() / (bars[0][0].Count) / 2.0;

		for (var x = 0.0 ; x < bars.Count ; x++) {
			var xPosition = calculatePosition(x, bars.Count, xAdjust);
			var barMatrix = bars[x];

			for (var y = 0.0 ; y < barMatrix.Count ; y++) {
				var yPosition = calculatePosition(y, barMatrix.Count, yAdjust);
				var barList = barMatrix[y];

				for (var z = 0.0 ; z < barList.Count ; z++) {
					var zPosition = calculatePosition(z, barList.Count, zAdjust);
					var bar = barList[z];

					bar.setDesiredPosition(new Vector3(xPosition, yPosition, zPosition));

					var fillMargins = false;
					if (fillMargins) {
						var marginMultiplier : float = 2;
					} else {
						marginMultiplier = 1;
					}

					bar.setDesiredScale(new Vector3(xAdjust*marginMultiplier, yAdjust*marginMultiplier, zAdjust*marginMultiplier));
				}

			}
		}
	}

	private static function calculatePosition(index : float, barCount : int, adjust : float) {
		if (barCount > 1) {
			var position = GraphController.getScale() * (index / barCount) + adjust;
		} else {
			position = GraphController.getScale() / 2.0;
		}
		return position;
	}

	private static function getRanges() {

		var mins = new float[3];
		var maxes = new float[3];
		var ranges = new float[3];

		mins[0] = GraphController.getMaxValue(0);
		maxes[0] = GraphController.getMinValue(0)+0.001;
		mins[1] = GraphController.getMaxValue(1);
		maxes[1] = GraphController.getMinValue(1)+0.001;
		mins[2] = GraphController.getMaxValue(2);
		maxes[2] = GraphController.getMinValue(2)+0.001;
		ranges[0] = maxes[0] - mins[0] + 0.001;
		ranges[1] = maxes[1] - mins[1] + 0.001;
		ranges[2] = maxes[2] - mins[2] + 0.001;


		var countAxis = GraphController.getSpecialRowAxis();
		mins[countAxis] = 0;
		maxes[countAxis] = 0.001;
		ranges[countAxis] = 0.001;

		return ranges;
	}

	private static function updateCountAxisScale() {

		var bars = BarController.getBars();
		var axes = GraphController.getAxes();

		var file = GraphController.getFile();
		if (file == null) return;

		var counts = new int[bars.Count, bars[0].Count, bars[0][0].Count];
		
		var nodes = file.getNodes();
		for (var node in nodes) {

			var bucket = new float[3];

			for (var axisIndex = 0 ; axisIndex < 3 ; axisIndex++) {
				var attribute = axes[axisIndex];
				if (attribute != null) {
					var val = node.GetNumeric(attribute);
					var bucketVal = getBucket(val, axisIndex);
					bucket[axisIndex] = bucketVal;
				}
			}

			try {
			counts[bucket[0], bucket[1], bucket[2]] += 1;
			} catch(e) {
				print(bucket[0] + " " + bucket[1] + " " + bucket[2]);
			}

		}

		var highestBar = 0.0001;

		for (var x = 0 ; x < bars.Count ; x++) {
			for (var y = 0 ; y < bars[0].Count ; y++) {
				for (var z = 0 ; z < bars[0][0].Count ; z++) {
					var barHeight = counts[x, y, z];
					if (barHeight > highestBar) {
						highestBar = barHeight;
					}
				}
			}
		}

		var specialRowAxis = GraphController.getSpecialRowAxis();
		for (x = 0 ; x < bars.Count ; x++) {
			for (y = 0 ; y < bars[0].Count ; y++) {
				for (z = 0 ; z < bars[0][0].Count ; z++) {
					barHeight = counts[x, y, z] / highestBar * GraphController.getScale();
					bars[x][y][z].setDesiredScale(specialRowAxis, barHeight);
				}
			}
		}

	}

	private static function getBucket(val : float, axisIndex : int) {
		var max = GraphController.getMaxValue(axisIndex);
		var min = GraphController.getMinValue(axisIndex);
		var numBars = BarController.getNumBars(axisIndex);

		// Avoid divide-by-zero errors
		if (max-min == 0) {
			return 0;
		}

		var bucket = (val - min) / (max - min) * (numBars - 1);		

		return bucket;
	}

}