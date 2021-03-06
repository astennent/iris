﻿#pragma strict

import System.IO;

class FilePicker extends MonoBehaviour {

	var customSkin : GUISkin;
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

	static var gridIconSize = 70; 
	static var gridIconNameHeight = 45;
	static var listIconSize = 30;

	static var textRectHeight = 25;

	static var selectButtonsHeight = 40;

	static var headerRect : Rect;

	private static var outerRect : Rect;

	private static var rendering = false; //Should the file picker be rendered right now?
	private static var fileString : String;
	static var fileStringWindow : Window;
	private static var windowWidth = 620;
	private static var windowHeight = 440;

		//Filled in by GUI calls of other menus.
	static var onSelectFunction : Function;
	static var onCancelFunction : Function;
	static var title : String;

	// Toggles between icons and a list.
	private static var isUsingListView : boolean = true;

	function Start() {
		folderTexture_s = folderTexture;
		fileTexture_s = fileTexture;
		upDirectoryTexture_s = upDirectoryTexture;
		fileString = Path.GetFullPath(".") + "\\";
		outerRect = new Rect(0, 0, windowWidth, windowHeight);
		fileStringWindow = Window.Instantiate(new Rect((Screen.width-windowWidth)/2, 
				(MenuController.getScreenHeight()-windowHeight)/2, windowWidth, windowHeight));
	}

	function LateUpdate() {
		rendering = false;
	}

	function OnGUI() {
		GUI.skin = customSkin;
		if (rendering) {
			fileString = "" + fileStringWindow.Render(RenderFilePicker);		
		}
	}

	static function setPosition(point : Vector2) {
		fileStringWindow.setPosition(point);
	}

	static function centerWindow() {
		var openSpaceCenter = (MenuController.getScreenLeft() + MenuController.getScreenRight())/2;
		var windowX = openSpaceCenter - windowWidth/2;
		var windowY = (MenuController.getScreenHeight()-windowHeight)/2;

		setPosition(new Vector2(windowX, windowY));
	}

	//Called from other menu's GUI methods
	static function PickFile(selectionFunction : Function, cancelFunction : Function, title:String) : String {

		// The current file picking operation has changed. Cancel the first one.
		if (selectionFunction != onSelectFunction) {
			if (onCancelFunction != null) {
				onCancelFunction();
			}
			clearFunctions();
		}

		onSelectFunction = selectionFunction;
		onCancelFunction = cancelFunction;
		this.title = title;
		rendering = true;
		return fileString;
	}

	static function clearFunctions() {
		onSelectFunction = null;
		onCancelFunction = null;
		replaceDirectoryData(fileString);
	}

	//Get the last file string selected by the file picker. Does not render the GUI.
	static function getFileString() {
		return fileString;
	}

	private static function RenderFilePicker() : String {		
		GuiPlus.Box(outerRect, "");

		//Update directory contents if the string has changed.
		if (fileString != this.fileString) {
			setFileString(fileString);
		}

		//TODO: Draw the shortcut bar on the left side.
		var leftSide = 0;

		//Draw the field of icons with folder and file images
		DrawIconField(leftSide, textRectHeight + outerRect.y + 10);
		
		//Draw the text input for the user to type in the file information
		//Note: Header is drawn second so that you can capture keypress events before they're consumed by the textfield.
		DrawHeader(leftSide, outerRect.y + 5);

		DrawSelectButtons(outerRect.y + outerRect.height - selectButtonsHeight + 5);

		return this.fileString;
	}

