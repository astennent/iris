#pragma strict

class ColorRuleFilterMenu extends BaseMenu {
	private static var sourceScrollPosition : Vector2 = Vector2.zero;
	private static var clusterScrollPosition : Vector2 = Vector2.zero;
	private static var nodeScrollPosition : Vector2 = Vector2.zero;
	private static var attributeScrollPosition : Vector2 = Vector2.zero;
	private static var attributeScrollPosition2 : Vector2 = Vector2.zero;

	private static var hiding_unconnected_clusters : boolean = false;
	private static var found_unconnected_cluster : boolean = false;

	private static var attributeValueCache : HashSet.<String>;
	private static var searchString : String = "";
	private static var oldSearchString : String = "";
	private static var attributeMatchCount : int = 0;

	function Start(){
		parent = GetComponent(ColorRuleOptionsMenu);
		super.Start();
		width = 200;
		title = "Filter Affected Nodes";
	}


	function OnGUI(){
		super.OnGUI();

		var rule_index = DisplayMenu.rule_index;

		if (!displaying) {
			return;
		}

		var rule : ColorRule = ColorController.rules[rule_index];

		var y = 25;
		for (var i : int = 0 ; i < ColorRule.filter_methods.length ; i++){
			var type_name : String = ColorRule.filter_methods[i];
			var selected_current = GuiPlus.Toggle(Rect (x+5, y, width-5, 20), (i == rule.getFilterMethod()), type_name);

			if (selected_current && ! (rule.getFilterMethod() == i)) {
				rule.setFilterMethod(i);
			}
			y+=20;
		}

		var scrollBox = new Rect(x, y, width, 200);

		GuiPlus.Box(scrollBox, "Available Options");
		
		scrollBox.y += 20;
		scrollBox.height -= 20;
		var temp_y = 0;

		var rule_type = rule.getFilterMethod(); 
		if (rule_type == ColorRule.FILTER_SOURCE) {
			DrawFilterBySource(rule, scrollBox);		
		} else if (rule_type == 1){
			DrawFilterByCluster(rule, scrollBox, y);		
		} else if (rule_type == 2) { 
			DrawFilterByNode(rule, scrollBox);			
		} else if (rule_type == 3) {
			DrawFilterByAttribute(rule, scrollBox, y);
		}

	}

	function DrawFilterBySource(rule : ColorRule, scrollBox : Rect) {
		var files = FileManager.files;

		sourceScrollPosition = GuiPlus.BeginScrollView (scrollBox, 
				sourceScrollPosition, Rect (0, 0, width, 20*files.Count+20));

		var temp_y = 0;
		for (var file : DataFile in files) {
			var usedSourceBefore = rule.usesSource(file.uuid);
			var usedSourceAfter = GuiPlus.Toggle (Rect (5, temp_y, width-5, 20), (rule.usesSource(file.uuid)), file.shortName());
			if (usedSourceAfter != usedSourceBefore) {
				rule.toggleSource(file.uuid);
			}			
			temp_y+=20;
		}

		GuiPlus.EndScrollView();
	}

	function DrawFilterByCluster(rule : ColorRule, scrollBox : Rect, y : int) {
		if (found_unconnected_cluster){
			scrollBox.y += 20;
			scrollBox.height -=20;
		}	
		
		found_unconnected_cluster = false;
		var cluster_dict = ClusterController.group_dict;

		clusterScrollPosition = GuiPlus.BeginScrollView (scrollBox, 
				clusterScrollPosition, Rect (0, 0, width, 20*cluster_dict.Count+20));

		var temp_y = 0;
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

			var usedClusterBefore = rule.usesCluster(cluster_key);
			var usedClusterAfter = GuiPlus.Toggle (Rect (5, temp_y, width-5, 20), rule.usesCluster(cluster_key), display_string);
			if (usedClusterBefore != usedClusterAfter) {
				rule.toggleCluster(cluster_key);
			}
		
			temp_y+=20;
		}

		GuiPlus.EndScrollView();

