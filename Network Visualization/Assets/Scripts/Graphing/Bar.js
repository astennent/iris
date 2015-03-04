#pragma strict

class Bar extends MonoBehaviour {

	var desiredPosition : Vector3;
	var desiredScale : Vector3;

	// This class will represent the bars in histograms and bar graphs.
	function setDesiredPosition(desiredPosition : Vector3) {
		this.desiredPosition = desiredPosition;
	}

	function setDesiredScale(desiredScale : Vector3) {
		this.desiredScale = desiredScale;
	}

	function setDesiredScale(axisIndex : int, scale : float) {
		this.desiredScale[axisIndex] = scale;
	}

	function Update() {
		snapToBottom();
		transform.position = Vector3.Lerp(transform.position, desiredPosition, 0.5);
		transform.localScale = Vector3.Lerp(transform.localScale, desiredScale, 0.5);

		GetComponent.<Renderer>().enabled = (GraphController.isGraphing() && GraphController.isUsingMethodWithBars());
	}

	function snapToBottom() {
		//Snap to the bottom.
		var specialAxis = GraphController.getSpecialRowAxis();
		if (specialAxis != -1) {
			desiredPosition[specialAxis] = desiredScale[specialAxis]/2;
		}
	}

}