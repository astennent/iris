#pragma strict

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

var displaying_tooltips : boolean;
private var networkController : NetworkController;

function Start(){
	displaying_tooltips = false;
	networkController = this.GetComponent(NetworkController);
	Time.timeScale = 1;
}

function OnGUI(){

	var menu_width : float;
	if (displaying_tooltips){
		menu_width = 160;
	} else {
		menu_width = 45;
	}
	
	var centeredStyle = GUI.skin.GetStyle("Label");
	centeredStyle.alignment = TextAnchor.MiddleLeft;
	
	GUI.Box(new Rect(0, 0, menu_width, Screen.height), "");		

	var mousePosition = Input.mousePosition;
	mousePosition.y = Screen.height - mousePosition.y;
	
	var label_position : Rect = new Rect(50, 0, 100, 35);
	
	GUI.color = Color.white;
	var button_position : Rect = new Rect(5, 5, 35, 35);
	if (GUI.Button(button_position, more)){
		displaying_tooltips = !displaying_tooltips;
	}	
		
	button_position = new Rect(5, 60, 35, 35);
	GUI.color = Color.white;
	if (GUI.Button(button_position, search) || (Input.GetButtonDown("Search") && Input.GetButton("Ctrl"))){
		this.GetComponent(SearchMenu).ToggleDisplay();
		this.GetComponent(DisplayMenu).DisableDisplay();
		this.GetComponent(FileMenu).DisableDisplay();

	}
	if (button_position.Contains(mousePosition)){}
	if (displaying_tooltips){
		label_position.y = button_position.y;
		GUI.Label(label_position, "Search");
	}
		
	button_position = new Rect(5, 100, 35, 35);
	GUI.color = Color.magenta;
	if (GUI.Button(button_position, display)){
		this.GetComponent(SearchMenu).DisableDisplay();
		this.GetComponent(DisplayMenu).ToggleDisplay();
		this.GetComponent(FileMenu).DisableDisplay();
	}
	if (button_position.Contains(mousePosition)){}
	if (displaying_tooltips){
		label_position.y = button_position.y;
		GUI.Label(label_position, "Display Settings");
	}		
		
	button_position = new Rect(5, 140, 35, 35);
	GUI.color = Color.yellow;
	if (GUI.Button(button_position, gear)){
		print("clicked");
	}
	if (button_position.Contains(mousePosition)){}
	if (displaying_tooltips){
		label_position.y = button_position.y;
		GUI.Label(label_position, "General Settings");
	}
	
	button_position = new Rect(5, 190, 35, 35);
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
	if (displaying_tooltips){
		label_position.y = button_position.y;
		GUI.Label(label_position, tooltip);
	}
	

	
	button_position = new Rect(5, 230, 35, 35);
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
	if (displaying_tooltips){
		label_position.y = button_position.y;
		GUI.Label(label_position, tooltip);
	}
	
	button_position = new Rect(5, 270, 35, 35);
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
	if (displaying_tooltips){
		label_position.y = button_position.y;
		GUI.Label(label_position, tooltip);
	}
	
				
	button_position = new Rect(5, 320, 35, 35);
	GUI.color = Color.white;
	if (GUI.Button(button_position, upload)){
		this.GetComponent(SearchMenu).DisableDisplay();
		this.GetComponent(DisplayMenu).DisableDisplay();
		this.GetComponent(FileMenu).ToggleDisplay();
	}
	if (button_position.Contains(mousePosition)){}
	if (displaying_tooltips){
		label_position.y = button_position.y;
		GUI.Label(label_position, "Import Files");
	}	

	
}