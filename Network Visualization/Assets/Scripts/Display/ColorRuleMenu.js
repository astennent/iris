#pragma strict

class ColorRuleMenu extends BaseMenu {
	private static var scrollPosition : Vector2 = Vector2.zero;
	private static var ruleRects = new Dictionary.<ColorRule, Rect>();

	static var rule_index : int = -1;
	
	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		title = "Coloring Rules";
	}

	function OnGUI(){
		super.OnGUI();	

		if (!displaying) {
			return;
		}
		
		var y = DrawFallback(35);
		y = DrawRules(y);
	}

	function DrawFallback(y : int) {
		var fallbackRule : ColorRule = ColorController.rules[0];
		if (GuiPlus.Button(new Rect(x+5, y, width-10, 30), "Change Fallback Colors")){
			if (rule_index == 0) {
				setRuleIndex(-1);
			} else {
				setRuleIndex(0);
			}
		}

		y+=30;

		var rule : ColorRule = ColorController.rules[0];
		var filter_method = rule.getFilterMethod();

		//Draw radio buttons for the fallback rule
		var temp_x = 10;
		for (var i : int = 0 ; i < 3 ; i++) {
			var filter_method_name = ColorRule.filter_methods[i];
			var selected = GuiPlus.Toggle (Rect (x+temp_x, y, 100, 20), (filter_method == i), "By " + filter_method_name);
			if (selected && filter_method != i) {
				rule.setFilterMethod(i);
				break;
			}
			temp_x+=100;
		}

		
		
		return y+25;
	}

	function DrawRules(y : int) {
		var rules = ColorController.rules;

		var ruleRect = new Rect(x, y, width, MenuController.getScreenHeight() - y);
		GuiPlus.Box(ruleRect, "Rules");

		y+=25;

		if (GuiPlus.Button(new Rect(x+5, y, 100, 25), "Add Rule")){
			var createdRule = ColorController.createRule();
			setRuleIndex(ColorController.rules.Count-1);
			var createdRuleRect = new Rect(35, 0, width-85, 30);
			ruleRects[createdRule] = createdRuleRect;

		}

		if (GuiPlus.Button(new Rect(x+120, y, 120, 25), "Apply All Rules")){
			ColorController.ApplyAllRules();
		}

		ruleRect.y += 55;
		ruleRect.height = MenuController.getScreenHeight() - ruleRect.y;

		scrollPosition = GuiPlus.BeginScrollView (ruleRect, 
			scrollPosition, Rect (0, 0, width-20, 30*rules.Count+20));

		var temp_y = 0;
		for (var i = 1 ; i < rules.Count ; i++){

			var rule = ColorController.rules[i];
			var rule_color = rule.getMenuColor(); 
			rule_color.a = 1;
			GUI.color = rule_color;

			var buttonRect = ruleRects[rule];
			buttonRect.y = Mathf.Lerp(buttonRect.y, temp_y, .3);
			ruleRects[rule] = buttonRect;

			if (GuiPlus.Button(buttonRect, rule.getDisplayName())){
				if (rule_index == i) {
					setRuleIndex(-1);
				} else {
					setRuleIndex(i);
				}
			}
		
			var upRect = new Rect(5, buttonRect.y, 30, 15);
			var downRect = new Rect(5, buttonRect.y+15, 30, 15);

			if (GuiPlus.Button(upRect, "")) { //TODO make graphics for these.
				if (i > 1) {
					ColorController.moveRuleUp(i);
					if (rule_index == i) {
						setRuleIndex(rule_index - 1);
					} else if (rule_index == i-1) {
						setRuleIndex(rule_index + 1);
					}
				}
			}
			if (GuiPlus.Button(downRect, "")) {
				if (i < rules.Count - 1) {
					ColorController.moveRuleDown(i);
					if (rule_index == i) {
						setRuleIndex(rule_index + 1);
					} else if (rule_index == i+1) {
						setRuleIndex(rule_index - 1);
					}
				}
			}

			//only color the Xs if it's selected.
			if (i == rule_index){
				GUI.color = rule.getMenuColor();
			} else {
				GUI.color = Color.white;
			}

			if (GuiPlus.Button(new Rect(width-50, buttonRect.y, 35, 30), "X")){
				ColorController.removeRule(i);
				if (i == rule_index){
					setRuleIndex(-1);
				} else if (i < rule_index) {
					setRuleIndex(rule_index-1);
				}
			}
			


			temp_y+=30;
		}

		GuiPlus.EndScrollView();
		return y+temp_y;

	}

	static function setRuleIndex(index : int) {
		if (rule_index != index) {
			rule_index = index;
			if (rule_index > -1){
				var rule : ColorRule = ColorController.rules[rule_index];
				ColorPicker.setColor(rule.getColor());
				EnableDisplay(ColorRuleOptionsMenu);
				if (rule_index > 0) {
					EnableDisplay(ColorRuleFilterMenu);
				} else {
					DisableDisplay(ColorRuleFilterMenu);
				}
			} else {
				DisableDisplay(ColorRuleOptionsMenu);
				DisableDisplay(ColorRuleFilterMenu);
			}
		}
	}
}