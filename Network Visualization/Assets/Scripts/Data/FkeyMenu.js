//Handles the display of the fkey section in the file menu.

class FkeyMenu extends SecondaryMenu {

	private var adding_index : int = -1;
	private var adding_from_attr : Attribute;

	private var creating = false;
	private var cFileScrollPosition : Vector2 = Vector2.zero;

	private var tempFileScrollPosition : Vector2 = Vector2.zero;

	function Start(){
		super.Start();
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

		
		var cur_y = 0;
		//display menu for choosing a file for the new fkey
		reference_box = new Rect (x,40,width,180);
		if (creating){ 	
			//select a referencing attribute
			GUI.Box(reference_box, "Reference File:");
			reference_box.height -= 30;
			reference_box.y+= 30;
			cFileScrollPosition = GUI.BeginScrollView (reference_box, 
				cFileScrollPosition, Rect (0, 0, width-10, 25*fileManager.files.length));			
			file_box = new Rect(0, 0, width-20, 25);
			for (var ref_file : DataFile in fileManager.files){
				if (GUI.Button(file_box, ref_file.shortName())){
					file.createEmptyFkey(ref_file);
					creating = false;
				}
				file_box.y+=25;
			}
			GUI.EndScrollView();
			cur_y += 180;
		} else {
			add_box = new Rect(x+20, 40, width-40, 30);
			if (GUI.Button(add_box, "Create Foreign Key")){
				creating = true;
			}
			cur_y+=40;
		}
					
		//display all active keys
		var foreignKeys = file.getForeignKeys(true);
		cur_y += 40;
		for (var fkey_index = 0 ; fkey_index < foreignKeys.Count ; fkey_index++){
			var foreignKey = foreignKeys[fkey_index];

			var keyPairs = foreignKey.getKeyPairs();
			var pair_count = keyPairs.Count;
			
			var fkey_box = new Rect(x, cur_y, width, pair_count*20 + 95);


			GUI.Box(fkey_box, foreignKey.to_file.shortName()); 
			
			cur_y += 30;
			foreignKey.isBidirectional = GUI.Toggle(new Rect(x+5, cur_y, 100, 20),
					foreignKey.isBidirectional, "bi-directional");
			
			//deletes the foreign key.
			if (GUI.Button(new Rect(x+width-30, cur_y, 20, 20), "X")){
				file.removeFkey(foreignKey);
				continue;
			}
			
			cur_y += 30;
			
			for (var pair in keyPairs){
				var from_attr : Attribute = pair[0];
				var to_attr : Attribute = pair[1];
				
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
					resetCreation();
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
					tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
						tempFileScrollPosition, Rect (0, 0, width-10, 20*file.attributes.Count));			
					file_box = new Rect(0, 0, width-20, 20);
					for (var attr : Attribute in file.attributes){
						if (GUI.Button(file_box, attr.column_name)){
							adding_from_attr = attr;
						}
						file_box.y+=20;
					}
					GUI.EndScrollView();
					
				} else { //need to add a "to" index		
					
					//select a referenced attribute
					GUI.Box(reference_box, "From " + adding_from_attr.column_name + " to Attribute:");
					reference_box.height -= 30;
					reference_box.y+= 30;
					tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
						tempFileScrollPosition, Rect (0, 0, width-10, 20*foreignKey.to_file.attributes.Count));			
					
					file_box = new Rect(0, 0, width-20, 20);
					for (var i = 0 ; i < foreignKey.to_file.attributes.Count ; i++){
						var attr : Attribute = foreignKey.to_file.attributes[i];
						if (GUI.Button(file_box, attr.column_name)){
							foreignKey.addKeyPair(adding_from_attr, attr);
							resetCreation();
						}
						file_box.y += 20;
					}

					GUI.EndScrollView();
				}
				cur_y += 150;			
			}
			
			cur_y += 40;
		}
	}

	function resetCreation(){
		adding_index = -1;
		adding_from_attr = null;
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
		attributeMenu.DisableDisplay();
		resetCreation();
	}

	function DisableDisplay(){
		super.DisableDisplay();
		resetCreation();
	}
}
