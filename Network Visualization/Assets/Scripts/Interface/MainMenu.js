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
	var plane : Texture;
	var save : Texture;
	var load : Texture;

	function Start() {
		parent = null;
		super.Start();
		width = 45;
		Time.timeScale = 4;
		displaying = true;
	}

	function OnGUI() {
		GUI.skin = MenuController.getSkin();

		var menuRect = new Rect(x, MenuController.getScreenTop(), width, Screen.height - MenuController.getScreenTop());
		GuiPlus.Box(menuRect, title);
		
		var centeredStyle = GUI.skin.GetStyle("Label");
		centeredStyle.alignment = TextAnchor.MiddleLeft;
		
		var mousePosition = GuiPlus.getMousePosition();
		
		var label_position : Rect = new Rect(50, 0, 100, 35);
		
		GUI.color = Color.white;
		var button_position : Rect = new Rect(5, MenuController.getScreenTop()+5, 35, 35);
		if (GuiPlus.Button(button_position, more)){
			DisableDisplay(TimeSeriesMenu);
			ToggleDisplay(MainMenu);
		}	

		//Make sure that clicking the button when the menu is hidden doesn't trigger a click.
		GuiPlus.Box(button_position, "", false);


		if (button_position.Contains(mousePosition)){}
			
		if (displaying) {
			var cur_y = 60 + MenuController.getScreenTop();
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.white;
			if (GuiPlus.Button(button_position, upload)){
				chooseMenu(FileMenu);
			}	

			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = new Color(.7, .7, .4);
			if (GuiPlus.Button(button_position, save)){
				WorkspaceManager.toggleSelectingSaveFile();
			}

			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.white;
			if (GuiPlus.Button(button_position, load)){
				WorkspaceManager.toggleSelectingLoadFile();				
			}

			cur_y += 80;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.white;
			if (GuiPlus.Button(button_position, search) || (Input.GetButtonDown("Search") && Input.GetButton("Ctrl"))){
				chooseMenu(SearchMenu);
			}
			
			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.magenta;
			if (GuiPlus.Button(button_position, display)){
				chooseMenu(ColorRuleMenu);
			}
			
			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = Color.yellow;
			if (GuiPlus.Button(button_position, gear)){
				chooseMenu(TerminalMenu);
			}

			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = new Color(1, .7, 0);
			if (GuiPlus.Button(button_position, graph)){
				chooseMenu(GraphMenu);
			}
			if (button_position.Contains(mousePosition)){}

			cur_y += 40;
			button_position = new Rect(x+5, cur_y, 35, 35);
			GUI.color = new Color(.2, .7, .7);
			if (GuiPlus.Button(button_position, plane)){
				PlanarityController.toggleFlat();
			}
			
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
			if (GuiPlus.Button(button_position, lock_pic)){
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
			if (GuiPlus.Button(button_position, playpause)){
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
			if (GuiPlus.Button(button_position, ff)){
				NetworkController.gameSpeed=next_speed;
			}
				


			button_position = new Rect(x+5, Screen.height-50, 35, 35);
			GUI.color = Attribute.TIME_SERIES_COLOR;
			if (GuiPlus.Button(button_position, clock)){
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

		if (chosenMenu == ColorRuleMenu) {
			ToggleDisplay(ColorRuleMenu);
		} else {
			DisableDisplay(ColorRuleMenu);
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