#pragma strict

class ColorRuleOptionsMenu extends BaseMenu {
	private static var schemeScrollPosition : Vector2 = Vector2.zero;
	private static var attributeScrollPosition : Vector2 = Vector2.zero;
	private static var rule : ColorRule;
	function Start(){
		parent = GetComponent(DisplayMenu);
		super.Start();
		width = 220;
		title = "Rule Options";
	}

	function OnGUI(){
		super.OnGUI();
		if (displaying){
			var button_text : String;
			var label_text : String;

			var rule_index = DisplayMenu.rule_index;
			rule = ColorController.rules[DisplayMenu.rule_index];

			var y = DrawColoringMethodSelection(35);

			//Draw the appropriate options associated with the coloring method
			switch (rule.getColoringMethod()) {
				case ColorRule.COLORING_CUSTOM:
					y = DrawColorCustom(y);
					break;
				case ColorRule.COLORING_SCHEME:
					y = DrawColorScheme(y);
					break;
				case ColorRule.COLORING_CENTRALITY:
					y = DrawCentrality(y);
					break;
				case ColorRule.COLORING_CONTINUOUS_ATTR:
					y = DrawContinuousAttribute(y);
			} 

			y = DrawHaloOptions(y);
			DrawSizingOptions(y);				
		}
	}

	function DrawColoringMethodSelection(cur_y : int) {
		var is_fallback = rule.isFallback();
		var box_height = (is_fallback) ? 80 : 100;
		GuiPlus.Box(Rect(x+5, cur_y, width-10, box_height), "");
		var toggle_rect = new Rect(x+20, cur_y+10, width, 20);

		var current_method = rule.getColoringMethod();
		var coloring_methods = rule.coloring_methods;

		for (var i = 0 ; i < coloring_methods.length ; i++) {
			var coloring_method_name = coloring_methods[i];

			// Do not draw the continuous attribute option for the fallback rule.
			if (is_fallback && i == ColorRule.COLORING_CONTINUOUS_ATTR) {
				continue;
			}

			if (GuiPlus.Toggle(toggle_rect, current_method==i, coloring_method_name) && current_method != i){
				rule.setColoringMethod(i);
			}
			toggle_rect.y+=20;
		}
		return cur_y+box_height;
	}

	function DrawColorCustom(cur_y : int) {
		ColorPicker.Init(x, cur_y, false);
		var original_color = rule.color;
		rule.color = ColorPicker.getColor();

		cur_y += 190;
		var original_variation = rule.variation;
		GuiPlus.Label(new Rect(x+10, cur_y, 130, 20), "Randomness: " + rule.variation.ToString("f2"));
		rule.variation = GUI.HorizontalSlider(Rect(x+130, cur_y+5, width-140, 20), rule.variation, 0.0, 1.0);

		if (rule.color != original_color || rule.variation != original_variation){
			ColorController.ApplyRule(rule);
		}
		cur_y += 30;
		return cur_y;
	}

	function DrawColorScheme(y : int) {
		GUI.color = Color.white;

		var schemeNames = ColorController.getSchemeNames();

		schemeScrollPosition = GuiPlus.BeginScrollView (Rect (x,y,width,MenuController.getScreenHeight()-33), 
			schemeScrollPosition, Rect (0, 0, width, 30*schemeNames.length+20));

		var cur_y = 0;

		for (var i=0 ; i<schemeNames.length ; i++){
			var schemeName : String = schemeNames[i];
			var schemeRect = new Rect(0, cur_y, width, 30);

			if (rule.getScheme() == i) { 
				GUI.color = rule.color;
				GUI.color.a = 1; //just in case the custom color is transparent. 
			} else {
				GUI.color = Color.white; 
			}

			if (GuiPlus.Button(schemeRect, schemeName)){
				rule.setScheme(i);
			}
			cur_y+=30;
		}
		GUI.color = Color.white;
		GuiPlus.EndScrollView();
		y+=cur_y;
		return y;
	}

	function DrawCentrality(cur_y : int) {
		cur_y += 5;

		GuiPlus.Box(Rect(x+5, cur_y, width-10, 155), "");
		var centrality_types = CentralityController.centrality_types;

		var wasInverted = rule.getInvertCentrality();
		if (wasInverted) {
			var inversion_text = " On";
		} else {
			inversion_text = " Off";
		}

		cur_y+=5;
		GuiPlus.Label(new Rect(x+10, cur_y, 85, 20), "Invert Colors: ");
		if (GuiPlus.Toggle(new Rect(x+95, cur_y, width, 20), wasInverted, inversion_text) != wasInverted){
			rule.toggleInvertCentrality();
		}
		cur_y += 20;
		var inter_cluster = rule.getInterCluster();
		if (GuiPlus.Toggle(new Rect(x+10, cur_y, width/2-20, 20), inter_cluster, " Inter-Cluster")  && !inter_cluster) {
			rule.toggleInterCluster();
		} 
		if (GuiPlus.Toggle(new Rect(x+width/2, cur_y, width/2, 20), !inter_cluster, " Intra-Cluster") && inter_cluster) {
			rule.toggleInterCluster();
		}

		cur_y += 25;

		GuiPlus.Label(new Rect(x+10, cur_y, 120, 20), "Centrality Method: ");
		cur_y += 20;

		for (var index : int = 0 ; index < centrality_types.length ; index++){
			var selected = (rule.getCentralityType() == index);

			if (selected){
				GUI.color = rule.getColor();
			} else {
				GUI.color = Color.white;
			}		

			if (GuiPlus.Toggle(new Rect(x+15, cur_y, width, 20), selected, centrality_types[index]) && !selected ) {
				rule.setCentralityType(index);
			}
			cur_y +=20;
		}
		GUI.color = Color.white;
		cur_y += 5;
		return cur_y;
	}

