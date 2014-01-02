//Handles the display of the fkey section in the file menu.

#pragma strict

class FkeyMenu extends BaseMenu {

	private var adding_index : int = -1;
	private var adding_from_attr : Attribute;

	private var creating = false;
	private var cFileScrollPosition : Vector2 = Vector2.zero;

	private var tempFileScrollPosition : Vector2 = Vector2.zero;

	function Start(){
		parent = GetComponent(FileMenu);
		super.Start();
		title = "Foreign Key Manager";
		width = 250;
	}
   
	function OnGUI(){
		super.OnGUI();
		GUI.color = Color.white;

		var file = fileMenu.getSelectedFile();
		if (file == null) {
			return;
		}		
		
		var cur_y = 40;
		//display menu for choosing a file for the new fkey
		if (creating){ 	
			var add_box = new Rect(x+20, cur_y, width-40, 30);
			if (GUI.Button(add_box, "Cancel")){
				creating = false;
			}
			cur_y+=40;
			var reference_box = new Rect (x,cur_y,width,180);

			//select a referencing attribute
			GUI.Box(reference_box, "Reference File:");
			reference_box.height -= 30;
			reference_box.y+= 30;
			cFileScrollPosition = GUI.BeginScrollView (reference_box, 
				cFileScrollPosition, Rect (0, 0, width-10, 25*fileManager.files.Count));			
			var file_box = new Rect(0, 0, width-20, 25);
			for (var ref_file : DataFile in fileManager.files){
				if (GUI.Button(file_box, ref_file.shortName())){
					file.createEmptyFkey(ref_file);
					creating = false;
				}
				file_box.y+=25;
			}
			GUI.EndScrollView();
			cur_y += 150;
		} else {
			add_box = new Rect(x+20, cur_y, width-40, 30);
			if (GUI.Button(add_box, "Create Foreign Key")){
				creating = true;
			}
		}
					
		//display all active keys
		var foreignKeys = file.getForeignKeys(true);
		cur_y += 40;
		for (var fkey_index = 0 ; fkey_index < foreignKeys.Count ; fkey_index++){
			var foreignKey = foreignKeys[fkey_index];

			var keyPairs = foreignKey.getKeyPairs();
			var pair_count = keyPairs.Count;
			
			var fkey_box = new Rect(x, cur_y, width, pair_count*20 + 115);

			//deletes the foreign key.
			if (GUI.Button(new Rect(x+width-30, cur_y+7, 23, 23), "X")){
				file.removeFkey(foreignKey);
				continue;
			}

			GUI.Box(fkey_box, foreignKey.to_file.shortName()); 
			
			cur_y += 30;
			foreignKey.isBidirectional = GUI.Toggle(new Rect(x+5, cur_y, 100, 20),
					foreignKey.isBidirectional, "bi-directional");
						
			cur_y += 20;

			GUI.Label(new Rect(x+10, cur_y, width, 20), "Weight Modifier: " + foreignKey.weightModifier.ToString("f1"));
			foreignKey.weightModifier = GUI.HorizontalSlider(Rect(x+155, cur_y+5, width-180, 20), foreignKey.weightModifier, 0.0, 10.0);
			cur_y += 30;
			
			for (var pair in keyPairs){
				var from_attr : Attribute = pair[0];
				var to_attr : Attribute = pair[1];
				
				var content = new GUIContent(from_attr.getColumnName());
	   			var size = GUI.skin.label.CalcSize(content);
				var attr_box = new Rect(x+20, cur_y, size.x+20, 20);
				GUI.Button(attr_box, content);
				
				attr_box.x += size.x+25;
				GUI.Label(attr_box, " > ");
				
				attr_box.x += 25;
				content = new GUIContent(to_attr.getColumnName());
	   			size = GUI.skin.label.CalcSize(content);
	   			attr_box.width = size.x+20;
				GUI.Button(attr_box, content);

				//deletes the key pair.
				if (GUI.Button(new Rect(x+width-30, cur_y, 20, 20), "X")){
					foreignKey.removeKeyPair(from_attr, to_attr);
					return; //stop rendering, otherwise you get an invalid pointer from the deletion.
				}
				
				cur_y += 21;
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
						if (GUI.Button(file_box, attr.getColumnName())){
							adding_from_attr = attr;
						}
						file_box.y+=20;
					}
					GUI.EndScrollView();
					
				} else { //need to add a "to" index		
					
					//select a referenced attribute
					GUI.Box(reference_box, "From " + adding_from_attr.getColumnName() + " to Attribute:");
					reference_box.height -= 30;
					reference_box.y+= 30;
					tempFileScrollPosition = GUI.BeginScrollView (reference_box, 
						tempFileScrollPosition, Rect (0, 0, width-10, 20*foreignKey.to_file.attributes.Count));			
					
					file_box = new Rect(0, 0, width-20, 20);
					for (var i = 0 ; i < foreignKey.to_file.attributes.Count ; i++){
						var attr : Attribute = foreignKey.to_file.attributes[i];
						if (GUI.Button(file_box, attr.getColumnName())){
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
		resetCreation();
	}

	function DisableDisplay(){
		super.DisableDisplay();
		resetCreation();
	}
}
