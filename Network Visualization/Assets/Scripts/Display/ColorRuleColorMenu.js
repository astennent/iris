class ColorRuleColorMenu extends SecondaryMenu {
	//private var scrollPosition : Vector2 = Vector2.zero;

	private var rule : ColorRule;
	function Start(){
		super.Start();
		width = 200;
		parentMenu = GetComponent(DisplayMenu);
		title = "Rule Options";
	}

	function setRuleIndex(rule_index : int){
		if (rule_index > -1){
			rule = colorController.rules[rule_index];
			colorPicker.setColor(rule.color);
		}
	}

	function OnGUI(){
		super.OnGUI();
		if (displaying){

			var cur_y = 35;

			var original_halo = rule.halo;
			if (rule.halo){
				var halo_txt = "Coloring Selection Halo";
			} else {
				halo_txt = "Coloring Node Body";
			}
			rule.halo = GUI.Toggle (Rect (x+10, cur_y, width-20, 20), rule.halo, halo_txt);

			cur_y += 20;		
			colorPicker.Init(x, cur_y, false);
			original_color = rule.color;
			rule.color = colorPicker.getColor();

			cur_y += 190;
			original_variation = rule.variation;
			GUI.Label(new Rect(x+10, cur_y, width, 20), "Randomness: " + rule.variation.ToString("f2"));
			rule.variation = GUI.HorizontalSlider(Rect(x+130, cur_y+5, width-140, 20), rule.variation, 0.0, 1.0);

			if (rule.color != original_color || rule.variation != original_variation || rule.halo != original_halo){
				colorController.ApplyRule(rule);
			}

		}
	}

	function EnableDisplay(){
		super.EnableDisplay();
		colorPicker.displaying = true;
	} 

	function DisableDisplay(){
		super.DisableDisplay();
		colorPicker.displaying = false;
	}
}