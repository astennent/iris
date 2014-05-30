#pragma strict

class FilePicker extends MonoBehaviour {

	var folderTexture : Texture;
	var fileTexture : Texture;
	var upDirectoryTexture : Texture;
	static var folderTexture_s : Texture;
	static var fileTexture_s : Texture;
	static var upDirectoryTexture_s : Texture;

	private static var scrollPosition : Vector2 = Vector2.zero;

	static var selectedIndex = 0;
	
	static var matching_directories = new LinkedList.<Icon>();
	static var matching_files = new LinkedList.<Icon>();

	static var iconSize = 70; 
	static var iconNameHeight = 45;
	static var textRectHeight = 25;

	static var headerRect : Rect;

	private static var fileString = "";
	private static var outerRect : Rect;

	function Start() {
		folderTexture_s = folderTexture;
		fileTexture_s = fileTexture;
		upDirectoryTexture_s = upDirectoryTexture;
	}

	//Called from GUI methods with the size of the rectangle to display.
	static function PickFile(outerRect : Rect, fileString : String) {
		return PickFile(outerRect, fileString, false);
	}

	static function PickFile(outerRect : Rect, fileString : String, shouldDrawSidebar : boolean) {
		
		//Save this window area so it doesn't need to be passed around
		this.outerRect = outerRect;

		GUI.Box(outerRect, "");

		//Update directory contents if the string has changed.
		if (fileString != this.fileString) {
			setFileString(fileString);
		}

		//Draw the shortcut bar on the left side.
		var leftSide = 0;
		if (shouldDrawSidebar) {
			leftSide = DrawSideBar();
		}

		//Draw the field of icons with folder and file images
		DrawIconField(leftSide, textRectHeight + outerRect.y + 10);
		
		//Draw the text input for the user to type in the file information
		//Note: Header is drawn second so that you can capture keypress events before they're consumed by the textfield.
		DrawHeader(leftSide, outerRect.y + 5);

		return this.fileString;
	}

	static function DrawSideBar() {
		return 0;
	}

	static function DrawHeader(leftSide : int, cur_y : int) {
		GUI.color = Color.white;
		var margin = 10;
		var headerWidth = outerRect.width-margin;
		var upRect = new Rect(outerRect.x+leftSide+5, cur_y, textRectHeight, textRectHeight);

		if (GUI.Button(upRect, upDirectoryTexture_s)) {
			moveUpDirectory();
		}

		var textLeft = upRect.x+upRect.width+3;
		headerRect = new Rect(textLeft, cur_y, headerWidth-upRect.width, textRectHeight);

		var oldSelectionColor = GUI.skin.settings.selectionColor;
		GUI.skin.settings.selectionColor = new Color(0, 0, 0, 1);
		GUI.SetNextControlName("fileheader");
		var updatedFileString = GUI.TextField(headerRect, fileString);
		GUI.skin.settings.selectionColor = oldSelectionColor;

		
		focusHeader();
		if (updatedFileString != fileString) {
			setFileString(updatedFileString);
		}
	}

	static function DrawIconField(leftSide : int, cur_y : int) {
		var scrollOuterRect = new Rect(outerRect.x+leftSide, cur_y, outerRect.width-leftSide, outerRect.height-5-cur_y+outerRect.y);

		// Constants for icon size and spacing 
		var margin = 10;
		var scrollbarAdjust = 20; //TODO: Adjust only if necessary
		var padding = 3;

		var innerWidth = scrollOuterRect.width-scrollbarAdjust;
		var numIcons = matching_directories.Count + matching_files.Count;
		
		//Calculate the number of icons in a row
		var iconsPerRow = 0;
		var iconRight = margin + iconSize;
		while (iconRight < innerWidth) {
			iconRight += iconSize + padding;
			iconsPerRow++;
		}

		//Ensure there is at least 1 icon, even if it's huge.
		iconsPerRow = Mathf.Max(1, iconsPerRow);


		var numRows = (numIcons+iconsPerRow-1)/iconsPerRow;
		var innerHeight = numRows * (iconSize+padding+iconNameHeight);
		var scrollInnerRect = new Rect(0, 0, innerWidth, innerHeight);

		//Process up/left/down/right strokes
		var selectionChanged = processKeyStrokes(numIcons, iconsPerRow);


		// Keep track of the current selection rectangle so you can scroll to it later.
		var selectionTop = 0;
		var selectionBottom = 0;

		scrollPosition = GUI.BeginScrollView (scrollOuterRect, scrollPosition, scrollInnerRect);			

			var bothLists = new List.<LinkedList.<Icon> >();
			bothLists.Add(matching_directories); 
			bothLists.Add(matching_files);

			var scroll_y = 0;
			var colIndex = 0;
			var iconIndex = 0;
			for (var currentList in bothLists) {
				for (var icon in currentList) {
					var info = icon.getInfo();
					var button_x = margin + colIndex * (iconSize+padding);
					var desiredCoords = new Vector2(button_x, scroll_y);
					var buttonRect = icon.getAndUpdateLocation(desiredCoords);			
					var selected = (iconIndex == selectedIndex);

					//Determine values shown
					var text = icon.getName();
					var image = (icon.isDirectory()) ? folderTexture_s : fileTexture_s;

					//Adjust label
					var textRect = buttonRect;
					textRect.y += buttonRect.height;
					textRect.height = iconNameHeight;
					
					//Determine the color of the button
					GUI.color = icon.getColor();

					//Render box if selected
					if (selected) {
						var selectRect = buttonRect;
						selectRect.height+=textRect.height+4;
						selectRect.x -= 2;
						selectRect.width += 4;
						selectRect.y -= 2;
						GUI.Box(selectRect, "");

						selectionTop = selectRect.y;
						selectionBottom = selectionTop + selectRect.height;
					}

					//Render label
					GUI.Label(textRect, text);

					//Render button
					var pressedEnter = (selected && Event.current.type == EventType.KeyDown && Event.current.keyCode == KeyCode.Return);
					if (GUI.Button(buttonRect, image) || pressedEnter) {
						setFileString(icon.getFullName());
						GUI.EndScrollView(); return;
					}

					iconIndex++;
					colIndex++;
					if (colIndex == iconsPerRow) {
						colIndex = 0;
						scroll_y += iconSize + padding + iconNameHeight;
					}
				}
			}

		GUI.EndScrollView();

		if (selectionChanged) {
			// Decide if you need to scroll to see the selection.
			var viewTop = scrollPosition.y;
			var viewBottom = viewTop + scrollOuterRect.height;

			if (selectionBottom > viewBottom) {
				//scroll down to fit the selection.
				scrollPosition.y = selectionBottom-scrollOuterRect.height;
			} else if (selectionTop < viewTop) {
				scrollPosition.y = selectionTop;
			}
		}

		focusHeader();
	}

