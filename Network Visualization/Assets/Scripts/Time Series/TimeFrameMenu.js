#pragma strict

class TimeFrameMenu extends BaseMenu {

	private static var creatingStart : boolean = false;
	private static var creatingEnd : boolean = false;

	private static var cur_file : DataFile;

	private static var attrScrollPosition : Vector2 = Vector2.zero;

	function Start(){
		parent = GetComponent(FileMenu);
		super.Start();
		title = "Time Series Manager";
		width = 280;
	}


	function OnGUI() {
		super.OnGUI();

		//get the currently selected file
		cur_file = FileMenu.getSelectedFile();
		if (cur_file == null || !displaying) {
			return;
		}		
		var timeFrame = cur_file.timeFrame;

		var cur_y = DrawColumns(40, true, timeFrame);
		cur_y = DrawColumns(cur_y+30, false, timeFrame);
		
	}

	static function setFile(cur_file : DataFile) {
		for (var key in Dropdown.getIDs()) {
			if (key.StartsWith("2") || key.StartsWith("3")) {
				Dropdown.reset(key);
			}
		}
	}

	function DrawColumns(cur_y : int, isStart : boolean, timeFrame : TimeFrame) {
		var columns = timeFrame.getColumns(isStart);

		var timeframe_box = new Rect(x+5, cur_y, width-10, columns.Count*20+50);
		//Adjust height
		if (columns.Count > 0) {
			timeframe_box.height += 40;
		}
		
		//Adjust the length of the box when adding an attribute
		var creating = (creatingStart && isStart || creatingEnd && !isStart); 
		if (creating) {
 			timeframe_box.height += 100;
		}

		//Determine the text at the top of the box
		var box_text : String;
		var invalidMessage = timeFrame.getInvalidMessage(isStart);
		if (invalidMessage == "") {
			if (isStart) {
				box_text = "Start Date: ";
			} else {
				box_text = "End Date: ";
			}
			if (columns.Count > 0) {
				box_text += columns.Count + " columns";
				if (columns.Count == 1) {
					box_text = box_text[0:-1]; //Remove the 's'
				}			
			} else {
				box_text += "None";
			}
		} else {
			box_text = invalidMessage;
		}

		if (!timeFrame.isValid(isStart)){
			GUI.color = Color.red;
		}
		GuiPlus.Box(timeframe_box, box_text);
		GUI.color = Color.white;

		//Draw the column headers.
		if (columns.Count > 0) {
			//Draw the headers
			cur_y += 30;
			var header_rect = new Rect(x+12, cur_y, 80, 20);
			GuiPlus.Label(header_rect, "Name");
			header_rect.x += 63;
			GuiPlus.Label(header_rect, "Format");

		}


		//Draw the currently chosen columns.
 		cur_y += 20;
		for (var column_index : int = 0 ; column_index < columns.Count ; column_index++) {
			var column = columns[column_index];
			var column_rect = new Rect(x+12, cur_y, 85, 20);

			var DROPDOWN_ID = AttributeMenu.getDropdownId(column);

			//Use the aspect color.
			GUI.color = column.getAspectColor();
			
			//Draw the attribute label
			GuiPlus.Label(column_rect, column.getRestrictedName(column_rect.width-5));

			//Draw the format textbox
			column_rect.x += 68;
			if (!column.hasValidTimeFrameFormat()) {
				GUI.color = Color.red;
			}
			var old_format = column.getTimeFrameFormat();
			var new_format = GUI.TextField(column_rect, old_format);
			if (new_format != old_format) {
				column.setTimeFrameFormat(new_format);
				Dropdown.setSelectedIndex(DROPDOWN_ID, TimeParser.getFormatIndex(new_format));
			}

			//Update the dropdown for any changes in the text
			var format = column.getTimeFrameFormat();
			var selected_index = TimeParser.getFormatIndex(format);

			//Restore the aspect color (if it was invalid)
			GUI.color = column.getAspectColor();

			column_rect.x += 85;
			//Draw the dropdown
			var presetNames = TimeParser.presetNames;
			var new_selected_index = Dropdown.Select(column_rect, 200, presetNames, selected_index, DROPDOWN_ID, "Presets");

			//If the selected index changed
			if (new_selected_index == -1) {
				column.setTimeFrameFormat("");
			} else if (new_selected_index != TimeParser.presetNames.length - 1 && // The value is not "Custom"
					selected_index != new_selected_index) {
				column.setTimeFrameFormat(TimeParser.presetValues[new_selected_index]);
			}

			//Draw the Remove button
			column_rect.x += 85;
			column_rect.width = 20;
			if (GuiPlus.Button(column_rect, "x")) {
				timeFrame.removeColumn(column_index, isStart);
			}

			cur_y += 20;
		}

		GUI.color = Color.white;


		var add_column_rect = new Rect(x+width/9, cur_y+5, width*.5, 25);
		if (creatingStart && isStart || creatingEnd && !isStart) { //Draw a cancel button to undo the column adding click.
			if (GuiPlus.Button(add_column_rect, "Done")) {
				if (isStart) {
					creatingStart = false;
				} else {
					creatingEnd = false;
				}
			}
		} else { //You are not creating already.
			if (GuiPlus.Button(add_column_rect, "Add Columns")) {
				if (isStart) {
					creatingStart = true;
					creatingEnd = false;
				} else {
					creatingEnd = true;
					creatingStart = false;
				}
			}
		}
		cur_y += 20;

		//Draw the column selection box.
		if (creating) {
			cur_y += 15;

			var attributes = cur_file.getAttributes();
			var attributes_box = new Rect(x+10, cur_y, width-20, 100);

			attrScrollPosition = GuiPlus.BeginScrollView (attributes_box, 
					attrScrollPosition, Rect (0, 0, width-40, 20*attributes.Count));	

				var scroll_y = 0;

				for (var attribute in attributes) {
					GUI.color = attribute.getAspectColor(); //Use aspect color.
					var attr_rect = new Rect(0, scroll_y, width-30, 22);

					if (GuiPlus.Button(attr_rect, attribute.getRestrictedName(attr_rect.width))) {
						timeFrame.addColumn(attribute, isStart);
					}

					scroll_y += 20;
				}

				GUI.color = Color.white;
			
			GuiPlus.EndScrollView();
			cur_y += 105; //adjust cur_y
		}

		return cur_y;
	}

	static function OnDisableDisplay(){
		creatingStart = false;
		creatingEnd = false;
	}

}