#pragma strict

class GraphMenu extends BaseMenu {
	private var fileScrollPosition : Vector2 = Vector2.zero;
	private var axesScrollPosition : Vector2 = Vector2.zero;

	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		title = "Graph Options";
		width = 260;
	}	

	function OnGUI(){
		super.OnGUI();	

		if (displaying) {
			var cur_y = DrawEnableButton(40);
			cur_y = DrawFileSelection(cur_y);
			cur_y = DrawOptions(cur_y);
			cur_y = DrawAxesSelection(cur_y);
		}
	}

	function DrawEnableButton(cur_y : int) {
		if (graphController.isGraphing()){
			GUI.color = new Color(1, .3, .3);
			var button_text = "Disable Graphing";
		} else {
			GUI.color = new Color(.4, 1, .4);
			button_text = "Enable Graphing";
		}
		if (GUI.Button(new Rect(x+10, cur_y, width-20, 30), button_text)) {
			graphController.toggleGraphing();
		}

		GUI.color = Color.white;
		return cur_y+30;
	}

	function DrawFileSelection(cur_y : int) {
		cur_y += 5;
		var files = fileManager.files;

		var fileRect = new Rect(x+5, cur_y, width-10, 90);
		GUI.Box(fileRect, "Select File");
		fileRect.height -= 20; fileRect.y+=20;

		fileScrollPosition = GUI.BeginScrollView (fileRect, 
				fileScrollPosition, Rect (0, 0, width-26, 25*files.Count));

		var scroll_y = 0;

		for (var file in files) {
			
			var buttonRect = new Rect(5, scroll_y, width-25, 25);
			var selected = false;

			if (file == graphController.getFile()) {
				GUI.color = new Color(1, .8, .1);
				selected = true;
			} else {
				GUI.color = Color.white;
			}

			if (GUI.Button(buttonRect,file.shortName()) && !selected) {
				graphController.setFile(file);
			}

			scroll_y += 25;
		}

		GUI.EndScrollView();

		GUI.color = Color.white;
		return cur_y+90;
	}

	function DrawOptions(cur_y : int) {
		//TODO:
		//Options Section:
			//toggle connections
			//toggle labels (show on mouseover?)
			//toggle auto-size
		//Axes Menu:
			//custom scale
			//tick marks options (disable, frequency)
			//color?

		return cur_y;
	}

	function DrawAxesSelection(cur_y : int) {
		cur_y +=5;

		var file = graphController.getFile();
		if (file == null) {
			return -1;
		} 

		var attrs = file.attributes;

		var axesRect = new Rect(x+5, cur_y, width-10, Screen.height-cur_y-5);
		GUI.Box(axesRect, "Select Axes");

		if (file.linking_table) {
			GUI.Label(new Rect(x+5, cur_y+20, width-10, 20), "[Cannot graph linking tables]");
			return cur_y + 20;
		}

		cur_y+=20;
		var axis_spacing = 25; //horizontal space between radio buttons
		var axes = graphController.getAxes();

		if (axes[0] != null) {GUI.color = Color.red;} else {GUI.color = Color.white;}
		GUI.Label(new Rect(x+width/2+18, cur_y, axis_spacing, 20), "X");

		if (axes[1] != null) {GUI.color = Color.green;} else {GUI.color = Color.white;}
		GUI.Label(new Rect(x+width/2+axis_spacing+18, cur_y, axis_spacing, 20), "Y");

		if (axes[2] != null) {GUI.color = Color.blue;} else {GUI.color = Color.white;}
		GUI.Label(new Rect(x+width/2+axis_spacing*2+18, cur_y, axis_spacing, 20), "Z");
		
		GUI.color = Color.white;

		axesRect.height -= 40; axesRect.y+=40;
		axesScrollPosition = GUI.BeginScrollView (axesRect, 
				axesScrollPosition, Rect (0, 0, width-26, 20*attrs.Count));

		var scroll_y = 0;

		for (var attribute : Attribute in attrs) {
			var attrRect = new Rect(10, scroll_y, width-25, 20);
			
			if (attribute.is_numeric) {
				GUI.color = new Color(.5, .5 , 1);
			} else {
				GUI.color = Color.white;
			}
			GUI.Label(attrRect, attribute.getRestrictedName(width/2-10));
			
			if (attribute == axes[0]) {
				GUI.color = Color.red;
			} else if (attribute == axes[1]) {
				GUI.color = Color.green;
			} else if (attribute == axes[2]) {
				GUI.color = Color.blue;
			} else {
				GUI.color = Color.white;
			}
			
			attrRect.x+=width/2; attrRect.width = 15;
			for (var i = 0 ; i < 3 ; i++) {
				var alreadySelected = (attribute == axes[i]);
				var newlySelected = GUI.Toggle (attrRect, alreadySelected, "");

				if (newlySelected && !alreadySelected) {
					graphController.setAxis(i, attribute);
				} else if (!newlySelected && alreadySelected) {
					graphController.setAxis(i, null);
				}
				
				attrRect.x+=axis_spacing;
			}


			scroll_y += 20;
		}

		GUI.EndScrollView();
		GUI.color = Color.white;
		return cur_y;
	}
}