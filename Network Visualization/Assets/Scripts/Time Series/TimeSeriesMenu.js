#pragma strict

public class TimeSeriesMenu extends BaseMenu {

	static var height = 65;

	function Start() {
		super.Start();
		desired_x = 45;
		width = Screen.width - 45;
		x = -width;
	}

	function OnGUI() {

		//Modified from BaseMenu to stay at bottom, next to MainMenu.
		var menuRect = new Rect(x, Screen.height - height, width, height);
		guiplus.Box(menuRect, "");

		var box = new Rect(x+width-30, menuRect.y+4, 26, 26);
		if (GUI.Button(box, "X")){
			DisableDisplay();
		};
		
	}
}