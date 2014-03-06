#pragma strict

class GraphMenu extends BaseMenu {
	private static var fileScrollPosition : Vector2 = Vector2.zero;
	private static var axesScrollPosition : Vector2 = Vector2.zero;

	static var DROPDOWN_ID = "1";
	static var METHOD_DROPDOWN_ID = "GraphMenuMethod";

	static var colors = [Color.red, Color.green, Color.blue];

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
			if (GraphController.getFile() != null) {
				cur_y = DrawMethodSelection(cur_y);
				cur_y = DrawOptions(cur_y);
				cur_y = DrawAxesSelection(cur_y);
			}
		}
	}

	private function DrawEnableButton(cur_y : int) {
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

	private function DrawFileSelection(cur_y : int) {
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

	private function DrawMethodSelection(cur_y : int) {
		cur_y += 5;
	
		//Draw the file selection dropdown
		var selection_rect = new Rect(x+5, cur_y, width-10, 30);
		var dropHeight = 120;
		var fileNames = GraphController.getMethodNames();
		var selected_method_index = GraphController.getMethodIndex();
		var new_selected_index = Dropdown.Select(selection_rect, dropHeight, fileNames, selected_method_index, METHOD_DROPDOWN_ID, "Select a Method");
		
		//Update method if necessary
		if (new_selected_index != selected_method_index) {
			GraphController.setMethodIndex(new_selected_index);
		}

		return cur_y+30;
	}

	private function DrawOptions(cur_y : int) {

		//Don't draw options if it's a linking table or you have no file selected.
		var file = GraphController.getFile();
		if (file.linking_table) {
			//store alignment and center.
			var oldLabelAlignment = GUI.skin.label.alignment;
			GUI.skin.label.alignment = TextAnchor.MiddleCenter;

			GUI.Label(new Rect(x+5, cur_y, width-10, 20), "Cannot graph linking tables.");
			
			//restore alignment and return
			GUI.skin.label.alignment = oldLabelAlignment;
			return cur_y + 20;
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

	private function DrawAxesSelection(cur_y : int) {
		cur_y +=5;

		var file = GraphController.getFile();
		var attrs = file.attributes;

		var axesRect = new Rect(x+5, cur_y, width-10, MenuController.getScreenHeight()-cur_y-5);
		GUI.Box(axesRect, "Select Axes");

		var axes = GraphController.getAxes();
		var axis_spacing = 25; //horizontal space between radio buttons

		//Draw the labels for X, Y, and Z
		cur_y+=20;
		DrawAxisSelectionHeaders(cur_y, axis_spacing, axes);

		var innerHeightAdjust = 0;
		var methodRequiresSpecialRow = GraphController.methodRequiresSpecialRow();
		if (methodRequiresSpecialRow) {
			innerHeightAdjust = 30;
		}		

		axesRect.height -= 40; axesRect.y+=40;
		axesScrollPosition = GUI.BeginScrollView (axesRect, 
				axesScrollPosition, Rect (0, 0, width-26, 20*attrs.Count+innerHeightAdjust));

			var scroll_y = 0;

			if (methodRequiresSpecialRow) {
				DrawAxisSelectionRow(null, scroll_y+5, axis_spacing, axes);
				scroll_y += 30;
			}

			//Loop over all attributes and draw their rows
			for (var attribute : Attribute in attrs) {
				DrawAxisSelectionRow(attribute, scroll_y, axis_spacing, axes);
				scroll_y += 20;
			}

		GUI.EndScrollView();
		GUI.color = Color.white;
		return cur_y;
	}

	private function DrawAxisSelectionHeaders(cur_y : int, axis_spacing : int, axes : Attribute[]) {		
		if (axes[0] != null) {GUI.color = colors[0];} else {GUI.color = Color.white;}
		GUI.Label(new Rect(x+width/2+18, cur_y, axis_spacing, 20), "X");

		if (axes[1] != null) {GUI.color = colors[1];} else {GUI.color = Color.white;}
		GUI.Label(new Rect(x+width/2+axis_spacing+18, cur_y, axis_spacing, 20), "Y");

		if (axes[2] != null) {GUI.color = colors[2];} else {GUI.color = Color.white;}
		GUI.Label(new Rect(x+width/2+axis_spacing*2+18, cur_y, axis_spacing, 20), "Z");

		GUI.color = Color.white;
	}

	private function DrawAxisSelectionRow(attribute : Attribute, scroll_y : int, axis_spacing : int,  axes : Attribute[]) {
		var attrRect = new Rect(10, scroll_y, width/2-10, 20);
		var usingSpecialRow = (attribute == null);
		
		if (usingSpecialRow) {
			var countRect = new Rect(attrRect);
			countRect.y-=2; countRect.height+=4;
			countRect.x = 5; countRect.width = width-20;
			GUI.Box(countRect, "");
			GUI.Label(attrRect, "Number of Matches:");
		} else {
			GUI.color = getColorForAttribute(attribute, axes);
			GUI.Label(attrRect, attribute.getRestrictedName(width/2-10));
		}

		attrRect.x+=width/2; attrRect.width = 15;
		
		var usedAxisCount = 0;
		for (var a = 0 ; a < 3 ; a++) { if (axes[a] != null) usedAxisCount++; }

		for (var i = 0 ; i < 3 ; i++) {

			if (usingSpecialRow) {
				var alreadySelected = (i == GraphController.getSpecialRowAxis());
			} else {
				alreadySelected = (attribute == axes[i]);
			}

			//Turn gray if you won't be able to select because of graphing method
			if (attribute == null) {
				GUI.color = Color.white;
			} else {
				
				if (GraphController.methodRequiresOneSpecialRow() && //the method requires that somethign always be filled and...
						usedAxisCount == 2 && //There are already two axes being used and...
						GraphController.getSpecialRowAxis() == i &&  //the method is using the axis and...
						axes[0] != attribute && axes[1] != attribute && axes[2] != attribute) { //this row is not used (it can't be swapped)
					GUI.color = Color.gray;
				} else {
					GUI.color = getColorForAttribute(attribute, axes);
				}
			}

			var newlySelected = GUI.Toggle (attrRect, alreadySelected, "");


			if (newlySelected != alreadySelected) {
				if (usingSpecialRow) {
					GraphController.setSpecialRowAxis(i);
				} else {
					GraphController.setAxis(i, attribute);
				}
			}
					
			attrRect.x+=axis_spacing;
		}
	}

	function getColorForAttribute(attribute : Attribute, axes : Attribute[]) {
		for (var i = 0 ; i < 3 ; i++) {
			if (attribute == axes[i]) {
				return colors[i];
			}
		}
		return Color.white;
	}
}