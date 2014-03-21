#pragma strict
class MainMenu extends BaseMenu {

	var gear : Texture;
	var play : Texture;
	var pause : Texture;
	var ff : Texture;
	var locked : Texture;
	var unlocked : Texture;
	var more : Texture;
	var search : Texture;
	var display : Texture;
	var upload : Texture;
	var zoom_to_fit : Texture;
	var graph : Texture;
	var clock : Texture;

	function Start() {
		parent = null;
		super.Start();
		width = 45;
		Time.timeScale = 4;
		displaying = true;
	}

	function OnGUI() {
		var menuRect = new Rect(x, 0, width, Screen.height);
		GuiPlus.Box(menuRect, title);
		
		var centeredStyle = GUI.skin.GetStyle("Label");
		centeredStyle.alignment = TextAnchor.MiddleLeft;
		
		var mousePosition = Input.mousePosition;
		mousePosition.y = Screen.height - mousePosition.y;
		
		var label_position : Rect = new Rect(50, 0, 100, 35);
		
		GUI.color = Color.white;
		var button_position : Rect = new Rect(5, 5, 35, 35);
		if (GUI.Button(button_position, more)){
			DisableDisplay(TimeSeriesMenu);
			ToggleDisplay(MainMenu);
		}	
			
		if (displaying) {
			var cur_y = 60;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.white;
			if (GUI.Button(button_position, search) || (Input.GetButtonDown("Search") && Input.GetButton("Ctrl"))){
				chooseMenu(SearchMenu);
			}
			if (button_position.Contains(mousePosition)){} //TODO: tooltips
			
			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.magenta;
			if (GUI.Button(button_position, display)){
				chooseMenu(DisplayMenu);
			}
			if (button_position.Contains(mousePosition)){}
			
			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.yellow;
			if (GUI.Button(button_position, gear)){
				chooseMenu(TerminalMenu);
			}
			if (button_position.Contains(mousePosition)){}


			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = new Color(1, .7, 0);
			if (GUI.Button(button_position, graph)){
				chooseMenu(GraphMenu);
			}
			if (button_position.Contains(mousePosition)){}

			
			cur_y += 80;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = new Color(1, 0, 0);
			if (CameraController.isFree()){
				var lock_pic = unlocked;
				var tooltip = "Lock Camera";			
			}	else {
				lock_pic = locked;
				tooltip = "Unlock Camera";
			}
			if (GUI.Button(button_position, lock_pic)){
				CameraController.toggleFree();
			}

			

			
			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = new Color(0, 1, 1);
			if (NetworkController.isPaused()){
				var playpause = play;
				tooltip = "Play";
			}	else {
				playpause = pause;
				tooltip = "Pause";
			}
			if (GUI.Button(button_position, playpause)){
				NetworkController.TogglePause();
			}

			
			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = new Color(0, 1, 0);
			var next_speed : int; 
			tooltip = "Fast Forward (x" + NetworkController.gameSpeed + ")";		
			if (NetworkController.gameSpeed >= 16){
				next_speed = 1;
			} else {
				next_speed = NetworkController.gameSpeed*2;
			}	
			if (GUI.Button(button_position, ff)){
				NetworkController.gameSpeed=next_speed;
			}
				
			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.white;
			if (GUI.Button(button_position, upload)){
				chooseMenu(FileMenu);
			}
			if (button_position.Contains(mousePosition)){}

			button_position = new Rect(x+5, Screen.height-50, 35, 35);
			GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
			if (GUI.Button(button_position, clock)){
				TimeSeriesMenu.ToggleDisplay(TimeSeriesMenu);
			}

		}
		
	}

	static function chooseMenu(chosenMenu : System.Type){
		if (chosenMenu == SearchMenu) {
			ToggleDisplay(SearchMenu);
		} else {
			DisableDisplay(SearchMenu);
		}

		if (chosenMenu == DisplayMenu) {
			ToggleDisplay(DisplayMenu);
		} else {
			DisableDisplay(DisplayMenu);
		}

		if (chosenMenu == FileMenu) {
			ToggleDisplay(FileMenu);
		} else {
			DisableDisplay(FileMenu);
		}

		if (chosenMenu == GraphMenu) {
			ToggleDisplay(GraphMenu);
		} else {
			DisableDisplay(GraphMenu);
		}

		if (chosenMenu == TerminalMenu) {
			ToggleDisplay(TerminalMenu);
		} else {
			DisableDisplay(TerminalMenu);
		}

	}
}