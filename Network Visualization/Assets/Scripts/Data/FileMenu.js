//TODO: tooltips over all buttons
#pragma strict 

import System.IO;

class FileMenu extends BaseMenu {

	private var cur_y : float;
	private var directoryScrollPosition : Vector2 = Vector2.zero;
	private var attributeScrollPosition : Vector2 = Vector2.zero;
	private var fileString : String = "";
	var error_message : String = "";

	
	/*	Used to decide what to display below the line.
		-2 : new File
		-1 : nothing
		0+ : index in FileManager.files */
	var selected_file_index : int = -1; //used to decide what to display below the line.

	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		title = "File Manager";
	}

	function getSelectedFile() {
		if (selected_file_index >= 0) {
			return fileManager.files[selected_file_index];
		} else {
			return null;
		}
	}

	function setSelectedFile(index : int) {
		selected_file_index = index;
		attributeMenu.setSelectedIndex(-1);
		fkeyMenu.resetCreation();
	}
	function OnGUI(){
		super.OnGUI();
		cur_y = 40;
		//make buttons for each of the files.
		var button_position : Rect;
		for (var i=0 ; i<fileManager.files.Count ; i++){
			button_position = new Rect(x+10, cur_y, width-20, 30);
			var file : DataFile = fileManager.files[i];
			if (i == selected_file_index){ GUI.color = Color.yellow; } else { GUI.color = Color.white;	}
			if (GUI.Button(button_position, file.shortName())){
				setSelectedFile(i);
			}
			//display files.
			cur_y += 35;
		}
		GUI.color = Color.white;
		
		button_position = new Rect(x+10, cur_y, width-20, 30);
		GUI.color = Color.green;
		
		//New File Button
		if (GUI.Button(button_position, "Import New File")){
			setSelectedFile(-2);
		}

		GUI.color = Color.white;	
		cur_y += 40;	
		
		if (selected_file_index == -2){
			DrawNewFileDetails();	
		} else if (selected_file_index >= 0){
			DrawLoadedFileDetails();
		}
	}

	//displays information / actions for imported files.
	function DrawLoadedFileDetails(){
		var file = fileManager.files[selected_file_index];

		var menuRect = new Rect(x, cur_y, width, Screen.height-cur_y);
		if (file.imported){
			var title = "Imported File";
		} else {
			title = "Loaded File";
		}
		GUI.Box(menuRect, title);
		cur_y += 20;
		var toggle_box = new Rect(x+5, cur_y, 150, 25);
		var using_headers = GUI.Toggle (toggle_box, file.using_headers, " File uses headers");
		if (file.using_headers != using_headers){
			file.ToggleUsingHeaders();
		}
		
		toggle_box.x+=160;
		file.linking_table = GUI.Toggle (toggle_box, file.linking_table, " Linking Table");
		
		cur_y+=28;
		var fkey_box = new Rect(x+10, cur_y, width/2-10, 32);
		GUI.color = Attribute.aspectColors[Attribute.FOREIGN_KEY];
		if (GUI.Button(fkey_box, "Foreign Keys")){
			fkeyMenu.ToggleDisplay();
		}
		var details_box = new Rect(x+width/2+5, cur_y, width/2-20, 32);
		GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
		if (GUI.Button(details_box, "Time Series")){
			timeFrameMenu.ToggleDisplay();
		}
		
		GUI.color = Color.white;	

		cur_y += 35;

		var label_box = new Rect(x+10, cur_y, width-10, 20);
		GUI.Label(label_box, "Shown");
		label_box.x += 50;
		GUI.Label(label_box, "PKey");
		label_box.x += 117;
		GUI.Label(label_box, "Name");

		cur_y += 25;

		//File Attributes (columns)
		attributeScrollPosition = GUI.BeginScrollView (Rect (x+5,cur_y,width-10,Screen.height-cur_y-50), 
			attributeScrollPosition, Rect (0, 0, width-30, 20*file.attributes.Count+20));
		
		
		var attribute_y = 0;
		
		for (var i = 0 ; i < file.attributes.Count ; i++){
			var attribute = file.attributes[i];
						
			//is shown toggles
			if (attribute.is_shown){ GUI.color = Attribute.shownColor; } 
			else { GUI.color = Color.white; }		
			var is_name_box = new Rect(17, attribute_y, 20, 20);
			var is_shown_value = GUI.Toggle (is_name_box, attribute.is_shown, "");	
			if (is_shown_value != attribute.is_shown){
				attribute.ToggleShown();
			}		
	
			//pkey toggles
			if (attribute.is_pkey){ GUI.color = Attribute.pkeyColor; } 
			else { GUI.color = Color.white; }		
			var is_pkey_box = new Rect(63, attribute_y, 20, 20);
			var pkey_value = GUI.Toggle (is_pkey_box, attribute.is_pkey, "");	
			if (pkey_value != attribute.is_pkey){
				attribute.TogglePkey();
			}
			
			//attribute buttons			
			GUI.color = attribute.getAspectColor();			
			var display_string :String = attribute.getRestrictedName(140);
	   		if (GUI.Button(new Rect(100, attribute_y, 180, 20), display_string)){
	   			fkeyMenu.DisableDisplay();
	   			attributeMenu.setSelectedIndex(i);
	   		}
		
			attribute_y += 20;
		}
		
		GUI.EndScrollView();
		
		var import_button : Rect;
		if (file.imported){
			//Disable button
			GUI.color = new Color(1, .7, 0);
			cur_y += 30;
			import_button = new Rect(x+10, Screen.height-40, width/2-10, 30);
			if (GUI.Button(import_button, "Deavtivate File")){
				fileManager.DeactivateFile(selected_file_index);
			}
		} else {
			//Import button
			GUI.color = new Color(0, 1, 0);
			cur_y += 30;
			import_button = new Rect(x+10, Screen.height-40, width/2-10, 30);
			if (GUI.Button(import_button, "Activate File")){
				fileManager.ActivateFile(selected_file_index);
			}
		}
		
		//Remove button
		GUI.color = Color.red;
		cur_y += 30;
		var remove_button = new Rect(x+width/2+5, Screen.height-40, width/2-12.5, 30);
		if (GUI.Button(remove_button, "Remove File")){
			//TODO: Removing files from workspace
			//fileManager.removeFile(selected_file_index);
			//selected_file_index = -1;
		}
		
	}

	//displays information / actions for a new file.
	function DrawNewFileDetails(){
		var menuRect = new Rect(x, cur_y, width, Screen.height-cur_y);
		GUI.Box(menuRect, "New File");
		
		cur_y+=30;
		var sourceRect = new Rect(x+10, cur_y, 100, 20);
		GUI.Label(sourceRect, "Source");
		sourceRect.x+=50;
		sourceRect.width = width-65;
		
		var newFileString : String = GUI.TextField(sourceRect, fileString, 100);
		if (newFileString != fileString){
			fileString = newFileString;
			UpdateDirectoryData();
		}
		
		cur_y+=20;
		
		if (error_message != ""){
			GUI.color = new Color(1.0, 0.7, 0.7);
			var errorRect = new Rect(x+10, cur_y, width-20, 20);
			GUI.Label(errorRect, error_message);
			GUI.color = Color.white;
		}
		var loadRect = new Rect(x+200, cur_y, width- 220, 20);
		
		cur_y+=30;
		
		//Color the load button green if it's a csv
		if (fileString.EndsWith(".csv")){
			GUI.color = Color.green;
		} else {
			GUI.color = Color.white;
		}
		if (GUI.Button(loadRect, "Load")){
			selected_file_index = fileManager.Load(fileString); //switches to loaded menu if successful.
			attributeMenu.selected_index = -1;
		}
		GUI.color = Color.white;
		
		DrawDirectoryData();
		
		
	}

	function DrawDirectoryData(){
		//loop over directories
		directoryScrollPosition = GUI.BeginScrollView (Rect (x,cur_y,width,Screen.height-cur_y), 
			directoryScrollPosition, Rect (0, 0, width, 20*fileManager.dest_directories.Count + 20*fileManager.dest_files.Count));
		cur_y = 0;
		
		GUI.color = new Color(0, .8, .8);
		if (fileString.Contains("\\") || fileString.Contains("/")){
			var buttonRect : Rect = new Rect(10, cur_y, width-20, 20);
			if (GUI.Button(buttonRect, "<--")){
				if (fileString.Contains("\\")){
					fileString = fileString.Substring(0, fileString.LastIndexOf("\\"));
				} else if (fileString.Contains("/")){
					fileString = fileString.Substring(0, fileString.LastIndexOf("/"));
				}
				UpdateDirectoryData();
			}
		}
		GUI.color = Color.cyan;
		cur_y+=20;
		for (var di:DirectoryInfo in fileManager.dest_directories){
			buttonRect = new Rect(10, cur_y, width-20, 20);
			if (GUI.Button(buttonRect, di.Name)){
				fileString = di.FullName;
				UpdateDirectoryData();
			}
			cur_y += 20;
		}
		//loop over files
		for (var fi:FileInfo in fileManager.dest_files){
			if (fi.Name.EndsWith(".csv")){
				GUI.color = Color.green;
			} else {
				GUI.color = Color.yellow;
			}
			buttonRect = new Rect(10, cur_y, width-20, 20);
			if (GUI.Button(buttonRect, fi.Name)){
				fileString = fi.FullName;
				UpdateDirectoryData();
			}
			cur_y += 20;
		}
		GUI.EndScrollView();
	}



	function UpdateDirectoryData(){
		fileManager.UpdateDirectoryData(fileString);
		error_message = "";
	}

}