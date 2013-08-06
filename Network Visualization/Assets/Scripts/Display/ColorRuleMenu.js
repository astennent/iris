#pragma downcast

class ColorRuleMenu extends SecondaryMenu {
	private var sourceScrollPosition : Vector2 = Vector2.zero;
	private var clusterScrollPosition : Vector2 = Vector2.zero;
	private var nodeScrollPosition : Vector2 = Vector2.zero;
	private var attributeScrollPosition : Vector2 = Vector2.zero;
	private var attributeScrollPosition2 : Vector2 = Vector2.zero;

	private var hiding_unconnected_clusters : boolean = false;
	private var found_unconnected_cluster : boolean = false;

	private var attributeValueCache;
	private var searchString : String = "";
	private var oldSearchString : String = "";
	private var attributeMatchCount : int = 0;

	var rule_index : int = -1;

	function Start(){
		super.Start();
		width = 200;
		desired_x_without_details += 200; //based on color rule color menu width
		desired_x_with_details += 200;
		parentMenu = GetComponent(ColorRuleColorMenu);
		title = "Coloring Rules";
	}

	function setRuleIndex(i : int){
		rule_index = i;
	}

	function OnGUI(){
		super.OnGUI();
		if (rule_index < 0 || rule_index >= colorController.rules.length){
			return;
		}
		var rule : ColorRule = colorController.rules[rule_index];
		title = rule.getDisplayName();

		var y = 40;
		for (var i : int = 0 ; i < colorController.rule_types.length ; i++){
			var rule_type : String = colorController.rule_types[i];
			if (GUI.Toggle (Rect (x+5, y, width-5, 20), (i == rule.rule_type), rule_type)){
				rule.rule_type = i;
			}
			y+=20;
		}

		var scrollBox = new Rect(x, y, width, 200);

		GUI.Box(scrollBox, "Available Options");
		
		scrollBox.y += 20;
		scrollBox.height -= 20;

		var temp_y = 0;
		if (rule.rule_type == 0){
			var files = fileManager.files;

			sourceScrollPosition = GUI.BeginScrollView (scrollBox, 
				sourceScrollPosition, Rect (0, 0, width, 20*files.length+20));

			for (var file : DataFile in files){

				if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (file == rule.source), file.shortName())){
					rule.source = file;
				}
			
				temp_y+=20;
			}

