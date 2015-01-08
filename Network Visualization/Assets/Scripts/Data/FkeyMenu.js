//Handles the display of the fkey section in the file menu.

#pragma strict

class FkeyMenu extends BaseMenu {

	private static var fkeyBoxHeight = 160;
	private static var fkeyBoxSpacing = 8;
	private static var keyPairHeight = 20;
	private static var keyPairPreSpace = 35;
	private static var keyPairSpacing = 1;
	private static var keyPairAddSpace = 5;
	private static var addingBoxPreSpace = 5;
	private static var addingBoxHeight = 130;

	private static var contentWidth : int;

	private static var innerBox : Rect;
	private static var outerBox : Rect;

	private static var fkeyScrollPosition : Vector2 = Vector2.zero;
	private static var addingScrollPosition : Vector2 = Vector2.zero;

	private var addingFkey : ForeignKey;
	private var addingFkeyStep = 0;
	private var addingFromAttr : Attribute;

	function Start(){
		parent = GetComponent(FileMenu);
		super.Start();
		title = "Edge Manager";
		width = 300;
	}
   
	function OnGUI(){
		super.OnGUI();
		GUI.color = Color.white;

		var file = FileMenu.getSelectedFile();
		if (file == null) {
			return;
		}		

	   var cur_y = 40;
		var add_box = new Rect(x+20, cur_y, width-40, 30);
		if (GuiPlus.Button(add_box, "Create Foreign Key")){
			file.createEmptyFkey();
		}

		var outerBoxHeight = MenuController.getScreenHeight()-cur_y-40;
		outerBox =  new Rect(x, cur_y+40, width, outerBoxHeight);
		var innerSize = GuiPlus.BeginScrollView(outerBox, "FkeyMenu");

			var needsToScroll : boolean = (innerSize.y > outerBoxHeight);
			contentWidth = (needsToScroll) ? width - 17 : width - 1;

			cur_y = 0;
			var foreignKeys = file.getForeignKeys();
			var fkeyCount = foreignKeys.Count;
			for (var i = 0 ; i < fkeyCount ; i++) {
				var foreignKey = foreignKeys[i];
				cur_y = DrawForeignKey(file, foreignKey, cur_y);
				if (fkeyCount > foreignKeys.Count) {
					break; // You removed a key, just stop rendering the rest.
				}
			}

		GuiPlus.EndScrollView();
	}

	private function DrawForeignKey(file : DataFile, foreignKey : ForeignKey, cur_y : int) {
		var pair_count = foreignKey.getKeyPairs().Count;
		var boundingBoxHeight = pair_count*keyPairHeight + fkeyBoxHeight;

		var weightAttribute = foreignKey.getWeightAttribute();
		if (!weightAttribute) {
			boundingBoxHeight -= 40;
		}

		var fkey_box = new Rect(1, cur_y, contentWidth, boundingBoxHeight);
		GuiPlus.Box(fkey_box, ""); 

		//deletes the foreign key.
		if (GuiPlus.Button(new Rect(contentWidth-30, cur_y+3, 27, 27), "X")){
			file.removeFkey(foreignKey);
			return cur_y;
		}


		foreignKey.isBidirectional = GuiPlus.Toggle(new Rect(10, cur_y+6, 130, 20),
				foreignKey.isBidirectional, "Bi-directional");
					
		cur_y += 32;

		//Draw the weight attribute label
		var weightLabelWidth = 65;
		var weightLabelRect = new Rect(10, cur_y, weightLabelWidth, 20);
		GuiPlus.Label(weightLabelRect, "Weight: ");

		//Draw the dropdown for choosing the weight attribute
		var weightWidth = contentWidth-weightLabelWidth-20;

		var file_attributes = file.getAttributes();

		//populate the weight options with the attributes of the current (from) file.
		var file_attribute_count = file_attributes.Count;
		var weightDropdownOptions = new String[file_attribute_count];
		for (var i =0 ; i < file_attribute_count ; i++) {
			weightDropdownOptions[i] = file_attributes[i].getRestrictedName(weightWidth-10);
		}

		var weightRect = new Rect(weightLabelRect.x+weightLabelWidth, cur_y, weightWidth, 20);
		var dropdownHeight = 200;
		var selectedIndex = (weightAttribute == null) ? -1 : weightAttribute.column_index;
		var newSelectedIndex = Dropdown.Select(weightRect, dropdownHeight, 
				weightDropdownOptions, selectedIndex, AttributeMenu.getFkeyDropdownId(foreignKey), "None");

		if (selectedIndex != newSelectedIndex) {
			foreignKey.setWeightAttributeIndex(newSelectedIndex);
		}


		// Only show details about weight if there is a weight atttribute.
		if (weightAttribute) {
			cur_y += 20;
			var old_weight_modifier = foreignKey.getWeightModifier();
			var strengthLabelWidth = 100;
			var strengthLabelRect = new Rect(10, cur_y, strengthLabelWidth, 20);
			GuiPlus.Label(strengthLabelRect, "Strength: " + old_weight_modifier.ToString("f1"));
			var sliderWidth = contentWidth-strengthLabelWidth-20;
			var new_weight_modifier = GUI.HorizontalSlider(Rect(strengthLabelWidth+10, cur_y+5, sliderWidth, 20), old_weight_modifier, 
					ForeignKey.MIN_WEIGHT_MODIFIER, ForeignKey.MAX_WEIGHT_MODIFIER);
			if (old_weight_modifier != new_weight_modifier) {
				foreignKey.setWeightModifier(new_weight_modifier);
			}

			cur_y += 20;
			var wasInverted = foreignKey.isWeightInverted();
			var invertedRect = new Rect(10, cur_y, 130, 20);
			var isInverted = GuiPlus.Toggle(invertedRect, wasInverted, " Invert Weight");
			if (wasInverted != isInverted) {
				foreignKey.setWeightInverted(isInverted);
			}
		}

		cur_y += 20;
		var dropHeight = 112;
		var selectionRect = new Rect(5, cur_y+5, contentWidth-10, 28);
		var selectedFileIndex = FileManager.getFileIndex(foreignKey.getToFile());
		var DROPDOWN_ID = "FKEY_TO_FILE_" + foreignKey.uuid;
		var replacementFileIndex = Dropdown.Select(selectionRect, dropHeight, FileManager.getFileNames(), selectedFileIndex, DROPDOWN_ID, "Select Target File");
		var replacementFile = (replacementFileIndex >= 0) ? FileManager.files[replacementFileIndex] : null;
		if (foreignKey.getToFile() != replacementFile) {
			foreignKey.setToFile(replacementFile);
			if (replacementFile == null) {
				resetAdding();
			}
		}
		
		cur_y = DrawKeyPairs(foreignKey, cur_y + keyPairPreSpace);
		if (addingFkey == foreignKey) {
			cur_y = DrawAddingBox(cur_y + addingBoxPreSpace);
		}
		return cur_y + fkeyBoxSpacing;
	}

