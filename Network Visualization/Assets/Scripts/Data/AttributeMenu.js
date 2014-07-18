#pragma strict

class AttributeMenu extends BaseMenu {

	private static var selected_index : int = -1;
	private static var attribute : Attribute;
	private static var file : DataFile;

	private static var fkeyScrollPosition : Vector2 = Vector2.zero;

	function Start() {
		parent = GetComponent(FileMenu);
		super.Start();
		title = "Attribute Manager";
		width = 280;
	}

	static function setSelectedIndex(index : int){
		if (index < 0 || index == selected_index){
			DisableDisplay(AttributeMenu);
			selected_index = -1;
		} else {
			EnableDisplay(AttributeMenu);
			file = FileManager.files[FileMenu.selected_file_index];
			selected_index = index;
			attribute = file.getAttribute(selected_index);
			Dropdown.reset(getDropdownId(attribute));
		} 
	}

	function OnGUI(){
		super.OnGUI();

		if (displaying) {
			//don't draw if you don't have anything to look at.
			if (selected_index == -1){
				DisableDisplay(AttributeMenu);
				return;
			}

			var cur_y = DrawBasicInfo(40);
			cur_y = DrawTimeFrameEditing(cur_y + 5);
		}
	}

	function DrawBasicInfo(cur_y : int) {		
		var name_box :Rect = new Rect(x+10, cur_y, 60, 20);
		GuiPlus.Label(name_box, "Name:");
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
		GuiPlus.Box(large_box, "");
		var toggle_box = new Rect(x+10, cur_y+5, width-20, 20);

		GUI.color = (attribute.is_shown) ? Attribute.SHOWN_COLOR : Color.white;
		var shown_toggle = GuiPlus.Toggle (toggle_box, attribute.is_shown, " Shown in 3D view");
		if (shown_toggle != attribute.is_shown){
			file.ToggleShown(selected_index);
		}

		toggle_box.y += 20;

		//Primary Key Toggle
		GUI.color = (attribute.is_pkey) ? Attribute.PKEY_COLOR : Color.white;
		//TODOX: Wow this needs to be a setter.
		attribute.is_pkey = GuiPlus.LockableToggle (toggle_box, attribute.is_pkey, " Part of Primary Key", file.isActivated() || file.isActivating());		

		return cur_y + large_box.height;
	}

	function DrawTimeFrameEditing(cur_y : int) {

		var box_height = 50;
		var present = false; //present in either Start or End
		if (attribute.getFile().timeFrame.usesAttribute(attribute)) {
			box_height += 20;
			present = true;
		}
		var large_box = new Rect(x+5, cur_y, width-10, box_height);
		
		GuiPlus.Box(large_box, "");

		//Draw Start Date
		cur_y += 5;

		var label_box = new Rect(x+10, cur_y, 150, 20);
		var button_box = new Rect(x+160, cur_y, 60, 20);
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
			if (attribute.getFile().timeFrame.usesAttribute(attribute, isStart)) {
				//The attribute is present in the TimeFrame.
				GuiPlus.Label(label_box, "Part of " + name + " Date");
				GUI.color = Attribute.TIME_SERIES_COLOR;
				if (GuiPlus.Button(button_box, "Remove")) {
					attribute.getFile().timeFrame.removeColumn(attribute, isStart);
				}
			} else {
				//The attribute is not in the TimeFrame.
				GuiPlus.Label(label_box, "Not part of " + name + " Date");
				GUI.color = Attribute.TIME_SERIES_COLOR;
				if (GuiPlus.Button(button_box, "Add")) {
					attribute.getFile().timeFrame.addColumn(attribute, isStart);
				}
			}

			label_box.y += 20;
			button_box.y += 20;
		}

		if (present) {
			var DROPDOWN_ID = getDropdownId(attribute);
			GUI.color = Color.white;
			GuiPlus.Label(label_box, "Format:");

			//Draw the format textbox
			var text_box = new Rect(x+58, label_box.y, 80, 20);

			GUI.color = (attribute.hasValidTimeFrameFormat()) ? Attribute.TIME_SERIES_COLOR : Color.red;

			var old_format = attribute.getTimeFrameFormat();
			var new_format = GUI.TextField(text_box, old_format);
			if (old_format != new_format) {
				attribute.setTimeFrameFormat(new_format);
				Dropdown.setSelectedIndex(DROPDOWN_ID, TimeParser.getFormatIndex(new_format));
			}

			//Update the dropdown for any changes in the text
			var format = attribute.getTimeFrameFormat();
			var selected_index = TimeParser.getFormatIndex(format);

			//Draw the dropdown
			var presetNames = TimeParser.presetNames;
			var dropdown_box = new Rect(x+142, label_box.y, width-153, 20);
			var new_selected_index = Dropdown.Select(dropdown_box, 200, presetNames, selected_index, DROPDOWN_ID, "Presets");

			//If the selected index changed
			if (new_selected_index == -1) {
				attribute.setTimeFrameFormat("");
			} else if (new_selected_index != TimeParser.presetNames.length - 1 && // The value is not "Custom"
					selected_index != new_selected_index) {
				attribute.setTimeFrameFormat(TimeParser.presetValues[new_selected_index]);
			}

			// Draw out the warning label
			if (!attribute.hasValidTimeFrameFormat()) {
				cur_y += 25;
				var warning_rect = new Rect(x+5, dropdown_box.y+25, width-10, 20);
				GuiPlus.Box(warning_rect, "");
				GUI.color = Color.red;

				var oldAlignment = GUI.skin.label.alignment;
				GUI.skin.label.alignment = TextAnchor.MiddleCenter;
				GuiPlus.Label(warning_rect, attribute.getTimeFrameFormatWarning());
				GUI.skin.label.alignment = oldAlignment;
			}		

		}

		GUI.color = Color.white;
		return cur_y + box_height-5;
	}

	static function getDropdownId(attribute : Attribute) {
		return "3" + attribute.uuid;
	}

	static function getFkeyDropdownId(fkey : ForeignKey) {
		return "4" + fkey.uuid;
	}

}