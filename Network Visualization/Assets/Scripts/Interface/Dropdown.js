#pragma strict

class Dropdown extends MonoBehaviour {

	static var dropdowns = new Dictionary.<int, DropdownMenu>();
	var dropdownArrow : Texture;

	//Default call does not show a blank option.
	static function Select(optionBox : Rect, dropHeight : int, options : String[], selectedIndex : int, id : int) {
		return Select(optionBox, dropHeight, options, selectedIndex, id, null);
	}

	//Called in the OnGUI function of other scripts.
	static function Select(optionBox : Rect, dropHeight : int, options : String[], selectedIndex : int, id : int, blankText : String) {
		if (!dropdowns.ContainsKey(id)) {
			dropdowns[id] = new DropdownMenu(optionBox, dropHeight, options, selectedIndex, id, blankText);
			return selectedIndex;
		} else {
			var dropdown = dropdowns[id];
			dropdown.showing = true;
			dropdown.optionBox = optionBox;
			dropdown.dropHeight = dropHeight;
			dropdown.options = options;
			dropdown.blankText = blankText;
			return dropdown.selectedIndex;
		}
	}

	function OnGUI() {

		//Set special GUI properties.
		var oldDepth = GUI.depth;
		GUI.depth = 0;

		for (var dropdown in dropdowns.Values) {
			
			//Don't render anything if the dropdown hasn't been called on this frame.
			if (!dropdown.showing) {
				continue;
			}
		
			//aligns the arrow image to the right side and the label to the center.
			var oldButtonAlignment = GUI.skin.button.alignment;
			var oldLabelAlignment = GUI.skin.label.alignment;
			GUI.skin.button.alignment = TextAnchor.MiddleRight;
			GUI.skin.label.alignment = TextAnchor.MiddleCenter;
			
			//Draw the dropdown button
			var optionBox = dropdown.optionBox;
			if (GUI.Button(optionBox, dropdownArrow)) {
				dropdown.open = !dropdown.open; //Toggle menu if you click the dropdown source button.
			}

			//Draw the current selection as a label.
			var options = dropdown.options;
			var selectedIndex = dropdown.selectedIndex;
			var blankText = dropdown.blankText;
			var selectedText = (selectedIndex < 0 || selectedIndex > options.length) ? blankText : options[selectedIndex];
			GUI.Label(optionBox, selectedText);

			//Restore alignment
			GUI.skin.button.alignment = oldButtonAlignment;
			GUI.skin.label.alignment = oldLabelAlignment;


			//show the other options if dropdown is open.
			if (dropdown.open) {

				var outerBox = new Rect(optionBox.x, optionBox.y + optionBox.height, optionBox.width, dropdown.dropHeight);
				var requiredHeight = options.length * optionBox.height;
				
				if (blankText != null) {
					requiredHeight += optionBox.height;
				}

				if (outerBox.height > requiredHeight) {
					outerBox.height = requiredHeight; //truncate the bottom of the outer box, so you don't see extra space.
				} else if (outerBox.height < requiredHeight) {
					optionBox.width-=14; //make space for the scroll bar.
				}

				//Draw a Box to darken the background behind the buttons.
				GUI.Box(outerBox, "");
				GUI.Box(outerBox, "");

				//Create a scroll pane the size of the outer box.
				var innerBox = new Rect(0, 0, optionBox.width-3, requiredHeight);
				
				dropdown.scrollPosition = GUI.BeginScrollView (outerBox, 
						dropdown.scrollPosition, innerBox);

					optionBox.x = optionBox.y = 0; //move to the top left of the scrollable pane.

					//Calculate the number of hypens
					var hyphenSize : double = GUI.skin.button.CalcSize(new GUIContent("- ")).x;
					var hypenCount = (optionBox.width / hyphenSize);
					var hypenRatio = 1.3; //arbitrary number that looks pretty good.

					//Create a button for the blank option.
					if (GUI.Button(optionBox, "- " * (hypenCount * hypenRatio))) {
						dropdown.open = false;
						dropdown.selectedIndex = -1;
					}
					optionBox.y+=optionBox.height;

					for (var optionIndex = 0 ; optionIndex < options.length ; optionIndex ++) {

						//Create a button for the current option.
						if (GUI.Button(optionBox, options[optionIndex])) {
							dropdown.open = false;
							dropdown.selectedIndex = optionIndex;
						}

						//adjust the y value
						optionBox.y += optionBox.height;
					}

				GUI.EndScrollView();
			}
		}

		//Restore GUI properties
		GUI.depth = oldDepth;

	}

	function LateUpdate() {
		for (var dropdown in dropdowns.Values) {
			dropdown.showing = false;
		}
	}

	class DropdownMenu {
		var optionBox : Rect;
		var dropHeight : int;
		var options : String[];
		var selectedIndex : int;
		var id : int;
		var open : boolean = false;
		var showing : boolean = true;
		var blankText : String;
		var scrollPosition : Vector2 = Vector2.zero;

		public function DropdownMenu(optionBox : Rect, dropHeight : int, options : String[], selectedIndex : int, id : int, blankText : String) {
			this.optionBox = optionBox;
			this.dropHeight = dropHeight;
			this.options = options;
			this.selectedIndex = selectedIndex;
			this.id = id;
			this.blankText = blankText;
		}
	}
}