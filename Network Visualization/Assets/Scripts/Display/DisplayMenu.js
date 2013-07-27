#pragma strict

class DisplayMenu extends PrimaryMenu {
	private var scrollPosition : Vector2 = Vector2.zero;
	
	function Start(){
		super.Start();
		title = "Display Settings";
	}

	function OnGUI(){
		super.OnGUI();	
		var y = 33;

		y+=15;

		var schemeRect = new Rect(x+10, y, 120, 25);
		if (GUI.Button(schemeRect, "Change Scheme")){
			if (colorRuleMenu.displaying){
				colorRuleMenu.DisableDisplay();
			}
			colorSchemeMenu.ToggleDisplay();
		}
		y+=30;

		var current_color_mode = colorController.getMode();
		
		var clicked_random = GUI.Toggle (Rect (x+10, y, 100, 20), (current_color_mode == colorController.RANDOM), "By Node");
		var clicked_by_cluster = GUI.Toggle (Rect (x+100, y, 100, 20), (current_color_mode == colorController.BY_CLUSTER), "By Cluster");
		var clicked_by_attribute = GUI.Toggle (Rect (x+200, y, 100, 20), (current_color_mode == colorController.BY_SOURCE), "By Source");	
		
		if (clicked_random && current_color_mode != colorController.RANDOM){
			colorController.setMode(colorController.RANDOM);
			ColorRandom();
		} else if (clicked_by_cluster && current_color_mode != colorController.BY_CLUSTER){
			colorController.setMode(colorController.BY_CLUSTER);
			ColorByCluster();
		} else if (clicked_by_attribute && current_color_mode != colorController.BY_SOURCE){
			colorController.setMode(colorController.BY_SOURCE);
			ColorBySource();
		}	
		
		y+=25;

		var ruleRect = new Rect(x, y, width, 200);
		GUI.Box(ruleRect, "Rules");

		y+=25;

		if (GUI.Button(new Rect(x+5, y, 100, 25), "Add Rule")){
			colorController.createRule();
			colorRuleMenu.EnableDisplay();
			colorRuleMenu.setRuleIndex(colorController.rules.length-1);
		}

		if (GUI.Button(new Rect(x+120, y, 120, 25), "Apply All Rules")){
			colorController.ApplyAllRules();
		}

		var rules = colorController.rules;
		var current_rule_id = colorRuleMenu.rule_index;

		ruleRect.y += 55;
		ruleRect.height -= 60;

		scrollPosition = GUI.BeginScrollView (ruleRect, 
			scrollPosition, Rect (0, 0, width-20, 30*rules.length+20));

		var temp_y = 0;
		for (var i : int ; i < rules.length ; i++){

			var rule : ColorRule = colorController.rules[i];
			GUI.color = rule.color;

			var upRect = new Rect(5, temp_y, 30, 15);
			var downRect = new Rect(5, temp_y+15, 30, 15);
			if (GUI.Button(upRect, "")){ //TODO make graphics for these.
				colorController.moveRuleUp(i);
			}
			if (GUI.Button(downRect, "")){
				colorController.moveRuleDown(i);
			}

			var buttonRect = new Rect(35, temp_y, width-85, 30);
			if (GUI.Button(buttonRect, rule.getDisplayName())){
				colorRuleMenu.setRuleIndex(i);
				if (current_rule_id == i){
					colorRuleMenu.DisableDisplay();
				} else {
					colorRuleMenu.EnableDisplay();
				}
			}

			//only color the Xs if it's selected.
			if (i == current_rule_id){
				GUI.color = rule.color;
			} else {
				GUI.color = Color.white;
			}

			if (GUI.Button(new Rect(width-45, temp_y, 30, 30), "X")){
				colorController.removeRule(i);
				if (current_rule_id == i){
					colorRuleMenu.DisableDisplay();
				} else if (current_rule_id > i) {
					colorRuleMenu.rule_index -= 1;
				}
			}

			temp_y+=30;
		}


		GUI.EndScrollView();

	}

	function ColorRandom(){
		colorController.ColorRandom();
	}

	function ColorByCluster(){
		colorController.ColorByCluster();
	}

	function ColorBySource(){
		colorController.ColorBySource();
	}

	function DisableDisplay(){
		super.DisableDisplay();
		colorSchemeMenu.DisableDisplay();
	}

}