//TODO: tooltips over all buttons
#pragma strict 

class FileMenu extends BaseMenu {

	var plus : Texture;
	var cross : Texture;

	private static var cur_y : float;
	private static var attributeScrollPosition : Vector2 = Vector2.zero;

	static var DROPDOWN_ID = "0";

	/*	Used to decide what to display below the line.
		-1 : nothing
		0+ : index in FileManager.files */
	static var selected_file_index : int = -1; //used to decide what to display below the line.
	static var creating_file : boolean = false;


	private static var attrRowHeight = 25;

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

	static function setSelectedFileIndex(index : int) {
		if (selected_file_index != index) {
			selected_file_index = index;
			AttributeMenu.setSelectedIndex(-1);
			creating_file = false;
			Dropdown.reset(DROPDOWN_ID);
		}
	}

	static function toggleCreatingFile() {
		creating_file = !creating_file;
		AttributeMenu.setSelectedIndex(-1);

		if (creating_file) {
			FilePicker.centerWindow();
		}
	}

	function OnGUI(){
		super.OnGUI();

		if (!displaying) {
			return;
		}

		cur_y = 35;
		
		//Draw the file selection dropdown
		var selection_rect = new Rect(x+10, cur_y, width-50, 30);
		var dropHeight = 500;
		var filesList = new String[FileManager.files.Count];
		for (var i = 0 ; i < FileManager.files.Count ; i++) {
			filesList[i] = FileManager.files[i].shortName();
		}
		var new_selected_index = Dropdown.Select(selection_rect, dropHeight, filesList, selected_file_index, DROPDOWN_ID, "Select a File");
		if (new_selected_index != selected_file_index) {
			setSelectedFileIndex(new_selected_index);
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
		if (GuiPlus.Button(selection_rect, image)){
			toggleCreatingFile();
		}
		GUI.color = Color.white;			
		cur_y += 37;
		
		if (creating_file) {
			FilePicker.PickFile(FilePickerSelectFunction, FilePickerCancelFunction, "Open File");
		}

		if (selected_file_index >= 0){
			DrawLoadedFileDetails();
		}
	}

	//displays information / actions for activated files.
	function DrawLoadedFileDetails(){
		var file = FileManager.files[selected_file_index];
		var menuRect = new Rect(x, cur_y, width, MenuController.getScreenHeight()-cur_y);
		if (file.isActivated()){
			var title = "Activated File";
		} else if (file.isActivating()) {
			title = "Loading File...";
		} else {
			title = "Loaded File";
		}
		GuiPlus.Box(menuRect, title);
		cur_y += 22;
		var toggle_box = new Rect(x+5, cur_y, 150, 25);
		var using_headers = GuiPlus.LockableToggle(toggle_box, file.using_headers, " File uses headers", file.isActivated() || file.isActivating());
		if (file.using_headers != using_headers){
			file.ToggleUsingHeaders();
		}
		
		toggle_box.x+=160;
		file.linking_table = GuiPlus.LockableToggle(toggle_box, file.linking_table, " Linking Table", file.isActivated() || file.isActivating());
		
		cur_y+=28;
		var fkey_box = new Rect(x+10, cur_y, width/2-10, 32);
		GUI.color = Attribute.FKEY_COLOR;
		if (GuiPlus.Button(fkey_box, "Foreign Keys")){
			FkeyMenu.ToggleDisplay(FkeyMenu);
		}
		var details_box = new Rect(x+width/2+5, cur_y, width/2-20, 32);
		GUI.color = Attribute.TIME_SERIES_COLOR;
		if (GuiPlus.Button(details_box, "Time Series")){
			TimeFrameMenu.ToggleDisplay(TimeFrameMenu);
		}
		
		GUI.color = Color.white;	

		cur_y += 35;

		var label_box = new Rect(x+10, cur_y, width-10, 20);
		GuiPlus.Label(label_box, "Shown");
		label_box.x += 50;
		GuiPlus.Label(label_box, "PKey");
		label_box.x += 117;
		GuiPlus.Label(label_box, "Name");

		cur_y += 25;

		var file_attributes = file.getAttributes();

		//File Attributes (columns)
		attributeScrollPosition = GuiPlus.BeginScrollView (Rect (x+5,cur_y,width-10,MenuController.getScreenHeight()-cur_y-50), 
			attributeScrollPosition, Rect (0, 0, width-30, attrRowHeight*(file_attributes.Count+1)));
		
		
		var attribute_y = 0;
		
		for (var i = 0 ; i < file_attributes.Count ; i++){
			var attribute = file_attributes[i];
						
			//is shown toggles
			if (attribute.is_shown){ GUI.color = Attribute.SHOWN_COLOR; } 
			else { GUI.color = Color.white; }		
			var is_name_box = new Rect(17, attribute_y, 20, attrRowHeight);
			var is_shown_value = GuiPlus.Toggle (is_name_box, attribute.is_shown, "");	
			if (is_shown_value != attribute.is_shown){
				attribute.ToggleShown();
			}		
	
			//pkey toggles
			if (attribute.is_pkey){ GUI.color = Attribute.PKEY_COLOR; } 
			else { GUI.color = Color.white; }		
			var is_pkey_box = new Rect(63, attribute_y, 20, attrRowHeight);
			var pkey_value = GuiPlus.LockableToggle (is_pkey_box, attribute.is_pkey, "", file.isActivated() || file.isActivating());	
			if (pkey_value != attribute.is_pkey){
				attribute.TogglePkey();
			}
			
			//attribute buttons			
			GUI.color = attribute.getAspectColor();			
			var display_string :String = attribute.getRestrictedName(140);
	   		if (GuiPlus.Button(new Rect(100, attribute_y, 180, attrRowHeight), display_string)){
	   			DisableDisplay(FkeyMenu);
	   			DisableDisplay(TimeSeriesMenu);
	   			AttributeMenu.setSelectedIndex(i);
	   		}
		
			attribute_y += attrRowHeight;
		}
		
		GuiPlus.EndScrollView();
		
		var import_button : Rect;
		if (file.isActivated()){
			//Disable button
			GUI.color = new Color(1, .7, 0);
			cur_y += 30;
			import_button = new Rect(x+10, MenuController.getScreenHeight()-40, width/2-10, 30);
			if (GuiPlus.Button(import_button, "Deactivate File")){
				FileManager.DeactivateFile(selected_file_index);
			}
		} else {
			//Import button
			GUI.color = new Color(0, 1, 0);
			cur_y += 30;
			import_button = new Rect(x+10, MenuController.getScreenHeight()-40, width/2-10, 30);
			if (GuiPlus.Button(import_button, "Activate File")){
				FileManager.ActivateFile(selected_file_index);
			}
		}
		
		//Remove button
		GUI.color = Color.red;
		cur_y += 30;
		var remove_button = new Rect(x+width/2+5, MenuController.getScreenHeight()-40, width/2-12.5, 30);
		if (GuiPlus.Button(remove_button, "Remove File")) {
			FileManager.RemoveFile(selected_file_index);
			setSelectedFileIndex(-1);
		}
		
	}

	static function FilePickerSelectFunction() {
		setSelectedFileIndex(FileManager.Load(FilePicker.getFileString()));
	}

	static function FilePickerCancelFunction() {
		toggleCreatingFile();
	}

	static function EnableDisplay(){
		super.EnableDisplay(SearchMenu);
		GUI.FocusControl("searchbar");	
	}
}