			GUI.EndScrollView();

		} else if (rule.rule_type == 1){

			if (found_unconnected_cluster){
				scrollBox.y += 20;
				scrollBox.height -=20;
			}	
			
			found_unconnected_cluster = false;

			var cluster_dict = clusterController.group_dict;

			clusterScrollPosition = GUI.BeginScrollView (scrollBox, 
				clusterScrollPosition, Rect (0, 0, width, 20*cluster_dict.Count+20));

			for (var cluster in cluster_dict){
				var cluster_key : int = cluster.Key;
				var cluster_size : int = cluster.Value.Count;

				if (cluster_size == 1 && hiding_unconnected_clusters){
					found_unconnected_cluster = true;
					continue; //skip this cluster.
				}

				if (cluster_size == 1){
					var display_string = cluster_key+"(1 node)";
					found_unconnected_cluster = true;
				} else {
					display_string = cluster_key+" ("+ cluster_size + " nodes)";
				}



				if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (cluster_key == rule.cluster_id),
						display_string)) {
					rule.cluster_id = cluster_key;
				}
			
				temp_y+=20;
			}

			GUI.EndScrollView();
			if (found_unconnected_cluster){
				if (hiding_unconnected_clusters){
					display_string = "Show Unconnected Clusters";
				} else {
					display_string = "Hide Unconnected Clusters";
				}
				if (GUI.Button( new Rect(x, y+20, width-20, 20), display_string)){
					hiding_unconnected_clusters = !hiding_unconnected_clusters;
				}
			}
		
		} else if (rule.rule_type == 2) {
			/* TODO

			var line_count : int  = 0;
			for (var file : DataFile in fileManager.files){
				line_count += file.nodes.Count + 3;
			}

			clusterScrollPosition = GUI.BeginScrollView (scrollBox, 
				clusterScrollPosition, Rect (0, 0, width, 20*line_count+20));

			for (var file : DataFile in fileManager.files){
				for (var node in file.nodes){
					var node_pkey = node.Key;
					if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (node_pkey == rule.node_pkey), node_pkey+"")){
						rule.node_pkey = node_pkey;
					}
					temp_y += 20;
				}
				
			}

			GUI.EndScrollView();*/
		} else if (rule.rule_type == 3){
			line_count = 0;
			for (var file : DataFile in fileManager.files){
				line_count += file.attributes.Count + 1;
			}

			attributeScrollPosition = GUI.BeginScrollView (scrollBox, 
				attributeScrollPosition, Rect (0, 0, width, 20*line_count+20));
			temp_y -= 20;
			for (var file : DataFile in fileManager.files){
				temp_y += 20;
				GUI.Label(Rect (5, temp_y, width-5, 20), file.shortName() + ":");
				temp_y += 20;

				for (var attribute in file.attributes){
					if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (attribute == rule.attribute), attribute.column_name)){
						if (attribute != rule.attribute) {
							updateCachedAttributeValues(attribute);
						}
						rule.attribute = attribute;
					}
					temp_y += 20;
				}
			}

			GUI.EndScrollView();
			y+=200;
			scrollBox = new Rect(x, y, width, 120);

			GUI.Box(scrollBox, "Available Values");

			var searchRect = new Rect(x, y+20, width-10, 20);
			searchString = GUI.TextField(searchRect, searchString, 20);
			if (searchString != oldSearchString){
				oldSearchString = searchString;
				updateCachedAttributeValues(rule.attribute);
			}

			scrollBox.y += 40;
			scrollBox.height -= 40;

			line_count = Mathf.Min(20, attributeMatchCount);

			attributeScrollPosition2 = GUI.BeginScrollView (scrollBox, 
				attributeScrollPosition2, Rect (0, 0, width, 20*line_count+40));
			
			temp_y = 0;

			for (var entry in attributeValueCache){
				var value = entry.Key+"";
				if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (value == rule.attribute_value), value)){
					rule.attribute_value = value;
				}
				temp_y += 20;
			}

			message_box = new Rect(5, temp_y, width-5, 20);
			if (rule.attribute == null){
				GUI.Label(message_box, "Select an attribute");
			} else if (attributeMatchCount == 0){
				GUI.Label(message_box, "No Matches");
			} else if (attributeMatchCount > 20){
				GUI.Label(message_box, attributeMatchCount-20 + " more...");
			}


				
			GUI.EndScrollView();
		}

	}

	function updateCachedAttributeValues(attribute : Attribute){
		if (attribute == null){
			return;
		}
		attributeValueCache = {};
		var file = attribute.file;
		var attribute_index : int = -1;
		for (var i : int = 0 ; i < file.attributes.Count; i++){
			if (file.attributes[i] == attribute){
				attribute_index = i;
				break;
			}
		}
		attributeMatchCount = 0;
		for (var node in file.nodes){
			var data = node.Value.data;
			var value = data[attribute_index];
			var value_string = (value+"")/*.ToLower()*/;
			if (value_string.StartsWith(searchString/*.ToLower()*/) && !attributeValueCache.ContainsKey(value)){
				if (attributeMatchCount < 20){
					attributeValueCache[value] = null; //add to dict
				}
				attributeMatchCount++;
			}
		}	
	}

	function EnableDisplay(){
		super.EnableDisplay();
		parentMenu.EnableDisplay();

	}

	function DisableDisplay(){
		super.DisableDisplay();
		parentMenu.DisableDisplay();
		rule_index = -1;
		GUI.FocusControl("");
	}

}