	#pragma strict
class MainMenu extends PrimaryMenu {

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

	function Start() {
		super.Start();
		width = 45;
		Time.timeScale = 1;
		displaying = true;
	}

	function Update() {
		super.Update();
	    if (Input.GetButtonDown("Escape")) {
	    	displayMenu.setRuleIndex(-1);
	    	DisableDisplay(true); //cascade disabling responsibility down the submenus
	    } 
	}

	function OnGUI(){
		var menuRect = new Rect(x, 0, width, Screen.height);
		GUI.Box(menuRect, title);
		
		var centeredStyle = GUI.skin.GetStyle("Label");
		centeredStyle.alignment = TextAnchor.MiddleLeft;
		
		var mousePosition = Input.mousePosition;
		mousePosition.y = Screen.height - mousePosition.y;
		
		var label_position : Rect = new Rect(50, 0, 100, 35);
		
		GUI.color = Color.white;
		var button_position : Rect = new Rect(5, 5, 35, 35);
		if (GUI.Button(button_position, more)){
			ToggleDisplay();
		}	
			
		if (displaying) {
			button_position = new Rect(x+5, 60, 35, 35);
			GUI.color = Color.white;
			if (GUI.Button(button_position, search) || (Input.GetButtonDown("Search") && Input.GetButton("Ctrl"))){
				this.GetComponent(SearchMenu).ToggleDisplay();
				this.GetComponent(DisplayMenu).DisableDisplay();
				this.GetComponent(FileMenu).DisableDisplay();

			}
			if (button_position.Contains(mousePosition)){} //TODO: tooltips
			
			button_position = new Rect(x+5, 100, 35, 35);
			GUI.color = Color.magenta;
			if (GUI.Button(button_position, display)){
				this.GetComponent(SearchMenu).DisableDisplay();
				this.GetComponent(DisplayMenu).ToggleDisplay();
				this.GetComponent(FileMenu).DisableDisplay();
			}
			if (button_position.Contains(mousePosition)){}
			
				
			button_position = new Rect(x+5, 140, 35, 35);
			GUI.color = Color.yellow;
			if (GUI.Button(button_position, gear)){
				print("clicked");
			}
			if (button_position.Contains(mousePosition)){}

			
			button_position = new Rect(x+5, 190, 35, 35);
			GUI.color = new Color(1, 0, 0);
			if (Camera.main.GetComponent(NetworkCamera).freeCamera){
				var lock_pic = unlocked;
				var tooltip = "Lock Camera";			
			}	else {
				lock_pic = locked;
				tooltip = "Unlock Camera";
			}
			if (GUI.Button(button_position, lock_pic)){
				Camera.main.GetComponent(NetworkCamera).ToggleLocked();
			}

			

			
			button_position = new Rect(x+5, 230, 35, 35);
			GUI.color = new Color(0, 1, 1);
			if (networkController.paused){
				var playpause = play;
				tooltip = "Play";
			}	else {
				playpause = pause;
				tooltip = "Pause";
			}
			if (GUI.Button(button_position, playpause)){
				this.GetComponent(NetworkController).TogglePause();
			}

			
			button_position = new Rect(x+5, 270, 35, 35);
			GUI.color = new Color(0, 1, 0);
			var next_speed : int; 
			tooltip = "Fast Forward (x" + networkController.gameSpeed + ")";		
			if (networkController.gameSpeed == 8){
				next_speed = 1;
			} else {
				next_speed = networkController.gameSpeed*2;
			}	
			if (GUI.Button(button_position, ff)){
				networkController.gameSpeed=next_speed;
			}

			button_position = new Rect(x+5, 310, 35, 35);
			GUI.color = new Color(1, .8, .3);
			if (GUI.Button(button_position, zoom_to_fit)){
				print("clicked");
			}
			if (button_position.Contains(mousePosition)){}

			
						
			button_position = new Rect(x+5, 360, 35, 35);
			GUI.color = Color.white;
			if (GUI.Button(button_position, upload)){
				this.GetComponent(SearchMenu).DisableDisplay();
				this.GetComponent(DisplayMenu).DisableDisplay();
				this.GetComponent(FileMenu).ToggleDisplay();
			}
			if (button_position.Contains(mousePosition)){}

		}
		
	}
}