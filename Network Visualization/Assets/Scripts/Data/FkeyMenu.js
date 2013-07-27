//Handles the display of the fkey section in the file menu.

class FkeyMenu extends SecondaryMenu {

	private var creating : boolean;
	private var temp_key : Object[];
	private var temp_self_attr : DataFileAttribute;
	private var temp_foreign_attr : DataFileAttribute;

	private var adding_index : int = -1;
	private var adding_from_attr : DataFileAttribute;

	private var tempFileScrollPosition : Vector2 = Vector2.zero;

	function Start(){
		super.Start();
		temp_key = new Object[3];
		parentMenu = GetComponent(FileMenu);
		title = "Foreign Key Manager";
	}
   
	function OnGUI(){
		super.OnGUI();
		GUI.color = Color.white;
		
		file_index = fileMenu.selected_file_index;
		if (file_index < 0){
			return;
		}	
		var file = fileManager.files[file_index];			

		
		var cur_y = 40;
		add_box = new Rect(x+20, cur_y, width-40, 30);
		if (creating){
			if (GUI.Button(add_box, "Cancel")){
				resetCreation();
			}
		} else {
			if (GUI.Button(add_box, "Create Foreign Key")){
				creating = true;
				temp_key = new Object[3];
			}
		}
		
		//interface for creating a foreign key
		if (creating){
			var reference_box = new Rect (x,cur_y+30,width,180);
			cur_y += 40;
			
			//select a reference file
			if (temp_key[0] == null){
				GUI.Box(reference_box, "Reference file");
				reference_box.height -= 30;
				reference_box.y+= 30;
				cur_y += 30;
				tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
					tempFileScrollPosition, Rect (0, 0, width-10, 30*fileManager.files.length));			
				file_box = new Rect(0, 0, width-20, 30);
				for (var f : DataFile in fileManager.files){
					if (GUI.Button(file_box, f.shortName())){
						temp_key[0] = f;
					}
					file_box.y+=30;
				}
				GUI.EndScrollView();
							
			} else {
				file_box = new Rect(x+width-80, cur_y, 80, 20);
				GUI.color = Color.red;
				if (GUI.Button(file_box, "(Remove)")){ //TODO: make this an image
					temp_key[0] = null;
					temp_self_attr = null;
					temp_foreign_attr = null;
				}
				GUI.color = Color.white;
				file_box.x = x+10;
				file_box.width = width - 20;
				GUI.Label(file_box, "Reference File: ");
				file_box.y+=20;
				
				if (temp_key[0] != null) //Need this in case you just cleared it.
					GUI.Label(file_box, temp_key[0].shortName());

				cur_y += 20;
				reference_box.y = cur_y+30;
			}
			
			//select the new "from" attribute
			if (temp_key[0] != null && temp_self_attr == null){
				GUI.Box(reference_box, "From Reference");
				reference_box.height -= 30;
				reference_box.y+= 30;
				cur_y += 30;
				tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
					tempFileScrollPosition, Rect (0, 0, width-10, 22*file.attributes.length));			
				file_box = new Rect(0, 0, width-20, 22);
				for (var attribute : DataFileAttribute in file.attributes){
					if (GUI.Button(file_box, attribute.column_name)){
						temp_self_attr = attribute;
					}
					file_box.y+=22;
				}	
				cur_y += 30;
				GUI.EndScrollView();
			} else if (temp_self_attr != null){
				cur_y += 20;
				from_box = new Rect(x+width-80, cur_y, 80, 20);
				GUI.color = Color.red;
				if (GUI.Button(from_box, "(Remove)")){ //TODO: make this an image
					temp_self_attr = null;
					temp_foreign_attr = null;
				}
				GUI.color = Color.white;
				from_box.x = x+10;
				from_box.width = width - 20;
				GUI.Label(from_box, "From Attribute: ");
				from_box.y+=20;			
				if (temp_self_attr != null) //Need this in case you just cleared it.
					GUI.Label(from_box, temp_self_attr.column_name);

				cur_y += 25;
				reference_box.y = cur_y+30;
			}
			
