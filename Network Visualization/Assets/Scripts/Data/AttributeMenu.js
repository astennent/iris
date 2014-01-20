#pragma strict

class AttributeMenu extends BaseMenu {

	private var selected_index : int = -1;
	private var attribute : Attribute;
	private var file : DataFile;

	private var fkeyScrollPosition : Vector2 = Vector2.zero;

	function Start() {
		parent = GetComponent(FileMenu);
		super.Start();
		title = "Attribute Manager";
		width = 250;
	}

	function setSelectedIndex(index : int){
		if (index < 0 || index == selected_index){
			DisableDisplay();
		} else {
			EnableDisplay();
			selected_index = index;
			file = fileManager.files[fileMenu.selected_file_index];
			attribute = file.attributes[selected_index];
		} 
	}

	function OnGUI(){
		super.OnGUI();

		if (displaying) {
			//don't draw if you don't have anything to look at.
			if (selected_index == -1){
				DisableDisplay();
				return;
			}

			var cur_y = DrawBasicInfo(40);
			cur_y = DrawTimeFrameEditing(cur_y + 5);
			cur_y = DrawForeignKeyEditing(cur_y + 5);

		}
	}

	function DrawBasicInfo(cur_y : int) {		
		var name_box :Rect = new Rect(x+10, cur_y, 60, 20);
		GUI.Label(name_box, "Name:");
		name_box.width=width-70;
		name_box.x += 50;

		//Name
		var current_column_name = attribute.getColumnName();
		var new_column_name = GUI.TextField(name_box, current_column_name);
		if (new_column_name != current_column_name){
			attribute.setColumnName(new_column_name);	
		}
		
		cur_y += 25;
		
		//Shown Toggle
		var large_box = new Rect(x+5, cur_y, width-10, 50);
		GUI.Box(large_box, "");
		var toggle_box = new Rect(x+10, cur_y+5, width-20, 20);
		if (attribute.is_shown){ GUI.color = Attribute.shownColor; } 
		else { GUI.color = Color.white; }
		var shown_toggle = GUI.Toggle (toggle_box, attribute.is_shown, " Shown in 3D view");
		if (shown_toggle != attribute.is_shown){
			file.ToggleShown(selected_index);
		}

		//Primary Key Toggle
		toggle_box.y += 20;
		if (attribute.is_pkey){ GUI.color = Attribute.pkeyColor; } 
		else { GUI.color = Color.white; }
		attribute.is_pkey = GUI.Toggle (toggle_box, attribute.is_pkey, " Part of Primary Key");		

		return cur_y + large_box.height;
	}

	function DrawTimeFrameEditing(cur_y : int) {

		var box_height = 50;
		var present = false; //present in either Start or End
		if (attribute.getTimeFramePresence(true) || attribute.getTimeFramePresence(false)) {
			box_height += 20;
			present = true;
		}
		var large_box = new Rect(x+5, cur_y, width-10, box_height);
		
		GUI.Box(large_box, "");

		//Draw Start Date
		cur_y += 5;

		var label_box = new Rect(x+10, cur_y, 130, 20);
		var button_box = new Rect(x+140, cur_y, 60, 20);
		for (var onStartIndex = 0 ; onStartIndex < 2 ; onStartIndex++) {
			GUI.color = Color.white;

			//Update values for whether it's the start or end.
			if (onStartIndex == 0) {
				var name = "Start";
				var isStart = true;
			} else {
				name = "End";
				isStart = false;
			}

			//Draw options for adding and removing from TimeFrame
			if (attribute.getTimeFramePresence(isStart)) {
				//The attribute is present in the TimeFrame.
				GUI.Label(label_box, "Part of " + name + " Date");
				var old_format = attribute.getTimeFrameFormat();
				GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
				if (GUI.Button(button_box, "Remove")) {
					attribute.file.timeFrame.removeColumn(attribute, isStart);
				}
			} else {
				//The attribute is not in the TimeFrame.
				GUI.Label(label_box, "Not part of " + name + " Date");
				GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
				if (GUI.Button(button_box, "Add")) {
					attribute.file.timeFrame.addColumn(attribute, isStart);
				}
			}
			
			label_box.y += 20;
			button_box.y += 20;
		}

		if (present) {
			GUI.color = Color.white;
			GUI.Label(label_box, "Format:");
			button_box.width += 30;
			if (attribute.hasValidTimeFrameFormat()) {
				GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
			} else {
				GUI.color = Color.red;
			}
			var new_format = GUI.TextField(button_box, attribute.getTimeFrameFormat());
			if (old_format != new_format) {
				attribute.setTimeFrameFormat(new_format);
			}
		}

		GUI.color = Color.white;
		return cur_y + 10;
	}

	function DrawForeignKeyEditing(cur_y : int) {

		GUI.color = Attribute.aspectColors[Attribute.FOREIGN_KEY];

		return cur_y;
	}

	function DisableDisplay(){
		super.DisableDisplay();
		selected_index = -1;
	}


}