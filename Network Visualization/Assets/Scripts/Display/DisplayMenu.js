#pragma strict

class DisplayMenu extends PrimaryMenu {
	private var scrollPosition : Vector2 = Vector2.zero;

	var rule_index : int = -1;
	
	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		title = "Display Settings";
	}

	function OnGUI(){
		super.OnGUI();	
		
		var y = 35;

		var fallbackRule : ColorRule = colorController.rules[0];
		if (GUI.Button(new Rect(x+5, y, width-10, 30), "Change Fallback Colors")){
			if (rule_index == 0) {
				setRuleIndex(-1);
			} else {
				setRuleIndex(0);
			}
		}

		y+=30;

		var rules = colorController.rules;
		var rule : ColorRule = rules[0];
		var rule_type_index = rule.getRuleType();

		//Draw radio buttons for the fallback rule
		var temp_x = 10;
		for (var i : int = 0 ; i < 3 ; i++) {
			var rule_type_name = colorController.rule_types[i];
			var selected = GUI.Toggle (Rect (x+temp_x, y, 100, 20), (rule_type_index == i), "By " + rule_type_name);
			if (selected && rule_type_index != i) { //you just clicked it.
				rule.setRuleType(i);
				break;
			}
			temp_x+=100;
		}
		
		y+=25;

		var ruleRect = new Rect(x, y, width, 200);
		GUI.Box(ruleRect, "Rules");

		y+=25;

		if (GUI.Button(new Rect(x+5, y, 100, 25), "Add Rule")){
			colorController.createRule();
			setRuleIndex(colorController.rules.Count-1);
		}

		if (GUI.Button(new Rect(x+120, y, 120, 25), "Apply All Rules")){
			colorController.ApplyAllRules();
		}


		ruleRect.y += 55;
		ruleRect.height -= 60;

		scrollPosition = GUI.BeginScrollView (ruleRect, 
			scrollPosition, Rect (0, 0, width-20, 30*rules.Count+20));

		var temp_y = 0;
		for (i = 1 ; i < rules.Count ; i++){

			rule = colorController.rules[i];
			GUI.color = rule.color;


			var buttonRect = new Rect(35, temp_y, width-85, 30);
			if (GUI.Button(buttonRect, rule.getDisplayName())){
				if (rule_index == i) {
					setRuleIndex(-1);
				} else {
					setRuleIndex(i);
				}
			}

		
			if (!rule.is_fallback) {
				var upRect = new Rect(5, temp_y, 30, 15);
				var downRect = new Rect(5, temp_y+15, 30, 15);

				if (GUI.Button(upRect, "")){ //TODO make graphics for these.
					colorController.moveRuleUp(i);
				}
				if (GUI.Button(downRect, "")){
					colorController.moveRuleDown(i);
				}
	
				//only color the Xs if it's selected.
				if (i == rule_index){
					GUI.color = rule.color;
				} else {
					GUI.color = Color.white;
				}

				if (GUI.Button(new Rect(width-50, temp_y, 35, 30), "X")){
					colorController.removeRule(i);
					if (i == rule_index){
						setRuleIndex(-1);
					} else if (i < rule_index) {
						setRuleIndex(rule_index-1);
					}
				}
			}



			temp_y+=30;
		}

		GUI.EndScrollView();

	}
	
	function setRuleIndex(index : int) {
		rule_index = index;
		if (rule_index > -1){
			var rule : ColorRule = colorController.rules[rule_index];
			colorPicker.setColor(rule.color);
		}
	}

	function DisableDisplay(){
		super.DisableDisplay();
		setRuleIndex(-1);
	}
}