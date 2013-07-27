
class AttributeMenu extends SecondaryMenu {

	var selected_index : int = -1; //used for displaying the foreign key menu to the side of the file menu.

	private var fkeyScrollPosition : Vector2 = Vector2.zero;

	function Start(){
		super.Start();
		parentMenu = GetComponent(FileMenu);
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
		GUI.color = Color.white;

		var menuRect = new Rect(x, 0, width, Screen.height);
		GUI.Box(menuRect, "Attribute Manager");
		
		//don't draw if you don't have anything to look at.
		if (selected_index < 0){
			return;
		}
		
		var cur_y = 40;
		var file = fileManager.files[fileMenu.selected_file_index];
		var attribute = file.attributes[selected_index];
		
		var name_box :Rect = new Rect(x+10, cur_y, 60, 20);
		GUI.Label(name_box, "Name:");
		name_box.width=width - 70;
		name_box.x += 50;
		attribute.column_name = GUI.TextField(name_box, attribute.column_name);
		
		cur_y += 25;
		
		//toggles
		var box = new Rect(x+10, cur_y, 200, 20);
		if (attribute.is_shown){ GUI.color = new Color(1, 0, 1); } 
		else { GUI.color = Color.white; }
		var shown_toggle = GUI.Toggle (box, attribute.is_shown, " Shown in 3D view");
		if (shown_toggle != attribute.is_shown){
			file.ToggleShown(selected_index);
		}


		box.y += 20;
		if (attribute.is_numeric){ GUI.color = new Color(.5, .5, 1); } 
		else { GUI.color = Color.white; }
		var numeric_toggle = GUI.Toggle (box, attribute.is_numeric, " Uses numeric values");		
		if (numeric_toggle != attribute.is_numeric){
			file.ToggleNumeric(selected_index);
		}
		
		box.y += 20;
		if (attribute.is_pkey){ GUI.color = Color.yellow; } 
		else { GUI.color = Color.white; }
		attribute.is_pkey = GUI.Toggle (box, attribute.is_pkey, " Part of Primary Key");		

		
		box.y+=40;	
		if (attribute.is_fkey){ GUI.color = new Color(1, .5, 0);}
		else { GUI.color = Color.white; }
		box.y+=20;
		GUI.Label(box, "For multi-attribute references, use");
		box.y+=20;
		GUI.color = new Color(1, .5, 0);
		if (GUI.Button(box, "Manage Foreign Key References")){
			fkeyMenu.ToggleDisplay();
		}
		GUI.color = Color.white;
		box.x+=30;
		box.y+=40;
		cur_y += 30;
		cur_y += 120;

		var fkey_rect = new Rect(x, cur_y, width, Screen.height-cur_y);
		GUI.Box(fkey_rect, "Select Referencing Attributes");
		
		//determine the number of lines required.
		var line_count = 1;
		for (var cur_file : DataFile in fileManager.files){
			line_count += 3+cur_file.attributes.length;
		}
		
		fkeyScrollPosition = GUI.BeginScrollView (Rect (x,cur_y+20,width,Screen.height-cur_y), 
			fkeyScrollPosition, Rect (0, 0, width, 20*line_count));
		
		box = new Rect(10, 0, width-10, 40);
		for (var cur_file : DataFile in fileManager.files){
			box.height = 60;
			GUI.Label(box, cur_file.fname);
			box.y+=60;
			box.height = 20;
			for (var cur_attribute : DataFileAttribute in cur_file.attributes){
				var is_simple_fkey = file.getSimpleFkeyIndexOf(attribute, cur_attribute) != -1;
				
				if (is_simple_fkey){ GUI.color = new Color(1, .5, 0); } else { GUI.color = Color.white; }
				var match_att = GUI.Toggle(box, is_simple_fkey, " " + cur_attribute.column_name);
				if (match_att != is_simple_fkey){
					if (match_att){	
						//generate an fkey	
						file.createFkey(cur_attribute.file, attribute, cur_attribute);		
					} else {
						//destroy the matching fkey.
						file.destroyFkey(attribute, cur_attribute);
					}
				} 		
				box.y+=20;
			}
		}

			
		GUI.EndScrollView();
	}

	function DisableDisplay(){
		super.DisableDisplay();
		selected_index = -1;
	}


}