			//select the new "to" attribute
			if (temp_self_attr != null && temp_foreign_attr == null){
				GUI.Box(reference_box, "To Reference");
				reference_box.height -= 30;
				reference_box.y+= 30;
				cur_y += 30;
				tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
					tempFileScrollPosition, Rect (0, 0, width-10, 22*temp_key[0].attributes.length));			
				file_box = new Rect(0, 0, width-20, 22);
				for (var attribute : DataFileAttribute in temp_key[0].attributes){
					if (attribute.is_numeric == temp_self_attr.is_numeric){ GUI.color = new Color(.5, 1, 0);}  else { GUI.color = new Color(1, .5, 0); }	
					if (attribute.column_name == temp_self_attr.column_name){ GUI.color = Color.green; }
					if (attribute == temp_self_attr){ GUI.color = Color.white; }
					if (GUI.Button(file_box, attribute.column_name)){
						temp_foreign_attr = attribute;
					}
					file_box.y+=22;
				}	
				cur_y += 30;
				GUI.EndScrollView();
			
			} else if (temp_foreign_attr != null ){
				cur_y += 20;
				to_box = new Rect(x+width-80, cur_y, 80, 20);
				GUI.color = Color.red;
				if (GUI.Button(to_box, "(Remove)")){ //TODO: make this an image
					temp_foreign_attr = null;
				}
				GUI.color = Color.white;
				to_box.x = x+10;
				to_box.width = width - 20;
				GUI.Label(to_box, "To Attribute: ");
				to_box.y+=20;			
				if (temp_foreign_attr != null) //Need this in case you just cleared it.
					GUI.Label(to_box, temp_foreign_attr.column_name);

			}
			
			//Create the foreign key
			cur_y += 40;
			var ready : boolean = (temp_key[0] != null && temp_self_attr != null && temp_foreign_attr != null);
			if (ready) { 
				GUI.color = Color.green;
				var create_box = new Rect(x+15, cur_y, width-30, 30);
				if (GUI.Button(create_box, "Create Foreign Key")){
					temp_key[1] = {};
					temp_key[1][temp_self_attr] = temp_foreign_attr;
					temp_key[2] = true; //default to bidirectional
					file.fkeys.Push(temp_key);
					resetCreation();				
				}
				GUI.color = Color.white;
				cur_y += 10;
			} else {
				cur_y += 80;
			}
		}
			
		//display already made keys
		cur_y += 40;
		var fkey_index = 0;
		for (var fkey in file.fkeys){
			//TODO: There might be a more efficient way of doing this, but you're rarely going to have more than 2 anyways.
			var attr_count = 0;
			for (var entry in fkey[1]){
				attr_count += 1;
			}
			var fkey_box = new Rect(x, cur_y, width, attr_count*20 + 95);
			GUI.Box(fkey_box, fkey[0].shortName());
			
			cur_y += 30;
			fkey[2] = GUI.Toggle(new Rect(x+5, cur_y, 100, 20), fkey[2], "bi-directional");
			
			//deletes the foreign key.
			if (GUI.Button(new Rect(x+width-30, cur_y, 20, 20), "X")){
				file.removeFKey(fkey_index);
				continue;
			}
			
			cur_y += 30;
			
			for (var entry in fkey[1]){
				var from_attr : DataFileAttribute = entry.Key;
				var to_attr : DataFileAttribute = entry.Value;
				
				var content = new GUIContent(from_attr.column_name);
	   			var size = GUI.skin.label.CalcSize(content);
				attr_box = new Rect(x+20, cur_y, size.x+20, 20);
				GUI.Button(attr_box, content);
				
				attr_box.x += size.x+25;
				GUI.Label(attr_box, " > ");
				
				attr_box.x += 25;
				content = new GUIContent(to_attr.column_name);
	   			size = GUI.skin.label.CalcSize(content);
	   			attr_box.width = size.x+20;
				GUI.Button(attr_box, content);
				
				cur_y += 20;
			}
			cur_y += 5;
			add_box = new Rect(x+20, cur_y, 140, 20);
			if (adding_index != fkey_index){
				GUI.color = new Color(1, .5, 0);
				if (GUI.Button(add_box, "Add Attribute Pair")){
					adding_index = fkey_index;
					adding_from_attr = null;
				}
			} else {
				GUI.color = Color.red;
				if (GUI.Button(add_box, "Cancel")){
					adding_index = -1;
					adding_from_attr = null;
				}
			}
			GUI.color = Color.white;		
			//display interface for adding attribute to existing fkey
			if (adding_index == fkey_index){
				cur_y+=30;
				reference_box = new Rect (x,cur_y,width,180);
				if (adding_from_attr == null){ //need to add a "from" index
			
					//select a referencing attribute
					GUI.Box(reference_box, "From Attribute:");
					reference_box.height -= 30;
					reference_box.y+= 30;
					cur_y += 30;
					tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
						tempFileScrollPosition, Rect (0, 0, width-10, 20*file.attributes.length));			
					file_box = new Rect(0, 0, width-20, 20);
					for (var attr : DataFileAttribute in file.attributes){
						if (GUI.Button(file_box, attr.column_name)){
							adding_from_attr = attr;
						}
						file_box.y+=20;
					}
					GUI.EndScrollView();
					
				} else { //need to add a "to" index		
					
					//show the selected "from" attribute
					from_box = new Rect(x+5, cur_y, 60, 25);
					GUI.Label(from_box, "From: ");
					from_box.x+=50;
					content = new GUIContent(from_attr.column_name);
	   				size = GUI.skin.label.CalcSize(content);
					from_box.width = size.x+20;
					GUI.Button(from_box, content);
					
					cur_y+=25;
					reference_box.y+=30;
					
					//select a referenced attribute
					GUI.Box(reference_box, "To Attribute:");
					reference_box.height -= 30;
					reference_box.y+= 30;
					cur_y += 30;
					tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
						tempFileScrollPosition, Rect (0, 0, width-10, 20*fkey[0].attributes.length));			
					file_box = new Rect(0, 0, width-20, 20);
					for (var attr : DataFileAttribute in fkey[0].attributes){
						if (GUI.Button(file_box, attr.column_name)){
							fkey[1][adding_from_attr] = attr;
							resetCreation();
						}
						file_box.y+=20;
					}
					GUI.EndScrollView();
				}
				cur_y += 150;			
			}
			
			cur_y += 40;
			fkey_index += 1;
		}
	}

	function resetCreation(){
		temp_key = null;
		temp_self_attr = null;
		temp_foreign_attr = null;
		adding_index = -1;
		adding_from_attr = null;
		creating = false;
	}

	function ToggleDisplay(){
		super.ToggleDisplay();
		if (displaying){
			EnableDisplay();
		} else {
			DisableDisplay();
		}
	}

	function EnableDisplay(){
		super.EnableDisplay();
		attributeMenu.selected_index = -1;
		resetCreation();
	}

	function DisableDisplay(){
		super.DisableDisplay();
		resetCreation();
	}
}