	static function processKeyStrokes(numIcons : int, iconsPerRow : int) {
		var selectionChanged = false;
		var e = Event.current;
		if (e.type == EventType.KeyDown) {
			switch(e.keyCode) {
			case KeyCode.RightArrow:
				selectedIndex++;
				selectionChanged = true;
				break;
			case KeyCode.LeftArrow:
				selectedIndex--;
				selectionChanged = true;
				break;
			case KeyCode.DownArrow:
				if (selectedIndex < numIcons-iconsPerRow) {
					selectedIndex+=iconsPerRow;
				}
				selectionChanged = true;
				break;
			case KeyCode.UpArrow:
				if (selectedIndex >= iconsPerRow) {
					selectedIndex-=iconsPerRow;
				}
				selectionChanged = true;
				break;
			default:
				break;
			}
			selectedIndex = Mathf.Clamp(selectedIndex, 0, numIcons-1);
		} 
		return selectionChanged;
	}

	static function moveUpDirectory() {

		//Do nothing if the fileString is already empty.
		if (fileString == "") {
			return;
		}

		var delimiter = getPathDelimiter(fileString);
		if (fileString[fileString.length-1] == delimiter) {
			fileString = fileString.Substring(0, fileString.length-1);
		}
		setFileString(fileString.Substring(0, fileString.LastIndexOf(delimiter)+1));
	}

	static function setFileString(replacementFileString : String) {

		if (replacementFileString == fileString) {
			return;
		}

		var currentPathContainer = getPathContainer(fileString);
		var replacementPathContainer = getPathContainer(replacementFileString);

		if (currentPathContainer == replacementPathContainer) {
			var currentPathEnding = getPathEnding(fileString);
			var replacementPathEnding = getPathEnding(replacementFileString);

			if (currentPathEnding != replacementPathEnding) {
				filterDirectoryData(replacementFileString);		
			}	

		} else {
			replaceDirectoryData(replacementFileString);
		}

		fileString = replacementFileString;
	}


	// Called when appending or removing characters to the current path ending.
	static function filterDirectoryData(path : String) {
		var pathContainer = getPathContainer(path);
		var pathEnding = getPathEnding(path);
		var currentEnding = getPathEnding(fileString);

		var updated = false;

		// The new ending is longer than the old.
		if (pathEnding.length > currentEnding.length) {

			//Check that you are only appending to the end.
			if (currentEnding.length == 0 || pathEnding.Substring(0, currentEnding.length) == currentEnding) {
				filterDownDirectoryData(pathContainer, pathEnding);
				updated = true;
			} 
		} 

		// The new ending is shorter than the old. (Pressed backspace)
		else if (pathEnding.length < currentEnding.length) {
			filterUpDirectoryData(pathContainer, pathEnding);
			updated = true;
		} 

		// The change happened in the middle of the string or was a full replacement.
		if (!updated) {
			replaceDirectoryData(path);
		}
	}


