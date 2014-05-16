﻿#pragma strict

class FreeCamera extends MonoBehaviour {

	//Used for camera movement
	var x : float = 0;
	var y : float = 0;
	var r : float = 0;

	private static var transitionTime : float;

	static function StartCamera() {
		transitionTime = Time.time;
	}

	function Update() {
		if (!CameraController.isFree()) {
			return;
		}

		transform.parent = null;

		var freeRotateSpeed : float = 10.0;
		if(Input.GetMouseButton(1)){
			x = Input.GetAxis("Mouse X") * freeRotateSpeed;
			y = Input.GetAxis("Mouse Y") * freeRotateSpeed;
			
			transform.RotateAround(transform.position, transform.right, -y);
			transform.RotateAround(transform.position, transform.up, x);
		}

		var speed : int;
		if (Input.GetButton("Shift")){
			speed = 2;
		} else {
			speed = 1;
		}
		
		var h : float = Input.GetAxis("Horizontal")*speed;
		var f : float = Input.GetAxis("Vertical")*speed;
		var v : float = Input.GetAxis("StrafeVertical")*speed;
		
		transform.position += f*transform.forward;
		transform.position += h*transform.right;
		transform.position += v*transform.up;

		//Orient the camera to always be right side up
		var oldRotation = transform.rotation;
		transform.LookAt(transform.position + transform.forward, Vector3.up);
		if (Time.time - transitionTime < 1) {
			transform.rotation = Quaternion.Lerp(oldRotation, transform.rotation, 0.3);
		}

	}

}