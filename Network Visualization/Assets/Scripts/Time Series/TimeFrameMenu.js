#pragma strict

class TimeFrameMenu extends BaseMenu {

	private var creatingStart : boolean = false;
	private var creatingEnd : boolean = false;

	private var cur_file : DataFile;

	private var attrScrollPosition : Vector2 = Vector2.zero;

	function Start(){
		parent = GetComponent(FileMenu);
		super.Start();
		title = "Time Series Manager";
		width = 280;
	}


	function OnGUI() {
		super.OnGUI();

		// if (GuiPlus.Button(new Rect(200, 200, 300, 300), "Popup?")){
		// 	popupWindow.createWindow("messsage!", new PopupOption("test", testFunction));
		// }

		//get the currently selected file
		cur_file = fileMenu.getSelectedFile();
		if (cur_file == null) {
			return;
		}		
		var timeFrame = cur_file.timeFrame;

		var cur_y = DrawColumns(40, true, timeFrame);
		cur_y = DrawColumns(cur_y+30, false, timeFrame);
		
	}

	function testFunction(){
		Debug.Log("Test" + this);
	}

	function DrawColumns(cur_y : int, isStart : boolean, timeFrame : TimeFrame) {
		var columns : List.<AFTuple> = timeFrame.getColumns(isStart);

		var timeframe_box = new Rect(x+10, cur_y, width-20, columns.Count*20+50);
		
		//Adjust the length of the box when adding an attribute
		var creating = (creatingStart && isStart || creatingEnd && !isStart); 
		if (creating) {
 			timeframe_box.height += 105;
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

			//Draw the box.
			if (columns.Count > 0) {
				box_text += columns.Count + " columns";
				if (columns.Count == 1) {
					box_text = box_text[0:-1]; //Remove the 's'
				}			
				timeframe_box.height += 60; //Column headers (20) + Required (20)
			} else {
				box_text += "Not Defined";
			}
		} else {
			box_text = invalidMessage;
		}

		if (!timeFrame.isValid(isStart)){
			GUI.color = Color.red;
		}
		GUI.Box(timeframe_box, box_text);
		GUI.color = Color.white;

		//Draw the column headers and required option.
		if (columns.Count > 0) {

			//Draw required option.
			var required = timeFrame.getRequired(isStart);
			var requiredText : String;
			if (required) {
				requiredText = " Required. Rows with invalid dates \nwill not be shown.";
			} else {
				requiredText = " Not Required. Rows with invalid dates \nwill ";
				if (isStart) {
					requiredText += "start at the earliest date.";
				} else {
					requiredText += "end at the latest date.";
				}
			}
			var new_required = GUI.Toggle(new Rect(x+20, cur_y+20, width-20, 40), required, requiredText);
			if (required != new_required) {
				timeFrame.setRequired(isStart, new_required);
			}
			
			//Draw the headers
			cur_y += 60;
			var header_rect = new Rect(x+30, cur_y, 80, 20);
			GUI.Label(header_rect, "Name");
			header_rect.x += header_rect.width+5;
			GUI.Label(header_rect, "Format");

		}


		//Draw the currently chosen columns.
 		cur_y += 20;
		for (var column_index : int = 0 ; column_index < columns.Count ; column_index++) {
			var column = columns[column_index];
			var column_rect = new Rect(x+30, cur_y, 80, 20);

			//Use the aspect color.
			GUI.color = column.attribute.getAspectColor();
			
			//Draw the attribute label
			GUI.Label(column_rect, column.attribute.getRestrictedName(column_rect.width));

			//Draw the format textbox
			column_rect.x += column_rect.width+5;

			if (!column.isValid()) {
				GUI.color = Color.red;
			}

			var old_format = column.getFormat();
			var new_format = GUI.TextField(column_rect, old_format);
			if (new_format != old_format) {
				column.setFormat(new_format);
			}

			//Restore the aspect color (if it was invalid)
			GUI.color = column.attribute.getAspectColor();

			//Draw the Remove button
			column_rect.x += column_rect.width+5;
			column_rect.width = 20;
			if (GUI.Button(column_rect, "x")) {
				timeFrame.removeColumn(isStart, column_index);
			}

			cur_y += 20;
		}

		GUI.color = Color.white;


		var add_column_rect = new Rect(x+width/9, cur_y+5, width/3, 20);
		if (creatingStart && isStart || creatingEnd && !isStart) { //Draw a cancel button to undo the column adding click.
			if (GUI.Button(add_column_rect, "Done")) {
				if (isStart) {
					creatingStart = false;
				} else {
					creatingEnd = false;
				}
			}
		} else { //You are not creating already.
			if (GUI.Button(add_column_rect, "Add Columns")) {
				if (isStart) {
					creatingStart = true;
					creatingEnd = false;
				} else {
					creatingEnd = true;
					creatingStart = false;
				}
			}
		}
		cur_y += 15;

		//Draw the column selection box.
		if (creating) {
			cur_y += 15;

			var attributes = cur_file.attributes;
			var attributes_box = new Rect(x+10, cur_y, width-20, 100);

			attrScrollPosition = GUI.BeginScrollView (attributes_box, 
					attrScrollPosition, Rect (0, 0, width-40, 20*attributes.Count));	

				var scroll_y = 0;

				for (var attribute in attributes) {
					GUI.color = attribute.getAspectColor(); //Use aspect color.
					var attr_rect = new Rect(0, scroll_y, width-35, 20);

					if (GUI.Button(attr_rect, attribute.getRestrictedName(attr_rect.width))) {
						timeFrame.addColumn(attribute, isStart);
					}

					scroll_y += 20;
				}

				GUI.color = Color.white;
			
			GUI.EndScrollView();
			cur_y += 105; //adjust cur_y
		}

		return cur_y;
	}

	function DisableDisplay(){
		super.DisableDisplay();
		creatingStart = false;
		creatingEnd = false;
	}

}