#pragma strict

class TerminalMenu extends BaseMenu {

	private var height : float;
	private static var bufferScrollPosition : Vector2 = Vector2.zero;


	//Options for hiding columns
	var displaying_time = true;
	var displaying_context = true;

	//Options for hiding different levels
	var displaying_levels = new boolean[4];
	private var level_colors = new Color[4];
	
	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		width = 600;
		x =  -width;

		//initialize to display all levels.
		for (var level in displaying_levels) {
			level = true;
		}
		level_colors[0] = Color.green; 	//Command
		level_colors[1] = Color.white; 	//Verbose
		level_colors[2] = Color.yellow;	//Warning
		level_colors[3] = new Color(1, .2, .2);  	//Error

	}	

	function OnGUI() {

		desired_x = (Screen.width - width)/2;
		height = MenuController.getScreenHeight()*.7;
		var top : float = (MenuController.getScreenHeight() - height)/2;
		GuiPlus.Box(new Rect(x, top, width, height), "");
		
		if (!displaying) {
			return;
		}

		top = DrawColumnOptions(top);
		DrawBuffer(top);
		DrawCommandPrompt();
		DrawOptions();		
	}

	function DrawColumnOptions(top : float) {
		var timeRect = new Rect(x+10, top, 200, 20);
		var contextRect = new Rect(x+210, top, 200, 20);

		displaying_time = new GUI.Toggle(timeRect, displaying_time, " Display Timestamp");
		displaying_context = new GUI.Toggle(contextRect, displaying_context, " Display Context");

		return top+25;
	}

	function DrawBuffer(top : float) {
		var cur_y = top;

		var outerWidth = width;
		var outerRect = new Rect(x, cur_y, outerWidth, height-25);
		var innerWidth = outerWidth-16;
		var innerRect = new Rect(0, 0, innerWidth, 20*Terminal.bufferSize());

		bufferScrollPosition = GUI.BeginScrollView (outerRect, 
				bufferScrollPosition, innerRect);

			if (displaying_time) {
				var timeWidth = 70;
			} else {
				timeWidth = 0;
			}

			if (displaying_context) {
				var contextWidth = 220;
			} else {
				contextWidth = 0;
			}

			var textWidth = innerWidth - timeWidth - contextWidth - 40;
			
			var timeX = 5;
			var textX = timeX + timeWidth;
			var contextX = textX + textWidth;

			var timeRect = new Rect(timeX, 0, timeWidth, 20);
			var textRect = new Rect(textX, 0, textWidth, 20);
			var contextRect = new Rect(contextX, 0, contextWidth, 20);
			var boxRect = new Rect(0, 0, innerWidth, 20);
			
			for (var i=0 ; i < Terminal.bufferSize() ; i++) {
				var message = Terminal.getMessage(i);
				
				//Draw the colored background box.
				GUI.color = level_colors[message.level];
	
				if (displaying_time) {
					var t = message.timestamp;
					var t_string = String.Format("{0:D2}:{1:D2}:{2:D2}", t.Hour, t.Minute, t.Second);
					GUI.Label(timeRect, t_string);
				}
				GUI.Label(textRect, message.text);
				if (displaying_context) {
					GUI.Label(contextRect, message.context);
				}
				textRect.y+=20; timeRect.y+=20; contextRect.y+=20; boxRect.y+=20;
			}

		GUI.EndScrollView();
	}

	function DrawCommandPrompt() {

	}

	function DrawOptions() {

	}


}