#pragma strict

class Dropdown extends MonoBehaviour {

	static var dropdowns = new Dictionary.<String, DropdownMenu>();
	var dropdownArrow : Texture;
	static var s_dropdownArrow : Texture;

	function Start() {
		s_dropdownArrow = dropdownArrow;
	}

	//Default call does not show a blank option.
	static function Select(position : Rect, dropHeight : int, options : String[], selectedIndex : int, id : String) {
		return Select(position, dropHeight, options, selectedIndex, id, null);
	}

	//Called in the OnGUI function of other scripts.
	static function Select(position : Rect, dropHeight : int, options : String[], selectedIndex : int, id : String, blankText : String) {
		if (!dropdowns.ContainsKey(id)) {
			dropdowns[id] = new DropdownMenu(position, dropHeight, options, selectedIndex, id, blankText);
			return selectedIndex;
		} else {
			var dropdown = dropdowns[id];
			dropdown.showing = true;
			dropdown.addPosition(position);
			dropdown.dropHeight = dropHeight;
			dropdown.options = options;
			dropdown.blankText = blankText;
			DrawDropdown(dropdown);
			return dropdown.selectedIndex;
		}
	}

	static function setSelectedIndex(id : String, selectedIndex : int) {
		if (dropdowns.ContainsKey(id)) {
			dropdowns[id].selectedIndex = selectedIndex;
		}
	}

	static function reset(id : String) {
		dropdowns.Remove(id);
	}

	//Returns a list of keys into the dropdowns dictionary
	static function getIDs() {
		return dropdowns.Keys;
	}

	private static function DrawDropdown(dropdown : DropdownMenu) {

		//Set special GUI properties.
		var oldDepth = GUI.depth;

		//aligns the arrow image to the right side and the label to the center.
		var oldButtonAlignment = GUI.skin.button.alignment;
		var oldLabelAlignment = GUI.skin.label.alignment;
		GUI.skin.label.alignment = TextAnchor.MiddleCenter;


		//Note that most of the time there will only be one optionBox displayed.
		for (var optionBox in dropdown.optionBoxes) {

			//Draw the dropdown button
			var position = optionBox.position;
			GUI.skin.button.alignment = TextAnchor.MiddleRight; //right-align the arrow.
			if (GUI.Button(position, s_dropdownArrow)) {
				optionBox.open = !optionBox.open;
			}

			//Draw the current selection as a label.
			var options = dropdown.options;
			var selectedIndex = dropdown.selectedIndex;
			var blankText = dropdown.blankText;
			var selectedText = (selectedIndex < 0 || selectedIndex > options.length) ? blankText : options[selectedIndex];
			GUI.Label(position, selectedText);

			//show the other options if dropdown is open.
			if (optionBox.open) {
				GUI.depth = 2; //open dropdowns should be on "top"

				var outerBox = new Rect(position.x, position.y + position.height, position.width, dropdown.dropHeight);
				var requiredHeight = options.length * position.height;
				
				if (blankText != null) {
					requiredHeight += position.height;
				}

				if (outerBox.height > requiredHeight) {
					outerBox.height = requiredHeight; //truncate the bottom of the outer box, so you don't see extra space.
				} else if (outerBox.height < requiredHeight) {
					position.width-=14; //make space for the scroll bar.
				}

				//Draw a Box to darken the background behind the buttons.
				GUI.Box(outerBox, "");
				GUI.Box(outerBox, "");

				// Check if the user has clicked outside to close the menu
				if (Input.GetMouseButtonDown(0)) {
					var mousePosition = Input.mousePosition;
					mousePosition.y = Screen.height - mousePosition.y; 	

					// The mouse is in neither the optionBox nor in any of the dropdown buttons
					if (!outerBox.Contains(mousePosition) && !position.Contains(mousePosition)) {
						optionBox.open = false;
					} 
				}

				//Create a scroll pane the size of the outer box.
				var innerBox = new Rect(0, 0, position.width-3, requiredHeight);
				
				dropdown.scrollPosition = GUI.BeginScrollView (outerBox, 
						dropdown.scrollPosition, innerBox);

					position.x = position.y = 0; //move to the top left of the scrollable pane.

					//Calculate the number of hypens
					var hyphenSize : double = GUI.skin.button.CalcSize(new GUIContent("- ")).x;
					var hypenCount = (position.width / hyphenSize);
					var hypenRatio = 1.3; //arbitrary number that looks pretty good.

					//Create a button for the blank option.
					GUI.skin.button.alignment = TextAnchor.MiddleCenter; //center the contents (since the arrow was right-aligned)
					if (GUI.Button(position, "- " * (hypenCount * hypenRatio))) {
						optionBox.open = false;
						dropdown.selectedIndex = -1;
					}
					position.y+=position.height;

					for (var optionIndex = 0 ; optionIndex < options.length ; optionIndex ++) {

						//Create a button for the current option.
						if (GUI.Button(position, options[optionIndex])) {
							optionBox.open = false;
							dropdown.selectedIndex = optionIndex;
						}

						//adjust the y value
						position.y += position.height;
					}

				GUI.EndScrollView();
			} //end if (optionBox.open && dropdown.showing)
		} //end loop over optionboxes


		//Restore alignment
		GUI.skin.button.alignment = oldButtonAlignment;
		GUI.skin.label.alignment = oldLabelAlignment;

		//Restore GUI properties
		GUI.depth = oldDepth;
	}

	function LateUpdate() {
		for (var dropdown in dropdowns.Values) {
			//Clear the showing flag of all dropboxes. If they are still 
			//being displayed, this will be fixed by a subsequent GUI call.
			dropdown.showing = false;

			// Clear cache of rectangles, in case your dropdown moved
			// across the screen and generated false duplicates.
			dropdown.resetOptionBoxes(); //Doesn't affect open boxes.
		}
	}

	class DropdownMenu {
		var optionBoxes : List.<OptionBox>;
		var dropHeight : int;
		var options : String[];
		var selectedIndex : int;
		var id : String;
		var showing : boolean = true;
		var blankText : String;
		var scrollPosition : Vector2 = Vector2.zero;

		public function DropdownMenu(position : Rect, dropHeight : int, options : String[], selectedIndex : int, id : String, blankText : String) {
			this.optionBoxes = new List.<OptionBox>();
			optionBoxes.Add(new OptionBox(position));
			this.dropHeight = dropHeight;
			this.options = options;
			this.selectedIndex = selectedIndex;
			this.id = id;
			this.blankText = blankText;
		}

		public function addPosition(r : Rect) {
			for (var optionBox in optionBoxes) {
				if (optionBox.position == r) {
					return;
				}
			}
			optionBoxes.Add(new OptionBox(r));
		}

		public function resetOptionBoxes() {
			var replacementList = new List.<OptionBox>();

			for (var optionBox in optionBoxes) {

				if (optionBox.open) {
					replacementList.Add(optionBox);
				}
			}
			optionBoxes = replacementList;
		}


		class OptionBox {
			var position : Rect;
			var open : boolean = false;

			public function OptionBox(position : Rect) {
				this.position = position;
			}
		}

	}
}