	function DrawContinuousAttribute(cur_y : int) {
		cur_y += 5;
		var scrollBoxHeight = 200;
		var outerBox = new Rect(x+5, cur_y, width-10, scrollBoxHeight);

		GuiPlus.Box(outerBox, "");
		var line_count = 0;

		for (var file : DataFile in FileManager.files){
			line_count += file.getAttributeCount() + 2;
		}

		var innerBoxWidth = (line_count*20 + 20 < scrollBoxHeight) ? outerBox.width-5 : outerBox.width-23;
		var innerBox = new Rect(0, 0, innerBoxWidth, 20*line_count);

		attributeScrollPosition = GuiPlus.BeginScrollView (outerBox, attributeScrollPosition, innerBox);
			var scroll_y = 0;
			for (var file : DataFile in FileManager.files){
				GuiPlus.Label(Rect (5, scroll_y, width-5, 20), file.shortName() + ":");
				scroll_y += 20;

				for (var attribute in file.getAttributes()){
					if (GuiPlus.Toggle (Rect (5, scroll_y, width-5, 20), (attribute == rule.getContinuousAttribute()), attribute.getColumnName())){
						if (rule.getContinuousAttribute() != attribute) {
							rule.setContinuousAttribute(attribute);
						}
					}
					scroll_y += 20;
				}
				scroll_y += 20;
			}

		GuiPlus.EndScrollView();
		return cur_y + scrollBoxHeight;
	}

	function DrawHaloOptions (cur_y : int) {
		cur_y += 5;
		GuiPlus.Box(Rect(x+5, cur_y, width-10, 30), "");
		cur_y+=5;
		var original_node = rule.coloring_node;
		var original_halo = rule.coloring_halo;

		rule.coloring_node = GuiPlus.Toggle (Rect (x+width/2+10, cur_y, width/2-10, 20), rule.coloring_node, " Color Node");
		rule.coloring_halo = GuiPlus.Toggle (Rect (x+10, cur_y, width/2-10, 20), rule.coloring_halo, " Color Halo");

		if ( (!rule.coloring_halo && original_halo) || (!rule.coloring_node && original_node)) {
			ColorController.ApplyAllRules(true, false);
		} else if ((rule.coloring_halo && !original_halo) || (rule.coloring_node && !original_node)) {
			ColorController.ApplyRule(rule);
		}

		return cur_y + 35;	
	}

	function DrawSizingOptions(cur_y : int){
		var ruleChanged = false;

		var changingText : String;
		var wasChangingSize = rule.isChangingSize();
		if (wasChangingSize) {
			changingText = " Changing node size.";
		} else {
			changingText = " Not changing node size.";
		}
		if (GuiPlus.Toggle(Rect (x+10, cur_y, width-20, 20), wasChangingSize, changingText) != wasChangingSize) {
			rule.setChangingSize(!wasChangingSize);
			ruleChanged = true;
		}

		for (var sizing_type = 0 ; sizing_type < ColorRule.sizing_types.length ; sizing_type++) {
			cur_y+=20;
			var lock_toggle = (!rule.isChangingSize() || (sizing_type == ColorRule.SIZING_ATTRIBUTE && rule.getColoringMethod() != 3) );
			var wasUsingType = (rule.getSizingType() == sizing_type);
			if (GuiPlus.LockableToggle(Rect(x+20, cur_y, width-40, 20), wasUsingType, ColorRule.sizing_types[sizing_type], lock_toggle) && !wasUsingType) {
				rule.setSizingType(sizing_type);
				ruleChanged = true;
			}
		}

		if (rule.isChangingSize() && (rule.getSizingType() == ColorRule.SIZING_ATTRIBUTE || rule.getSizingType() == ColorRule.SIZING_FIXED)) {
			cur_y += 20;
			GuiPlus.Label(new Rect(x+10, cur_y, width, 20), "Scale: " + rule.getSizingScale().ToString("f2"));
			var oldScale = rule.getSizingScale();
			var newScale = GUI.HorizontalSlider(Rect(x+90, cur_y+5, width-110, 20), oldScale, 0.01, 50.0);
			if (newScale != oldScale) {
				rule.setSizingScale(newScale);
				ruleChanged = true;
			}
		}

		if (ruleChanged){
			if (rule.isChangingSize()) {
				ColorController.ApplyRule(rule, false, true);
			} else {
				ColorController.ApplyAllRules(false, true);
			}
		}
	}

	static function OnDisableDisplay(){
		DisplayMenu.setRuleIndex(-1);
	}
}