		if (found_unconnected_cluster){
			if (hiding_unconnected_clusters){
				display_string = "Show Unconnected Clusters";
			} else {
				display_string = "Hide Unconnected Clusters";
			}
			if (GuiPlus.Button( new Rect(x, y+20, width-20, 20), display_string)){
				hiding_unconnected_clusters = !hiding_unconnected_clusters;
			}
		}
	}

	function DrawFilterByNode(rule : ColorRule, scrollBox : Rect) {
		var line_count : int  = 0;
		for (var file : DataFile in FileManager.files){
			line_count += file.getNodes().Count + 3;
		}

		clusterScrollPosition = GuiPlus.BeginScrollView (scrollBox, 
				clusterScrollPosition, Rect (0, 0, width, 20*line_count+20));

		var temp_y = 0;
		for (var file : DataFile in FileManager.files){
			for (var entry in file.getNodeDict()){
				var node = entry.Value;
				var key = entry.Key;
				var usedNodeBefore = rule.usesNode(node);
				var usedNodeAfter = GuiPlus.Toggle (Rect (5, temp_y, width-5, 20), rule.usesNode(node), key);
				if (usedNodeBefore != usedNodeAfter) {
					rule.toggleNode(node);
				}
				temp_y += 20;
			}
			
		}

		GuiPlus.EndScrollView();
	}

	function DrawFilterByAttribute(rule : ColorRule, scrollBox : Rect, y:int) {
		var line_count = 0;
		for (var file : DataFile in FileManager.files){
			line_count += file.getAttributeCount() + 1;
		}

		attributeScrollPosition = GuiPlus.BeginScrollView (scrollBox, 
				attributeScrollPosition, Rect (0, 0, width, 20*line_count+20));

		var temp_y = -20;
		for (var file : DataFile in FileManager.files){
			temp_y += 20;
			GuiPlus.Label(Rect (5, temp_y, width-5, 20), file.shortName() + ":");
			temp_y += 20;

			for (var attribute in file.getAttributes()){
				if (GuiPlus.Toggle (Rect (5, temp_y, width-5, 20), (attribute == rule.getAttribute()), attribute.getColumnName())){
					if (attribute != rule.getAttribute()) {
						updateCachedAttributeValues(attribute);
					}
					rule.setAttribute(attribute);
				}
				temp_y += 20;
			}
		}

		GuiPlus.EndScrollView();
		y+=200;

		scrollBox = new Rect(x, y, width, 120);
		GuiPlus.Box(scrollBox, "Available Values");

		var searchRect = new Rect(x, y+20, width-10, 20);
		searchString = GUI.TextField(searchRect, searchString, 20);
		if (searchString != oldSearchString){
			oldSearchString = searchString;
			updateCachedAttributeValues(rule.getAttribute());
		}

		scrollBox.y += 40;
		scrollBox.height -= 40;

		line_count = Mathf.Min(20, attributeMatchCount);

		attributeScrollPosition2 = GuiPlus.BeginScrollView (scrollBox, 
			attributeScrollPosition2, Rect (0, 0, width, 20*line_count+40));
		
		temp_y = 0;

		for (var value in attributeValueCache){
			if (GuiPlus.Toggle (Rect (5, temp_y, width-5, 20), (value == rule.getAttributeValue()), value)){
				rule.setAttributeValue(value);
			}
			temp_y += 20;
		}

		var message_box = new Rect(5, temp_y, width-5, 20);
		if (rule.getAttribute() == null){
			GuiPlus.Label(message_box, "Select an attribute");
		} else if (attributeMatchCount == 0){
			GuiPlus.Label(message_box, "No Matches");
		} else if (attributeMatchCount > 20){
			GuiPlus.Label(message_box, attributeMatchCount-20 + " more...");
		}
			
		GuiPlus.EndScrollView();
	}

	static function updateCachedAttributeValues(attribute : Attribute){
		if (attribute == null){
			return;
		}
		attributeValueCache = new HashSet.<String>();
		var file = attribute.getFile();
		var attribute_index : int = -1;
		var file_attributes = file.getAttributes();
		for (var i : int = 0 ; i < file_attributes.Count ; i++){
			if (file_attributes[i] == attribute) {
				attribute_index = i;
				break;
			}
		}
		attributeMatchCount = 0;
		for (var node in file.getNodes()){
			var value = node.Get(attribute_index);
			var value_string = (value+"")/*.ToLower()*/;
			if (value_string.StartsWith(searchString/*.ToLower()*/) && !attributeValueCache.Contains(value)){
				if (attributeMatchCount < 20){
					attributeValueCache.Add(value);
				}
				attributeMatchCount++;
			}
		}	
	}

	static function OnDisableDisplay(){
		//special case: when you're on the fallback rule, don't reset the rule when you close.
		if (DisplayMenu.rule_index != 0) {
			DisplayMenu.setRuleIndex(-1);
		}
	}
}