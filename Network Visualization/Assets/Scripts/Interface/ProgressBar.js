﻿#pragma strict

static var progress = 0.01;
static var instance : ProgressBar;
static var height : float = 4.0;
static var bottom : float = 0.0;

static function getInstance() {
	if (instance == null) {
		instance = GameObject.FindGameObjectWithTag("GameController").GetComponent(ProgressBar);
	}
	return instance;
}

function OnGUI() {
	GUI.skin = MenuController.getSkin();

	progress = Mathf.Clamp(progress, 0, 1);

	var displayedProgress = progress * progress;
	var desiredBottom = (progress < 0.99 && progress > 0) ? height : 0;
	bottom = Mathf.Lerp(bottom, desiredBottom, .2);

	// Stop early because rendering with a very small (or zero) height will still show borders.
	if (bottom < 0.2) {
		return;
	}

	var backgroundRect = new Rect(0, bottom-height, Screen.width, height);
	var progressRect = new Rect(0, bottom-height, Screen.width*displayedProgress, height);
	GUI.color = new Color(0, 0, 0, .1);
	GuiPlus.Box(backgroundRect, "");
	GUI.color = ColorController.GenFractionalColor(1 - displayedProgress);
	GuiPlus.Box(progressRect, "");
}

static function setProgress(input : float) {
	progress = input;
}

static function getBottom() {
	return bottom;
}