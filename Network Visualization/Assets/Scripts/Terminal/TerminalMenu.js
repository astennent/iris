#pragma strict

class TerminalMenu extends BaseMenu {

	private var height : float;

	private static var bufferScrollPosition : Vector2 = Vector2.zero;

	//Options for hiding columns
	var displaying_time = true;
	var displaying_context = true;
	var commandText = "";

	//Options for hiding different levels
	var displaying_levels = new boolean[4];
	private var level_colors = new Color[4];

	private static var commandPromptHeight = 23;
	private static var headerOptionsHeight = 25;

	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		width = 700;
		x =  -width;

		//initialize to display all levels.
		for (var level in displaying_levels) {
			level = true;
		}
		level_colors[0] = Color.white; 	//Command
		level_colors[1] = Color.green; 	//Verbose
		level_colors[2] = Color.yellow;	//Warning
		level_colors[3] = new Color(1, .2, .2);  	//Error

	}	

	function OnGUI() {

		GUI.skin = MenuController.getSkin();
		
		desired_x = (Screen.width - width)/2;
		height = MenuController.getScreenHeight()*.7;
		var top : float = (MenuController.getScreenHeight() - height)/2;
		GuiPlus.Box(new Rect(x, top, width, height), "");
		
		if (!displaying) {
			return;
		}

		DrawColumnOptions(top);
		DrawBuffer(top+25);
		DrawCommandPrompt(top + height - commandPromptHeight);
		DrawOptions();		
	}

	function DrawColumnOptions(top : float) {
		var timeRect = new Rect(x+10, top, 200, headerOptionsHeight-5);
		var contextRect = new Rect(x+210, top, 200, headerOptionsHeight-5);

		displaying_time = new GuiPlus.Toggle(timeRect, displaying_time, " Display Timestamp");
		displaying_context = new GuiPlus.Toggle(contextRect, displaying_context, " Display Context");
	}

	function DrawBuffer(top : float) {
		var cur_y = top;

		var outerWidth = width;
		var outerRect = new Rect(x, cur_y, outerWidth, height-commandPromptHeight-headerOptionsHeight);
		var innerWidth = outerWidth-16;
		var innerRect = new Rect(0, 0, innerWidth, 20*Terminal.bufferSize());

		bufferScrollPosition = GuiPlus.BeginScrollView (outerRect, 
				bufferScrollPosition, innerRect);

			var timeWidth = (displaying_time) ? 70 : 0;

			if (displaying_context) {
				var contextWidth = 120;
			} else {
				contextWidth = 0;
			}

			var textWidth = innerWidth - timeWidth - contextWidth - 6;
			
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
					GUI.TextField(timeRect, t_string);
				}
				GUI.TextField(textRect, message.text);
				if (displaying_context) {
					GUI.TextField(contextRect, message.context);
				}
				textRect.y+=20; timeRect.y+=20; contextRect.y+=20; boxRect.y+=20;
			}

		GuiPlus.EndScrollView();
	}

	function DrawCommandPrompt(top : float) {
		GUI.FocusControl("cmdprompt");	


		var promptWidth = 12;
		var promptLabel = "$:";

		GUI.color = Color.white;

		var promptRect = new Rect(x+5, top, promptWidth, commandPromptHeight);
		GuiPlus.Label(promptRect, promptLabel);

		// Check if the user pressed Enter, Up, or Down
		var pressedEnter = false;
		if (Event.current.type == EventType.KeyDown) {
			if (Event.current.keyCode == KeyCode.Return) {
				pressedEnter = true;
			} else if (Event.current.keyCode == KeyCode.UpArrow) {
				commandText = Terminal.cycleCommand(true);
			} else if (Event.current.keyCode == KeyCode.DownArrow) {
				commandText = Terminal.cycleCommand(false);
			}	
		}

		// Draw the command prompt field
		var cmdPromptRect = new Rect(x+5+promptWidth, top, width-promptWidth-5, commandPromptHeight);
		GUI.SetNextControlName("cmdprompt");
		commandText = GUI.TextField(cmdPromptRect, commandText);

		if (pressedEnter) {
			Terminal.Evaluate(commandText);
			commandText = "";
			bufferScrollPosition.y += Terminal.bufferSize() * 20;
		}
	}

	function DrawOptions() {

	}


}