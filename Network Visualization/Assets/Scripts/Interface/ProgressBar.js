#pragma strict

static var progress = 0.01;
static var instance : ProgressBar;
var height = 4.0;
var top = -height;

static function getInstance() {
	if (instance == null) {
		instance = GameObject.FindGameObjectWithTag("GameController").GetComponent(ProgressBar);
	}
	return instance;
}

function OnGUI() {
	progress = Mathf.Clamp(progress, 0, 1);

	var desiredTop = (progress < 0.99 && progress > 0) ? 0.0 : -height-5;
	top = Mathf.Lerp(top, desiredTop, .1);

	var backgroundRect = new Rect(0, top, Screen.width, 4);
	var progressRect = new Rect(0, top, Screen.width*(progress*progress), 4);
	GUI.color = new Color(0, 0, 0, .1);
	GUI.Box(backgroundRect, "");
	GUI.color = ColorController.GenFractionalColor(1-(progress*progress));
	GUI.Button(progressRect, "");
}

static function setProgress(input : float) {
	progress = input;
}