	// Loops over the current matches and removes ones that do not match the ending.
	static function filterDownDirectoryData(pathContainer : String, pathEnding : String) {
	
		var entry = matching_directories.First;
		while (entry != null) {
			var nextEntry = entry.Next;
			var icon = entry.Value;
			if (!icon.getName().StartsWith(pathEnding)) {
				matching_directories.Remove(icon);
			}
			entry = nextEntry;
		}

		entry = matching_files.First;
		while (entry != null) {
			nextEntry = entry.Next;
			icon = entry.Value;
			if (!icon.getName().StartsWith(pathEnding)) {
				matching_files.Remove(icon);
			}
			entry = nextEntry;
		}
	}

	//Saves the current icons in a dictionary to preserve location for animation, 
	//then queries the OS for new directories and files.
	static function filterUpDirectoryData(pathContainer : String, pathEnding : String) {
		//Create maps that will be queried to see if an icon already exists.
		var oldDirectories = new Dictionary.<String, Icon>();
		for (var icon in matching_directories) {
			oldDirectories[icon.getName()] = icon;
		}

		var oldFiles = new Dictionary.<String, Icon>();
		for (var icon in matching_files) {
			oldFiles[icon.getName()] = icon;
		}

		matching_directories = new LinkedList.<Icon>();
		matching_files = new LinkedList.<Icon>();

		try {
			var dest_directory_names = Directory.GetDirectories(pathContainer);
			for (var entry in dest_directory_names){
				var di : DirectoryInfo = new DirectoryInfo(entry);
				if (di.Name.StartsWith(pathEnding)){

					var oldIcon = oldDirectories.ContainsKey(di.Name) ? oldDirectories[di.Name] : null;
					if (oldIcon == null) {
						matching_directories.AddLast(new Icon(di, null));
					} else {
						matching_directories.AddLast(oldIcon);
					}

				}
			}
			var dest_file_names = Directory.GetFiles(pathContainer);	
			for (var entry in dest_file_names){
				var fi : FileInfo = new FileInfo(entry);
				if (fi.Name.StartsWith(pathEnding)){


					oldIcon = oldFiles.ContainsKey(fi.Name) ? oldFiles[fi.Name] : null;
					if (oldIcon == null) {
						matching_files.AddLast(new Icon(null, fi));
					} else {
						matching_files.AddLast(oldIcon);
					}


				}
			}

		} catch (e) {	Debug.Log("Error: " + e); }

		focusHeader();

	}


	static function replaceDirectoryData(path : String){
		matching_directories = new LinkedList.<Icon>();
		matching_files = new LinkedList.<Icon>();
		
		var pathContainer = getPathContainer(path);
		var pathEnding = getPathEnding(path);

		filterUpDirectoryData(pathContainer, pathEnding);

		//Move the index to the beginning of the list
		selectedIndex = 0;		
	}


	// Returns the path with everything trailing the last "/" removed.
	// i.e. getPathContainer(foo/bar/x) == getContainingFolder(foo/bar/y); 
	static function getPathContainer(path : String) {
		var delimiter : String = getPathDelimiter(path);
		if (path.Contains(delimiter)) {
			return path.Substring(0, path.LastIndexOf(delimiter));
		}
		return path;
	}

	// Returns everything after the last "/" character 
	// i.e. getPathEnding(foo/bar) == "bar"
	static function getPathEnding(path : String) {
		var delimiter : String = getPathDelimiter(path);
		if (path.Contains(delimiter)) {
			if (path[path.length-1] == delimiter) {
				return "";
			}
			return path.Substring(path.LastIndexOf(delimiter)+1);
		}
		return path;
	}

	static function getPathDelimiter(path : String) {
		if (path.Contains("\\")) {
			return "\\";
		} else {
			return "/";
		}
	}

	private static function focusHeader() {
		GUI.FocusControl("fileheader");
		var controlID : int = GUIUtility.GetControlID(headerRect.GetHashCode(), FocusType.Keyboard); 
		var te : TextEditor = GUIUtility.GetStateObject(typeof(TextEditor), controlID -1);
		if (te != null) {
			te.MoveTextEnd();
		} 
	}

	class Icon {
		var isDir : boolean;
		var di : DirectoryInfo;
		var fi : FileInfo;
		var currentLocation : Vector2 = Vector2.zero;

		function isDirectory() {
			return isDir;
		}


		function Icon(di : DirectoryInfo, fi : FileInfo) {
			if (di != null) {
				this.di = di;
				isDir = true;
			} else {
				this.fi = fi;
				isDir = false;
			}
		}

		function getInfo() {
			return (isDir) ? di : fi;
		}

		function getName() {
			return (isDir) ? di.Name : fi.Name;
		}

		function getFullName() {
			var output = getInfo().FullName;
			if (isDir) {
				output += "\\";
			}
			return output;
		}

		function getColor() {
			if (isDir) {
				return Color.yellow;
			} else {
				return (getName().EndsWith(".csv")) ? Color.green : Color.cyan;
			}
		}

		function getAndUpdateLocation(desiredCoords : Vector2) {
			//Adjust location
			currentLocation = Vector2.Lerp(currentLocation, desiredCoords, 0.15);
			var iconRect = new Rect(currentLocation.x, currentLocation.y, iconSize, iconSize);
			return iconRect;
		}
		
	}
}