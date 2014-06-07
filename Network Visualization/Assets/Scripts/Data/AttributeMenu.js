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
		} else {
			super.EnableDisplay(AttributeMenu);
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
		attribute.is_pkey = GuiPlus.LockableToggle (toggle_box, attribute.is_pkey, " Part of Primary Key", file.isActivated() || file.isActivating());		

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
			var DROPDOWN_ID = getDropdownId(attribute);
			GUI.color = Color.white;
			GUI.Label(label_box, "Format:");

			//Draw the format textbox
			var text_box = new Rect(x+58, label_box.y, 80, 20);
			if (attribute.hasValidTimeFrameFormat()) {
				GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
			} else {
				GUI.color = Color.red;
			}

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
				GUI.Box(warning_rect, "");
				GUI.color = Color.red;

				var oldAlignment = GUI.skin.label.alignment;
				GUI.skin.label.alignment = TextAnchor.MiddleCenter;
				GUI.Label(warning_rect, attribute.getTimeFrameFormatWarning());
				GUI.skin.label.alignment = oldAlignment;
			}		

		}

		GUI.color = Color.white;
		return cur_y + box_height-5;
	}

	function DrawForeignKeyEditing(cur_y : int) {
		GUI.color = Attribute.aspectColors[Attribute.FOREIGN_KEY];

		var outerBoxHeight = MenuController.getScreenHeight()-cur_y;
		var outerBox = new Rect(x+5, cur_y, width-10, outerBoxHeight);

		//get the attributes that are pointed to by simple fkeys
		var simpleFKeys = attribute.getSimpleFKeys();

		var innerBoxBaseHeight = 40;
		var innerBoxHeight = simpleFKeys.Count*70 + innerBoxBaseHeight;

		var nameWidth = 85;
		var weightLabelWidth = 105;
		var weightWidth = 110;
		var weightScaleLabelWidth = 84;
		var weightScaleWidth = 73;
		var invertedWidth = 90;
		var innerBoxWidth = outerBox.width;
		
		//make room for the scrollbar
		if (outerBox.height <= innerBoxHeight) {
			innerBoxWidth = outerBox.width - 18; 
			weightScaleWidth -= 18;
			weightWidth -= 18;
		}
		
		var innerBox = new Rect(0, 0, innerBoxWidth, innerBoxHeight);
		var fkeyRect = new Rect(5, 20, innerBoxWidth-10, 70);

		//populate the weight options with the attributes of the current (from) file.
		var file_attributes = file.getAttributes();

		var file_attribute_count = file_attributes.Count;
		var weightDropdownOptions = new String[file_attribute_count];
		for (var i =0 ; i < file_attribute_count ; i++) {
			weightDropdownOptions[i] = file_attributes[i].getRestrictedName(weightWidth-10);
		}

		fkeyScrollPosition = GUI.BeginScrollView (outerBox, 
				fkeyScrollPosition, innerBox);

			GUI.color = new Color(1, 1, 1, .5);
			GUI.Box(innerBox, "Single-Attribute Foreign Keys");
			GUI.color = Color.white;

			var oldAlignment = GUI.skin.label.alignment;
			GUI.skin.label.alignment = TextAnchor.MiddleCenter;
	

			for (var fkey in simpleFKeys) {
				var to_attr = fkey.getKeyPairs()[0][1];

				//Draw the box that surrounds the fkey options.
				GUI.Box(fkeyRect, fkey.to_file.shortName() + " / " + to_attr.getRestrictedName(80));


				//Draw the weight attribute label
				var weightLabelRect = new Rect(fkeyRect.x+5, fkeyRect.y+25, weightLabelWidth, 20);
				GUI.Label(weightLabelRect, "Weight Attribute: ");

				//Draw the dropdown for choosing the weight attribute
				var weightRect = new Rect(weightLabelRect.x+weightLabelWidth, fkeyRect.y+25, weightWidth, 20);
				weightRect.x += outerBox.x; weightRect.y += outerBox.y; //Adjust for scrolling, since Dropdown doesn't know about it.
				var dropdownHeight = 300;
				var weightAttribute = fkey.getWeightAttribute();
				var selectedIndex = (weightAttribute == null) ? -1 : weightAttribute.column_index;
				var newSelectedIndex = Dropdown.Select(weightRect, dropdownHeight, weightDropdownOptions, selectedIndex, getFkeyDropdownId(fkey), "None");

				//Change the weight attribute if necessary.
				if (selectedIndex != newSelectedIndex) {
					fkey.setWeightAttributeIndex(newSelectedIndex);
				}

				// Draw the delete button.
				if (GUI.Button(new Rect(fkeyRect.width-30, fkeyRect.y+20, 25, 25), "X")) {
					file.destroySimpleFkey(attribute, to_attr);
					return;
				}

				//Draw the weight scale
				var old_weight_modifier = fkey.getWeightModifier();
				var weightScaleLabelRect = new Rect(fkeyRect.x+5, fkeyRect.y+45, weightScaleLabelWidth, 20);
				var sliderRect = new Rect(weightScaleLabelRect.x+weightScaleLabelWidth, fkeyRect.y+50, weightScaleWidth, 20);
				GUI.Label(weightScaleLabelRect, "Strength: " + old_weight_modifier.ToString("f1"));
				var new_weight_modifier = GUI.HorizontalSlider(sliderRect, old_weight_modifier, 
						ForeignKey.MIN_WEIGHT_MODIFIER,  ForeignKey.MAX_WEIGHT_MODIFIER);
				if (old_weight_modifier != new_weight_modifier) {
					fkey.setWeightModifier(new_weight_modifier);
				}

				// Draw the inverted selection
				var invertedText : String;
				if (fkey.weightInverted) {
					invertedText = " Inverted";
				} else {
					invertedText = " Not Inverted";
				}

				var invertedRect = new Rect(sliderRect.x+sliderRect.width+5, fkeyRect.y+45, invertedWidth, 20);
				fkey.weightInverted = GUI.Toggle(invertedRect, fkey.weightInverted, invertedText);

				fkeyRect.y += fkeyRect.height;

			}
			GUI.skin.label.alignment = oldAlignment;

		GUI.EndScrollView();

		return cur_y+fkeyRect.y;
	}

	static function getDropdownId(attribute : Attribute) {
		return "3" + attribute.file.shortName()+attribute.column_index;
	}

	static function getFkeyDropdownId(fkey : ForeignKey) {
		if (fkey.isLinking()) {
			return "4" + fkey.source_file.shortName();
		}
		var id = "4" + fkey.from_file.shortName() + fkey.to_file.shortName();
		for (var keyPair in fkey.getKeyPairs()) {
			id += keyPair[0].column_index + " " + keyPair[1].column_index + " ";
		}
		return id;
	}

	static function OnDisableDisplay(){
		selected_index = -1;
	}


}