	private function DrawKeyPairs(foreignKey : ForeignKey, cur_y : int) {

		var keyPairs = foreignKey.getKeyPairs();
		for (var pair in keyPairs){
			var from_attr : Attribute = pair[0];
			var to_attr : Attribute = pair[1];
			
			var content = new GUIContent(from_attr.getColumnName());
   			var size = GUI.skin.label.CalcSize(content);
			var attr_box = new Rect(20, cur_y, size.x+20, keyPairHeight);
			GuiPlus.Button(attr_box, content);
			
			attr_box.x += size.x+25;
			GuiPlus.Label(attr_box, " > ");
			
			attr_box.x += 25;
			content = new GUIContent(to_attr.getColumnName());
   			size = GUI.skin.label.CalcSize(content);
   			attr_box.width = size.x+20;
			GuiPlus.Button(attr_box, content);

			//deletes the key pair.
			if (GuiPlus.Button(new Rect(contentWidth-30, cur_y, 20, 20), "X")){
				foreignKey.removeKeyPair(from_attr, to_attr);
				return; //stop rendering, otherwise you get an invalid pointer from the deletion.
			}
			
			cur_y += keyPairHeight + keyPairSpacing;
		}
		cur_y += keyPairAddSpace;
		var addBox = new Rect(20, cur_y, 140, 20);		
		var isAdding = (addingFkey == foreignKey);
		var addText = (isAdding) ? "Cancel" : "Add Attribute Pair";

		var isLocked = (foreignKey.getToFile() == null);
		if (GuiPlus.LockableButton(addBox, addText, isLocked)){
			if (isAdding) {
				resetAdding();
			} else {
	 			addingFkey = foreignKey;
				addingFkeyStep = 1;
			}
		}
		return cur_y + 27;
	}

	private function DrawAddingBox(cur_y : int) {
		var addingBox = new Rect(1, cur_y, contentWidth, addingBoxHeight);
		var addingText = (addingFkeyStep == 1) ? "Select Attribute from Origin File" : "Select Attribute from Target File";
		GuiPlus.Box(addingBox, addingText);

		var file = (addingFkeyStep == 1) ? addingFkey.getSourceFile() : addingFkey.getToFile();
		var attributes = file.getAttributes();

		var outerBox = addingBox;
		var titleSpacing = 25;
		outerBox.y += titleSpacing; outerBox.height -= titleSpacing;

		var attrRectHeight = 20;
		var innerHeight = attrRectHeight * attributes.Count;
		var innerWidth = (innerHeight > addingBoxHeight - titleSpacing) ? contentWidth-17 : contentWidth;
		var innerBox = new Rect(0, 0, innerWidth, innerHeight);

		addingScrollPosition = GuiPlus.BeginScrollView (outerBox, 
				addingScrollPosition, innerBox);

			var scroll_y = 0;
			for (attribute in attributes) {
				var attrRect = new Rect(0, scroll_y, innerWidth, attrRectHeight);
				if (GuiPlus.Button(attrRect, attribute.getRestrictedName(innerWidth - 20))) {
					if (addingFkeyStep == 1) {
						addingFromAttr = attribute;
						addingFkeyStep = 2;
					} else {
						addingFkey.addKeyPair(addingFromAttr, attribute);
						addingFkey = null;
						addingFkeyStep = 0;
					}
					break;
				}
				scroll_y += attrRectHeight;
			}

		GuiPlus.EndScrollView();


		return cur_y + addingBoxHeight;
	}

	private function resetAdding() {
		addingFkey = null;
		addingFkeyStep = 0;
	}
}
