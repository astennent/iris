#pragma strict

class ColorRuleMenu extends PrimaryMenu {
	private var sourceScrollPosition : Vector2 = Vector2.zero;
	private var clusterScrollPosition : Vector2 = Vector2.zero;
	private var nodeScrollPosition : Vector2 = Vector2.zero;
	private var attributeScrollPosition : Vector2 = Vector2.zero;
	private var attributeScrollPosition2 : Vector2 = Vector2.zero;

	private var hiding_unconnected_clusters : boolean = false;
	private var found_unconnected_cluster : boolean = false;

	private var attributeValueCache : HashSet.<String>;
	private var searchString : String = "";
	private var oldSearchString : String = "";
	private var attributeMatchCount : int = 0;

	function Start(){
		parent = GetComponent(ColorRuleColorMenu);
		super.Start();
		width = 200;
		title = "Coloring Rules";
	}


	function OnGUI(){
		super.OnGUI();

		var rule_index = displayMenu.rule_index;

		if (rule_index >= 1) {
			if (!displaying){
				EnableDisplay();
			}
		} else{ 
			if (displaying) {
				DisableDisplay();
			}
			return;
		}

		var rule : ColorRule = colorController.rules[rule_index];

		title = rule.getDisplayName();

		var y = 40;
		for (var i : int = 0 ; i < colorController.rule_types.length ; i++){
			var type_name : String = colorController.rule_types[i];
			var selected_current = GUI.Toggle(Rect (x+5, y, width-5, 20), (i == rule.getRuleType()), type_name);

			if (selected_current && ! (rule.getRuleType() == i)) {
				rule.setRuleType(i);
			}
			y+=20;
		}

		var scrollBox = new Rect(x, y, width, 200);

		GUI.Box(scrollBox, "Available Options");
		
		scrollBox.y += 20;
		scrollBox.height -= 20;

		var temp_y = 0;

		var rule_type = rule.getRuleType(); 
		if (rule_type == 0){
			var files = fileManager.files;

			sourceScrollPosition = GUI.BeginScrollView (scrollBox, 
				sourceScrollPosition, Rect (0, 0, width, 20*files.Count+20));

			for (var file : DataFile in files) {
				var usedSourceBefore = rule.usesSource(file);
				var usedSourceAfter = GUI.Toggle (Rect (5, temp_y, width-5, 20), (rule.usesSource(file)), file.shortName());
				if (usedSourceAfter != usedSourceBefore) {
					rule.toggleSource(file);
				}			
				temp_y+=20;
			}

			GUI.EndScrollView();

		} else if (rule_type == 1){

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

				if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (cluster_key == rule.getClusterId()),
						display_string)) {
					rule.setClusterId(cluster_key);
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
		
		} else if (rule_type == 2) {
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
		} else if (rule_type == 3){
			var line_count = 0;
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
					if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (attribute == rule.getAttribute()), attribute.column_name)){
						if (attribute != rule.getAttribute()) {
							updateCachedAttributeValues(attribute);
						}
						rule.setAttribute(attribute);
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
				updateCachedAttributeValues(rule.getAttribute());
			}

			scrollBox.y += 40;
			scrollBox.height -= 40;

			line_count = Mathf.Min(20, attributeMatchCount);

			attributeScrollPosition2 = GUI.BeginScrollView (scrollBox, 
				attributeScrollPosition2, Rect (0, 0, width, 20*line_count+40));
			
			temp_y = 0;

			for (var value in attributeValueCache){
				if (GUI.Toggle (Rect (5, temp_y, width-5, 20), (value == rule.getAttributeValue()), value)){
					rule.setAttributeValue(value);
				}
				temp_y += 20;
			}

			var message_box = new Rect(5, temp_y, width-5, 20);
			if (rule.getAttribute() == null){
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
		attributeValueCache = new HashSet.<String>();
		var file = attribute.file;
		var attribute_index : int = -1;
		for (var i : int = 0 ; i < file.attributes.Count; i++){
			if (file.attributes[i] == attribute) {
				attribute_index = i;
				break;
			}
		}
		attributeMatchCount = 0;
		for (var node in file.nodes){
			var data = node.Value.data;
			var value = data[attribute_index];
			var value_string = (value+"")/*.ToLower()*/;
			if (value_string.StartsWith(searchString/*.ToLower()*/) && !attributeValueCache.Contains(value)){
				if (attributeMatchCount < 20){
					attributeValueCache.Add(value);
				}
				attributeMatchCount++;
			}
		}	
	}

	function DisableDisplay(){
		print ("Disabling ColorRuleMenu");
		//special case: when you're on the fallback rule, don't reset the rule when you close.
		if (displayMenu.rule_index != 0) {
			displayMenu.setRuleIndex(-1);
		}
		super.DisableDisplay();
	}
}