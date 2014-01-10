#pragma strict

private var timeSeriesMenu : TimeSeriesMenu;
private var popupWindow : PopupWindow;
private var mainMenu : MainMenu;
private var selectionController : SelectionController;

function Start() {
	timeSeriesMenu = GetComponent(TimeSeriesMenu);
	popupWindow = GetComponent(PopupWindow);
	mainMenu = GetComponent(MainMenu);
	selectionController = GetComponent(SelectionController);
}

function Update() {
	handleEscapePress();
}

function handleEscapePress() {

	//Escape priority in order: Popup, MainMenu children, Selected Nodes, TimeSeries, MainMenu (Toggles)
	if (Input.GetButtonDown("Escape")) {
		if (popupWindow.isDisplaying()) {
			popupWindow.DisableDisplay();
		} else if (mainMenu.isDisplayingChild()) {
    		mainMenu.DisableDisplay(true); //cascade disabling responsibility down the submenus
	    } else if (timeSeriesMenu.displaying) {
    		timeSeriesMenu.DisableDisplay();
    	} else if (selectionController.nodes.Count > 0) {
    		selectionController.clearSelectedNodes();
    	} else {
    		mainMenu.ToggleDisplay();
		}
	}
}

//Should be respected by all menus except Main and TimeSeries
function getScreenHeight() {
	if (timeSeriesMenu.displaying) {
		return Screen.height - TimeSeriesMenu.height;
	} else {
		return Screen.height;
	}
}

