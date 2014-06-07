#pragma strict

class GraphingCamera extends MonoBehaviour {

	static private var positionIndex = 0;

	var positions = new List.<Vector3>();
	var rotations = new List.<Quaternion>();

	function Start() {
		positions.Add(new Vector3(-70, 190, -70));
		positions.Add(new Vector3(90, 80, -90));
		positions.Add(new Vector3(280, 80, 80));
		positions.Add(new Vector3(110, 80, 280));
		positions.Add(new Vector3(-80, 80, 110));

		rotations.Add(new Quaternion(-0.3, -0.3, 0.1, -0.9));
		rotations.Add(new Quaternion(.1, 0, 0, 1));
		rotations.Add(new Quaternion(.1, -.7, .1, .7));
		rotations.Add(new Quaternion(0, 1, -.1, 0));
		rotations.Add(new Quaternion(.1, .7, -.1, .7));
	}

	static function StartCamera() {

	}

	function Update() {
		if (!CameraController.isGraphing()) {
			return;
		}

		transform.position = Vector3.Lerp(transform.position, positions[positionIndex], 0.3);
		transform.rotation = Quaternion.Lerp(transform.rotation, rotations[positionIndex], 0.3);

		//Check if the user is trying to control the camera
		if (Input.GetAxis("Horizontal") != 0 || Input.GetAxis("Horizontal") != 0 || 
			Input.GetAxis("StrafeVertical") != 0 || Input.GetMouseButton(1)) {
			CameraController.useFree();
		}
	}

	static function setPositionIndex(index : int) {
		positionIndex = index;
		CameraController.useGraphing();
	}


}