#pragma strict

class GraphMenu extends BaseMenu {
	private static var fileScrollPosition : Vector2 = Vector2.zero;
	private static var axesScrollPosition : Vector2 = Vector2.zero;

	static var DROPDOWN_ID = "1";

	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		title = "Graphing";
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
		if (GraphController.isGraphing()){
			GUI.color = new Color(1, .3, .3);
			var button_text = "Disable Graphing";
		} else {
			GUI.color = new Color(.4, 1, .4);
			button_text = "Enable Graphing";
		}
		if (GUI.Button(new Rect(x+10, cur_y, width-20, 30), button_text)) {
			GraphController.toggleGraphing();
		}

		GUI.color = Color.white;
		return cur_y+30;
	}

	function DrawFileSelection(cur_y : int) {
		cur_y += 5;
	
		//Draw the file selection dropdown
		var selection_rect = new Rect(x+5, cur_y, width-10, 30);
		var dropHeight = 120;
		var fileNames = FileManager.getFileNames();
		var selected_file_index = GraphController.getFileIndex();
		var new_selected_index = Dropdown.Select(selection_rect, dropHeight, fileNames, selected_file_index, DROPDOWN_ID, "Select a File");
		
		//Update file if necessary
		if (new_selected_index != selected_file_index) {
			GraphController.setFileIndex(new_selected_index);
		}

		return cur_y+30;
	}

	function DrawOptions(cur_y : int) {

		//Don't draw options if it's a linking table or you're graphing.
		var file = GraphController.getFile();
		if (file == null || file.linking_table) {
			return cur_y;
		}

		cur_y += 5;

		var optionsRect = new Rect(x+5, cur_y, width-10, 70);
		GUI.Box(optionsRect, "");

		var sizeRect = new Rect(x+10, cur_y+5, width/2-10, 20);
		var isForcingNodeSize = GraphController.isForcingNodeSize();
		if (GUI.Toggle(sizeRect, isForcingNodeSize, "Fix Node Size") != isForcingNodeSize) {
			GraphController.setForcingNodeSize(!isForcingNodeSize);
		}

		if (!isForcingNodeSize) {
			GUI.color = Color.gray;
		} 

		var original_size = GraphController.getForcedNodeSize();
		var new_size = GUI.HorizontalSlider(Rect(x+20, cur_y+25, width/2-50, 20), original_size, 1.0, 15.0);
		if (original_size != new_size) {
			GraphController.setForcedNodeSize(new_size);
		}

		GUI.color = Color.white;

		var axesRect = new Rect(x+width/2, cur_y+5, width/2, 20);
		var isDrawingAxes = AxisController.isDrawingAxes();
		if (GUI.Toggle(axesRect, isDrawingAxes, "Draw Axes") != isDrawingAxes) {
			AxisController.setDrawingAxes(!isDrawingAxes);
		}

		if (!isDrawingAxes) {
			GUI.color = Color.gray;
		} else {
			GUI.color = Color.white;
		}

		var gridRect = new Rect(x+width/2+30, cur_y+25, width/2-30, 20);
		var isDrawingGrid = AxisController.isDrawingGrid();
		if (GUI.Toggle(gridRect, isDrawingGrid, "Draw Grid") != isDrawingGrid && isDrawingAxes) {
			AxisController.setDrawingGrid(!isDrawingGrid);
		}

		var labelsRect = new Rect(x+width/2+30, cur_y+45, width/2-30, 20);
		var isDrawingLabels = AxisController.isDrawingLabels();
		if (GUI.Toggle(labelsRect, isDrawingLabels, "Draw Labels") != isDrawingLabels && isDrawingAxes) {
			AxisController.setDrawingLabels(!isDrawingLabels);
		}

		GUI.color = Color.white;
		return cur_y + 70;
	}

	function DrawAxesSelection(cur_y : int) {
		cur_y +=5;

		var file = GraphController.getFile();
		if (file == null) {
			return -1;
		} else if (file.linking_table) {
			//store alignment and center.
			var oldLabelAlignment = GUI.skin.label.alignment;
			GUI.skin.label.alignment = TextAnchor.MiddleCenter;

			GUI.Label(new Rect(x+5, cur_y+20, width-10, 20), "Cannot graph linking tables.");
			
			//restore alignment and return
			GUI.skin.label.alignment = oldLabelAlignment;
			return cur_y + 20;
		}

		var attrs = file.attributes;

		var axesRect = new Rect(x+5, cur_y, width-10, MenuController.getScreenHeight()-cur_y-5);
		GUI.Box(axesRect, "Select Axes");

		

		cur_y+=20;
		var axis_spacing = 25; //horizontal space between radio buttons
		var axes = GraphController.getAxes();

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
			var attrRect = new Rect(10, scroll_y, width/2-10, 20);
				
			if (attribute == axes[0]) {
				GUI.color = Color.red;
			} else if (attribute == axes[1]) {
				GUI.color = Color.green;
			} else if (attribute == axes[2]) {
				GUI.color = Color.blue;
			} else {
				GUI.color = Color.white;
			}
			
			GUI.Label(attrRect, attribute.getRestrictedName(width/2-10));
			
			attrRect.x+=width/2; attrRect.width = 15;
			for (var i = 0 ; i < 3 ; i++) {
				var alreadySelected = (attribute == axes[i]);
				var newlySelected = GUI.Toggle (attrRect, alreadySelected, "");

				if (newlySelected && !alreadySelected) {
					GraphController.setAxis(i, attribute);
				} else if (!newlySelected && alreadySelected) {
					GraphController.setAxis(i, null);
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