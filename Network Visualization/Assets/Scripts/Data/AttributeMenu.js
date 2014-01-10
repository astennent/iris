#pragma strict

class AttributeMenu extends BaseMenu {

	var selected_index : int = -1; //used for displaying the foreign key menu to the side of the file menu.

	private var fkeyScrollPosition : Vector2 = Vector2.zero;

	function Start() {
		parent = GetComponent(FileMenu);
		super.Start();
		title = "Attribute Manager";
		width = 250;
	}

	function setSelectedIndex(index : int){
		if (index < 0 || index == selected_index){
			DisableDisplay();
		} else {
			EnableDisplay();
			selected_index = index;
		} 
	}

	function OnGUI(){
		super.OnGUI();

		if (displaying) {
			GUI.color = Color.white;

			//don't draw if you don't have anything to look at.
			if (selected_index < 0){
				DisableDisplay();
				return;
			}
			
			var cur_y = 40;
			var file = fileManager.files[fileMenu.selected_file_index];
			var attribute = file.attributes[selected_index];
			
			var name_box :Rect = new Rect(x+10, cur_y, 60, 20);
			GUI.Label(name_box, "Name:");
			name_box.width=width - 70;
			name_box.x += 50;

			var current_column_name = attribute.getColumnName();
			var new_column_name = GUI.TextField(name_box, current_column_name);
			if (new_column_name != current_column_name){
				attribute.setColumnName(new_column_name);	
			}
			
			cur_y += 25;
			
			//toggles
			var box = new Rect(x+10, cur_y, 200, 20);
			if (attribute.is_shown){ GUI.color = Attribute.shownColor; } 
			else { GUI.color = Color.white; }
			var shown_toggle = GUI.Toggle (box, attribute.is_shown, " Shown in 3D view");
			if (shown_toggle != attribute.is_shown){
				file.ToggleShown(selected_index);
			}

			box.y += 20;
			if (attribute.is_pkey){ GUI.color = Attribute.pkeyColor; } 
			else { GUI.color = Color.white; }
			attribute.is_pkey = GUI.Toggle (box, attribute.is_pkey, " Part of Primary Key");		

			box.y+=20;
			GUI.color = Color.white;
			GUI.Label(box, "For multi-attribute references, use");
			box.y+=20;
			GUI.color = new Color(1, .5, 0);
			if (GUI.Button(box, "Manage Foreign Key References")){
				fkeyMenu.ToggleDisplay();
			}
			GUI.color = Color.white;
			box.x+=30;
			box.y+=40;
			cur_y += 110;

			var fkey_rect = new Rect(x, cur_y, width, menuController.getScreenHeight()-cur_y);
			GUI.Box(fkey_rect, "Select Referencing Attributes");
			
			//determine the number of lines required.
			var line_count = 1;
			for (var cur_file : DataFile in fileManager.files){
				line_count += 3+cur_file.attributes.Count;
			}
			
			fkeyScrollPosition = GUI.BeginScrollView (Rect (x,cur_y+20,width, menuController.getScreenHeight()-cur_y), 
				fkeyScrollPosition, Rect (0, 0, width, 20*line_count));
			
			box = new Rect(10, 0, width-10, 40);
			for (var cur_file : DataFile in fileManager.files){
				box.height = 60;
				GUI.Label(box, cur_file.fname);
				box.y+=60;
				box.height = 20;
				for (var cur_attribute : Attribute in cur_file.attributes){
					var is_simple_fkey = file.getSimpleFkey(attribute, cur_attribute) != null;
					
					if (is_simple_fkey){ GUI.color = new Color(1, .5, 0); } else { GUI.color = Color.white; }
					var match_att = GUI.Toggle(box, is_simple_fkey, " " + cur_attribute.getColumnName());
					if (match_att != is_simple_fkey){
						if (match_att){	
							//generate an fkey	
							file.createSimpleFkey(cur_attribute.file, attribute, cur_attribute);		
						} else {
							//destroy the matching fkey.
							file.destroySimpleFkey(attribute, cur_attribute);
						}
					} 		
					box.y+=20;
				}
			}			
			GUI.EndScrollView();
		}
	}

	function DisableDisplay(){
		super.DisableDisplay();
		selected_index = -1;
	}


}