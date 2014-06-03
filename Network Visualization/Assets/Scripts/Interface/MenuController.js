#pragma strict

function Update() {
	handleEscapePress();
}

static var gameController : GameObject;

static function handleEscapePress() {

	//Escape priority in order: Popup, MainMenu children, Selected Nodes, TimeSeries, MainMenu (Toggles)
	if (Input.GetButtonDown("Escape")) {
		if (PopupWindow.isDisplaying()) {
			BaseMenu.DisableDisplay(PopupWindow);
		} else if (getInstance(MainMenu).isDisplayingChild()) {
    		BaseMenu.DisableDisplay(MainMenu, true); //cascade disabling responsibility down the submenus
	    } else if (getInstance(TimeSeriesMenu).displaying) {
    		BaseMenu.DisableDisplay(TimeSeriesMenu);
    	} else if (SelectionController.nodes.Count > 0) {
    		SelectionController.clearSelectedNodes();
    	} else {
    		BaseMenu.ToggleDisplay(MainMenu);
		}
	}
}

//Should be respected by all menus except Main and TimeSeries
static function getScreenHeight() {
	var output = Screen.height;// - getScreenTop();

	if (getInstance(TimeSeriesMenu).displaying) {
		output -= TimeSeriesMenu.height;
	}

	return output;
}

static function getScreenTop() {
	return ProgressBar.getBottom();
}

static function getScreenLeft() {
	return gameController.GetComponent(MainMenu).getRightSideOfMenus();
}

static function getScreenRight() {
	return SelectionMenu.getLeftSide();
}

static function getInstance(menuClass : System.Type) : BaseMenu {
	if (!gameController) {
		gameController = GameObject.FindGameObjectWithTag("GameController");
	}
	return gameController.GetComponent(menuClass);
}

