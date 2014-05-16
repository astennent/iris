#pragma strict

class CameraController extends MonoBehaviour {
	private static var style = 0;

	static var NETWORK = 0;
	static var FREE = 1;
	static var GRAPHING = 2;

	function Update() {
		//spacebar to switch camera type.
		if (Input.GetButtonDown("Jump")){
			toggleFree();
		}
	}

	static function isNetwork() {
		return style == NETWORK;
	}

	static function isFree() {
		return style == FREE;
	}

	static function isGraphing() {
		return style == GRAPHING;
	}

	static function useNetwork() {
		setStyle(NETWORK);
	}

	static function useFree() {
		setStyle(FREE);
	}

	static function useGraphing() {
		setStyle(GRAPHING);
	}

	private static function setStyle(style : int) {
		this.style = style;
		if (style == NETWORK) {
			NetworkCamera.StartCamera();
		} else if (style == FREE) {
			FreeCamera.StartCamera();
		} else {
			GraphingCamera.StartCamera();
		}
	}

	static function toggleFree() {
		if (style == NETWORK || style == GRAPHING) {
			setStyle(FREE);
		} else {
			setStyle( (GraphController.isGraphing()) ? GRAPHING : NETWORK ); 
		}
	}



}