#pragma strict

class BarController extends MonoBehaviour {

	//access with bars[x][y][z];
	private var bars = new List.<List.<List.<Bar> > >();

	function Update() {
		if (GraphController.isGraphing() && GraphController.getMethodIndex() == GraphController.HISTOGRAM) {
			updateBarPositions();
		}
	}

	//Called when the axis selecctions change.
	static function updateBars() {
		//TODO: Figure this out from axis controller
		var numBuckets = [10, 10, 10];


	}

	//Called every frame to alter the positions and sizes of the bars.
	static function updateBarPositions() {

	}

}