	static function DrawHeader(leftSide : int, cur_y : int) {
		GUI.color = Color.white;
		var margin = 10;
		var headerWidth = outerRect.width-margin;
		var upRect = new Rect(outerRect.x+leftSide+5, cur_y, textRectHeight, textRectHeight);

		if (GuiPlus.Button(upRect, upDirectoryTexture_s)) {
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
		var scrollOuterRect = new Rect(outerRect.x+leftSide, cur_y, outerRect.width-leftSide, outerRect.height-5-cur_y+outerRect.y-selectButtonsHeight);

		// Constants for icon size and spacing 
		var margin = 10;
		var scrollbarAdjust = 20; //TODO: Adjust only if necessary
		var padding = 3;

		var innerWidth = scrollOuterRect.width-scrollbarAdjust;
		var numIcons = matching_directories.Count + matching_files.Count;
		var iconSize = getIconSize();
		var iconNameHeight = (isUsingListView) ? 0 : gridIconNameHeight;
		
		//Calculate the number of icons in a row.
		var iconsPerRow : int;
		if (isUsingListView) {
			iconsPerRow = 1;
		} else {
			iconsPerRow = 0;
			var iconRight = margin + iconSize;
			while (iconRight < innerWidth) {
				iconRight += iconSize + padding;
				iconsPerRow++;
			}

			//Ensure there is at least 1 icon, even if it's huge.
			iconsPerRow = Mathf.Max(1, iconsPerRow);
		}


		var numRows = (numIcons+iconsPerRow-1)/iconsPerRow;
		var innerHeight = numRows * (iconSize+padding+iconNameHeight);
		var scrollInnerRect = new Rect(0, 0, innerWidth, innerHeight);

		//Process up/left/down/right strokes
		var selectionChanged = processKeyStrokes(numIcons, iconsPerRow);


		// Keep track of the current selection rectangle so you can scroll to it later.
		var selectionTop = 0;
		var selectionBottom = 0;

		scrollPosition = GuiPlus.BeginScrollView (scrollOuterRect, scrollPosition, scrollInnerRect);			

			var bothLists = new List.<LinkedList.<Icon> >();
			bothLists.Add(matching_directories); 
			bothLists.Add(matching_files);

			var scroll_y = 0;
			var colIndex = 0;
			var iconIndex = 0;

			var pressedEnter = (Event.current.type == EventType.KeyDown && Event.current.keyCode == KeyCode.Return);

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

					if (isUsingListView) {
						var labelBuffer = 5;
						textRect.width = innerWidth - iconSize - 2*labelBuffer;
						textRect.x = margin + padding + iconSize + labelBuffer;
					} else {
						textRect.y += buttonRect.height;
						textRect.height = gridIconNameHeight;
					}
					
					//Determine the color of the button
					GUI.color = icon.getColor();

					// Calculate the size of the box around the icon.
					var selectRect = buttonRect;

					if (isUsingListView) {
						selectRect.width = innerWidth - iconSize - padding - 4;
						selectRect.x = margin + padding + iconSize - padding;
					} else {
						selectRect.height+=textRect.height+4;
						selectRect.x -= 2;
						selectRect.width += 4;
						selectRect.y -= 2;
					}

					//Render box if selected
					if (selected) {
						GuiPlus.Box(selectRect, "");
						selectionTop = selectRect.y;
						selectionBottom = selectionTop + selectRect.height;
					}

					//Render button
					if (GuiPlus.Button(buttonRect, image) || (selected && pressedEnter) ) {
						setFileString(icon.getFullName());
						GuiPlus.EndScrollView(); return;
					}

					// Select the icon if the user clicks the button, it will change the folder and override this. 
					GUI.color.a = 0.5;
					if (GuiPlus.Button(selectRect, "")) {
						selectedIndex = iconIndex;
						selected = true;
					}
					GUI.color.a = 1;

					//Render label
					GuiPlus.Label(textRect, text);

					iconIndex++;
					colIndex++;
					if (colIndex == iconsPerRow) {
						colIndex = 0;
						scroll_y += iconSize + padding + iconNameHeight;
					}
				}
			}

		GuiPlus.EndScrollView();

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

	private static function getIconSize() {
		return (isUsingListView) ? listIconSize : gridIconSize;
	}

	static function DrawSelectButtons(cur_y : float) {

		var titleRect = new Rect(10, cur_y, 500, selectButtonsHeight-10);
		GuiPlus.Label(titleRect, title);

		var styleIconSize = selectButtonsHeight-10;
		var styleIconRect = new Rect(outerRect.width-270, cur_y, styleIconSize, styleIconSize);
		
		// TODO: Icons....
		if (GUI.Button(styleIconRect, "L")) {
			isUsingListView = true;
		} 
		styleIconRect.x += styleIconSize;
		if (GUI.Button(styleIconRect, "G")) {
			isUsingListView = false;
		} 

		var buttonWidth = 80;
		var buttonRect = new Rect(outerRect.width-175, cur_y, buttonWidth, styleIconSize);
		if (GuiPlus.Button(buttonRect, "Select")) {
			onSelectFunction();
			clearFunctions();
		}

		buttonRect.x += buttonWidth+10;
		if (GuiPlus.Button(buttonRect, "Cancel")) {
			onCancelFunction();
			clearFunctions();
		}
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
				selectedIndex+=iconsPerRow;
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
			var iconSize = FilePicker.getIconSize();
			var iconRect = new Rect(currentLocation.x, currentLocation.y, iconSize, iconSize);
			return iconRect;
		}
		
	}
}