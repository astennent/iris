//TODO: tooltips over all buttons
#pragma strict 

import System.IO;

class FileMenu extends BaseMenu {

	var plus : Texture;
	var cross : Texture;

	private static var cur_y : float;
	private static var directoryScrollPosition : Vector2 = Vector2.zero;
	private static var attributeScrollPosition : Vector2 = Vector2.zero;
	private static var fileString : String = "";
	static var error_message : String = "";

	static var DROPDOWN_ID = "0";

	
	/*	Used to decide what to display below the line.
		-1 : nothing
		0+ : index in FileManager.files */
	static var selected_file_index : int = -1; //used to decide what to display below the line.
	static var creating_file : boolean = false;

	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		title = "File Manager";
	}

	static function getSelectedFile() {
		if (selected_file_index >= 0) {
			return FileManager.files[selected_file_index];
		} else {
			return null;
		}
	}

	static function setSelectedFile(index : int) {
		if (selected_file_index != index) {
			selected_file_index = index;
			AttributeMenu.setSelectedIndex(-1);
			FkeyMenu.resetCreation();
			creating_file = false;
		}
	}

	static function toggleCreatingFile() {
		creating_file = !creating_file;
		AttributeMenu.setSelectedIndex(-1);
		FkeyMenu.resetCreation();
	}

	function OnGUI(){
		super.OnGUI();
		cur_y = 35;
		
		//Draw the file selection dropdown
		var selection_rect = new Rect(x+10, cur_y, width-50, 30);
		var dropHeight = 120;
		var filesList = new String[FileManager.files.Count];
		for (var i = 0 ; i < FileManager.files.Count ; i++) {
			filesList[i] = FileManager.files[i].shortName();
		}
		var new_selected_index = Dropdown.Select(selection_rect, dropHeight, filesList, selected_file_index, DROPDOWN_ID, "Select a File");
		if (new_selected_index != selected_file_index) {
			setSelectedFile(new_selected_index);
		}

		
		//Draw the new file button
		selection_rect.x = x+width-40;
		selection_rect.width = 30;
		if (creating_file) {
			var image = cross;
			GUI.color = Color.red;
		} else {
			image = plus;
			GUI.color = Color.green;
		}
		if (GUI.Button(selection_rect, image)){
			toggleCreatingFile();
		}
		GUI.color = Color.white;			
		cur_y += 37;
		
		if (creating_file){
			DrawNewFileDetails();	
		} else if (selected_file_index >= 0){
			DrawLoadedFileDetails();
		}
	}

	//displays information / actions for imported files.
	function DrawLoadedFileDetails(){
		var file = FileManager.files[selected_file_index];

		var menuRect = new Rect(x, cur_y, width, MenuController.getScreenHeight()-cur_y);
		if (file.imported){
			var title = "Imported File";
		} else {
			title = "Loaded File";
		}
		GUI.Box(menuRect, title);
		cur_y += 20;
		var toggle_box = new Rect(x+5, cur_y, 150, 25);
		var using_headers = GuiPlus.LockableToggle(toggle_box, file.using_headers, " File uses headers", file.imported);
		if (file.using_headers != using_headers){
			file.ToggleUsingHeaders();
		}
		
		toggle_box.x+=160;
		file.linking_table = GuiPlus.LockableToggle(toggle_box, file.linking_table, " Linking Table", file.imported);
		
		cur_y+=28;
		var fkey_box = new Rect(x+10, cur_y, width/2-10, 32);
		GUI.color = Attribute.aspectColors[Attribute.FOREIGN_KEY];
		if (GUI.Button(fkey_box, "Foreign Keys")){
			FkeyMenu.ToggleDisplay(FkeyMenu);
		}
		var details_box = new Rect(x+width/2+5, cur_y, width/2-20, 32);
		GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
		if (GUI.Button(details_box, "Time Series")){
			TimeFrameMenu.ToggleDisplay(TimeFrameMenu);
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
		attributeScrollPosition = GUI.BeginScrollView (Rect (x+5,cur_y,width-10,MenuController.getScreenHeight()-cur_y-50), 
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
			var pkey_value = GuiPlus.LockableToggle (is_pkey_box, attribute.is_pkey, "", file.imported);	
			if (pkey_value != attribute.is_pkey){
				attribute.TogglePkey();
			}
			
			//attribute buttons			
			GUI.color = attribute.getAspectColor();			
			var display_string :String = attribute.getRestrictedName(140);
	   		if (GUI.Button(new Rect(100, attribute_y, 180, 20), display_string)){
	   			DisableDisplay(FkeyMenu);
	   			AttributeMenu.setSelectedIndex(i);
	   		}
		
			attribute_y += 20;
		}
		
		GUI.EndScrollView();
		
		var import_button : Rect;
		if (file.imported){
			//Disable button
			GUI.color = new Color(1, .7, 0);
			cur_y += 30;
			import_button = new Rect(x+10, MenuController.getScreenHeight()-40, width/2-10, 30);
			if (GUI.Button(import_button, "Deavtivate File")){
				FileManager.DeactivateFile(selected_file_index);
			}
		} else {
			//Import button
			GUI.color = new Color(0, 1, 0);
			cur_y += 30;
			import_button = new Rect(x+10, MenuController.getScreenHeight()-40, width/2-10, 30);
			if (GUI.Button(import_button, "Activate File")){
				FileManager.ActivateFile(selected_file_index);
			}
		}
		
		//Remove button
		GUI.color = Color.red;
		cur_y += 30;
		var remove_button = new Rect(x+width/2+5, MenuController.getScreenHeight()-40, width/2-12.5, 30);
		if (GUI.Button(remove_button, "Remove File")){
			//TODO: Removing files from workspace
			//FileManager.removeFile(selected_file_index);
			//selected_file_index = -1;
		}
		
	}

	//displays information / actions for a new file.
	function DrawNewFileDetails(){
		var menuRect = new Rect(x, cur_y, width, MenuController.getScreenHeight()-cur_y);
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
			selected_file_index = FileManager.Load(fileString); //switches to loaded menu if successful.
			AttributeMenu.setSelectedIndex(-1);
		}
		GUI.color = Color.white;
		
		DrawDirectoryData();
		
		
	}

	function DrawDirectoryData(){
		//loop over directories
		directoryScrollPosition = GUI.BeginScrollView (Rect (x,cur_y,width,MenuController.getScreenHeight()-cur_y), 
			directoryScrollPosition, Rect (0, 0, width, 20*FileManager.dest_directories.Count + 20*FileManager.dest_files.Count));
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
		for (var di:DirectoryInfo in FileManager.dest_directories){
			buttonRect = new Rect(10, cur_y, width-20, 20);
			if (GUI.Button(buttonRect, di.Name)){
				fileString = di.FullName;
				UpdateDirectoryData();
			}
			cur_y += 20;
		}
		//loop over files
		for (var fi:FileInfo in FileManager.dest_files){
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



	static function UpdateDirectoryData(){
		FileManager.UpdateDirectoryData(fileString);
		error_message = "";
	}

}